import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scissors, Mail, Lock, ArrowRight, Globe } from "lucide-react";
import { T } from "../lib/tokens";
import { connecter } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Erreur } from "../components/UI";

export default function Connexion() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const navigate = useNavigate();
  const { rafraichirProfil } = useAuth();

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await connecter({ username, password }); // POST /auth/connexion/
      await rafraichirProfil();                // GET /auth/profil/
      navigate("/");
    } catch (err) {
      setErreur(err.body?.detail || "Identifiants incorrects.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: T.gold }}>
            <Scissors size={22} style={{ color: T.inkDeep }} />
          </div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: T.ivory }}>LeBarberShop</h1>
        </div>

        <form onSubmit={soumettre} className="rounded-lg p-6 space-y-3.5" style={{ background: "rgba(246,239,221,0.03)", border: `1px solid ${T.line}` }}>
          <Erreur message={erreur} />
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(246,239,221,0.4)" }} />
            <input required value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Identifiant" className="w-full pl-10 pr-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(246,239,221,0.4)" }} />
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe" className="w-full pl-10 pr-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
          </div>
          <button type="submit" disabled={envoi}
            className="w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: T.gold, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>
            {envoi ? "Connexion…" : "Se connecter"} <ArrowRight size={15} />
          </button>
          <p className="text-center text-xs" style={{ color: "rgba(246,239,221,0.45)" }}>
            Pas encore de compte ? <Link to="/inscription" className="underline" style={{ color: T.mint }}>Créer un compte</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
