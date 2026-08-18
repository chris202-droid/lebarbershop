import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import Onboarding from "./pages/Onboarding";
import DashboardSalon from "./pages/DashboardSalon";
import Caisse from "./pages/Caisse";
import Admin from "./pages/Admin";
import Public from "./pages/Public";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Publiques */}
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/salons" element={<Public />} />

          {/* Authentifiées */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><DashboardSalon /></ProtectedRoute>} />
          <Route path="/caisse" element={<ProtectedRoute><Caisse /></ProtectedRoute>} />

          {/* Réservée aux administrateurs SAAS */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
