import { api } from "../lib/apiClient";

// /api/v1/employes/ (apps/employes/views.py::EmployeViewSet)
export const listerEmployes = (salonId) => api.get(`/employes/?salon=${salonId}`);
export const ajouterEmploye = (payload) => api.post("/employes/", payload);
export const modifierEmploye = (id, payload) => api.patch(`/employes/${id}/`, payload);
export const supprimerEmploye = (id) => api.del(`/employes/${id}/`);
