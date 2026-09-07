import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Scissors, Menu, X, Globe, LayoutGrid, LogOut } from "lucide-react";
import { T } from "../lib/tokens";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";

// Liens de route classiques ("to") et liens vers une section ancrée de la
// landing page ("hash") — ces derniers ramènent toujours sur "/" avant de
// défiler jusqu'à la section, quelle que soit la page de départ.
const NAV_LINKS = [
  { to: "/", label: "Accueil" },
  { hash: "#qui-sommes-nous", label: "Qui sommes-nous" },
  { hash: "#forfaits", label: "Nos forfaits" },
  { hash: "#partenaire", label: "Devenir partenaire" },
  { hash: "#code-promo", label: "Code promo" },
  { hash: "#contact", label: "Nous contacter" },
  { to: "/salons", label: "Trouver un salon" },
];

export default function SiteHeader() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [langue, setLangue] = useState("fr");
  const location = useLocation();
  const { utilisateur, deconnecter } = useAuth();
  const { routeParDefaut } = useRole();

  const cible = (l) => (l.hash ? `/${l.hash}` : l.to);

  const estActif = (l) => {
    if (l.hash) return location.pathname === "/" && location.hash === l.hash;
    if (l.to === "/") return location.pathname === "/" && !location.hash;
    return location.pathname === l.to;
  };
  const estActifRoute = (path) => location.pathname === path;

  // Déjà connecté : la session se poursuit sur tout le site (point 1) — on
  // propose de revenir directement à son espace plutôt que de repasser par
  // /connexion, et une déconnexion explicite à portée de clic partout.
  const ActionsConnexion = ({ mobile = false }) => (
    utilisateur ? (
      <div className={mobile ? "flex gap-2 pt-2" : "flex items-center gap-2"}>
        <Link to={routeParDefaut} onClick={() => setMenuOuvert(false)}
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md ${mobile ? "flex-1 justify-center" : ""}`}
          style={{ color: mobile ? T.clair : T.ivory, border: `1px solid ${mobile ? "rgba(245,241,232,0.25)" : T.line}` }}>
          <LayoutGrid size={14} /> Mon espace
        </Link>
        <button onClick={() => { setMenuOuvert(false); deconnecter(); window.location.href = "/"; }}
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md ${mobile ? "flex-1 justify-center" : ""}`}
          style={{ color: T.coral, border: `1px solid ${mobile ? "rgba(217,80,60,0.4)" : T.line}` }}>
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    ) : (
      <div className={mobile ? "flex gap-2 pt-2" : "flex items-center gap-3"}>
        <Link to="/connexion" onClick={() => setMenuOuvert(false)}
          className={`text-sm px-3 py-2 rounded-md transition-colors ${mobile ? "flex-1 text-center" : ""}`}
          style={{ color: estActifRoute("/connexion") ? T.gold : (mobile ? T.clair : T.ivory), border: `1px solid ${estActifRoute("/connexion") ? T.gold : (mobile ? "rgba(245,241,232,0.25)" : T.line)}` }}>
          Connexion
        </Link>
        <Link to="/inscription" onClick={() => setMenuOuvert(false)}
          className={`text-sm px-4 py-2 rounded-md font-semibold transition-shadow ${mobile ? "flex-1 text-center" : ""}`}
          style={{ background: T.mint, color: T.inkDeep, boxShadow: estActifRoute("/inscription") ? `0 0 0 2px ${T.gold}` : "none" }}>
          Créer mon salon
        </Link>
      </div>
    )
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur"
        style={{ background: "rgba(255,255,255,0.85)", borderBottom: `1px solid ${T.line}`, boxShadow: "0 1px 0 rgba(18,42,32,0.04)" }}>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}>
            <Scissors size={16} style={{ color: T.inkDeep }} />
          </div>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.titre }}>LeBarberShop</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} to={cible(l)} className="text-sm transition-colors"
              style={{ color: estActif(l) ? T.gold : "rgba(18,42,32,0.7)", fontWeight: estActif(l) ? 600 : 400 }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button onClick={() => setLangue(langue === "fr" ? "en" : "fr")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: "rgba(18,42,32,0.06)", color: "rgba(18,42,32,0.7)" }}>
            <Globe size={13} /> {langue.toUpperCase()}
          </button>
          <ActionsConnexion />
        </div>

        <button className="lg:hidden" onClick={() => setMenuOuvert(!menuOuvert)} aria-label="Ouvrir le menu">
          {menuOuvert ? <X size={22} style={{ color: T.ivory }} /> : <Menu size={22} style={{ color: T.ivory }} />}
        </button>
      </header>

      {menuOuvert && (
        <div className="lg:hidden px-6 py-4 space-y-3 sticky top-[65px] z-30" style={{ background: T.inkDeep, borderBottom: `1px solid rgba(245,241,232,0.15)` }}>
          {NAV_LINKS.map((l) => (
            <Link key={l.label} to={cible(l)} onClick={() => setMenuOuvert(false)} className="block text-sm"
              style={{ color: estActif(l) ? T.gold : "rgba(245,241,232,0.8)", fontWeight: estActif(l) ? 600 : 400 }}>
              {l.label}
            </Link>
          ))}
          <ActionsConnexion mobile />
        </div>
      )}
    </>
  );
}
