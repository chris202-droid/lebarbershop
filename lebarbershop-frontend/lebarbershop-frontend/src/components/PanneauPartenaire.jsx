import React, { useEffect, useState } from "react";
import { X, Copy, Smartphone, CreditCard as CardIcon, CheckCircle2 } from "lucide-react";
import { T } from "../lib/tokens";
import { Erreur } from "./UI";
import { mesCodesSponsoring, demanderCodePartenaire, confirmerPaiementCodePartenaire } from "../api/salons";

const MODES = [
  { key: "orange_money", label: "Orange Money", icon: Smartphone },
  { key: "mtn_momo", label: "MTN MoMo", icon: Smartphone },
  { key: "carte_bancaire", label: "Carte bancaire", icon: CardIcon },
];

/**
 * Programme partenaire (points 7, 15, 16, 17, 18) : un employé — ou une
 * caissière — peut acheter un code de sponsoring personnel à 500 FCFA, en
 * choisir le nom, régler via Orange Money / MTN MoMo / carte, et suivre ses
 * codes + revenus générés (200 FCFA par réutilisation) une fois attribués.
 */
export default function PanneauPartenaire({ ouvert, onFermer }) {
  const [codes, setCodes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const [nomCode, setNomCode] = useState("");
  const [modePaiement, setModePaiement] = useState(null);
  const [codeEnAttente, setCodeEnAttente] = useState(null);

  const charger = async () => {
    try {
      const c = await mesCodesSponsoring(); // GET /api/v1/codes-sponsoring/ (filtré à mes codes)
      const liste = c.results || c;
      setCodes(liste);
      setCodeEnAttente(liste.find((x) => x.statut === "en_attente_paiement") || null);
    } catch {
      setErreur("Impossible de charger vos codes.");
    }
  };
  useEffect(() => { if (ouvert) charger(); }, [ouvert]);

  const demander = async (e) => {
    e.preventDefault();
    if (!modePaiement) return;
    setEnvoi(true); setErreur("");
    try {
      const c = await demanderCodePartenaire({ // POST /api/v1/codes-sponsoring/acheter/
        ...(nomCode ? { code: nomCode.trim().toUpperCase() } : {}),
        mode_paiement: modePaiement,
      });
      setCodeEnAttente(c);
      setCodes([c, ...codes.filter((x) => x.id !== c.id)]);
    } catch (err) {
      setErreur(err.body?.code?.[0] || err.body?.mode_paiement?.[0] || "Demande impossible pour le moment.");
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerPaiement = async () => {
    if (!codeEnAttente) return;
    setEnvoi(true); setErreur("");
    try {
      const c = await confirmerPaiementCodePartenaire(codeEnAttente.id); // POST .../confirmer-paiement/
      setCodes(codes.map((x) => (x.id === c.id ? c : x)));
      setCodeEnAttente(null);
      setNomCode(""); setModePaiement(null);
    } catch {
      setErreur("Impossible de confirmer le paiement pour le moment.");
    } finally {
      setEnvoi(false);
    }
  };

  if (!ouvert) return null;

  const codesActifs = codes.filter((c) => c.statut === "actif");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,61,46,0.55)" }}>
      <div className="w-full max-w-md rounded-lg p-6" style={{ background: T.inkDeep, border: `1px solid rgba(245,241,232,0.15)` }}>
        <div className="flex items-center justify-between mb-1">
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.clair }}>Programme partenaire</h3>
          <button onClick={onFermer}><X size={18} style={{ color: "rgba(245,241,232,0.5)" }} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: "rgba(245,241,232,0.55)" }}>
          Achetez un code personnel à 500 FCFA, partagez-le : vous gagnez 200 FCFA à chaque nouvelle souscription de salon utilisant votre code.
        </p>
        <Erreur message={erreur} />

        {codeEnAttente ? (
          <div className="rounded-md p-4 mb-5" style={{ background: "rgba(201,147,42,0.08)", border: `1px solid rgba(201,147,42,0.3)` }}>
            <p className="text-xs mb-1" style={{ color: T.gold }}>Code réservé, en attente de paiement</p>
            <p className="font-mono text-lg mb-3" style={{ color: T.clair }}>{codeEnAttente.code}</p>
            <button onClick={confirmerPaiement} disabled={envoi} className="w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: T.mint, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>
              <CheckCircle2 size={15} /> {envoi ? "Confirmation…" : `Confirmer le paiement (${MODES.find((m) => m.key === codeEnAttente.mode_paiement)?.label || codeEnAttente.mode_paiement})`}
            </button>
          </div>
        ) : (
          <form onSubmit={demander} className="space-y-3 mb-5">
            <input value={nomCode} onChange={(e) => setNomCode(e.target.value)}
              placeholder="Nom de votre code (optionnel, ex. PROMO-MARIE)"
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(245,241,232,0.05)", color: T.clair, border: `1px solid rgba(245,241,232,0.15)` }} />
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button type="button" key={m.key} onClick={() => setModePaiement(m.key)}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-md text-[11px]"
                  style={{ background: modePaiement === m.key ? T.gold : "rgba(245,241,232,0.05)", color: modePaiement === m.key ? T.inkDeep : "rgba(245,241,232,0.7)", border: `1px solid rgba(245,241,232,0.15)` }}>
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>
            <button type="submit" disabled={envoi || !modePaiement} className="w-full py-2.5 rounded-md text-sm font-semibold"
              style={{ background: T.mint, color: T.inkDeep, opacity: (envoi || !modePaiement) ? 0.5 : 1 }}>
              {envoi ? "Demande…" : "Réserver mon code (500 FCFA)"}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {codesActifs.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: "rgba(245,241,232,0.04)" }}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm" style={{ color: T.gold }}>{c.code}</span>
                <button onClick={() => navigator.clipboard?.writeText(c.code)}><Copy size={12} style={{ color: "rgba(245,241,232,0.4)" }} /></button>
              </div>
              <div className="text-right">
                <p className="text-[11px]" style={{ color: "rgba(245,241,232,0.5)" }}>{c.nombre_utilisations || 0} utilisation(s)</p>
                <p className="font-mono text-xs" style={{ color: T.mint }}>{((c.nombre_utilisations || 0) * 200).toLocaleString()} FCFA gagnés</p>
              </div>
            </div>
          ))}
          {codesActifs.length === 0 && !codeEnAttente && <p className="text-xs text-center py-4" style={{ color: "rgba(245,241,232,0.35)" }}>Aucun code actif pour le moment.</p>}
        </div>
      </div>
    </div>
  );
}
