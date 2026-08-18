import { api } from "../lib/apiClient";

// /api/v1/produits/ (apps/stocks/views.py::ProduitViewSet)
export const listerProduits = (salonId, enAlerte = false) => {
  const params = new URLSearchParams({ salon: salonId, ...(enAlerte ? { en_alerte: "true" } : {}) });
  return api.get(`/produits/?${params.toString()}`);
};
export const creerProduit = (payload) => api.post("/produits/", payload);

// /api/v1/mouvements-stock/ (achat / consommation / ajustement)
export const enregistrerMouvementStock = (payload) => api.post("/mouvements-stock/", payload);
