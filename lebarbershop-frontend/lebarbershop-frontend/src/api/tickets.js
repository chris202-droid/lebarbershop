import { api } from "../lib/apiClient";

// /api/v1/tickets/ (apps/tickets/views.py::TicketViewSet)
export const listerTickets = (salonId, statut) => {
  const params = new URLSearchParams({ salon: salonId, ...(statut ? { statut } : {}) });
  return api.get(`/tickets/?${params.toString()}`);
};
export const creerTicket = (payload) => api.post("/tickets/", payload);
// payload attendu : { salon, client|nom_client_temporaire, employe_createur,
//                      reduction_pourcentage, lignes: [{ soin, employe_executant }] }

// POST /api/v1/tickets/{id}/valider/  (action @action "valider" côté DRF)
export const validerTicket = (ticketId, mode_paiement) =>
  api.post(`/tickets/${ticketId}/valider/`, { mode_paiement });

// /api/v1/lignes-ticket/ (apps/tickets/views.py::LigneTicketViewSet)
// Lignes de ticket assignées à l'employé connecté (tous salons confondus).
export const listerMesLignesTicket = () => api.get("/lignes-ticket/");

// POST /api/v1/lignes-ticket/{id}/confirmer/ — "le client a fait le soin"
export const confirmerLigne = (ligneId) => api.post(`/lignes-ticket/${ligneId}/confirmer/`);
// POST /api/v1/lignes-ticket/{id}/annuler/ — "le client a annulé le soin"
export const annulerLigne = (ligneId) => api.post(`/lignes-ticket/${ligneId}/annuler/`);
