import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, Smartphone, CreditCard as CardIcon, Banknote, CheckCircle2, Receipt,
  ArrowLeft, TrendingUp, Handshake, Scissors,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { T } from "../lib/tokens";
import { useAuth } from "../context/AuthContext";
import { Erreur } from "../components/UI";
import { listerSalons } from "../api/salons";
import { listerTickets, validerTicket } from "../api/tickets";
import { bilanSalon } from "../api/analytics";
import SiteFooter from "../components/SiteFooter";
import BoutonWhatsAppFlottant from "../components/BoutonWhatsAppFlottant";
import UserMenu from "../components/UserMenu";
import PanneauPartenaire from "../components/PanneauPartenaire";

const MODES = [
  { key: "especes", label: "Espèces", icon: Banknote },
  { key: "orange_money", label: "Orange Money", icon: Smartphone },
  { key: "mtn_momo", label: "MTN MoMo", icon: Smartphone },
  { key: "carte_bancaire", label: "Carte bancaire", icon: CardIcon },
];

const NAV = [
  { key: "caisse", label: "Encaissement", icon: Wallet },
  { key: "bilan", label: "Bilan", icon: TrendingUp },
];

/* ----------------------------- Vue : Encaissement ----------------------------- */

function VueEncaissement({ salon }) {
  const [tickets, setTickets] = useState([]);
  const [selection, setSelection] = useState(null);
  const [mode, setMode] = useState(null);
  const [valides, setValides] = useState([]);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    if (!salon) return;
    try {
      const t = await listerTickets(salon.id, "en_attente"); // GET /api/v1/tickets/?salon=&statut=en_attente
      const liste = t.results || t;
      setTickets(liste);
      setSelection(liste[0]?.id ?? null);
    } catch {
      setErreur("Impossible de charger la file de tickets.");
    }
  };
  useEffect(() => { charger(); }, [salon?.id]);

  const ticket = tickets.find((t) => t.id === selection);

  const encaisser = async () => {
    if (!ticket || !mode) return;
    setErreur("");
    try {
      const majTicket = await validerTicket(ticket.id, mode); // POST /api/v1/tickets/{id}/valider/ -> statut "payé" partout
      setValides([majTicket, ...valides]);
      const reste = tickets.filter((t) => t.id !== ticket.id);
      setTickets(reste);
      setSelection(reste[0]?.id ?? null);
      setMode(null);
    } catch (err) {
      setErreur(err.body?.detail || "Échec de l'encaissement (seule une caissière du salon peut valider).");
    }
  };

  const total = (t) => Number(t.montant_net || 0);

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-[300px] shrink-0 p-4 flex flex-col" style={{ borderRight: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-5 px-1">
          <Wallet size={18} style={{ color: T.gold }} />
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.titre }}>File d'attente</h2>
            <p className="text-[11px]" style={{ color: "rgba(18,42,32,0.45)" }}>{tickets.length} ticket(s) en attente</p>
          </div>
        </div>
        <Erreur message={erreur} />
        <div className="space-y-2 flex-1 overflow-auto mt-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setSelection(t.id)}
              className="w-full text-left p-3 rounded-md transition-colors"
              style={{ background: selection === t.id ? "rgba(201,147,42,0.1)" : "rgba(18,42,32,0.03)", border: `1px solid ${selection === t.id ? T.gold : T.line}` }}>
              <span className="font-mono text-[11px]" style={{ color: T.gold }}>{String(t.id).slice(0, 8)}</span>
              <p className="text-sm mt-1" style={{ color: T.ivory }}>{t.client_nom || t.nom_client_temporaire || "Client"}</p>
              <p className="font-mono text-sm mt-1.5" style={{ color: T.ivory }}>{total(t).toLocaleString()} FCFA</p>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-center text-sm py-10" style={{ color: "rgba(18,42,32,0.35)" }}>File vide — aucun ticket en attente</p>}
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-8">
        {!ticket ? (
          <div className="text-center">
            <Receipt size={40} className="mx-auto mb-3" style={{ color: "rgba(18,42,32,0.2)" }} />
            <p style={{ color: "rgba(18,42,32,0.4)" }}>Sélectionnez un ticket pour l'encaisser</p>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="rounded-lg p-6" style={{ background: T.inkDeep, border: `1px solid rgba(245,241,232,0.15)` }}>
              <div className="text-center mb-5">
                <p className="font-mono text-xs" style={{ color: "rgba(245,241,232,0.5)" }}>{String(ticket.id).slice(0, 8)}</p>
              </div>
              <div className="space-y-2 pb-4" style={{ borderBottom: `1px dashed rgba(245,241,232,0.2)` }}>
                {(ticket.lignes || []).map((l, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: "rgba(245,241,232,0.8)" }}>{l.soin_nom || l.soin}</span>
                    <span className="font-mono" style={{ color: T.clair }}>{Number(l.prix).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm" style={{ color: "rgba(245,241,232,0.7)" }}>Total à payer</span>
                <span className="font-mono text-2xl" style={{ color: T.gold }}>{total(ticket).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-medium"
                  style={{ background: mode === m.key ? T.gold : "rgba(18,42,32,0.05)", color: mode === m.key ? T.inkDeep : "rgba(18,42,32,0.7)", border: `1px solid ${mode === m.key ? T.gold : T.line}` }}>
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>

            <button onClick={encaisser} disabled={!mode}
              className="w-full mt-4 py-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: T.mint, color: T.boutonTexte, opacity: mode ? 1 : 0.4 }}>
              <CheckCircle2 size={16} /> Valider et encaisser
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* -------------------------------- Vue : Bilan -------------------------------- */

function VueBilan({ salon }) {
  const [periode, setPeriode] = useState("mois");
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!salon) return;
    (async () => {
      try {
        const d = await bilanSalon(salon.id, periode); // GET /api/v1/bilan-salon/?salon=&periode=
        setDonnees(d);
      } catch {
        setErreur("Impossible de charger le bilan de ce salon.");
      }
    })();
  }, [salon?.id, periode]);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <Erreur message={erreur} />
      <div className="flex gap-2">
        {[["semaine", "Semaine"], ["mois", "Mois"], ["trimestre", "Trimestre"], ["semestre", "Semestre"], ["annee", "Année"]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriode(k)}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: periode === k ? T.gold : "rgba(18,42,32,0.06)", color: periode === k ? T.inkDeep : "rgba(18,42,32,0.6)" }}>
            {l}
          </button>
        ))}
      </div>

      {donnees && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg p-4" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(18,42,32,0.45)" }}>Chiffre d'affaires (cumul)</p>
              <p className="font-mono" style={{ fontSize: 24, color: T.gold }}>{donnees.totaux.revenu_total.toLocaleString()} <span className="text-sm">FCFA</span></p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(18,42,32,0.45)" }}>Tickets réalisés (cumul)</p>
              <p className="font-mono" style={{ fontSize: 24, color: T.mint }}>{donnees.totaux.nombre_tickets_total}</p>
            </div>
          </div>

          <div className="rounded-lg p-5" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
            <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.titre }}>Revenus par période</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={donnees.lignes}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="periode" stroke="rgba(18,42,32,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12, boxShadow: "0 4px 16px rgba(18,42,32,0.12)" }} labelStyle={{ color: T.ivory }} />
                <Bar dataKey="revenu" fill={T.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {donnees.lignes.length === 0 && <p className="text-xs text-center py-6" style={{ color: "rgba(18,42,32,0.35)" }}>Aucune donnée sur cette période.</p>}
          </div>

          <div className="rounded-lg p-5" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
            <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.titre }}>Bilan par employé</h3>
            <div className="space-y-2">
              {donnees.par_employe.map((e) => (
                <div key={e.employe_id} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "rgba(18,42,32,0.03)" }}>
                  <span className="text-sm" style={{ color: T.ivory }}>{e.nom}</span>
                  <div className="text-right">
                    <span className="text-xs mr-3" style={{ color: "rgba(18,42,32,0.5)" }}>{e.nombre_soins} soin(s)</span>
                    <span className="font-mono text-sm" style={{ color: T.gold }}>{e.montant_total.toLocaleString()} FCFA</span>
                  </div>
                </div>
              ))}
              {donnees.par_employe.length === 0 && <p className="text-xs" style={{ color: "rgba(18,42,32,0.35)" }}>Aucune donnée employé.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------- Shell ---------------------------------- */

export default function Caisse() {
  const { utilisateur } = useAuth();
  const [salon, setSalon] = useState(null);
  const [vue, setVue] = useState("caisse");
  const [partenaireOuvert, setPartenaireOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const salons = await listerSalons();
        setSalon((salons.results || salons)[0] || null);
      } catch {
        setErreur("Impossible de charger le salon.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  if (chargement) return <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.ink, color: T.ivory }}>Chargement…</div>;

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <BoutonWhatsAppFlottant />
      <PanneauPartenaire ouvert={partenaireOuvert} onFermer={() => setPartenaireOuvert(false)} />

      <div className="flex flex-1 min-h-0">
        <div className="w-[70px] shrink-0 flex flex-col items-center py-4 gap-2" style={{ borderRight: `1px solid ${T.line}` }}>
          <Link to="/" className="w-9 h-9 rounded-md flex items-center justify-center mb-4" style={{ background: T.gold }} title="Accueil">
            <Scissors size={16} style={{ color: T.inkDeep }} />
          </Link>
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setVue(n.key)} title={n.label}
              className="w-11 h-11 rounded-md flex items-center justify-center"
              style={{ background: vue === n.key ? "rgba(201,147,42,0.12)" : "transparent", color: vue === n.key ? T.gold : "rgba(18,42,32,0.5)" }}>
              <n.icon size={18} />
            </button>
          ))}
          <button onClick={() => setPartenaireOuvert(true)} title="Devenir partenaire"
            className="w-11 h-11 rounded-md flex items-center justify-center mt-auto"
            style={{ background: "rgba(201,147,42,0.1)", color: T.gold }}>
            <Handshake size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
            <div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: T.titre }}>{NAV.find((n) => n.key === vue)?.label}</h1>
              {salon && <p className="text-xs mt-0.5" style={{ color: "rgba(18,42,32,0.45)" }}>{salon.nom}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm" style={{ color: "rgba(18,42,32,0.55)" }}>
                Bonjour, {utilisateur?.first_name || utilisateur?.username}
              </span>
              <UserMenu />
            </div>
          </header>
          <Erreur message={erreur} />
          {!salon ? (
            <p className="p-6" style={{ color: "rgba(18,42,32,0.5)" }}>Aucun salon associé à ce compte.</p>
          ) : (
            <>
              {vue === "caisse" && <VueEncaissement salon={salon} />}
              {vue === "bilan" && <VueBilan salon={salon} />}
            </>
          )}
        </div>
      </div>

      <SiteFooter compact />
    </div>
  );
}
