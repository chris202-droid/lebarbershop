import { api } from "../lib/apiClient";

// Routeur DRF : /api/v1/salons/  (apps/salons/views.py::SalonViewSet)
export const listerSalons = () => api.get("/salons/");
export const creerSalon = (payload) => api.post("/salons/", payload);
export const detailSalon = (id) => api.get(`/salons/${id}/`);
export const modifierSalon = (id, payload) => api.patch(`/salons/${id}/`, payload);

// /api/v1/abonnements/  (AbonnementViewSet — calcule automatiquement le prix)
export const listerAbonnements = (salonId) => api.get(`/abonnements/?salon=${salonId}`);
export const creerAbonnement = (payload) => api.post("/abonnements/", payload);

// /api/v1/codes-reduction/ et /api/v1/codes-sponsoring/ (admin principal uniquement)
export const listerCodesReduction = () => api.get("/codes-reduction/");
export const creerCodeReduction = (payload) => api.post("/codes-reduction/", payload);
export const listerCodesSponsoring = () => api.get("/codes-sponsoring/");
export const creerCodeSponsoring = (payload) => api.post("/codes-sponsoring/", payload);

// /api/v1/analyses-sectorielles/ (abonnement payant utilisateur lambda : 20000 / 25000)
export const listerAnalysesSectorielles = () => api.get("/analyses-sectorielles/");
export const souscrireAnalyseSectorielle = (type_abonnement) =>
  api.post("/analyses-sectorielles/", { type_abonnement });
