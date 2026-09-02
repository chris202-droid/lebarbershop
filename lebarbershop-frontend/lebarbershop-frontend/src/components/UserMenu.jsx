import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, ChevronDown, LogOut, UserCog } from "lucide-react";
import { T } from "../lib/tokens";
import { useAuth } from "../context/AuthContext";

/**
 * Menu utilisateur affiché dans l'en-tête des écrans applicatifs
 * (tableau de bord, caisse, admin). Donne accès au profil et à la
 * déconnexion depuis n'importe quelle page authentifiée.
 */
export default function UserMenu() {
  const { utilisateur, deconnecter } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const surClicExterieur = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, []);

  if (!utilisateur) return null;

  const nom = utilisateur.first_name || utilisateur.username;
  const initiales = (utilisateur.first_name?.[0] || utilisateur.username[0] || "?").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOuvert(!ouvert)} className="flex items-center gap-2 px-2 py-1.5 rounded-md"
        style={{ background: "rgba(246,239,221,0.05)" }}>
        {utilisateur.photo_url ? (
          <img src={utilisateur.photo_url} alt={nom} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: "rgba(232,184,75,0.15)", color: T.gold, fontFamily: "Fraunces, serif" }}>
            {initiales}
          </div>
        )}
        <span className="text-xs hidden sm:inline" style={{ color: "rgba(246,239,221,0.75)" }}>{nom}</span>
        <ChevronDown size={13} style={{ color: "rgba(246,239,221,0.5)" }} />
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-md py-1.5 z-40"
          style={{ background: T.inkDeep, border: `1px solid ${T.line}` }}>
          <Link to="/profil" onClick={() => setOuvert(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm" style={{ color: "rgba(246,239,221,0.8)" }}>
            <UserCog size={14} /> Mon profil
          </Link>
          <button onClick={deconnecter}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left" style={{ color: T.coral }}>
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
