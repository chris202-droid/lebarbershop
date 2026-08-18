import { api } from "../lib/apiClient";

// /api/v1/soins/ (apps/services/views.py::SoinViewSet)
export const listerSoins = (salonId) => api.get(`/soins/?salon=${salonId}`);
export const creerSoin = (payload) => api.post("/soins/", payload);
export const modifierSoin = (id, payload) => api.patch(`/soins/${id}/`, payload);
export const supprimerSoin = (id) => api.del(`/soins/${id}/`);
