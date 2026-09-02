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

// GET /api/v1/analytics/bilan-financier/?periode=mois|trimestre|semestre|annee
// Réservé à l'administrateur principal (point 5 du cahier des charges admin).
export const bilanFinancier = (periode = "mois") => api.get(`/bilan-financier/?periode=${periode}`);

// GET /api/v1/analytics/bilan-salon/?salon=&periode=semaine|mois|trimestre|semestre|annee
// Accessible au gestionnaire ET à la caissière du salon (point 14) : chiffre
// d'affaires par période + bilan de tickets/revenus par employé.
export const bilanSalon = (salonId, periode = "mois") =>
  api.get(`/bilan-salon/?salon=${salonId}&periode=${periode}`);
