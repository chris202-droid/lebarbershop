import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getProfil, deconnecter as deconnecterApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  const rafraichirProfil = useCallback(async () => {
    if (!localStorage.getItem("lbs_access")) {
      setUtilisateur(null);
      setChargement(false);
      return;
    }
    try {
      const profil = await getProfil();
      setUtilisateur(profil);
    } catch {
      setUtilisateur(null);
    } finally {
      setChargement(false);
    }
  }, []);

  const deconnecter = useCallback(() => {
    deconnecterApi();       // vide les tokens dans localStorage
    setUtilisateur(null);
    // Remplace l'entrée d'historique courante : un clic sur "précédent" après
    // déconnexion ne doit jamais réafficher une page protégée déjà rendue.
    window.location.replace("/connexion");
  }, []);

  useEffect(() => {
    rafraichirProfil();

    // Sécurité navigateur (retour arrière / bfcache) : certains navigateurs
    // (Safari, Firefox mobile) restaurent une page depuis leur cache mémoire
    // sans relancer le JS au clic sur "précédent" après une déconnexion. On
    // revalide systématiquement la session à chaque fois que la page redevient
    // visible depuis ce cache, pour ne jamais laisser un écran authentifié
    // s'afficher après déconnexion.
    const surAffichagePage = (evenement) => {
      if (evenement.persisted) rafraichirProfil();
    };
    window.addEventListener("pageshow", surAffichagePage);
    return () => window.removeEventListener("pageshow", surAffichagePage);
  }, [rafraichirProfil]);

  return (
    <AuthContext.Provider value={{ utilisateur, setUtilisateur, chargement, rafraichirProfil, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
