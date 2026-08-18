import React, { useEffect, useState } from "react";
import { Wallet, Smartphone, CreditCard as CardIcon, Banknote, CheckCircle2, Receipt } from "lucide-react";
import { T } from "../lib/tokens";
import { Erreur } from "../components/UI";
import { listerSalons } from "../api/salons";
import { listerTickets, validerTicket } from "../api/tickets";

const MODES = [
  { key: "especes", label: "Espèces", icon: Banknote },
  { key: "orange_money", label: "Orange Money", icon: Smartphone },
  { key: "mtn_momo", label: "MTN MoMo", icon: Smartphone },
  { key: "carte_bancaire", label: "Carte bancaire", icon: CardIcon },
];

export default function Caisse() {
  const [tickets, setTickets] = useState([]);
  const [selection, setSelection] = useState(null);
  const [mode, setMode] = useState(null);
  const [valides, setValides] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    try {
      const salons = await listerSalons();
      const salon = (salons.results || salons)[0];
      if (!salon) return;
      const t = await listerTickets(salon.id, "en_attente"); // GET /api/v1/tickets/?salon=&statut=en_attente
      const liste = t.results || t;
      setTickets(liste);
      setSelection(liste[0]?.id ?? null);
    } catch {
      setErreur("Impossible de charger la file de tickets.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const ticket = tickets.find((t) => t.id === selection);

  const encaisser = async () => {
    if (!ticket || !mode) return;
    setErreur("");
    try {
      const majTicket = await validerTicket(ticket.id, mode); // POST /api/v1/tickets/{id}/valider/
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

  if (chargement) return <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.ink, color: T.ivory }}>Chargement…</div>;

  return (
    <div className="w-full min-h-screen flex" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <aside className="w-[300px] shrink-0 p-4 flex flex-col" style={{ borderRight: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-5 px-1">
          <Wallet size={18} style={{ color: T.gold }} />
          <div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ivory }}>Caisse</h1>
            <p className="text-[11px]" style={{ color: "rgba(246,239,221,0.45)" }}>{tickets.length} ticket(s) en attente</p>
          </div>
        </div>
        <Erreur message={erreur} />
        <div className="space-y-2 flex-1 overflow-auto mt-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setSelection(t.id)}
              className="w-full text-left p-3 rounded-md transition-colors"
              style={{ background: selection === t.id ? "rgba(232,184,75,0.1)" : "rgba(246,239,221,0.03)", border: `1px solid ${selection === t.id ? T.gold : T.line}` }}>
              <span className="font-mono text-[11px]" style={{ color: T.gold }}>{String(t.id).slice(0, 8)}</span>
              <p className="text-sm mt-1" style={{ color: T.ivory }}>{t.client_nom || t.nom_client_temporaire || "Client"}</p>
              <p className="font-mono text-sm mt-1.5" style={{ color: T.ivory }}>{total(t).toLocaleString()} FCFA</p>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-center text-sm py-10" style={{ color: "rgba(246,239,221,0.35)" }}>File vide — aucun ticket en attente</p>}
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-8">
        {!ticket ? (
          <div className="text-center">
            <Receipt size={40} className="mx-auto mb-3" style={{ color: "rgba(246,239,221,0.2)" }} />
            <p style={{ color: "rgba(246,239,221,0.4)" }}>Sélectionnez un ticket pour l'encaisser</p>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="rounded-lg p-6" style={{ background: T.inkDeep, border: `1px solid ${T.line}` }}>
              <div className="text-center mb-5">
                <p className="font-mono text-xs" style={{ color: "rgba(246,239,221,0.4)" }}>{String(ticket.id).slice(0, 8)}</p>
              </div>
              <div className="space-y-2 pb-4" style={{ borderBottom: `1px dashed ${T.line}` }}>
                {(ticket.lignes || []).map((l, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: "rgba(246,239,221,0.75)" }}>{l.soin_nom || l.soin}</span>
                    <span className="font-mono" style={{ color: T.ivory }}>{Number(l.prix).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm" style={{ color: "rgba(246,239,221,0.6)" }}>Total à payer</span>
                <span className="font-mono text-2xl" style={{ color: T.gold }}>{total(ticket).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-medium"
                  style={{ background: mode === m.key ? T.gold : "rgba(246,239,221,0.05)", color: mode === m.key ? T.inkDeep : "rgba(246,239,221,0.7)", border: `1px solid ${mode === m.key ? T.gold : T.line}` }}>
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>

            <button onClick={encaisser} disabled={!mode}
              className="w-full mt-4 py-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: T.mint, color: T.inkDeep, opacity: mode ? 1 : 0.4 }}>
              <CheckCircle2 size={16} /> Valider et encaisser
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
