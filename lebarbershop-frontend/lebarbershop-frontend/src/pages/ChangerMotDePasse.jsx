import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ArrowRight } from "lucide-react";
import { T } from "../lib/tokens";
import { useAuth } from "../context/AuthContext";
import { changerMotDePasse } from "../api/auth";
import { Erreur } from "../components/UI";
import SiteFooter from "../components/SiteFooter";
import BoutonWhatsAppFlottant from "../components/BoutonWhatsAppFlottant";

export default function ChangerMotDePasse() {
  const { utilisateur, rafraichirProfil } = useAuth();
  const navigate = useNavigate();
  const premiereConnexion = utilisateur?.mot_de_passe_temporaire;

  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur("");
    if (nouveau !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setEnvoi(true);
    try {
      await changerMotDePasse({ ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau }); // POST /api/v1/auth/changer-mot-de-passe/
      await rafraichirProfil(); // recharge l'utilisateur : mot_de_passe_temporaire passe à false
      navigate("/tableau-de-bord");
    } catch (err) {
      setErreur(err.body?.ancien_mot_de_passe?.[0] || err.body?.nouveau_mot_de_passe?.[0] || "Impossible de changer le mot de passe.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <BoutonWhatsAppFlottant />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: T.gold }}>
              <KeyRound size={20} style={{ color: T.inkDeep }} />
            </div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: T.ivory, textAlign: "center" }}>
              {premiereConnexion ? "Choisissez votre mot de passe" : "Changer mon mot de passe"}
            </h1>
            {premiereConnexion && (
              <p className="text-xs text-center mt-2" style={{ color: "rgba(246,239,221,0.55)" }}>
                Votre gestionnaire a créé ce compte avec un mot de passe provisoire.
                Choisissez-en un nouveau pour continuer.
              </p>
            )}
          </div>

          <form onSubmit={soumettre} className="rounded-lg p-6 space-y-3" style={{ background: "rgba(246,239,221,0.03)", border: `1px solid ${T.line}` }}>
            <Erreur message={erreur} />
            {!premiereConnexion && (
              <input required type="password" value={ancien} onChange={(e) => setAncien(e.target.value)}
                placeholder="Mot de passe actuel" className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            )}
            <input required type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)}
              placeholder="Nouveau mot de passe" className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            <input required type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Confirmer le nouveau mot de passe" className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            <button type="submit" disabled={envoi}
              className="w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: T.gold, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>
              {envoi ? "Enregistrement…" : "Valider"} <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>
      <SiteFooter compact />
    </div>
  );
}
