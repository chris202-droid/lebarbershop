import React, { useEffect, useMemo, useState } from "react";
import {
  Scissors, LayoutGrid, Users, Receipt, Package, Star, CreditCard,
  Search, Bell, Globe, Wallet, Clock, AlertTriangle, CheckCircle2
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { T } from "../lib/tokens";
import { NavItem, StatCard, TicketStub, Erreur } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { listerSalons } from "../api/salons";
import { listerTickets, validerTicket } from "../api/tickets";
import { listerProduits } from "../api/stocks";
import { listerBilansJournaliers } from "../api/analytics";

const NAV = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { key: "tickets", label: "Tickets", icon: Receipt },
  { key: "employes", label: "Employés", icon: Users },
  { key: "produits", label: "Produits", icon: Package },
  { key: "avis", label: "Avis clients", icon: Star },
  { key: "abonnement", label: "Abonnement", icon: CreditCard },
];

export default function DashboardSalon() {
  const { utilisateur } = useAuth();
  const [vue, setVue] = useState("dashboard");
  const [salon, setSalon] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [produits, setProduits] = useState([]);
  const [bilans, setBilans] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  // Charge le premier salon du propriétaire connecté, puis ses données associées.
  useEffect(() => {
    (async () => {
      try {
        const salons = await listerSalons();          // GET /api/v1/salons/
        const s = (salons.results || salons)[0];
        setSalon(s);
        if (s) {
          const [t, p, b] = await Promise.all([
            listerTickets(s.id),                        // GET /api/v1/tickets/?salon=
            listerProduits(s.id),                        // GET /api/v1/produits/?salon=
            listerBilansJournaliers(s.id),                // GET /api/v1/bilans-journaliers/?salon=
          ]);
          setTickets(t.results || t);
          setProduits(p.results || p);
          setBilans(b.results || b);
        }
      } catch (err) {
        setErreur("Impossible de charger les données du salon.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const marquerValide = async (ticket) => {
    try {
      await validerTicket(ticket.id, "especes"); // POST /api/v1/tickets/{id}/valider/
      setTickets((cur) => cur.map((t) => (t.id === ticket.id ? { ...t, statut: "valide" } : t)));
    } catch {
      setErreur("Échec de la validation du ticket.");
    }
  };

  const enAttente = tickets.filter((t) => t.statut === "en_attente");
  const alertes = produits.filter((p) => p.en_alerte_stock);
  const courbe = useMemo(() => bilans.map((b) => ({ j: b.date, montant: Number(b.entrees_total) })), [bilans]);
  const titre = NAV.find((n) => n.key === vue)?.label ?? "";

  if (chargement) {
    return <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.ink, color: T.ivory }}>Chargement…</div>;
  }

  return (
    <div className="w-full min-h-screen flex" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <aside className="w-[240px] shrink-0 flex flex-col p-4" style={{ borderRight: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 px-2 mb-8 mt-1">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}>
            <Scissors size={16} style={{ color: T.inkDeep }} />
          </div>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>LeBarberShop</span>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map((n) => <NavItem key={n.key} {...n} badge={n.key === "tickets" ? enAttente.length || undefined : undefined} active={vue === n.key} onClick={() => setVue(n.key)} />)}
        </nav>
        {salon && (
          <div className="mt-4 rounded-md p-3" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
            <p style={{ color: T.ivory, fontSize: 13, fontFamily: "Fraunces, serif" }}>{salon.nom}</p>
            <p className="text-[11px]" style={{ color: "rgba(246,239,221,0.5)" }}>{salon.secteur_geographique}, {salon.ville}</p>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: T.ivory }}>{titre}</h1>
          <span className="text-xs" style={{ color: "rgba(246,239,221,0.5)" }}>{utilisateur?.first_name || utilisateur?.username}</span>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-5">
          <Erreur message={erreur} />
          {!salon && (
            <p style={{ color: "rgba(246,239,221,0.5)" }}>
              Aucun salon associé à ce compte. Passez par l'assistant de création (page /onboarding).
            </p>
          )}

          {salon && vue === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Entrées (dernier bilan)" value={courbe.at(-1)?.montant?.toLocaleString() ?? "0"} icon={Wallet} />
                <StatCard label="Tickets en attente" value={enAttente.length} icon={Clock} />
                <StatCard label="Produits en alerte" value={alertes.length} icon={AlertTriangle} />
              </div>
              <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ivory }}>Entrées journalières</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={courbe}>
                    <defs>
                      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.gold} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={T.line} vertical={false} />
                    <XAxis dataKey="j" stroke="rgba(246,239,221,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: T.inkDeep, border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12 }} />
                    <Area type="monotone" dataKey="montant" stroke={T.gold} strokeWidth={2} fill="url(#gold)" />
                  </AreaChart>
                </ResponsiveContainer>
                {courbe.length === 0 && <p className="text-xs text-center py-6" style={{ color: "rgba(246,239,221,0.35)" }}>Aucun bilan journalier pour le moment.</p>}
              </div>
            </>
          )}

          {salon && vue === "tickets" && (
            <div className="space-y-2.5">
              {tickets.map((t) => <TicketStub key={t.id} ticket={t} onValider={marquerValide} />)}
              {tickets.length === 0 && <p className="text-sm" style={{ color: "rgba(246,239,221,0.4)" }}>Aucun ticket pour ce salon.</p>}
            </div>
          )}

          {salon && vue === "produits" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {produits.map((p) => (
                <div key={p.id} className="rounded-lg p-4 flex items-center justify-between" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                  <span className="text-sm" style={{ color: T.ivory }}>{p.nom}</span>
                  <span className="flex items-center gap-1.5 text-xs font-mono">
                    {p.en_alerte_stock ? <AlertTriangle size={13} style={{ color: T.coral }} /> : <CheckCircle2 size={13} style={{ color: T.mint }} />}
                    <span style={{ color: p.en_alerte_stock ? T.coral : "rgba(246,239,221,0.6)" }}>{p.quantite_stock} en stock</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
