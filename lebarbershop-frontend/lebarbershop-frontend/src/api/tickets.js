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
