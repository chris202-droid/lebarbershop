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

// PATCH /api/v1/tickets/{id}/ — modifier un ticket avant sa validation (point 3)
export const modifierTicket = (ticketId, payload) => api.patch(`/tickets/${ticketId}/`, payload);

// DELETE /api/v1/tickets/{id}/ — supprimer un ticket avant sa validation (point 3)
export const supprimerTicket = (ticketId) => api.del(`/tickets/${ticketId}/`);

// POST /api/v1/tickets/{id}/annuler/ — annule le ticket entier sans le
// supprimer (garde une trace) ; disparaît alors de la file de la caissière.
export const annulerTicket = (ticketId) => api.post(`/tickets/${ticketId}/annuler/`);

// /api/v1/lignes-ticket/ (apps/tickets/views.py::LigneTicketViewSet)
// Lignes de ticket assignées à l'employé connecté (tous salons confondus).
export const listerMesLignesTicket = () => api.get("/lignes-ticket/");

// POST /api/v1/lignes-ticket/{id}/confirmer/ — "le client a fait le soin"
export const confirmerLigne = (ligneId) => api.post(`/lignes-ticket/${ligneId}/confirmer/`);
// POST /api/v1/lignes-ticket/{id}/annuler/ — "le client a annulé le soin"
export const annulerLigne = (ligneId) => api.post(`/lignes-ticket/${ligneId}/annuler/`);
