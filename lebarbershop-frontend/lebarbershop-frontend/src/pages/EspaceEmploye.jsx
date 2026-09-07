import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Scissors, LayoutGrid, Receipt, Star, CreditCard, Handshake,
  Plus, X, CheckCircle2, XCircle, Clock, TrendingUp, Gift,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { T } from "../lib/tokens";
import { NavItem, Erreur } from "../components/UI";
import SiteFooter from "../components/SiteFooter";
import BoutonWhatsAppFlottant from "../components/BoutonWhatsAppFlottant";
import UserMenu from "../components/UserMenu";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/RoleContext";
import {
  listerTickets, creerTicket, listerMesLignesTicket, confirmerLigne, annulerLigne, annulerTicket,
} from "../api/tickets";
import { listerSoins } from "../api/services";
import { listerAvis } from "../api/avis";
import { listerAbonnements } from "../api/salons";
import { listerRendementsEmployes } from "../api/analytics";
import PanneauPartenaire from "../components/PanneauPartenaire";

const NAV = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { key: "tickets", label: "Tickets", icon: Receipt },
  { key: "avis", label: "Avis clients", icon: Star },
  { key: "abonnement", label: "Abonnement", icon: CreditCard },
];

/* --------------------------- Vue : Tableau de bord --------------------------- */

function VueDashboard({ posteActif }) {
  const [rendements, setRendements] = useState([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!posteActif) return;
    (async () => {
      try {
        const r = await listerRendementsEmployes(posteActif.id); // GET /api/v1/rendements-employes/?employe=
        setRendements(r.results || r);
      } catch {
        setErreur("Impossible de charger vos performances.");
      }
    })();
  }, [posteActif]);

  const totalSoins = rendements.reduce((s, r) => s + r.nombre_soins, 0);
  const totalMontant = rendements.reduce((s, r) => s + Number(r.montant_total), 0);

  return (
    <div className="space-y-5">
      <Erreur message={erreur} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
          <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(18,42,32,0.45)" }}>Soins réalisés</p>
          <p className="font-mono" style={{ fontSize: 26, color: T.ivory }}>{totalSoins}</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
          <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(18,42,32,0.45)" }}>Montant généré</p>
          <p className="font-mono" style={{ fontSize: 26, color: T.gold }}>{totalMontant.toLocaleString()} <span className="text-sm">FCFA</span></p>
        </div>
      </div>

      <div className="rounded-lg p-5" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
        <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Ma performance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rendements}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="date" stroke="rgba(18,42,32,0.4)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "#FFFFFF", border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12, boxShadow: "0 4px 16px rgba(18,42,32,0.12)" }} labelStyle={{ color: T.ivory }} />
            <Bar dataKey="montant_total" fill={T.gold} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {rendements.length === 0 && <p className="text-xs text-center py-6" style={{ color: "rgba(18,42,32,0.35)" }}>Aucune donnée de performance pour le moment.</p>}
      </div>
    </div>
  );
}

/* ------------------------------- Vue : Tickets ------------------------------- */

function VueTickets({ posteActif }) {
  const [tickets, setTickets] = useState([]);
  const [mesLignes, setMesLignes] = useState([]);
  const [soins, setSoins] = useState([]);
  const [erreur, setErreur] = useState("");
  const [formOuvert, setFormOuvert] = useState(false);

  // Nouveau ticket
  const [nomClient, setNomClient] = useState("");
  const [panier, setPanier] = useState([]);
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    if (!posteActif) return;
    try {
      const [t, l, s] = await Promise.all([
        listerTickets(posteActif.salon, "en_attente"), // GET /api/v1/tickets/?salon=&statut=en_attente
        listerMesLignesTicket(),                        // GET /api/v1/lignes-ticket/
        listerSoins(posteActif.salon),                  // GET /api/v1/soins/?salon=
      ]);
      setTickets((t.results || t).filter((tk) => tk.employe_createur === posteActif.id));
      setMesLignes((l.results || l).filter((li) => li.statut === "en_attente"));
      setSoins((s.results || s).filter((so) => so.actif));
    } catch {
      setErreur("Impossible de charger les tickets.");
    }
  };
  useEffect(() => { charger(); }, [posteActif]);

  const ajouterSoin = (soin) => setPanier([...panier, { ...soin, uid: Date.now() + soin.id, prixModifie: String(soin.prix) }]);
  const retirerSoin = (uid) => setPanier(panier.filter((p) => p.uid !== uid));
  const modifierPrix = (uid, prix) => setPanier(panier.map((p) => (p.uid === uid ? { ...p, prixModifie: prix } : p)));
  const total = panier.reduce((s, p) => s + Number(p.prixModifie || 0), 0);

  const ouvrirTicket = async (e) => {
    e.preventDefault();
    if (!panier.length) return;
    setEnvoi(true); setErreur("");
    try {
      await creerTicket({ // POST /api/v1/tickets/
        salon: posteActif.salon,
        ...(nomClient ? { nom_client_temporaire: nomClient } : {}),
        employe_createur: posteActif.id,
        lignes: panier.map((p) => ({ soin: p.id, employe_executant: posteActif.id, prix: Number(p.prixModifie) })), // prix modifiable à la main (point 6)
      });
      setPanier([]); setNomClient(""); setFormOuvert(false);
      charger();
    } catch {
      setErreur("Impossible d'ouvrir ce ticket.");
    } finally {
      setEnvoi(false);
    }
  };

  const confirmer = async (ligne) => {
    try {
      await confirmerLigne(ligne.id);
      setMesLignes(mesLignes.filter((l) => l.id !== ligne.id));
    } catch {
      setErreur("Impossible de confirmer ce soin.");
    }
  };
  const annuler = async (ligne) => {
    try {
      await annulerLigne(ligne.id);
      setMesLignes(mesLignes.filter((l) => l.id !== ligne.id));
    } catch {
      setErreur("Impossible d'annuler ce soin.");
    }
  };

  const annulerMonTicket = async (ticket) => {
    try {
      await annulerTicket(ticket.id); // POST /api/v1/tickets/{id}/annuler/ (point 3)
      setTickets(tickets.filter((t) => t.id !== ticket.id));
    } catch {
      setErreur("Impossible d'annuler ce ticket.");
    }
  };

  return (
    <div className="space-y-6">
      <Erreur message={erreur} />

      {/* Soins qui m'attendent (assignés par la caissière ou un collègue) */}
      {mesLignes.length > 0 && (
        <div>
          <h3 className="mb-3" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Soins à confirmer</h3>
          <div className="space-y-2">
            {mesLignes.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
                <div>
                  <p className="text-sm" style={{ color: T.ivory }}>{l.soin_nom || l.soin}</p>
                  <p className="text-xs" style={{ color: "rgba(18,42,32,0.5)" }}>{Number(l.prix).toLocaleString()} FCFA</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => confirmer(l)} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md" style={{ background: "rgba(30,158,100,0.15)", color: T.mint }}>
                    <CheckCircle2 size={12} /> Confirmer
                  </button>
                  <button onClick={() => annuler(l)} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md" style={{ background: "rgba(217,80,60,0.15)", color: T.coral }}>
                    <XCircle size={12} /> Annuler
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mes tickets ouverts, en attente de passage en caisse */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Mes tickets en attente de caisse</h3>
          <button onClick={() => setFormOuvert(!formOuvert)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold" style={{ background: T.gold, color: T.inkDeep }}>
            <Plus size={13} /> Nouveau ticket
          </button>
        </div>

        {formOuvert && (
          <form onSubmit={ouvrirTicket} className="rounded-lg p-4 mb-4 space-y-3" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
            <input value={nomClient} onChange={(e) => setNomClient(e.target.value)}
              placeholder="Nom du client (laisser vide pour un nom automatique, ex. Clt1.28.8.26)"
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {soins.map((s) => (
                <button type="button" key={s.id} onClick={() => ajouterSoin(s)}
                  className="text-left p-2.5 rounded-md" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
                  <p className="text-xs" style={{ color: T.ivory }}>{s.nom}</p>
                  <p className="font-mono text-[11px] mt-1" style={{ color: T.gold }}>{Number(s.prix).toLocaleString()} FCFA</p>
                </button>
              ))}
            </div>
            {panier.length > 0 && (
              <div className="space-y-1.5 pt-2" style={{ borderTop: `1px dashed ${T.line}` }}>
                {panier.map((p) => (
                  <div key={p.uid} className="flex items-center justify-between gap-2 text-xs">
                    <span style={{ color: "rgba(18,42,32,0.8)" }}>{p.nom}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <input type="number" min="0" value={p.prixModifie} onChange={(e) => modifierPrix(p.uid, e.target.value)}
                        className="w-24 px-2 py-1 rounded-md text-xs outline-none text-right" style={{ background: "rgba(18,42,32,0.05)", color: T.gold, border: `1px solid ${T.line}` }} />
                      <button type="button" onClick={() => retirerSoin(p.uid)}><X size={12} style={{ color: T.coral }} /></button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-1.5 text-sm">
                  <span style={{ color: "rgba(18,42,32,0.6)" }}>Total</span>
                  <span className="font-mono" style={{ color: T.gold }}>{total.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
            <button type="submit" disabled={envoi || !panier.length} className="w-full py-2.5 rounded-md text-sm font-semibold"
              style={{ background: T.mint, color: T.inkDeep, opacity: (envoi || !panier.length) ? 0.5 : 1 }}>
              Ouvrir le ticket
            </button>
          </form>
        )}

        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
              <div>
                <p className="text-sm" style={{ color: T.ivory }}>{t.client_nom || t.nom_client_temporaire}</p>
                <p className="text-xs" style={{ color: "rgba(18,42,32,0.5)" }}>{(t.lignes || []).map((l) => l.soin_nom || l.soin).join(" · ")}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm" style={{ color: T.ivory }}>{Number(t.montant_net).toLocaleString()} FCFA</p>
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: T.gold }}><Clock size={10} /> Chez la caissière</span>
                  <button onClick={() => annulerMonTicket(t)} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(217,80,60,0.15)", color: T.coral }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun ticket en attente.</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Vue : Avis ------------------------------- */

function VueAvis({ posteActif }) {
  const [avis, setAvis] = useState([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!posteActif) return;
    (async () => {
      try {
        const a = await listerAvis(posteActif.salon); // GET /api/v1/avis/?salon=
        setAvis(a.results || a);
      } catch {
        setErreur("Impossible de charger les avis.");
      }
    })();
  }, [posteActif]);

  return (
    <div className="space-y-3 max-w-lg">
      <Erreur message={erreur} />
      {avis.map((a) => (
        <div key={a.id} className="rounded-lg p-4" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-1 mb-1.5">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < a.note ? T.gold : "none"} style={{ color: T.gold }} />)}
          </div>
          {a.commentaire && <p className="text-sm" style={{ color: "rgba(18,42,32,0.8)" }}>"{a.commentaire}"</p>}
        </div>
      ))}
      {avis.length === 0 && <p className="text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun avis pour le moment.</p>}
    </div>
  );
}

/* ----------------------------- Vue : Abonnement ----------------------------- */

function VueAbonnement({ posteActif }) {
  const [abonnement, setAbonnement] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!posteActif) return;
    (async () => {
      try {
        const a = await listerAbonnements(posteActif.salon); // GET /api/v1/abonnements/?salon=
        const liste = a.results || a;
        setAbonnement(liste.find((x) => x.statut === "actif") || liste[0] || null);
      } catch {
        setErreur("Impossible de charger l'abonnement.");
      }
    })();
  }, [posteActif]);

  return (
    <div className="max-w-md">
      <Erreur message={erreur} />
      {abonnement ? (
        <div className="rounded-lg p-6" style={{ background: T.inkDeep, border: `1px solid rgba(245,241,232,0.15)` }}>
          <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(245,241,232,0.5)" }}>Abonnement du salon</p>
          <p className="font-mono" style={{ fontSize: 22, color: T.gold }}>{abonnement.statut === "actif" ? "Actif" : abonnement.statut}</p>
          <p className="text-xs mt-2" style={{ color: "rgba(245,241,232,0.6)" }}>
            Expire le {new Date(abonnement.date_fin).toLocaleDateString("fr-FR")}
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun abonnement actif pour ce salon.</p>
      )}
    </div>
  );
}

/* --------------------------- Panneau : Devenir partenaire --------------------------- */

/* ---------------------------------- Shell ---------------------------------- */

export default function EspaceEmploye() {
  const { utilisateur } = useAuth();
  const { postes } = useRole();
  const [vue, setVue] = useState("dashboard");
  const [partenaireOuvert, setPartenaireOuvert] = useState(false);

  // Poste "praticien" actif (coiffeur/coiffeuse/maquilleuse/esthéticienne) —
  // détermine le salon d'appartenance affiché dans l'en-tête (point 2).
  const rolesPraticien = ["coiffeur_homme", "coiffeuse_femme", "maquilleuse", "estheticienne", "autre"];
  const posteActif = postes.find((p) => rolesPraticien.includes(p.role) && p.actif) || postes[0] || null;

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <BoutonWhatsAppFlottant />
      <PanneauPartenaire ouvert={partenaireOuvert} onFermer={() => setPartenaireOuvert(false)} />

      <div className="flex flex-1 min-h-0">
        <aside className="w-[240px] shrink-0 flex flex-col p-4" style={{ borderRight: `1px solid ${T.line}` }}>
          <Link to="/" className="flex items-center gap-2 px-2 mb-2 mt-1">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}>
              <Scissors size={16} style={{ color: T.inkDeep }} />
            </div>
            <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>LeBarberShop</span>
          </Link>

          {/* Nom du salon auquel l'employé appartient (point 2) */}
          {posteActif && (
            <div className="mb-6 mt-2 rounded-md p-3" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(18,42,32,0.4)" }}>Mon salon</p>
              <p style={{ color: T.ivory, fontSize: 14, fontFamily: "Fraunces, serif" }}>{posteActif.salon_nom}</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.mint }}>{posteActif.role_affiche || posteActif.role}</p>
            </div>
          )}

          <nav className="space-y-1 flex-1">
            {NAV.map((n) => <NavItem key={n.key} {...n} active={vue === n.key} onClick={() => setVue(n.key)} />)}
          </nav>

          <button onClick={() => setPartenaireOuvert(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-semibold mt-2"
            style={{ background: "rgba(201,147,42,0.12)", color: T.gold, border: `1px solid rgba(201,147,42,0.3)` }}>
            <Handshake size={16} /> Devenir partenaire
          </button>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
            <div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: T.ivory }}>{NAV.find((n) => n.key === vue)?.label}</h1>
              {posteActif && <p className="text-xs mt-0.5" style={{ color: "rgba(18,42,32,0.45)" }}>{posteActif.salon_nom}</p>}
            </div>
            <UserMenu />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {!posteActif ? (
              <p style={{ color: "rgba(18,42,32,0.5)" }}>Aucun poste actif trouvé. Contactez le gestionnaire de votre salon.</p>
            ) : (
              <>
                {vue === "dashboard" && <VueDashboard posteActif={posteActif} />}
                {vue === "tickets" && <VueTickets posteActif={posteActif} />}
                {vue === "avis" && <VueAvis posteActif={posteActif} />}
                {vue === "abonnement" && <VueAbonnement posteActif={posteActif} />}
              </>
            )}
          </main>
        </div>
      </div>

      <SiteFooter compact />
    </div>
  );
}
