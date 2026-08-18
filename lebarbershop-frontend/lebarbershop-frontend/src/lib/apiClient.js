/**
 * Client HTTP central pour parler au backend Django REST Framework.
 *
 * - Ajoute automatiquement le header Authorization: Bearer <access_token>.
 * - Si une requête échoue avec 401, tente un rafraîchissement du token
 *   via /auth/connexion/rafraichir/ puis rejoue la requête une fois.
 * - Les tokens sont stockés dans localStorage (clé "lbs_access" / "lbs_refresh").
 *   Ce n'est PAS le stockage le plus sûr contre le XSS ; pour une mise en
 *   production stricte, envisager des cookies httpOnly côté serveur.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function getAccessToken() {
  return localStorage.getItem("lbs_access");
}
function getRefreshToken() {
  return localStorage.getItem("lbs_refresh");
}
export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("lbs_access", access);
  if (refresh) localStorage.setItem("lbs_refresh", refresh);
}
export function clearTokens() {
  localStorage.removeItem("lbs_access");
  localStorage.removeItem("lbs_refresh");
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("Aucun refresh token disponible");
  const res = await fetch(`${BASE_URL}/auth/connexion/rafraichir/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error("Impossible de rafraîchir la session");
  const data = await res.json();
  setTokens({ access: data.access });
  return data.access;
}

/**
 * Requête générique. `path` est relatif à BASE_URL (ex: "/salons/").
 * `auth` = false pour les endpoints publics (inscription, connexion, avis en lecture...).
 */
export async function apiFetch(path, { method = "GET", body, auth = true, isRetry = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Token expiré -> on tente un refresh puis on rejoue la requête une seule fois.
  if (res.status === 401 && auth && !isRetry && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return apiFetch(path, { method, body, auth, isRetry: true });
    } catch {
      clearTokens();
      window.location.href = "/connexion";
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }
  }

  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();
    } catch {
      detail = { detail: res.statusText };
    }
    const error = new Error(detail.detail || "Erreur API");
    error.status = res.status;
    error.body = detail;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: "PUT", body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" }),
};
