import { api } from "../lib/apiClient";

// /api/v1/bilans-journaliers/ et /api/v1/rendements-employes/ (apps/analytics/views.py)
export const listerBilansJournaliers = (salonId, debut, fin) => {
  const params = new URLSearchParams({ salon: salonId, ...(debut ? { debut } : {}), ...(fin ? { fin } : {}) });
  return api.get(`/bilans-journaliers/?${params.toString()}`);
};
export const listerRendementsEmployes = (employeId, debut, fin) => {
  const params = new URLSearchParams({
    ...(employeId ? { employe: employeId } : {}), ...(debut ? { debut } : {}), ...(fin ? { fin } : {}),
  });
  return api.get(`/rendements-employes/?${params.toString()}`);
};

// GET /api/v1/statistiques-secteurs/ (fonction statistiques_secteur)
export const statistiquesSecteurs = () => api.get("/statistiques-secteurs/");
