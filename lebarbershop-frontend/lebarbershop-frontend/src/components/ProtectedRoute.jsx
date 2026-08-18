import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { T } from "../lib/tokens";

/**
 * Protège une route : redirige vers /connexion si non authentifié.
 * `role` optionnel : "admin" exige utilisateur.est_admin_principal ou est_admin_secondaire.
 */
export default function ProtectedRoute({ children, role }) {
  const { utilisateur, chargement } = useAuth();

  if (chargement) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.ink }}>
        <span className="text-sm" style={{ color: "rgba(246,239,221,0.5)" }}>Chargement…</span>
      </div>
    );
  }
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (role === "admin" && !(utilisateur.est_admin_principal || utilisateur.est_admin_secondaire)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
