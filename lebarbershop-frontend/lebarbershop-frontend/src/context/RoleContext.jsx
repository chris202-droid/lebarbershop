import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { mesPostes } from "../api/employes";

const RoleContext = createContext(null);

const ROLES_PRATICIEN = ["coiffeur_homme", "coiffeuse_femme", "maquilleuse", "estheticienne", "autre"];

/**
 * Calcule les rôles applicatifs d'un utilisateur à partir de son profil
 * (super admin) et de ses postes d'employé (gestionnaire, caissière,
 * praticien). Un même utilisateur peut cumuler plusieurs rôles (ex. être
 * gestionnaire de son propre salon ET praticien s'il s'y ajoute lui-même).
 */
function calculerRoles(profil, postes) {
  const estSuperAdmin = !!(profil?.is_superuser || profil?.est_admin_principal || profil?.est_admin_secondaire);
  const postesActifs = postes.filter((p) => p.actif);
  const estGestionnaire = postesActifs.some((p) => p.role === "gestionnaire");
  const estCaissiere = postesActifs.some((p) => p.role === "caissiere");
  const estPraticien = postesActifs.some((p) => ROLES_PRATICIEN.includes(p.role));

  let routeParDefaut = "/onboarding";
  if (estSuperAdmin) routeParDefaut = "/admin";
  else if (estGestionnaire) routeParDefaut = "/tableau-de-bord";
  else if (estCaissiere) routeParDefaut = "/caisse";
  else if (estPraticien) routeParDefaut = "/espace-employe";

  return { estSuperAdmin, estGestionnaire, estCaissiere, estPraticien, postesActifs, routeParDefaut };
}

export function RoleProvider({ children }) {
  const { utilisateur, chargement: chargementAuth } = useAuth();
  const [postes, setPostes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const rafraichirPostes = useCallback(async () => {
    if (!utilisateur) {
      setPostes([]);
      setChargement(false);
      return;
    }
    setChargement(true);
    try {
      const p = await mesPostes(); // GET /api/v1/employes/?moi=true
      setPostes(p.results || p);
    } catch {
      setPostes([]);
    } finally {
      setChargement(false);
    }
  }, [utilisateur]);

  useEffect(() => {
    if (!chargementAuth) rafraichirPostes();
  }, [chargementAuth, utilisateur, rafraichirPostes]);

  const roles = calculerRoles(utilisateur, postes);

  return (
    <RoleContext.Provider value={{ ...roles, postes, chargement: chargementAuth || chargement, rafraichirPostes }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole doit être utilisé dans <RoleProvider>");
  return ctx;
}

/**
 * Calcule la route par défaut sans dépendre du contexte — utilisée juste
 * après la connexion, où l'on vient tout juste d'obtenir le profil et où
 * l'on ne peut pas attendre le prochain rendu du RoleProvider.
 */
export function calculerRouteParDefaut(profil, postes) {
  return calculerRoles(profil, postes).routeParDefaut;
}
