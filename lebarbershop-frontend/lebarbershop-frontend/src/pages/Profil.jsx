import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Phone, Camera, LogOut, ArrowLeft, KeyRound, Save } from "lucide-react";
import { T } from "../lib/tokens";
import { useAuth } from "../context/AuthContext";
import { majProfil } from "../api/auth";
import { Erreur } from "../components/UI";
import SiteFooter from "../components/SiteFooter";
import BoutonWhatsAppFlottant from "../components/BoutonWhatsAppFlottant";

const ROLE_LABELS = {
  coiffeur_homme: "Coiffeur homme", coiffeuse_femme: "Coiffeuse femme", caissiere: "Caissière",
  maquilleuse: "Maquilleuse", estheticienne: "Esthéticienne", gestionnaire: "Gestionnaire du salon", autre: "Autre",
};

export default function Profil() {
  const { utilisateur, setUtilisateur, deconnecter } = useAuth();
  const [form, setForm] = useState({
    first_name: utilisateur?.first_name || "",
    last_name: utilisateur?.last_name || "",
    email: utilisateur?.email || "",
    telephone: utilisateur?.telephone || "",
    photo_url: utilisateur?.photo_url || "",
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);

  if (!utilisateur) return null;

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces(false); setEnvoi(true);
    try {
      const maj = await majProfil(form); // PATCH /api/v1/auth/profil/
      setUtilisateur(maj);
      setSucces(true);
    } catch {
      setErreur("Impossible d'enregistrer ces modifications.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <BoutonWhatsAppFlottant />
      <div className="flex-1 flex justify-center p-6">
        <div className="w-full max-w-lg">
          <Link to="/tableau-de-bord" className="flex items-center gap-1.5 text-xs mb-6 w-fit" style={{ color: "rgba(18,42,32,0.5)" }}>
            <ArrowLeft size={13} /> Retour
          </Link>

          <div className="flex items-center gap-4 mb-8">
            {form.photo_url ? (
              <img src={form.photo_url} alt="Photo de profil" className="w-16 h-16 rounded-full object-cover" style={{ border: `2px solid ${T.gold}` }} />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(201,147,42,0.15)" }}>
                <User size={26} style={{ color: T.gold }} />
              </div>
            )}
            <div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: T.titre }}>
                {utilisateur.first_name || utilisateur.username}
              </h1>
              {utilisateur.est_admin_principal && <p className="text-xs" style={{ color: T.gold }}>Administrateur principal</p>}
              {utilisateur.est_admin_secondaire && <p className="text-xs" style={{ color: T.gold }}>Administrateur secondaire</p>}
            </div>
          </div>

          <form onSubmit={enregistrer} className="rounded-lg p-6 space-y-3" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
            <Erreur message={erreur} />
            {succes && <p className="text-xs" style={{ color: T.mint }}>Profil mis à jour.</p>}

            <div className="relative">
              <Camera size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(18,42,32,0.4)" }} />
              <input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="URL de la photo de profil" className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Prénom" className="px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Nom" className="px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(18,42,32,0.4)" }} />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email" className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            </div>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(18,42,32,0.4)" }} />
              <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="Téléphone" className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            </div>

            <button type="submit" disabled={envoi}
              className="w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: T.mint, color: T.boutonTexte, opacity: envoi ? 0.6 : 1 }}>
              <Save size={15} /> {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <Link to="/changer-mot-de-passe"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm"
              style={{ color: T.ivory, border: `1px solid ${T.line}` }}>
              <KeyRound size={15} /> Changer mon mot de passe
            </Link>
            <button onClick={deconnecter}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold"
              style={{ background: "rgba(217,80,60,0.12)", color: T.coral }}>
              <LogOut size={15} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
      <SiteFooter compact />
    </div>
  );
}
