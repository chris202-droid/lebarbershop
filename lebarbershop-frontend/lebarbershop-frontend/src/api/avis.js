import { api } from "../lib/apiClient";

// /api/v1/avis/ — lecture publique, écriture authentifiée (IsAuthenticatedOrReadOnly)
export const listerAvis = (salonId) => api.get(`/avis/?salon=${salonId}`, { auth: false });
export const laisserAvis = (payload) => api.post("/avis/", payload);
