import { api } from "../lib/apiClient";

// /api/v1/paiements/ (apps/paiements/views.py::PaiementAbonnementViewSet)
export const initierPaiement = (payload) => api.post("/paiements/", payload);
// payload : { abonnement, mode_paiement, montant, reference_transaction }

// POST /api/v1/paiements/{id}/confirmer/ — à appeler depuis le webhook de la
// passerelle (Orange Money / MTN MoMo / carte) ou après redirection de paiement.
export const confirmerPaiement = (paiementId) => api.post(`/paiements/${paiementId}/confirmer/`);
