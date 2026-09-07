import { api } from "../lib/apiClient";

// Routeur DRF : /api/v1/salons/  (apps/salons/views.py::SalonViewSet)
export const listerSalons = (statut) => api.get(statut ? `/salons/?statut=${statut}` : "/salons/");
export const creerSalon = (payload) => api.post("/salons/", payload);
export const detailSalon = (id) => api.get(`/salons/${id}/`);
export const modifierSalon = (id, payload) => api.patch(`/salons/${id}/`, payload);

// Activation/désactivation d'un salon — réservé à l'administrateur principal
// (apps/salons/views.py::SalonViewSet.activer / .desactiver)
export const activerSalon = (id) => api.post(`/salons/${id}/activer/`);
export const suspendreSalon = (id) => api.post(`/salons/${id}/suspendre/`);
export const desactiverSalon = (id) => api.post(`/salons/${id}/desactiver/`);

// /api/v1/abonnements/  (AbonnementViewSet — calcule automatiquement le prix)
export const listerAbonnements = (salonId) => api.get(`/abonnements/?salon=${salonId}`);

// GET /api/v1/abonnements/ sans filtre — réservé à l'admin SAAS (voir
// AbonnementViewSet.get_queryset : renvoie tous les abonnements de tous les
// salons pour un administrateur, comme dans le Django admin).
export const listerTousLesAbonnements = () => api.get("/abonnements/");
export const creerAbonnement = (payload) => api.post("/abonnements/", payload);

// /api/v1/codes-reduction/ et /api/v1/codes-sponsoring/ (admin principal uniquement)
export const listerCodesReduction = () => api.get("/codes-reduction/");
export const creerCodeReduction = (payload) => api.post("/codes-reduction/", payload);
export const activerCodeReduction = (id, actif) => api.patch(`/codes-reduction/${id}/`, { actif });
export const listerCodesSponsoring = () => api.get("/codes-sponsoring/");
export const creerCodeSponsoring = (payload) => api.post("/codes-sponsoring/", payload);

// Programme partenaire employé (points 7, 15, 16, 17, 18) — demande d'un code
// personnel à 500 FCFA (nom personnalisable), 200 FCFA gagnés à chaque
// réutilisation lors d'une souscription. Le code n'est attribué (actif)
// qu'après confirmation du paiement — voir confirmerPaiementCodePartenaire.
// GET /api/v1/codes-sponsoring/ renvoie automatiquement, pour un
// utilisateur non-admin, uniquement SES propres codes achetés.
export const mesCodesSponsoring = () => api.get("/codes-sponsoring/");

// payload : { code?: string, mode_paiement: "orange_money"|"mtn_momo"|"carte_bancaire" }
export const demanderCodePartenaire = (payload) => api.post("/codes-sponsoring/acheter/", payload);

// Finalise l'attribution après paiement (à appeler une fois le paiement
// confirmé côté passerelle — ici déclenché directement par simplicité, comme
// pour les autres flux de paiement non branchés à une vraie passerelle).
export const confirmerPaiementCodePartenaire = (id) => api.post(`/codes-sponsoring/${id}/confirmer-paiement/`);

// /api/v1/analyses-sectorielles/ (abonnement payant utilisateur lambda : 20000 / 25000)
export const listerAnalysesSectorielles = () => api.get("/analyses-sectorielles/");
export const souscrireAnalyseSectorielle = (type_abonnement) =>
  api.post("/analyses-sectorielles/", { type_abonnement });

// POST /api/v1/abonnements/essai/ (AbonnementEssaiView) — 14 jours gratuits,
// sans mode de paiement ni carte bancaire. Réservé au tout premier salon créé
// par l'utilisateur (restriction vérifiée côté backend, pas par salon).
export const demarrerEssaiGratuit = (salonId) => api.post("/abonnements/essai/", { salon: salonId });

// /api/v1/forfaits/ — configurables par l'admin, lecture publique (apps/salons/views.py::ForfaitViewSet)
export const listerForfaits = (actifSeulement = false) =>
  actifSeulement
    ? api.get("/forfaits/?actif=true", { auth: false })
    : api.get("/forfaits/");
export const creerForfait = (payload) => api.post("/forfaits/", payload);
export const modifierForfait = (id, payload) => api.patch(`/forfaits/${id}/`, payload);
export const supprimerForfait = (id) => api.del(`/forfaits/${id}/`);
