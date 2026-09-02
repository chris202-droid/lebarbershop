import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Scissors, LayoutGrid, Users, Receipt, Package, Star, CreditCard,
  Wallet, Clock, AlertTriangle, CheckCircle2, Plus, ChevronDown,
  Camera, Lock, TrendingUp, Sparkles, Smartphone, CreditCard as CardIcon,
  Upload, ShieldCheck, PackagePlus, XCircle, X,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { T } from "../lib/tokens";
import { NavItem, StatCard, TicketStub, Erreur } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { listerSalons, modifierSalon, listerAbonnements, creerAbonnement, demarrerEssaiGratuit } from "../api/salons";
import { listerTickets, validerTicket, creerTicket, listerMesLignesTicket, confirmerLigne, annulerLigne, annulerTicket } from "../api/tickets";
import { listerSoins } from "../api/services";
import { listerProduits, creerProduit, enregistrerMouvementStock } from "../api/stocks";
import { listerBilansJournaliers, listerRendementsEmployes } from "../api/analytics";
import { listerEmployes, ajouterEmploye, modifierEmploye } from "../api/employes";
import { listerAvis } from "../api/avis";
import SiteFooter from "../components/SiteFooter";
import BoutonWhatsAppFlottant from "../components/BoutonWhatsAppFlottant";
import UserMenu from "../components/UserMenu";

const NAV = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { key: "tickets", label: "Tickets", icon: Receipt },
  { key: "employes", label: "Employés", icon: Users },
  { key: "produits", label: "Produits", icon: Package },
  { key: "avis", label: "Avis clients", icon: Star },
  { key: "abonnement", label: "Abonnement", icon: CreditCard },
];

const ROLES = ["coiffeur_homme", "coiffeuse_femme", "caissiere", "maquilleuse", "estheticienne", "gestionnaire", "autre"];
const ROLE_LABELS = {
  coiffeur_homme: "Coiffeur homme", coiffeuse_femme: "Coiffeuse femme", caissiere: "Caissière",
  maquilleuse: "Maquilleuse", estheticienne: "Esthéticienne", gestionnaire: "Gestionnaire", autre: "Autre",
};

const CATEGORIES_PRODUIT = [
  ["materiel", "Matériel"], ["produit_homme", "Produit homme"],
  ["produit_femme", "Produit femme"], ["esthetique", "Esthétique"], ["autre", "Autre"],
];

export default function DashboardSalon() {
  const { utilisateur } = useAuth();
  const [vue, setVue] = useState("dashboard");

  const [salons, setSalons] = useState([]);
  const [salonActifId, setSalonActifId] = useState(null);
  const [selecteurOuvert, setSelecteurOuvert] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [produits, setProduits] = useState([]);
  const [bilans, setBilans] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [rendementsEmployes, setRendementsEmployes] = useState([]);
  const [avis, setAvis] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [lignesAConfirmer, setLignesAConfirmer] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [chargementSalon, setChargementSalon] = useState(false);
  const [erreur, setErreur] = useState("");

  const salon = salons.find((s) => s.id === salonActifId) || null;

  // Charge la liste des salons du propriétaire connecté au montage.
  useEffect(() => {
    (async () => {
      try {
        const s = await listerSalons(); // GET /api/v1/salons/
        const liste = s.results || s;
        setSalons(liste);
        if (liste[0]) setSalonActifId(liste[0].id);
      } catch {
        setErreur("Impossible de charger vos salons.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  // Recharge les données associées à chaque changement de salon actif.
  const chargerDonneesSalon = useCallback(async (s) => {
    setChargementSalon(true);
    try {
      const [t, p, b, e, a, ab, so, lignes] = await Promise.all([
        listerTickets(s.id),                          // GET /api/v1/tickets/?salon=
        listerProduits(s.id),                          // GET /api/v1/produits/?salon=
        listerBilansJournaliers(s.id),                  // GET /api/v1/bilans-journaliers/?salon=
        listerEmployes(s.id),                           // GET /api/v1/employes/?salon=
        listerAvis(s.id),                               // GET /api/v1/avis/?salon=
        listerAbonnements(s.id),                        // GET /api/v1/abonnements/?salon=
        listerSoins(s.id),                              // GET /api/v1/soins/?salon=
        listerMesLignesTicket(),                        // GET /api/v1/lignes-ticket/ (lignes du salon géré, à confirmer)
      ]);
      const listeEmployes = e.results || e;
      setTickets(t.results || t);
      setProduits(p.results || p);
      setBilans(b.results || b);
      setEmployes(listeEmployes);
      setAvis(a.results || a);
      setAbonnements(ab.results || ab);
      setSoins((so.results || so).filter((sn) => sn.actif));
      setLignesAConfirmer((lignes.results || lignes).filter((l) => l.statut === "en_attente" && l.ticket_salon === s.id));

      // Rendement en argent par employé sur les 30 derniers jours.
      const fin = new Date().toISOString().slice(0, 10);
      const debut = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const rendements = await Promise.all(
        listeEmployes.map((emp) => listerRendementsEmployes(emp.id, debut, fin).catch(() => []))
      );
      setRendementsEmployes(listeEmployes.map((emp, i) => {
        const lignes = rendements[i]?.results || rendements[i] || [];
        const montant = lignes.reduce((s2, l) => s2 + Number(l.montant_total || 0), 0);
        return { nom: emp.nom_complet, montant };
      }));
    } catch {
      setErreur("Impossible de charger les données de ce salon.");
    } finally {
      setChargementSalon(false);
    }
  }, []);

  useEffect(() => {
    if (salon) chargerDonneesSalon(salon);
  }, [salon?.id, chargerDonneesSalon]);

  const marquerValide = async (ticket) => {
    try {
      await validerTicket(ticket.id, "especes"); // POST /api/v1/tickets/{id}/valider/
      setTickets((cur) => cur.map((t) => (t.id === ticket.id ? { ...t, statut: "valide" } : t)));
    } catch {
      setErreur("Échec de la validation du ticket.");
    }
  };

  const annulerTicketManager = async (ticket) => {
    try {
      await annulerTicket(ticket.id); // POST /api/v1/tickets/{id}/annuler/ (point 3)
      setTickets((cur) => cur.map((t) => (t.id === ticket.id ? { ...t, statut: "annule" } : t)));
    } catch {
      setErreur("Impossible d'annuler ce ticket.");
    }
  };

  // ---- Confirmer / annuler un soin en attente (point 1 : le manager peut
  // confirmer un ticket comme n'importe quel praticien de son salon) ----
  const confirmerLigneManager = async (ligne) => {
    try {
      await confirmerLigne(ligne.id); // POST /api/v1/lignes-ticket/{id}/confirmer/
      setLignesAConfirmer(lignesAConfirmer.filter((l) => l.id !== ligne.id));
    } catch {
      setErreur("Impossible de confirmer ce soin.");
    }
  };
  const annulerLigneManager = async (ligne) => {
    try {
      await annulerLigne(ligne.id); // POST /api/v1/lignes-ticket/{id}/annuler/
      setLignesAConfirmer(lignesAConfirmer.filter((l) => l.id !== ligne.id));
    } catch {
      setErreur("Impossible d'annuler ce soin.");
    }
  };

  // ---- Désigner un autre employé comme manager (point 6/4), changer son
  // rôle, le retirer du salon, ou restreindre les tâches d'un co-manager ----
  const [envoiManager, setEnvoiManager] = useState(null); // id de l'employé en cours de modification

  const changerRole = async (employe, nouveauRole) => {
    setEnvoiManager(employe.id); setErreur("");
    try {
      const maj = await modifierEmploye(employe.id, { role: nouveauRole });
      setEmployes(employes.map((e) => (e.id === maj.id ? maj : e)));
    } catch {
      setErreur("Impossible de changer le rôle de cet employé.");
    } finally {
      setEnvoiManager(null);
    }
  };

  const basculerActifEmploye = async (employe) => {
    setEnvoiManager(employe.id); setErreur("");
    try {
      const maj = await modifierEmploye(employe.id, { actif: !employe.actif }); // retirer/réintégrer
      setEmployes(employes.map((e) => (e.id === maj.id ? maj : e)));
    } catch {
      setErreur("Impossible de retirer cet employé du salon.");
    } finally {
      setEnvoiManager(null);
    }
  };

  const basculerPermissionTicket = async (employe, cle) => {
    setEnvoiManager(employe.id); setErreur("");
    try {
      const maj = await modifierEmploye(employe.id, { [cle]: !employe[cle] }); // restreindre un co-manager (point 4)
      setEmployes(employes.map((e) => (e.id === maj.id ? maj : e)));
    } catch {
      setErreur("Impossible de modifier cette permission.");
    } finally {
      setEnvoiManager(null);
    }
  };

  // ---- Nouveau ticket créé par le manager lui-même (point 1) ----
  const posteManager = employes.find((e) => e.utilisateur === utilisateur?.id) || null;
  const [formTicketOuvert, setFormTicketOuvert] = useState(false);
  const [nomClientTicket, setNomClientTicket] = useState("");
  const [panierTicket, setPanierTicket] = useState([]);
  const [envoiTicket, setEnvoiTicket] = useState(false);
  const [erreurTicket, setErreurTicket] = useState("");
  const [soins, setSoins] = useState([]);

  const ajouterSoinPanier = (soin) => setPanierTicket([...panierTicket, { ...soin, uid: Date.now() + soin.id, prixModifie: String(soin.prix) }]);
  const retirerSoinPanier = (uid) => setPanierTicket(panierTicket.filter((p) => p.uid !== uid));
  const modifierPrixPanier = (uid, prix) => setPanierTicket(panierTicket.map((p) => (p.uid === uid ? { ...p, prixModifie: prix } : p)));
  const totalPanierTicket = panierTicket.reduce((s, p) => s + Number(p.prixModifie || 0), 0);

  const ouvrirTicketManager = async (e) => {
    e.preventDefault();
    if (!panierTicket.length || !posteManager) return;
    setEnvoiTicket(true); setErreurTicket("");
    try {
      await creerTicket({ // POST /api/v1/tickets/
        salon: salon.id,
        ...(nomClientTicket ? { nom_client_temporaire: nomClientTicket } : {}),
        employe_createur: posteManager.id,
        lignes: panierTicket.map((p) => ({ soin: p.id, employe_executant: posteManager.id, prix: Number(p.prixModifie) })), // prix modifiable à la main (point 3)
      });
      setPanierTicket([]); setNomClientTicket(""); setFormTicketOuvert(false);
      const t = await listerTickets(salon.id);
      setTickets(t.results || t);
    } catch {
      setErreurTicket("Impossible d'ouvrir ce ticket.");
    } finally {
      setEnvoiTicket(false);
    }
  };

  // ---- Produits : ajout + ravitaillement, groupés par catégorie (point 11) ----
  const [formProduit, setFormProduit] = useState({ nom: "", categorie: "materiel", quantite_stock: "", seuil_alerte: "5", prix_unitaire_achat: "" });
  const [envoiProduit, setEnvoiProduit] = useState(false);
  const [erreurProduit, setErreurProduit] = useState("");
  const [ravitaillement, setRavitaillement] = useState({}); // { [produitId]: quantite saisie }

  const soumettreProduit = async (e) => {
    e.preventDefault();
    setErreurProduit(""); setEnvoiProduit(true);
    try {
      const nouveau = await creerProduit({ // POST /api/v1/produits/
        ...formProduit,
        salon: salon.id,
        quantite_stock: Number(formProduit.quantite_stock || 0),
        seuil_alerte: Number(formProduit.seuil_alerte || 5),
        prix_unitaire_achat: Number(formProduit.prix_unitaire_achat),
      });
      setProduits([...produits, nouveau]);
      setFormProduit({ nom: "", categorie: "materiel", quantite_stock: "", seuil_alerte: "5", prix_unitaire_achat: "" });
    } catch {
      setErreurProduit("Impossible d'ajouter ce produit.");
    } finally {
      setEnvoiProduit(false);
    }
  };

  const ravitailler = async (produit) => {
    const quantite = Number(ravitaillement[produit.id]);
    if (!quantite || quantite <= 0) return;
    try {
      await enregistrerMouvementStock({ produit: produit.id, type_mouvement: "achat", quantite }); // POST /api/v1/mouvements-stock/
      setProduits(produits.map((p) => (p.id === produit.id ? { ...p, quantite_stock: p.quantite_stock + quantite, en_alerte_stock: (p.quantite_stock + quantite) <= p.seuil_alerte } : p)));
      setRavitaillement({ ...ravitaillement, [produit.id]: "" });
    } catch {
      setErreur("Impossible de ravitailler ce produit.");
    }
  };


  const enAttente = tickets.filter((t) => t.statut === "en_attente");
  const alertes = produits.filter((p) => p.en_alerte_stock);
  const courbe = useMemo(() => bilans.map((b) => ({ j: b.date, montant: Number(b.entrees_total) })), [bilans]);
  const abonnementActif = abonnements.find((a) => a.statut === "actif");
  const titre = NAV.find((n) => n.key === vue)?.label ?? "";

  // ---- Ajout d'employé (identifiants définis par le gestionnaire) ----
  const [formEmploye, setFormEmploye] = useState({ username: "", password: "", first_name: "", last_name: "", role: ROLES[0] });
  const [envoiEmploye, setEnvoiEmploye] = useState(false);
  const [erreurEmploye, setErreurEmploye] = useState("");

  const soumettreEmploye = async (e) => {
    e.preventDefault();
    setErreurEmploye(""); setEnvoiEmploye(true);
    try {
      const nouveau = await ajouterEmploye({ ...formEmploye, salon: salon.id }); // POST /api/v1/employes/
      setEmployes([...employes, nouveau]);
      setFormEmploye({ username: "", password: "", first_name: "", last_name: "", role: ROLES[0] });
    } catch (err) {
      setErreurEmploye(err.body?.username?.[0] || err.body?.detail || "Impossible d'ajouter cet employé.");
    } finally {
      setEnvoiEmploye(false);
    }
  };

  // ---- Paramètres du salon : renommer (une seule fois) + photo + effectif ----
  const [nomSalon, setNomSalon] = useState("");
  const [photoSalon, setPhotoSalon] = useState("");
  const [nombreEmployesMax, setNombreEmployesMax] = useState("");
  const [envoiParametres, setEnvoiParametres] = useState(false);
  const [erreurParametres, setErreurParametres] = useState("");
  const [succesParametres, setSuccesParametres] = useState(false);

  useEffect(() => {
    if (salon) {
      setNomSalon(salon.nom);
      setPhotoSalon(salon.photo_url || "");
      setNombreEmployesMax(String(salon.nombre_employes_max ?? ""));
    }
  }, [salon?.id]);

  // Upload direct : convertit le fichier choisi en base64 et le place dans
  // le même champ que l'URL — le backend accepte les deux formats (voir
  // apps/salons/models.py::Salon.photo_url).
  const televerserPhoto = (fichier) => {
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => setPhotoSalon(lecteur.result);
    lecteur.readAsDataURL(fichier);
  };

  const enregistrerParametres = async (e) => {
    e.preventDefault();
    setErreurParametres(""); setSuccesParametres(false); setEnvoiParametres(true);
    try {
      const maj = await modifierSalon(salon.id, { // PATCH /api/v1/salons/{id}/
        nom: nomSalon,
        photo_url: photoSalon,
        nombre_employes_max: Number(nombreEmployesMax),
      });
      setSalons(salons.map((s) => (s.id === maj.id ? maj : s)));
      setSuccesParametres(true);
    } catch (err) {
      setErreurParametres(err.body?.nom?.[0] || err.body?.nombre_employes_max?.[0] || "Impossible d'enregistrer ces modifications.");
    } finally {
      setEnvoiParametres(false);
    }
  };


  // ---- Abonnement : renouvellement / essai ----
  const [duree, setDuree] = useState(3);
  const [modePaiement, setModePaiement] = useState(null);
  const [codePromoRenouvellement, setCodePromoRenouvellement] = useState("");
  const [envoiAbonnement, setEnvoiAbonnement] = useState(false);
  const [erreurAbonnement, setErreurAbonnement] = useState("");

  const demarrerEssai = async () => {
    setErreurAbonnement(""); setEnvoiAbonnement(true);
    try {
      const abo = await demarrerEssaiGratuit(salon.id); // POST /api/v1/abonnements/essai/
      setAbonnements([abo, ...abonnements]);
    } catch (err) {
      setErreurAbonnement(err.body?.detail || "Essai gratuit indisponible pour ce salon.");
    } finally {
      setEnvoiAbonnement(false);
    }
  };

  const renouveler = async () => {
    setErreurAbonnement(""); setEnvoiAbonnement(true);
    try {
      const abo = await creerAbonnement({ // POST /api/v1/abonnements/ — point 1 : code promo ou parrainage appliqué au montant final
        salon: salon.id, duree_mois: duree, ...(codePromoRenouvellement ? { code_promo: codePromoRenouvellement } : {}),
      });
      setAbonnements([abo, ...abonnements]);
      setCodePromoRenouvellement("");
    } catch (err) {
      setErreurAbonnement(err.body?.code_promo?.[0] || err.body?.detail || "Impossible de créer l'abonnement.");
    } finally {
      setEnvoiAbonnement(false);
    }
  };

  if (chargement) {
    return <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.ink, color: T.ivory }}>Chargement…</div>;
  }

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <BoutonWhatsAppFlottant />
      <div className="flex flex-1 min-h-0">
      <aside className="w-[240px] shrink-0 flex flex-col p-4" style={{ borderRight: `1px solid ${T.line}` }}>
        <Link to="/" className="flex items-center gap-2 px-2 mb-6 mt-1">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}>
            <Scissors size={16} style={{ color: T.inkDeep }} />
          </div>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>LeBarberShop</span>
        </Link>

        {/* Sélecteur de salon — un gestionnaire peut en posséder plusieurs */}
        {salons.length > 0 && (
          <div className="relative mb-4">
            <button onClick={() => setSelecteurOuvert(!selecteurOuvert)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left"
              style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
              <div className="min-w-0">
                <p className="truncate" style={{ color: T.ivory, fontSize: 13, fontFamily: "Fraunces, serif" }}>{salon?.nom}</p>
                <p className="text-[10px] truncate" style={{ color: "rgba(246,239,221,0.5)" }}>{salon?.secteur_geographique}, {salon?.ville}</p>
              </div>
              <ChevronDown size={14} style={{ color: "rgba(246,239,221,0.5)" }} />
            </button>
            {selecteurOuvert && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-md py-1 z-30" style={{ background: T.inkDeep, border: `1px solid ${T.line}` }}>
                {salons.map((s) => (
                  <button key={s.id} onClick={() => { setSalonActifId(s.id); setSelecteurOuvert(false); }}
                    className="w-full text-left px-3 py-2 text-xs truncate"
                    style={{ color: s.id === salonActifId ? T.gold : "rgba(246,239,221,0.7)" }}>
                    {s.nom}
                  </button>
                ))}
                <Link to="/onboarding" onClick={() => setSelecteurOuvert(false)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs" style={{ color: T.mint, borderTop: `1px solid ${T.line}` }}>
                  <Plus size={12} /> Ajouter un salon
                </Link>
              </div>
            )}
          </div>
        )}

        <nav className="space-y-1 flex-1">
          {NAV.map((n) => <NavItem key={n.key} {...n} badge={n.key === "tickets" ? enAttente.length || undefined : undefined} active={vue === n.key} onClick={() => setVue(n.key)} />)}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: T.ivory }}>{titre}</h1>
          <UserMenu />
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-5">
          <Erreur message={erreur} />
          {!salon && (
            <div>
              <p className="mb-3" style={{ color: "rgba(246,239,221,0.5)" }}>Aucun salon associé à ce compte.</p>
              <Link to="/onboarding" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep }}>
                <Plus size={15} /> Créer mon salon
              </Link>
            </div>
          )}

          {salon && vue === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Entrées (dernier bilan)" value={courbe.at(-1)?.montant?.toLocaleString() ?? "0"} icon={Wallet} />
                <StatCard label="Tickets en attente" value={enAttente.length} icon={Clock} />
                <StatCard label="Produits en alerte" value={alertes.length} icon={AlertTriangle} />
              </div>

              <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ivory }}>Entrées journalières</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={courbe}>
                    <defs>
                      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.gold} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={T.line} vertical={false} />
                    <XAxis dataKey="j" stroke="rgba(246,239,221,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: T.inkDeep, border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12 }} />
                    <Area type="monotone" dataKey="montant" stroke={T.gold} strokeWidth={2} fill="url(#gold)" />
                  </AreaChart>
                </ResponsiveContainer>
                {courbe.length === 0 && <p className="text-xs text-center py-6" style={{ color: "rgba(246,239,221,0.35)" }}>Aucun bilan journalier pour le moment.</p>}
              </div>

              <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} style={{ color: T.mint }} />
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ivory }}>Rendement par employé (30 derniers jours)</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rendementsEmployes}>
                    <CartesianGrid stroke={T.line} vertical={false} />
                    <XAxis dataKey="nom" stroke="rgba(246,239,221,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: T.inkDeep, border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="montant" fill={T.coral} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {rendementsEmployes.length === 0 && <p className="text-xs text-center py-6" style={{ color: "rgba(246,239,221,0.35)" }}>Aucun employé pour le moment.</p>}
              </div>

              {/* Paramètres du salon : nom modifiable une seule fois, photo */}
              <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ivory }}>Paramètres du salon</h3>
                <form onSubmit={enregistrerParametres} className="space-y-3 max-w-md">
                  <Erreur message={erreurParametres} />
                  {succesParametres && <p className="text-xs" style={{ color: T.mint }}>Modifications enregistrées.</p>}
                  <div>
                    <input value={nomSalon} onChange={(e) => setNomSalon(e.target.value)} disabled={!salon.nom_modifiable}
                      className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
                      style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}`, opacity: salon.nom_modifiable ? 1 : 0.5 }} />
                    <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "rgba(246,239,221,0.4)" }}>
                      {salon.nom_modifiable ? "Vous pouvez renommer votre salon une seule fois." : <><Lock size={10} /> Le nom a déjà été modifié une fois et ne peut plus l'être.</>}
                    </p>
                  </div>
                  <div className="relative">
                    <Camera size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(246,239,221,0.4)" }} />
                    <input value={photoSalon.startsWith("data:") ? "" : photoSalon} onChange={(e) => setPhotoSalon(e.target.value)}
                      placeholder={photoSalon.startsWith("data:") ? "Image téléversée ✓ — ou collez une URL pour la remplacer" : "URL de la photo du salon"}
                      className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none"
                      style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  </div>
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm cursor-pointer"
                    style={{ background: "rgba(246,239,221,0.05)", color: "rgba(246,239,221,0.7)", border: `1px dashed ${T.line}` }}>
                    <Upload size={14} /> Ou téléverser une image depuis votre appareil
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => televerserPhoto(e.target.files?.[0])} />
                  </label>
                  {photoSalon && (
                    <img src={photoSalon} alt="Aperçu du salon" className="w-full h-32 object-cover rounded-md" style={{ border: `1px solid ${T.line}` }} />
                  )}
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "rgba(246,239,221,0.5)" }}>Nombre d'employés maximum</label>
                    <input type="number" min="1" value={nombreEmployesMax} onChange={(e) => setNombreEmployesMax(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
                      style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                    <p className="text-[11px] mt-1" style={{ color: "rgba(246,239,221,0.4)" }}>Augmentez ce nombre à tout moment pour recruter davantage.</p>
                  </div>
                  <button type="submit" disabled={envoiParametres} className="px-4 py-2 rounded-md text-sm font-semibold"
                    style={{ background: T.gold, color: T.inkDeep, opacity: envoiParametres ? 0.6 : 1 }}>
                    {envoiParametres ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </form>
              </div>
            </>
          )}

          {salon && vue === "tickets" && (
            <div className="space-y-6">
              {lignesAConfirmer.length > 0 && (
                <div>
                  <h3 className="mb-3" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Soins à confirmer</h3>
                  <div className="space-y-2">
                    {lignesAConfirmer.map((l) => (
                      <div key={l.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                        <div>
                          <p className="text-sm" style={{ color: T.ivory }}>{l.soin_nom} — {l.employe_executant_nom}</p>
                          <p className="text-xs" style={{ color: "rgba(246,239,221,0.5)" }}>{Number(l.prix).toLocaleString()} FCFA</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => confirmerLigneManager(l)} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md" style={{ background: "rgba(127,214,194,0.15)", color: T.mint }}>
                            <CheckCircle2 size={12} /> Confirmer
                          </button>
                          <button onClick={() => annulerLigneManager(l)} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md" style={{ background: "rgba(255,122,92,0.15)", color: T.coral }}>
                            <XCircle size={12} /> Annuler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Tickets</h3>
                  {posteManager && (
                    <button onClick={() => setFormTicketOuvert(!formTicketOuvert)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold" style={{ background: T.gold, color: T.inkDeep }}>
                      <Plus size={13} /> Nouveau ticket
                    </button>
                  )}
                </div>

                {formTicketOuvert && (
                  <form onSubmit={ouvrirTicketManager} className="rounded-lg p-4 mb-4 space-y-3" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                    <Erreur message={erreurTicket} />
                    <input value={nomClientTicket} onChange={(e) => setNomClientTicket(e.target.value)}
                      placeholder="Nom du client (laisser vide pour un nom automatique, ex. Clt1.28.8.26)"
                      className="w-full px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {soins.map((s) => (
                        <button type="button" key={s.id} onClick={() => ajouterSoinPanier(s)}
                          className="text-left p-2.5 rounded-md" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                          <p className="text-xs" style={{ color: T.ivory }}>{s.nom}</p>
                          <p className="font-mono text-[11px] mt-1" style={{ color: T.gold }}>{Number(s.prix).toLocaleString()} FCFA</p>
                        </button>
                      ))}
                    </div>
                    {panierTicket.length > 0 && (
                      <div className="space-y-2 pt-2" style={{ borderTop: `1px dashed ${T.line}` }}>
                        {panierTicket.map((p) => (
                          <div key={p.uid} className="flex items-center justify-between gap-2 text-xs">
                            <span style={{ color: "rgba(246,239,221,0.8)" }}>{p.nom}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Prix modifiable à la main lors de l'enregistrement (point 3) */}
                              <input type="number" min="0" value={p.prixModifie} onChange={(e) => modifierPrixPanier(p.uid, e.target.value)}
                                className="w-24 px-2 py-1 rounded-md text-xs outline-none text-right" style={{ background: "rgba(246,239,221,0.05)", color: T.gold, border: `1px solid ${T.line}` }} />
                              <button type="button" onClick={() => retirerSoinPanier(p.uid)}><X size={12} style={{ color: T.coral }} /></button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1.5 text-sm">
                          <span style={{ color: "rgba(246,239,221,0.6)" }}>Total</span>
                          <span className="font-mono" style={{ color: T.gold }}>{totalPanierTicket.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    )}
                    <button type="submit" disabled={envoiTicket || !panierTicket.length} className="w-full py-2.5 rounded-md text-sm font-semibold"
                      style={{ background: T.mint, color: T.inkDeep, opacity: (envoiTicket || !panierTicket.length) ? 0.5 : 1 }}>
                      {envoiTicket ? "Ouverture…" : "Ouvrir le ticket"}
                    </button>
                  </form>
                )}

                <div className="space-y-2.5">
                  {tickets.map((t) => <TicketStub key={t.id} ticket={t} onValider={marquerValide} onAnnuler={annulerTicketManager} />)}
                  {tickets.length === 0 && <p className="text-sm" style={{ color: "rgba(246,239,221,0.4)" }}>Aucun ticket pour ce salon.</p>}
                </div>
              </div>
            </div>
          )}

          {salon && vue === "employes" && (
            <div className="space-y-5">
              <form onSubmit={soumettreEmploye} className="rounded-lg p-5 space-y-3" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Ajouter un employé</h3>
                <p className="text-[11px]" style={{ color: "rgba(246,239,221,0.45)" }}>
                  Vous définissez ses identifiants ; il pourra changer ce mot de passe à sa première connexion.
                </p>
                <Erreur message={erreurEmploye} />
                <div className="grid grid-cols-2 gap-3">
                  <input required value={formEmploye.first_name} onChange={(e) => setFormEmploye({ ...formEmploye, first_name: e.target.value })}
                    placeholder="Prénom" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input value={formEmploye.last_name} onChange={(e) => setFormEmploye({ ...formEmploye, last_name: e.target.value })}
                    placeholder="Nom" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input required value={formEmploye.username} onChange={(e) => setFormEmploye({ ...formEmploye, username: e.target.value })}
                    placeholder="Identifiant" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input required type="password" value={formEmploye.password} onChange={(e) => setFormEmploye({ ...formEmploye, password: e.target.value })}
                    placeholder="Mot de passe provisoire" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <select value={formEmploye.role} onChange={(e) => setFormEmploye({ ...formEmploye, role: e.target.value })}
                    className="col-span-2 px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }}>
                    {ROLES.map((r) => <option key={r} value={r} style={{ background: T.inkDeep }}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={envoiEmploye} className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold"
                  style={{ background: T.gold, color: T.inkDeep, opacity: envoiEmploye ? 0.6 : 1 }}>
                  <Plus size={14} /> {envoiEmploye ? "Ajout…" : "Ajouter"}
                </button>
              </form>

              <div className="space-y-2">
                {employes.map((e) => {
                  const estProprietaire = e.utilisateur === salon.proprietaire;
                  return (
                    <div key={e.id} className="rounded-md p-3" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}`, opacity: e.actif ? 1 : 0.5 }}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm" style={{ color: T.ivory }}>
                          {e.nom_complet}
                          {estProprietaire && <span className="text-[10px] ml-1.5" style={{ color: T.gold }}>(propriétaire)</span>}
                          {!e.actif && <span className="text-[10px] ml-1.5" style={{ color: T.coral }}>(retiré du salon)</span>}
                        </span>
                        {estProprietaire ? (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(127,214,194,0.12)", color: T.mint }}>{ROLE_LABELS[e.role] || e.role}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Changer le rôle de l'employé (point 2) */}
                            <select value={e.role} onChange={(ev) => changerRole(e, ev.target.value)} disabled={envoiManager === e.id}
                              className="text-xs px-2 py-1 rounded-md outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }}>
                              {ROLES.map((r) => <option key={r} value={r} style={{ background: T.inkDeep }}>{ROLE_LABELS[r]}</option>)}
                            </select>
                            {/* Retirer / réintégrer l'employé du salon (point 2) */}
                            <button onClick={() => basculerActifEmploye(e)} disabled={envoiManager === e.id}
                              className="text-[11px] px-2 py-1 rounded-md" style={{ background: e.actif ? "rgba(255,122,92,0.12)" : "rgba(127,214,194,0.12)", color: e.actif ? T.coral : T.mint, opacity: envoiManager === e.id ? 0.5 : 1 }}
                              title={e.actif ? "Retirer cet employé du salon" : "Réintégrer cet employé"}>
                              {e.actif ? "Retirer" : "Réintégrer"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Droits granulaires sur les tickets — uniquement pour les co-managers (point 4) */}
                      {!estProprietaire && e.role === "gestionnaire" && (
                        <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2.5" style={{ borderTop: `1px dashed ${T.line}` }}>
                          <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(246,239,221,0.4)" }}>Tâches autorisées :</span>
                          {[["peut_creer_ticket", "Créer un ticket"], ["peut_confirmer_ticket", "Confirmer un soin"], ["peut_valider_ticket", "Valider un paiement"]].map(([cle, label]) => (
                            <label key={cle} className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(246,239,221,0.65)" }}>
                              <input type="checkbox" checked={!!e[cle]} onChange={() => basculerPermissionTicket(e, cle)} style={{ accentColor: T.gold }} />
                              {label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {employes.length === 0 && <p className="text-sm" style={{ color: "rgba(246,239,221,0.4)" }}>Aucun employé pour le moment.</p>}
              </div>
            </div>
          )}

          {salon && vue === "produits" && (
            <div className="space-y-6">
              <form onSubmit={soumettreProduit} className="rounded-lg p-5 space-y-3" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Ajouter un produit</h3>
                <Erreur message={erreurProduit} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input required value={formProduit.nom} onChange={(e) => setFormProduit({ ...formProduit, nom: e.target.value })}
                    placeholder="Nom du produit" className="col-span-2 px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <select value={formProduit.categorie} onChange={(e) => setFormProduit({ ...formProduit, categorie: e.target.value })}
                    className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }}>
                    {CATEGORIES_PRODUIT.map(([k, l]) => <option key={k} value={k} style={{ background: T.inkDeep }}>{l}</option>)}
                  </select>
                  <input required type="number" min="0" value={formProduit.prix_unitaire_achat} onChange={(e) => setFormProduit({ ...formProduit, prix_unitaire_achat: e.target.value })}
                    placeholder="Prix d'achat (FCFA)" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input type="number" min="0" value={formProduit.quantite_stock} onChange={(e) => setFormProduit({ ...formProduit, quantite_stock: e.target.value })}
                    placeholder="Quantité initiale" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input type="number" min="0" value={formProduit.seuil_alerte} onChange={(e) => setFormProduit({ ...formProduit, seuil_alerte: e.target.value })}
                    placeholder="Seuil d'alerte" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                </div>
                <button type="submit" disabled={envoiProduit} className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold"
                  style={{ background: T.gold, color: T.inkDeep, opacity: envoiProduit ? 0.6 : 1 }}>
                  <Plus size={14} /> {envoiProduit ? "Ajout…" : "Ajouter au stock"}
                </button>
              </form>

              {CATEGORIES_PRODUIT.map(([cle, libelle]) => {
                const produitsCategorie = produits.filter((p) => p.categorie === cle);
                if (produitsCategorie.length === 0) return null;
                return (
                  <div key={cle}>
                    <h3 className="mb-3" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>{libelle}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {produitsCategorie.map((p) => (
                        <div key={p.id} className="rounded-lg p-4" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm" style={{ color: T.ivory }}>{p.nom}</span>
                            <span className="flex items-center gap-1.5 text-xs font-mono">
                              {p.en_alerte_stock ? <AlertTriangle size={13} style={{ color: T.coral }} /> : <CheckCircle2 size={13} style={{ color: T.mint }} />}
                              <span style={{ color: p.en_alerte_stock ? T.coral : "rgba(246,239,221,0.6)" }}>{p.quantite_stock} en stock</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="number" min="1" placeholder="Qté à ajouter" value={ravitaillement[p.id] || ""}
                              onChange={(e) => setRavitaillement({ ...ravitaillement, [p.id]: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 rounded-md text-xs outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                            <button onClick={() => ravitailler(p)} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md font-medium shrink-0"
                              style={{ background: "rgba(127,214,194,0.15)", color: T.mint }}>
                              <PackagePlus size={12} /> Ravitailler
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {produits.length === 0 && <p className="text-sm" style={{ color: "rgba(246,239,221,0.4)" }}>Aucun produit enregistré.</p>}
            </div>
          )}

          {salon && vue === "avis" && (
            <div className="space-y-3 max-w-lg">
              {avis.map((a) => (
                <div key={a.id} className="rounded-lg p-4" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                  <div className="flex items-center gap-1 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill={i < a.note ? T.gold : "none"} style={{ color: T.gold }} />
                    ))}
                  </div>
                  {a.commentaire && <p className="text-sm" style={{ color: "rgba(246,239,221,0.8)" }}>"{a.commentaire}"</p>}
                </div>
              ))}
              {avis.length === 0 && <p className="text-sm" style={{ color: "rgba(246,239,221,0.4)" }}>Aucun avis pour le moment.</p>}
            </div>
          )}

          {salon && vue === "abonnement" && (
            <div className="max-w-lg space-y-4">
              <div className="rounded-lg p-5" style={{ background: T.inkDeep, border: `1px solid ${T.line}` }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.ivory }}>État de l'abonnement</h3>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full"
                    style={{ background: abonnementActif ? "rgba(127,214,194,0.15)" : "rgba(255,122,92,0.15)", color: abonnementActif ? T.mint : T.coral }}>
                    {abonnementActif ? (abonnementActif.est_essai ? "Essai gratuit actif" : "Actif") : "Aucun abonnement actif"}
                  </span>
                </div>
                {abonnementActif && (
                  <p className="text-sm mt-2" style={{ color: "rgba(246,239,221,0.6)" }}>
                    Expire le {new Date(abonnementActif.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>

              <Erreur message={erreurAbonnement} />

              {!utilisateur?.a_utilise_essai_gratuit && !abonnementActif && (
                <button onClick={demarrerEssai} disabled={envoiAbonnement}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold"
                  style={{ background: T.mint, color: T.inkDeep, opacity: envoiAbonnement ? 0.6 : 1 }}>
                  <Sparkles size={15} /> Démarrer l'essai gratuit de 14 jours
                </button>
              )}

              <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
                <h3 className="mb-3" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>Renouveler / souscrire</h3>
                <div className="flex gap-2 mb-3">
                  {[3, 6, 12].map((m) => (
                    <button key={m} onClick={() => setDuree(m)}
                      className="flex-1 py-2 rounded-md text-sm"
                      style={{ background: duree === m ? T.gold : "rgba(246,239,221,0.05)", color: duree === m ? T.inkDeep : "rgba(246,239,221,0.7)", border: `1px solid ${duree === m ? T.gold : T.line}` }}>
                      {m} mois
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[["orange_money", "Orange Money", Smartphone], ["mtn_momo", "MTN MoMo", Smartphone], ["carte_bancaire", "Carte", CardIcon]].map(([k, l, Icon]) => (
                    <button key={k} onClick={() => setModePaiement(k)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-md text-xs"
                      style={{ background: modePaiement === k ? T.gold : "rgba(246,239,221,0.05)", color: modePaiement === k ? T.inkDeep : "rgba(246,239,221,0.7)", border: `1px solid ${T.line}` }}>
                      <Icon size={14} /> {l}
                    </button>
                  ))}
                </div>
                <input value={codePromoRenouvellement} onChange={(e) => setCodePromoRenouvellement(e.target.value.toUpperCase())}
                  placeholder="Code de réduction ou de parrainage (optionnel)"
                  className="w-full mb-3 px-3 py-2 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <button onClick={renouveler} disabled={envoiAbonnement}
                  className="w-full py-2.5 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep, opacity: envoiAbonnement ? 0.6 : 1 }}>
                  {envoiAbonnement ? "Traitement…" : `Payer ${(duree * 1800).toLocaleString()} FCFA`}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      </div>

      <SiteFooter compact />
    </div>
  );
}
