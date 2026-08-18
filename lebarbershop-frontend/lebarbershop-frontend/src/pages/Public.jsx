import React, { useEffect, useState } from "react";
import { Scissors, Search, Star, MapPin, Lock, TrendingUp, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { T } from "../lib/tokens";
import { useAuth } from "../context/AuthContext";
import { Erreur } from "../components/UI";
import { listerSalons, souscrireAnalyseSectorielle } from "../api/salons";
import { statistiquesSecteurs } from "../api/analytics";

function Stars({ note }) {
  return <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < Math.round(note || 0) ? T.gold : "none"} style={{ color: T.gold }} />)}</div>;
}

export default function Public() {
  const { utilisateur } = useAuth();
  const [salons, setSalons] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState("");
  const [debloque, setDebloque] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Endpoint public en lecture — pas d'authentification requise pour parcourir les salons.
        const s = await listerSalons();
        setSalons(s.results || s);
      } catch { /* silencieux : la recherche publique peut nécessiter un endpoint dédié en prod */ }
    })();
  }, []);

  const souscrire = async (type) => {
    setErreur("");
    if (!utilisateur) { setErreur("Connectez-vous pour souscrire à l'analyse sectorielle."); return; }
    try {
      await souscrireAnalyseSectorielle(type); // POST /api/v1/analyses-sectorielles/
      const st = await statistiquesSecteurs(); // GET /api/v1/statistiques-secteurs/
      setSecteurs(st);
      setDebloque(true);
    } catch {
      setErreur("Impossible d'activer l'abonnement d'analyse.");
    }
  };

  const filtres = salons.filter((s) => s.nom?.toLowerCase().includes(recherche.toLowerCase()));

  return (
    <div className="w-full min-h-screen" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}><Scissors size={16} style={{ color: T.inkDeep }} /></div>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>LeBarberShop</span>
        </div>
      </header>

      <div className="px-6 py-6 max-w-5xl mx-auto space-y-10">
        <Erreur message={erreur} />
        <section>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ background: "rgba(246,239,221,0.05)", border: `1px solid ${T.line}` }}>
            <Search size={16} style={{ color: "rgba(246,239,221,0.4)" }} />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un salon par nom…" className="flex-1 bg-transparent outline-none text-sm" style={{ color: T.ivory }} />
          </div>
          <h2 className="mb-3" style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: T.ivory }}>Salons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtres.map((s) => (
              <div key={s.id} className="rounded-lg p-4" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <div className="flex items-start justify-between mb-1">
                  <p style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>{s.nom}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(246,239,221,0.5)" }}>
                  <MapPin size={11} style={{ color: T.mint }} /> {s.secteur_geographique}, {s.ville}
                </div>
              </div>
            ))}
            {filtres.length === 0 && <p className="text-sm" style={{ color: "rgba(246,239,221,0.4)" }}>Aucun salon trouvé.</p>}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-1"><Sparkles size={17} style={{ color: T.gold }} /><h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: T.ivory }}>Analyse sectorielle</h2></div>
          <p className="text-sm mb-5" style={{ color: "rgba(246,239,221,0.55)" }}>Identifiez où ouvrir votre prochain salon.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              { titre: "Secteurs rentables", type: "secteurs_rentables", prix: 20000, accent: T.mint, avantages: ["Secteurs rentables classés", "Secteurs non occupés"] },
              { titre: "Gestion complète", type: "gestion_complete", prix: 25000, accent: T.coral, avantages: ["Standards & matériel", "Rendements par secteur"] },
            ].map((p) => (
              <div key={p.type} className="rounded-lg p-5" style={{ background: T.inkDeep, border: `1px solid ${T.line}` }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ivory }}>{p.titre}</h3>
                  {!debloque && <Lock size={15} style={{ color: p.accent }} />}
                </div>
                <div className="space-y-1.5 mb-5">
                  {p.avantages.map((a) => <div key={a} className="flex items-center gap-2 text-xs" style={{ color: "rgba(246,239,221,0.7)" }}><CheckCircle2 size={12} style={{ color: p.accent }} /> {a}</div>)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl" style={{ color: p.accent }}>{p.prix.toLocaleString()} <span className="text-xs">FCFA</span></span>
                  <button onClick={() => souscrire(p.type)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold" style={{ background: p.accent, color: T.inkDeep }}>
                    S'abonner <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {debloque && (
            <div className="mt-5 rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} style={{ color: T.mint }} /><h3 style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Nombre de salons par secteur</h3></div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={secteurs} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke={T.line} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="secteur_geographique" stroke="rgba(246,239,221,0.5)" fontSize={12} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={{ background: T.inkDeep, border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="nombre_salons" fill={T.mint} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
