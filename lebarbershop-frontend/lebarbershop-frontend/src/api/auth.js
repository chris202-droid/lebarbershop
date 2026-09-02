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

// POST /api/v1/auth/changer-mot-de-passe/  (accounts.views.ChangerMotDePasseView)
// `ancien_mot_de_passe` est facultatif lorsque le compte est en mot de passe
// temporaire (premier changement imposé après création par un gestionnaire).
export const changerMotDePasse = ({ ancien_mot_de_passe, nouveau_mot_de_passe }) =>
  api.post("/auth/changer-mot-de-passe/", { ancien_mot_de_passe, nouveau_mot_de_passe });

// --- Administration (super admin) ---

// GET /api/v1/auth/administrateurs/ (AdministrateurSecondaireListeView)
export const listerAdministrateurs = () => api.get("/auth/administrateurs/");

// POST /api/v1/auth/administrateurs/nommer/ (NommerAdministrateurView)
// payload : { username, peut_modifier_salon, peut_ajouter_administrateur,
//             peut_creer_codes_reduction, peut_creer_codes_sponsoring,
//             peut_voir_abonnements, peut_consulter_rendement_employes,
//             peut_consulter_depenses }
export const nommerAdministrateur = (payload) => api.post("/auth/administrateurs/nommer/", payload);

// PATCH /api/v1/auth/administrateurs/{id}/ — met à jour les droits
export const modifierDroitsAdministrateur = (utilisateurId, payload) =>
  api.patch(`/auth/administrateurs/${utilisateurId}/`, payload);

// DELETE /api/v1/auth/administrateurs/{id}/ — révoque le statut d'administrateur secondaire
export const revoquerAdministrateur = (utilisateurId) => api.del(`/auth/administrateurs/${utilisateurId}/`);

// POST /api/v1/auth/utilisateurs/{id}/reinitialiser/ (ReinitialiserIdentifiantsView)
// payload : { username?, nouveau_mot_de_passe? } — utilisé notamment pour
// réinitialiser les identifiants du gérant d'un salon (point 8).
export const reinitialiserIdentifiants = (utilisateurId, payload) =>
  api.post(`/auth/utilisateurs/${utilisateurId}/reinitialiser/`, payload);
