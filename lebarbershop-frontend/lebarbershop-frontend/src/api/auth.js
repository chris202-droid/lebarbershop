import { api, setTokens, clearTokens } from "../lib/apiClient";

// POST /api/v1/auth/inscription/  (accounts.views.InscriptionView)
export async function inscrire({ username, first_name, last_name, email, telephone, password, langue_preferee }) {
  const data = await api.post("/auth/inscription/", {
    username, first_name, last_name, email, telephone, password, langue_preferee,
  }, { auth: false });
  setTokens({ access: data.access, refresh: data.refresh });
  return data.utilisateur;
}

// POST /api/v1/auth/connexion/  (TokenObtainPairView de simplejwt)
export async function connecter({ username, password }) {
  const data = await api.post("/auth/connexion/", { username, password }, { auth: false });
  setTokens({ access: data.access, refresh: data.refresh });
  return data;
}

export function deconnecter() {
  clearTokens();
}

// GET/PATCH /api/v1/auth/profil/  (accounts.views.ProfilView)
export const getProfil = () => api.get("/auth/profil/");
export const majProfil = (payload) => api.patch("/auth/profil/", payload);
