import React, { createContext, useContext, useEffect, useState } from "react";
import { getProfil } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  const rafraichirProfil = async () => {
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
  };

  useEffect(() => { rafraichirProfil(); }, []);

  return (
    <AuthContext.Provider value={{ utilisateur, setUtilisateur, chargement, rafraichirProfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
