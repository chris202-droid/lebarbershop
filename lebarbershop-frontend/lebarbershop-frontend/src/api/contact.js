import { api } from "../lib/apiClient";

// Formulaires publics de la landing page — apps/contact (Django), AllowAny.

// POST /api/v1/contact/demandes/  (apps/contact/views.py::DemandeContactCreateView)
export const envoyerDemandeContact = (payload) =>
  api.post("/contact/demandes/", payload, { auth: false });

// POST /api/v1/contact/partenariats/  (apps/contact/views.py::DemandePartenariatCreateView)
export const envoyerDemandePartenariat = (payload) =>
  api.post("/contact/partenariats/", payload, { auth: false });

// POST /api/v1/contact/code-promo/  (apps/contact/views.py::DemandeCodePromoView)
// Renvoie immédiatement { code, pourcentage_reduction, date_expiration, ... }
export const demanderCodePromo = (email) =>
  api.post("/contact/code-promo/", { email }, { auth: false });

// --- Administration (super admin) ---

// GET /api/v1/contact/admin/demandes-toutes/ — toutes les demandes du site
// (contact, partenariat, code promo), peu importe leur nature (point 2).
export const listerDemandesToutes = () => api.get("/contact/admin/demandes-toutes/");

// PATCH /api/v1/contact/admin/demandes-contact/{id}/
export const marquerDemandeContactTraitee = (id, traite = true) =>
  api.patch(`/contact/admin/demandes-contact/${id}/`, { traite });

// PATCH /api/v1/contact/admin/demandes-partenariat/{id}/
export const marquerDemandePartenariatTraitee = (id, traite = true) =>
  api.patch(`/contact/admin/demandes-partenariat/${id}/`, { traite });
