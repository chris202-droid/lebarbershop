import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Check, ArrowRight, ArrowLeft, Plus, X, Smartphone, CreditCard as CardIcon } from "lucide-react";
import { T } from "../lib/tokens";
import { creerSalon } from "../api/salons";
import { ajouterEmploye } from "../api/employes";
import { creerSoin } from "../api/services";
import { creerAbonnement } from "../api/salons";
import { initierPaiement } from "../api/paiements";
import { Erreur } from "../components/UI";

const ETAPES = ["Le salon", "Employés", "Soins & prix", "Abonnement"];
const ROLES = ["coiffeur_homme", "coiffeuse_femme", "caissiere", "maquilleuse", "estheticienne", "gestionnaire", "autre"];
const CATEGORIES = ["coiffure_homme", "coiffure_femme", "esthetique", "pedicure", "manucure", "autre"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(0);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const [salonForm, setSalonForm] = useState({ nom: "", nombre_employes_max: "", adresse: "", ville: "", secteur_geographique: "", telephone_contact: "" });
  const [salonId, setSalonId] = useState(null);

  const [employes, setEmployes] = useState([]);
  const [nouvelEmploye, setNouvelEmploye] = useState({ utilisateur: "", role: ROLES[0] });

  const [soins, setSoins] = useState([]);
  const [nouveauSoin, setNouveauSoin] = useState({ nom: "", prix: "", categorie: CATEGORIES[0] });

  const [duree, setDuree] = useState(3);
  const [modePaiement, setModePaiement] = useState(null);

  // Étape 1 : POST /api/v1/salons/  -> crée le salon (statut "en_attente" jusqu'au paiement)
  const validerSalon = async () => {
    setErreur(""); setEnvoi(true);
    try {
      const salon = await creerSalon(salonForm);
      setSalonId(salon.id);
      setEtape(1);
    } catch (err) {
      setErreur(err.body ? Object.values(err.body).flat().join(" ") : "Impossible de créer le salon.");
    } finally { setEnvoi(false); }
  };

  // Étape 2 : POST /api/v1/employes/ pour chaque employé ajouté localement
  const enregistrerEmployes = async () => {
    setErreur(""); setEnvoi(true);
    try {
      for (const emp of employes) {
        await ajouterEmploye({ ...emp, salon: salonId });
      }
      setEtape(2);
    } catch (err) {
      setErreur("Erreur lors de l'ajout des employés : " + (err.body?.detail || ""));
    } finally { setEnvoi(false); }
  };

  // Étape 3 : POST /api/v1/soins/ pour chaque soin du catalogue
  const enregistrerSoins = async () => {
    setErreur(""); setEnvoi(true);
    try {
      for (const s of soins) {
        await creerSoin({ ...s, salon: salonId, prix: Number(s.prix) });
      }
      setEtape(3);
    } catch (err) {
      setErreur("Erreur lors de l'ajout des soins : " + (err.body?.detail || ""));
    } finally { setEnvoi(false); }
  };

  // Étape 4 : POST /api/v1/abonnements/ (calcul auto du prix : 1500/mois au 1er abonnement)
  // puis POST /api/v1/paiements/ pour initier le paiement (Orange Money / MTN MoMo / carte)
  const activerSalon = async () => {
    setErreur(""); setEnvoi(true);
    try {
      const abonnement = await creerAbonnement({ salon: salonId, duree_mois: duree });
      await initierPaiement({
        abonnement: abonnement.id,
        mode_paiement: modePaiement,
        montant: abonnement.montant_total,
        reference_transaction: `LBS-${Date.now()}`,
      });
      // La confirmation réelle arrive via webhook -> PaiementAbonnementViewSet.confirmer()
      navigate("/");
    } catch (err) {
      setErreur("Erreur lors de l'abonnement : " + (err.body?.detail || ""));
    } finally { setEnvoi(false); }
  };

  return (
    <div className="w-full min-h-screen flex items-start justify-center p-8" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}>
            <Store size={16} style={{ color: T.inkDeep }} />
          </div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: T.ivory }}>Créer mon salon</h1>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {ETAPES.map((e, i) => (
            <React.Fragment key={e}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono shrink-0"
                style={{ background: i < etape ? T.mint : i === etape ? T.gold : "rgba(246,239,221,0.08)", color: i <= etape ? T.inkDeep : "rgba(246,239,221,0.4)" }}>
                {i < etape ? <Check size={13} /> : i + 1}
              </div>
              {i < ETAPES.length - 1 && <div className="flex-1 h-px" style={{ background: i < etape ? T.mint : T.line }} />}
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-lg p-6 min-h-[320px] space-y-4" style={{ background: "rgba(246,239,221,0.03)", border: `1px solid ${T.line}` }}>
          <Erreur message={erreur} />

          {etape === 0 && (
            <div className="space-y-3">
              {[["nom", "Nom du salon"], ["nombre_employes_max", "Nombre d'employés max"], ["ville", "Ville"], ["adresse", "Adresse"], ["secteur_geographique", "Secteur géographique"], ["telephone_contact", "Téléphone du salon"]].map(([k, l]) => (
                <input key={k} value={salonForm[k]} onChange={(e) => setSalonForm({ ...salonForm, [k]: e.target.value })}
                  placeholder={l} className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
                  style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
              ))}
            </div>
          )}

          {etape === 1 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={nouvelEmploye.utilisateur} onChange={(e) => setNouvelEmploye({ ...nouvelEmploye, utilisateur: e.target.value })}
                  placeholder="ID utilisateur de l'employé" className="flex-1 px-3 py-2.5 rounded-md text-sm outline-none"
                  style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <select value={nouvelEmploye.role} onChange={(e) => setNouvelEmploye({ ...nouvelEmploye, role: e.target.value })}
                  className="px-2 rounded-md text-sm" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }}>
                  {ROLES.map((r) => <option key={r} value={r} style={{ background: T.inkDeep }}>{r}</option>)}
                </select>
                <button onClick={() => { if (nouvelEmploye.utilisateur) { setEmployes([...employes, nouvelEmploye]); setNouvelEmploye({ utilisateur: "", role: ROLES[0] }); } }}
                  className="px-3 rounded-md" style={{ background: T.gold, color: T.inkDeep }}><Plus size={16} /></button>
              </div>
              <p className="text-[11px]" style={{ color: "rgba(246,239,221,0.4)" }}>
                L'employé doit d'abord posséder un compte utilisateur (inscription séparée) : renseignez son identifiant.
              </p>
              {employes.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "rgba(246,239,221,0.04)" }}>
                  <span className="text-sm" style={{ color: T.ivory }}>{e.utilisateur} — {e.role}</span>
                  <button onClick={() => setEmployes(employes.filter((_, j) => j !== i))}><X size={13} style={{ color: T.coral }} /></button>
                </div>
              ))}
            </div>
          )}

          {etape === 2 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={nouveauSoin.nom} onChange={(e) => setNouveauSoin({ ...nouveauSoin, nom: e.target.value })}
                  placeholder="Nom du soin" className="flex-1 px-3 py-2.5 rounded-md text-sm outline-none"
                  style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <input value={nouveauSoin.prix} onChange={(e) => setNouveauSoin({ ...nouveauSoin, prix: e.target.value })}
                  placeholder="Prix" type="number" className="w-24 px-3 py-2.5 rounded-md text-sm outline-none"
                  style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <select value={nouveauSoin.categorie} onChange={(e) => setNouveauSoin({ ...nouveauSoin, categorie: e.target.value })}
                  className="px-2 rounded-md text-sm" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }}>
                  {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: T.inkDeep }}>{c}</option>)}
                </select>
                <button onClick={() => { if (nouveauSoin.nom && nouveauSoin.prix) { setSoins([...soins, nouveauSoin]); setNouveauSoin({ nom: "", prix: "", categorie: CATEGORIES[0] }); } }}
                  className="px-3 rounded-md" style={{ background: T.coral, color: T.inkDeep }}><Plus size={16} /></button>
              </div>
              {soins.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "rgba(246,239,221,0.04)" }}>
                  <span className="text-sm" style={{ color: T.ivory }}>{s.nom} ({s.categorie})</span>
                  <span className="font-mono text-xs" style={{ color: T.gold }}>{Number(s.prix).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {etape === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {[3, 6, 12].map((m) => (
                  <button key={m} onClick={() => setDuree(m)}
                    className="flex-1 py-2.5 rounded-md text-sm"
                    style={{ background: duree === m ? T.gold : "rgba(246,239,221,0.05)", color: duree === m ? T.inkDeep : "rgba(246,239,221,0.7)", border: `1px solid ${duree === m ? T.gold : T.line}` }}>
                    {m} mois
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[["orange_money", "Orange Money", Smartphone], ["mtn_momo", "MTN MoMo", Smartphone], ["carte_bancaire", "Carte", CardIcon]].map(([k, l, Icon]) => (
                  <button key={k} onClick={() => setModePaiement(k)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-md text-xs"
                    style={{ background: modePaiement === k ? T.gold : "rgba(246,239,221,0.05)", color: modePaiement === k ? T.inkDeep : "rgba(246,239,221,0.7)", border: `1px solid ${T.line}` }}>
                    <Icon size={16} /> {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
          <button onClick={() => setEtape((e) => Math.max(e - 1, 0))} disabled={etape === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm" style={{ color: "rgba(246,239,221,0.6)", opacity: etape === 0 ? 0.3 : 1 }}>
            <ArrowLeft size={15} /> Précédent
          </button>
          {etape === 0 && <button onClick={validerSalon} disabled={envoi} className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>Continuer <ArrowRight size={15} /></button>}
          {etape === 1 && <button onClick={enregistrerEmployes} disabled={envoi} className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>Continuer <ArrowRight size={15} /></button>}
          {etape === 2 && <button onClick={enregistrerSoins} disabled={envoi} className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>Continuer <ArrowRight size={15} /></button>}
          {etape === 3 && <button onClick={activerSalon} disabled={envoi || !modePaiement} className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold" style={{ background: T.mint, color: T.inkDeep, opacity: (envoi || !modePaiement) ? 0.5 : 1 }}><Check size={15} /> Payer et activer</button>}
        </div>
      </div>
    </div>
  );
}
