import { api } from "../lib/apiClient";

// /api/v1/secteurs/ (apps/geolocalisation/views.py::SecteurGeographiqueViewSet)
export const listerSecteurs = () => api.get("/secteurs/", { auth: false });
