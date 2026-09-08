import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Scissors, Star } from "lucide-react";
import { T } from "../lib/tokens";
import { LogoTexte } from "./UI";

const LIENS_RAPIDES = [
  { to: "/", label: "Accueil" },
  { to: "/#forfaits", label: "Nos forfaits" },
  { to: "/#partenaire", label: "Devenir partenaire" },
  { to: "/#code-promo", label: "Code promo" },
  { to: "/#contact", label: "Nous contacter" },
  { to: "/salons", label: "Trouver un salon" },
];

/**
 * Pied de page commun à toutes les pages (publiques et applicatives).
 * `compact` réduit le padding vertical et masque la ligne d'accroche,
 * pensé pour les écrans applicatifs (tableau de bord, caisse, admin…)
 * afin de ne pas alourdir des interfaces déjà denses.
 */
export default function SiteFooter({ compact = false }) {
  const location = useLocation();
  const estActif = (to) => {
    if (to.includes("#")) {
      const [chemin, hash] = to.split("#");
      return location.pathname === (chemin || "/") && location.hash === `#${hash}`;
    }
    return location.pathname === to;
  };

  return (
    <footer className={compact ? "px-6 py-5" : "px-6 py-10"} style={{ borderTop: `1px solid ${T.line}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: T.gold }}>
              <Scissors size={14} style={{ color: T.inkDeep }} />
            </div>
            <LogoTexte fontSize={15} />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {LIENS_RAPIDES.map((l) => (
              <Link key={l.label} to={l.to} className="text-xs transition-colors"
                style={{ color: estActif(l.to) ? T.gold : "rgba(18,42,32,0.55)", fontWeight: estActif(l.to) ? 600 : 400 }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {!compact && (
            <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: "rgba(18,42,32,0.4)" }}>
              <Star size={12} /> Noté par les salons partenaires au Cameroun
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6">
          <p className="text-xs" style={{ color: "rgba(18,42,32,0.35)" }}>© {new Date().getFullYear()} LeBarberShop. Tous droits réservés.</p>
          <p className="text-[11px]" style={{ color: "rgba(18,42,32,0.3)" }}>
            Powered by{" "}
            <a href="https://kalarai.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "rgba(18,42,32,0.45)" }}>
              KALARAI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
