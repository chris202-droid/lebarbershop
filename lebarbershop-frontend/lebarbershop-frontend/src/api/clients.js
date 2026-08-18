import { api } from "../lib/apiClient";

// /api/v1/clients/ (apps/clients/views.py::ClientViewSet)
export const rechercherClients = (q) => api.get(`/clients/?search=${encodeURIComponent(q)}`);
export const creerClient = (payload) => api.post("/clients/", payload);

// /api/v1/fidelite/ (lecture seule)
export const listerFidelite = (salonId) => api.get(`/fidelite/?salon=${salonId}`);
