import { api } from "../lib/apiClient";

// --- Demandes du site (contact, partenariat, code promo) — apps/contact ---

// GET /api/v1/contact/admin/demandes-toutes/ — vue unifiée, toutes natures confondues
export const listerToutesLesDemandes = () => api.get("/contact/admin/demandes-toutes/");

export const listerDemandesContact = () => api.get("/contact/admin/demandes-contact/");
export const marquerDemandeContactTraitee = (id, traite = true) =>
  api.patch(`/contact/admin/demandes-contact/${id}/`, { traite });

export const listerDemandesPartenariat = () => api.get("/contact/admin/demandes-partenariat/");
export const marquerDemandePartenariatTraitee = (id, traite = true) =>
  api.patch(`/contact/admin/demandes-partenariat/${id}/`, { traite });

export const listerDemandesCodePromo = () => api.get("/contact/admin/demandes-code-promo/");

// --- Bilan financier global — apps/analytics ---

// GET /api/v1/analytics/bilan-financier/?periode=mois|trimestre|semestre|annee
export const bilanFinancier = (periode = "mois") =>
  api.get(`/bilan-financier/?periode=${periode}`);

// --- Administrateurs secondaires — apps/accounts ---

export const listerAdministrateurs = () => api.get("/auth/administrateurs/");
export const nommerAdministrateur = (payload) => api.post("/auth/administrateurs/nommer/", payload);
export const modifierDroitsAdministrateur = (utilisateurId, droits) =>
  api.patch(`/auth/administrateurs/${utilisateurId}/`, droits);
export const revoquerAdministrateur = (utilisateurId) =>
  api.del(`/auth/administrateurs/${utilisateurId}/`);

// --- Réinitialisation d'identifiants (ex. gestionnaire de salon) ---

// POST /api/v1/auth/utilisateurs/{id}/reinitialiser/  body: { username?, nouveau_mot_de_passe? }
export const reinitialiserIdentifiants = (utilisateurId, payload) =>
  api.post(`/auth/utilisateurs/${utilisateurId}/reinitialiser/`, payload);
