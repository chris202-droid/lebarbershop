import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scissors, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { T } from "../lib/tokens";
import { inscrire } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Erreur } from "../components/UI";

export default function Inscription() {
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "", telephone: "", password: "" });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const navigate = useNavigate();
  const { rafraichirProfil } = useAuth();

  const champ = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await inscrire({ ...form, langue_preferee: "fr" }); // POST /auth/inscription/
      await rafraichirProfil();
      navigate("/onboarding"); // direction : créer son salon
    } catch (err) {
      const msgs = err.body ? Object.values(err.body).flat().join(" ") : "Inscription impossible.";
      setErreur(msgs);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: T.coral }}>
            <Scissors size={22} style={{ color: T.inkDeep }} />
          </div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: T.ivory }}>Créer un compte</h1>
        </div>

        <form onSubmit={soumettre} className="rounded-lg p-6 space-y-3" style={{ background: "rgba(246,239,221,0.03)", border: `1px solid ${T.line}` }}>
          <Erreur message={erreur} />
          {[
            ["username", "Identifiant", User, "text"],
            ["first_name", "Prénom", User, "text"],
            ["last_name", "Nom", User, "text"],
            ["email", "Email", Mail, "email"],
            ["telephone", "Téléphone (+237…)", Phone, "text"],
            ["password", "Mot de passe", Lock, "password"],
          ].map(([k, label, Icon, type]) => (
            <div key={k} className="relative">
              <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(246,239,221,0.4)" }} />
              <input required={["username", "password"].includes(k)} type={type} value={form[k]} onChange={champ(k)}
                placeholder={label} className="w-full pl-10 pr-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            </div>
          ))}
          <button type="submit" disabled={envoi}
            className="w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: T.coral, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>
            {envoi ? "Création…" : "Créer mon compte"} <ArrowRight size={15} />
          </button>
          <p className="text-center text-xs" style={{ color: "rgba(246,239,221,0.45)" }}>
            Déjà inscrit ? <Link to="/connexion" className="underline" style={{ color: T.mint }}>Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
