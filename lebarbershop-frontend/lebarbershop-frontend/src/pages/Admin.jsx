import React, { useEffect, useState } from "react";
import { Shield, Store, Tag, Gift, Users, TrendingUp, Plus, MapPin, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { T } from "../lib/tokens";
import { NavItem, Erreur } from "../components/UI";
import { listerSalons, listerCodesReduction, creerCodeReduction, listerCodesSponsoring, creerCodeSponsoring } from "../api/salons";
import { statistiquesSecteurs } from "../api/analytics";

function StatutBadge({ statut }) {
  const map = {
    actif: { label: "Actif", color: T.mint, Icon: CheckCircle2 },
    en_attente: { label: "En attente", color: T.gold, Icon: Clock },
    suspendu: { label: "Suspendu", color: T.coral, Icon: XCircle },
  };
  const { label, color, Icon } = map[statut] || map.en_attente;
  return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}><Icon size={11} /> {label}</span>;
}

const NAV = [
  { key: "salons", label: "Salons", icon: Store },
  { key: "codes", label: "Codes réduction & sponsoring", icon: Tag },
  { key: "rendement", label: "Statistiques secteurs", icon: TrendingUp },
];

export default function Admin() {
  const [vue, setVue] = useState("salons");
  const [salons, setSalons] = useState([]);
  const [codesReduction, setCodesReduction] = useState([]);
  const [codesSponsoring, setCodesSponsoring] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  const [nouveauCodeReduc, setNouveauCodeReduc] = useState({ code: "", pourcentage_reduction: "" });
  const [nouveauCodeSpons, setNouveauCodeSpons] = useState({ code: "", beneficiaire_nom: "" });

  useEffect(() => {
    (async () => {
      try {
        const [s, cr, cs, st] = await Promise.all([
          listerSalons(),              // GET /api/v1/salons/ (admin voit tous les salons)
          listerCodesReduction(),      // GET /api/v1/codes-reduction/
          listerCodesSponsoring(),     // GET /api/v1/codes-sponsoring/
          statistiquesSecteurs(),      // GET /api/v1/statistiques-secteurs/
        ]);
        setSalons(s.results || s);
        setCodesReduction(cr.results || cr);
        setCodesSponsoring(cs.results || cs);
        setSecteurs(st);
      } catch {
        setErreur("Accès refusé ou erreur de chargement (réservé à l'administrateur principal).");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const ajouterCodeReduction = async () => {
    if (!nouveauCodeReduc.code) return;
    const c = await creerCodeReduction({ ...nouveauCodeReduc, pourcentage_reduction: Number(nouveauCodeReduc.pourcentage_reduction) }); // POST /api/v1/codes-reduction/
    setCodesReduction([c, ...codesReduction]);
    setNouveauCodeReduc({ code: "", pourcentage_reduction: "" });
  };
  const ajouterCodeSponsoring = async () => {
    if (!nouveauCodeSpons.code) return;
    const c = await creerCodeSponsoring(nouveauCodeSpons); // POST /api/v1/codes-sponsoring/
    setCodesSponsoring([c, ...codesSponsoring]);
    setNouveauCodeSpons({ code: "", beneficiaire_nom: "" });
  };

  if (chargement) return <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.ink, color: T.ivory }}>Chargement…</div>;

  return (
    <div className="w-full min-h-screen flex" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <aside className="w-[250px] shrink-0 p-4 flex flex-col" style={{ borderRight: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 px-2 mb-8 mt-1">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}><Shield size={16} style={{ color: T.inkDeep }} /></div>
          <div>
            <p style={{ fontFamily: "Fraunces, serif", fontSize: 15, color: T.ivory }}>LeBarberShop</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: T.gold }}>Administration</p>
          </div>
        </div>
        <nav className="space-y-1">{NAV.map((n) => <NavItem key={n.key} {...n} active={vue === n.key} onClick={() => setVue(n.key)} />)}</nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: T.ivory }}>{NAV.find((n) => n.key === vue)?.label}</h1>
        </header>
        <main className="flex-1 overflow-auto p-6 space-y-4">
          <Erreur message={erreur} />

          {vue === "salons" && (
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.line}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(246,239,221,0.04)" }}>
                    {["Salon", "Secteur", "Employés max", "Statut"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wide" style={{ color: "rgba(246,239,221,0.45)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salons.map((s) => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${T.line}` }}>
                      <td className="px-4 py-3" style={{ color: T.ivory }}>{s.nom}</td>
                      <td className="px-4 py-3 flex items-center gap-1.5" style={{ color: "rgba(246,239,221,0.6)" }}><MapPin size={12} style={{ color: T.mint }} /> {s.secteur_geographique}, {s.ville}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: "rgba(246,239,221,0.7)" }}>{s.nombre_employes_max}</td>
                      <td className="px-4 py-3"><StatutBadge statut={s.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salons.length === 0 && <p className="text-sm text-center py-6" style={{ color: "rgba(246,239,221,0.4)" }}>Aucun salon enregistré.</p>}
            </div>
          )}

          {vue === "codes" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <div className="flex items-center gap-2 mb-4"><Tag size={16} style={{ color: T.coral }} /><h3 style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Codes de réduction</h3></div>
                <div className="flex gap-2 mb-3">
                  <input value={nouveauCodeReduc.code} onChange={(e) => setNouveauCodeReduc({ ...nouveauCodeReduc, code: e.target.value })} placeholder="CODE" className="flex-1 px-2 py-2 rounded-md text-sm" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input value={nouveauCodeReduc.pourcentage_reduction} onChange={(e) => setNouveauCodeReduc({ ...nouveauCodeReduc, pourcentage_reduction: e.target.value })} placeholder="%" type="number" className="w-16 px-2 py-2 rounded-md text-sm" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <button onClick={ajouterCodeReduction} className="px-3 rounded-md" style={{ background: T.coral, color: T.inkDeep }}><Plus size={14} /></button>
                </div>
                <div className="space-y-2">
                  {codesReduction.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "rgba(246,239,221,0.03)" }}>
                      <span className="font-mono text-sm" style={{ color: T.ivory }}>{c.code}</span>
                      <span className="font-mono text-sm" style={{ color: T.gold }}>{c.pourcentage_reduction}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <div className="flex items-center gap-2 mb-4"><Gift size={16} style={{ color: T.mint }} /><h3 style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Codes de sponsoring</h3></div>
                <div className="flex gap-2 mb-3">
                  <input value={nouveauCodeSpons.code} onChange={(e) => setNouveauCodeSpons({ ...nouveauCodeSpons, code: e.target.value })} placeholder="CODE" className="flex-1 px-2 py-2 rounded-md text-sm" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input value={nouveauCodeSpons.beneficiaire_nom} onChange={(e) => setNouveauCodeSpons({ ...nouveauCodeSpons, beneficiaire_nom: e.target.value })} placeholder="Bénéficiaire" className="flex-1 px-2 py-2 rounded-md text-sm" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <button onClick={ajouterCodeSponsoring} className="px-3 rounded-md" style={{ background: T.mint, color: T.inkDeep }}><Plus size={14} /></button>
                </div>
                <div className="space-y-2">
                  {codesSponsoring.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "rgba(246,239,221,0.03)" }}>
                      <span className="font-mono text-sm" style={{ color: T.ivory }}>{c.code}</span>
                      <span className="text-xs" style={{ color: "rgba(246,239,221,0.6)" }}>{c.beneficiaire_nom}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {vue === "rendement" && (
            <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
              <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Salons par secteur géographique</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={secteurs}>
                  <CartesianGrid stroke={T.line} vertical={false} />
                  <XAxis dataKey="secteur_geographique" stroke="rgba(246,239,221,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: T.inkDeep, border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="nombre_salons" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
