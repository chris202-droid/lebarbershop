import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";
import { T } from "../lib/tokens";

/**
 * Protège une route : redirige vers /connexion si non authentifié.
 *
 * `role="admin"` (rétrocompatible) ou `roles={[...]}` avec les valeurs
 * "superadmin" | "gestionnaire" | "caissiere" | "praticien" restreint
 * l'accès à ces rôles applicatifs (voir context/RoleContext.jsx). Sans
 * `role`/`roles`, la route est ouverte à tout utilisateur authentifié
 * (ex. /onboarding, /profil).
 *
 * Un utilisateur qui n'a pas le rôle requis est renvoyé vers SON propre
 * espace par défaut plutôt que vers /connexion, pour ne jamais lui faire
 * revivre un écran de connexion alors qu'il est déjà bien authentifié
 * (point 1 : la session se poursuit, quel que soit l'endroit du site).
 *
 * Si le compte est en mot de passe temporaire (employé créé par son
 * gestionnaire), toute route autre que /changer-mot-de-passe redirige vers
 * cette dernière : l'utilisateur ne peut pas accéder au reste de
 * l'application tant qu'il n'a pas choisi son propre mot de passe.
 */
export default function ProtectedRoute({ children, role, roles }) {
  const { utilisateur, chargement: chargementAuth } = useAuth();
  const { chargement: chargementRole, estSuperAdmin, estGestionnaire, estCaissiere, estPraticien, routeParDefaut } = useRole();
  const location = useLocation();

  if (chargementAuth || chargementRole) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.ink }}>
        <span className="text-sm" style={{ color: "rgba(18,42,32,0.5)" }}>Chargement…</span>
      </div>
    );
  }
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (utilisateur.mot_de_passe_temporaire && location.pathname !== "/changer-mot-de-passe") {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }

  const rolesRequis = roles || (role === "admin" ? ["superadmin"] : null);
  if (rolesRequis) {
    const correspond = {
      superadmin: estSuperAdmin,
      gestionnaire: estGestionnaire,
      caissiere: estCaissiere,
      praticien: estPraticien,
    };
    const autorise = rolesRequis.some((r) => correspond[r]);
    if (!autorise) return <Navigate to={routeParDefaut} replace />;
  }

  return children;
}
