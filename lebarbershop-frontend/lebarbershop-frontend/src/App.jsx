import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RoleProvider } from "./context/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Accueil from "./pages/Accueil";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import Onboarding from "./pages/Onboarding";
import DashboardSalon from "./pages/DashboardSalon";
import Caisse from "./pages/Caisse";
import Admin from "./pages/Admin";
import Public from "./pages/Public";
import Profil from "./pages/Profil";
import ChangerMotDePasse from "./pages/ChangerMotDePasse";
import EspaceEmploye from "./pages/EspaceEmploye";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <Routes>
            {/* Publiques */}
            <Route path="/" element={<Accueil />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/salons" element={<Public />} />

            {/* Authentifiées, ouvertes à tout rôle */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="/changer-mot-de-passe" element={<ProtectedRoute><ChangerMotDePasse /></ProtectedRoute>} />

            {/* Réservées à un rôle applicatif précis (voir context/RoleContext.jsx) */}
            <Route path="/tableau-de-bord" element={<ProtectedRoute roles={["gestionnaire"]}><DashboardSalon /></ProtectedRoute>} />
            <Route path="/caisse" element={<ProtectedRoute roles={["caissiere", "gestionnaire"]}><Caisse /></ProtectedRoute>} />
            <Route path="/espace-employe" element={<ProtectedRoute roles={["praticien"]}><EspaceEmploye /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={["superadmin"]}><Admin /></ProtectedRoute>} />
          </Routes>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
