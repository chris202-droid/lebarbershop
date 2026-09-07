import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Store, Inbox, Tag, Gift, Package, TrendingUp, ShieldCheck,
  Plus, MapPin, CheckCircle2, XCircle, Clock, X, Pencil, KeyRound,
  MessageSquare, Users2, CreditCard,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { T } from "../lib/tokens";
import { NavItem, Erreur } from "../components/UI";
import SiteFooter from "../components/SiteFooter";
import BoutonWhatsAppFlottant from "../components/BoutonWhatsAppFlottant";
import UserMenu from "../components/UserMenu";
import {
  listerSalons, modifierSalon, activerSalon, suspendreSalon, desactiverSalon,
  listerCodesReduction, creerCodeReduction, activerCodeReduction,
  listerCodesSponsoring, creerCodeSponsoring, listerTousLesAbonnements,
  listerForfaits, creerForfait, modifierForfait, supprimerForfait,
} from "../api/salons";
import { listerDemandesToutes, marquerDemandeContactTraitee, marquerDemandePartenariatTraitee } from "../api/contact";
import { bilanFinancier } from "../api/analytics";
import {
  listerAdministrateurs, nommerAdministrateur, modifierDroitsAdministrateur,
  revoquerAdministrateur, reinitialiserIdentifiants,
} from "../api/auth";

/* ------------------------------------------------------------------ */

function StatutBadge({ statut }) {
  const map = {
    actif: { label: "Actif", color: T.mint, Icon: CheckCircle2 },
    en_attente: { label: "En attente", color: T.gold, Icon: Clock },
    suspendu: { label: "Suspendu", color: T.coral, Icon: XCircle },
  };
  const { label, color, Icon } = map[statut] || map.en_attente;
  return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}><Icon size={11} /> {label}</span>;
}

function Carte({ children, className = "" }) {
  return <div className={`rounded-lg p-5 ${className}`} style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>{children}</div>;
}

function Champ({ surFondSombre, ...props }) {
  return <input {...props} className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
    style={surFondSombre
      ? { background: "rgba(245,241,232,0.08)", color: T.clair, border: `1px solid rgba(245,241,232,0.2)` }
      : { background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />;
}

const NAV = [
  { key: "salons", label: "Salons", icon: Store },
  { key: "abonnements", label: "Abonnements", icon: CreditCard },
  { key: "demandes", label: "Demandes", icon: Inbox },
  { key: "codes", label: "Codes promo & partenaires", icon: Tag },
  { key: "forfaits", label: "Forfaits", icon: Package },
  { key: "bilan", label: "Bilan financier", icon: TrendingUp },
  { key: "administrateurs", label: "Administrateurs", icon: ShieldCheck },
];

/* --------------------------- Vue : Salons --------------------------- */

function VueSalons() {
  const [salons, setSalons] = useState([]);
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [edition, setEdition] = useState(null); // salon en cours d'édition
  const [formEdition, setFormEdition] = useState({ nom: "", photo_url: "" });
  const [formIdentifiants, setFormIdentifiants] = useState({ username: "", nouveau_mot_de_passe: "" });
  const [envoi, setEnvoi] = useState(false);
  const [erreurEdition, setErreurEdition] = useState("");
  const [succesIdentifiants, setSuccesIdentifiants] = useState(false);

  const charger = async () => {
    setChargement(true);
    try {
      const s = await listerSalons(filtre || undefined); // GET /api/v1/salons/?statut=
      setSalons(s.results || s);
    } catch {
      setErreur("Impossible de charger les salons.");
    } finally {
      setChargement(false);
    }
  };
  useEffect(() => { charger(); }, [filtre]);

  const changerStatut = async (salon, action) => {
    try {
      const appel = action === "activer" ? activerSalon : action === "suspendre" ? suspendreSalon : desactiverSalon;
      const maj = await appel(salon.id);
      setSalons(salons.map((s) => (s.id === maj.id ? maj : s)));
    } catch {
      setErreur("Impossible de changer le statut de ce salon.");
    }
  };

  const ouvrirEdition = (salon) => {
    setEdition(salon);
    setFormEdition({ nom: salon.nom, photo_url: salon.photo_url || "" });
    setFormIdentifiants({ username: salon.proprietaire_username || "", nouveau_mot_de_passe: "" });
    setErreurEdition(""); setSuccesIdentifiants(false);
  };

  const enregistrerSalon = async (e) => {
    e.preventDefault();
    setErreurEdition(""); setEnvoi(true);
    try {
      // L'administrateur n'a pas la restriction "une seule modification" du nom.
      const maj = await modifierSalon(edition.id, formEdition); // PATCH /api/v1/salons/{id}/
      setSalons(salons.map((s) => (s.id === maj.id ? maj : s)));
      setEdition(maj);
    } catch {
      setErreurEdition("Impossible d'enregistrer ces modifications.");
    } finally {
      setEnvoi(false);
    }
  };

  const reinitialiser = async (e) => {
    e.preventDefault();
    setErreurEdition(""); setSuccesIdentifiants(false); setEnvoi(true);
    try {
      await reinitialiserIdentifiants(edition.proprietaire, { // POST /api/v1/auth/utilisateurs/{id}/reinitialiser/
        ...(formIdentifiants.username ? { username: formIdentifiants.username } : {}),
        ...(formIdentifiants.nouveau_mot_de_passe ? { nouveau_mot_de_passe: formIdentifiants.nouveau_mot_de_passe } : {}),
      });
      setSuccesIdentifiants(true);
      setFormIdentifiants({ ...formIdentifiants, nouveau_mot_de_passe: "" });
    } catch (err) {
      setErreurEdition(err.body?.nouveau_mot_de_passe?.[0] || err.body?.username?.[0] || "Impossible de réinitialiser les identifiants.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="space-y-4">
      <Erreur message={erreur} />
      <div className="flex gap-2">
        {[["", "Tous"], ["actif", "Actifs"], ["en_attente", "En attente"], ["suspendu", "Suspendus"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: filtre === k ? T.gold : "rgba(18,42,32,0.06)", color: filtre === k ? T.inkDeep : "rgba(18,42,32,0.6)" }}>
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.line}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(18,42,32,0.04)" }}>
              {["Salon", "Gérant", "Secteur", "Statut", "Abonnement", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wide" style={{ color: "rgba(18,42,32,0.45)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {salons.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td className="px-4 py-3" style={{ color: T.ivory }}>{s.nom}</td>
                <td className="px-4 py-3" style={{ color: "rgba(18,42,32,0.6)" }}>{s.proprietaire_username}</td>
                <td className="px-4 py-3 flex items-center gap-1.5" style={{ color: "rgba(18,42,32,0.6)" }}>
                  <MapPin size={12} style={{ color: T.mint }} /> {s.secteur_geographique}, {s.ville}
                </td>
                <td className="px-4 py-3"><StatutBadge statut={s.statut} /></td>
                <td className="px-4 py-3">
                  {s.abonnement_actif ? (
                    <div className="text-xs">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full mr-1.5"
                        style={{ background: s.abonnement_actif.est_essai ? "rgba(201,147,42,0.15)" : "rgba(30,158,100,0.15)", color: s.abonnement_actif.est_essai ? T.gold : T.mint }}>
                        {s.abonnement_actif.est_essai ? "Essai" : "Payant"}
                      </span>
                      <span style={{ color: "rgba(18,42,32,0.55)" }}>
                        jusqu'au {new Date(s.abonnement_actif.date_fin).toLocaleDateString("fr-FR")}
                      </span>
                      {!s.abonnement_actif.est_essai && (
                        <div className="font-mono mt-0.5" style={{ color: "rgba(18,42,32,0.45)" }}>
                          {Number(s.abonnement_actif.montant_total).toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "rgba(18,42,32,0.35)" }}>Aucun</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => ouvrirEdition(s)} className="p-1.5 rounded-md" style={{ background: "rgba(18,42,32,0.06)" }} title="Modifier">
                      <Pencil size={13} style={{ color: "rgba(18,42,32,0.7)" }} />
                    </button>
                    {s.statut !== "actif" && (
                      <button onClick={() => changerStatut(s, "activer")} className="text-[11px] px-2 py-1.5 rounded-md font-medium" style={{ background: "rgba(30,158,100,0.15)", color: T.mint }}>
                        Activer
                      </button>
                    )}
                    {s.statut !== "suspendu" && (
                      <button onClick={() => changerStatut(s, "suspendre")} className="text-[11px] px-2 py-1.5 rounded-md font-medium" style={{ background: "rgba(217,80,60,0.15)", color: T.coral }} title="Blocage administratif">
                        Suspendre
                      </button>
                    )}
                    {s.statut !== "en_attente" && (
                      <button onClick={() => changerStatut(s, "desactiver")} className="text-[11px] px-2 py-1.5 rounded-md font-medium" style={{ background: "rgba(201,147,42,0.15)", color: T.gold }} title="Remet le salon en attente de paiement">
                        Désactiver
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!chargement && salons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun salon.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Panneau d'édition : nom/photo + réinitialisation des identifiants du gérant */}
      {edition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,61,46,0.55)" }}>
          <div className="w-full max-w-md rounded-lg p-6" style={{ background: T.inkDeep, border: `1px solid rgba(245,241,232,0.15)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: T.clair }}>{edition.nom}</h3>
              <button onClick={() => setEdition(null)}><X size={18} style={{ color: "rgba(245,241,232,0.6)" }} /></button>
            </div>
            <Erreur message={erreurEdition} />

            <form onSubmit={enregistrerSalon} className="space-y-2.5 mt-3">
              <p className="text-[11px] uppercase tracking-wide" style={{ color: "rgba(245,241,232,0.5)" }}>Informations du salon</p>
              <Champ surFondSombre value={formEdition.nom} onChange={(e) => setFormEdition({ ...formEdition, nom: e.target.value })} placeholder="Nom du salon" />
              <Champ surFondSombre value={formEdition.photo_url} onChange={(e) => setFormEdition({ ...formEdition, photo_url: e.target.value })} placeholder="URL de la photo du salon" />
              <button type="submit" disabled={envoi} className="px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: T.gold, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>
                Enregistrer
              </button>
            </form>

            <form onSubmit={reinitialiser} className="space-y-2.5 mt-6 pt-5" style={{ borderTop: `1px dashed rgba(245,241,232,0.2)` }}>
              <p className="text-[11px] uppercase tracking-wide flex items-center gap-1.5" style={{ color: "rgba(245,241,232,0.5)" }}>
                <KeyRound size={12} /> Identifiants du gérant
              </p>
              {succesIdentifiants && <p className="text-xs" style={{ color: T.mint }}>Identifiants mis à jour.</p>}
              <Champ surFondSombre value={formIdentifiants.username} onChange={(e) => setFormIdentifiants({ ...formIdentifiants, username: e.target.value })} placeholder="Nom d'utilisateur" />
              <Champ surFondSombre type="password" value={formIdentifiants.nouveau_mot_de_passe} onChange={(e) => setFormIdentifiants({ ...formIdentifiants, nouveau_mot_de_passe: e.target.value })} placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)" />
              <button type="submit" disabled={envoi} className="px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: T.coral, color: T.clair, opacity: envoi ? 0.6 : 1 }}>
                Réinitialiser
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Vue : Abonnements ------------------------- */

function VueAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [filtre, setFiltre] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      setChargement(true);
      try {
        const a = await listerTousLesAbonnements(); // GET /api/v1/abonnements/ (tous, vue admin)
        setAbonnements(a.results || a);
      } catch {
        setErreur("Impossible de charger les abonnements.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const filtres = abonnements.filter((a) => !filtre || a.statut === filtre);

  return (
    <div className="space-y-4">
      <Erreur message={erreur} />
      <div className="flex gap-2">
        {[["", "Tous"], ["actif", "Actifs"], ["expire", "Expirés"], ["annule", "Annulés"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: filtre === k ? T.gold : "rgba(18,42,32,0.06)", color: filtre === k ? T.inkDeep : "rgba(18,42,32,0.6)" }}>
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.line}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(18,42,32,0.04)" }}>
              {["Salon", "Statut", "Essai", "Date début", "Date fin", "Montant total"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wide" style={{ color: "rgba(18,42,32,0.45)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtres.map((a) => (
              <tr key={a.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td className="px-4 py-3" style={{ color: T.ivory }}>{a.salon_nom || a.salon}</td>
                <td className="px-4 py-3"><StatutBadge statut={a.statut === "actif" ? "actif" : a.statut === "expire" ? "suspendu" : "en_attente"} /></td>
                <td className="px-4 py-3">
                  {a.est_essai ? (
                    <CheckCircle2 size={14} style={{ color: T.mint }} />
                  ) : (
                    <span style={{ color: "rgba(18,42,32,0.3)" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(18,42,32,0.7)" }}>{new Date(a.date_debut).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(18,42,32,0.7)" }}>{new Date(a.date_fin).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3 font-mono" style={{ color: T.gold }}>{Number(a.montant_total).toLocaleString()}</td>
              </tr>
            ))}
            {!chargement && filtres.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun abonnement.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs" style={{ color: "rgba(18,42,32,0.4)" }}>{filtres.length} abonnement(s)</p>
    </div>
  );
}

/* -------------------------- Vue : Demandes -------------------------- */

function VueDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [filtre, setFiltre] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      const d = await listerDemandesToutes(); // GET /api/v1/contact/admin/demandes-toutes/
      setDemandes(d);
    } catch {
      setErreur("Impossible de charger les demandes.");
    }
  };
  useEffect(() => { charger(); }, []);

  const marquerTraitee = async (d) => {
    try {
      if (d.type === "contact") await marquerDemandeContactTraitee(d.id, true);
      if (d.type === "partenariat") await marquerDemandePartenariatTraitee(d.id, true);
      setDemandes(demandes.map((x) => (x.id === d.id ? { ...x, traite: true } : x)));
    } catch {
      setErreur("Impossible de marquer cette demande comme traitée.");
    }
  };

  const filtrees = demandes.filter((d) => !filtre || d.type === filtre);
  const iconeType = { contact: MessageSquare, partenariat: Users2, code_promo: Gift };

  return (
    <div className="space-y-4">
      <Erreur message={erreur} />
      <div className="flex gap-2">
        {[["", "Toutes"], ["contact", "Contact"], ["partenariat", "Partenariat"], ["code_promo", "Code promo"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: filtre === k ? T.gold : "rgba(18,42,32,0.06)", color: filtre === k ? T.inkDeep : "rgba(18,42,32,0.6)" }}>
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtrees.map((d) => {
          const Icon = iconeType[d.type] || Inbox;
          return (
            <Carte key={`${d.type}-${d.id}`} className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Icon size={16} className="mt-0.5 shrink-0" style={{ color: T.mint }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: T.ivory }}>{d.titre}</span>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ background: "rgba(201,147,42,0.12)", color: T.gold }}>{d.type_label}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(18,42,32,0.5)" }}>{d.sous_titre}</p>
                  {d.detail && <p className="text-xs mt-1.5" style={{ color: "rgba(18,42,32,0.65)" }}>{d.detail}</p>}
                  <p className="text-[10px] mt-1.5" style={{ color: "rgba(18,42,32,0.35)" }}>{new Date(d.date_creation).toLocaleString("fr-FR")}</p>
                </div>
              </div>
              {d.type !== "code_promo" && (
                d.traite ? (
                  <span className="text-[11px] px-2 py-1 rounded-full shrink-0" style={{ background: "rgba(30,158,100,0.15)", color: T.mint }}>Traitée</span>
                ) : (
                  <button onClick={() => marquerTraitee(d)} className="text-[11px] px-2.5 py-1.5 rounded-md font-medium shrink-0" style={{ background: T.gold, color: T.inkDeep }}>
                    Marquer traitée
                  </button>
                )
              )}
            </Carte>
          );
        })}
        {filtrees.length === 0 && <p className="text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucune demande.</p>}
      </div>
    </div>
  );
}

/* ----------------------- Vue : Codes & partenaires ----------------------- */

function VueCodes() {
  const [codesReduction, setCodesReduction] = useState([]);
  const [codesSponsoring, setCodesSponsoring] = useState([]);
  const [nouveauCodeReduc, setNouveauCodeReduc] = useState({
    code: "", montant_reduction: "", proprietaire_nom: "", proprietaire_contact: "", duree_jours: "30",
  });
  const [nouveauCodeSpons, setNouveauCodeSpons] = useState({ code: "", beneficiaire_nom: "", beneficiaire_contact: "", montant_reduction_utilisateur: "" });
  const [erreur, setErreur] = useState("");
  const [erreurCreation, setErreurCreation] = useState("");
  const [envoiCode, setEnvoiCode] = useState(false);

  const charger = async () => {
    // Chaque liste est chargée indépendamment : si l'une des deux échoue,
    // l'autre reste utilisable et l'erreur affichée est spécifique.
    try {
      const cr = await listerCodesReduction();
      setCodesReduction(cr.results || cr);
    } catch {
      setErreur((e) => e || "Impossible de charger les codes de réduction.");
    }
    try {
      const cs = await listerCodesSponsoring();
      setCodesSponsoring(cs.results || cs);
    } catch {
      setErreur((e) => e || "Impossible de charger les codes de sponsoring.");
    }
  };
  useEffect(() => { charger(); }, []);

  const basculerCodeReduction = async (c) => {
    try {
      const maj = await activerCodeReduction(c.id, !c.actif); // PATCH /api/v1/codes-reduction/{id}/
      setCodesReduction(codesReduction.map((x) => (x.id === maj.id ? maj : x)));
    } catch {
      setErreur("Impossible de changer le statut de ce code.");
    }
  };

  const ajouterCodeReduction = async (e) => {
    e.preventDefault();
    if (!nouveauCodeReduc.code || !nouveauCodeReduc.montant_reduction) return;
    setErreurCreation(""); setEnvoiCode(true);
    try {
      const c = await creerCodeReduction({
        ...nouveauCodeReduc,
        montant_reduction: Number(nouveauCodeReduc.montant_reduction),
        duree_jours: nouveauCodeReduc.duree_jours ? Number(nouveauCodeReduc.duree_jours) : undefined,
      }); // POST /api/v1/codes-reduction/ — propriétaire/contact/durée/montant fixe (point 2)
      setCodesReduction([c, ...codesReduction]);
      setNouveauCodeReduc({ code: "", montant_reduction: "", proprietaire_nom: "", proprietaire_contact: "", duree_jours: "30" });
    } catch (err) {
      const messages = err.body ? Object.values(err.body).flat().join(" ") : "Impossible de créer ce code.";
      setErreurCreation(messages);
    } finally {
      setEnvoiCode(false);
    }
  };
  const ajouterCodeSponsoring = async (e) => {
    e.preventDefault();
    if (!nouveauCodeSpons.code) return;
    try {
      const c = await creerCodeSponsoring({
        ...nouveauCodeSpons,
        montant_reduction_utilisateur: nouveauCodeSpons.montant_reduction_utilisateur ? Number(nouveauCodeSpons.montant_reduction_utilisateur) : 0,
      });
      setCodesSponsoring([c, ...codesSponsoring]);
      setNouveauCodeSpons({ code: "", beneficiaire_nom: "", beneficiaire_contact: "", montant_reduction_utilisateur: "" });
    } catch {
      setErreur("Impossible de créer ce code de sponsoring.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Erreur message={erreur} />
      <Carte>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Tag size={16} style={{ color: T.coral }} /><h3 style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Codes de réduction</h3></div>
        </div>
        <form onSubmit={ajouterCodeReduction} className="space-y-2 mb-4">
          <Erreur message={erreurCreation} />
          <div className="grid grid-cols-2 gap-2">
            <Champ required value={nouveauCodeReduc.code} onChange={(e) => setNouveauCodeReduc({ ...nouveauCodeReduc, code: e.target.value })} placeholder="CODE" />
            <input required value={nouveauCodeReduc.montant_reduction} onChange={(e) => setNouveauCodeReduc({ ...nouveauCodeReduc, montant_reduction: e.target.value })} placeholder="Montant de réduction (FCFA)" type="number" min="1"
              className="px-2 py-2 rounded-md text-sm outline-none" style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Champ value={nouveauCodeReduc.proprietaire_nom} onChange={(e) => setNouveauCodeReduc({ ...nouveauCodeReduc, proprietaire_nom: e.target.value })} placeholder="Propriétaire du code" />
            <Champ value={nouveauCodeReduc.proprietaire_contact} onChange={(e) => setNouveauCodeReduc({ ...nouveauCodeReduc, proprietaire_contact: e.target.value })} placeholder="Contact (email/téléphone)" />
          </div>
          <div className="flex items-center gap-2">
            <input value={nouveauCodeReduc.duree_jours} onChange={(e) => setNouveauCodeReduc({ ...nouveauCodeReduc, duree_jours: e.target.value })} placeholder="Durée" type="number" min="1"
              className="w-24 px-2 py-2 rounded-md text-sm outline-none" style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            <span className="text-xs" style={{ color: "rgba(18,42,32,0.5)" }}>jour(s) de validité</span>
            <button type="submit" disabled={envoiCode} className="ml-auto px-3 py-2 rounded-md shrink-0" style={{ background: T.coral, color: T.inkDeep, opacity: envoiCode ? 0.6 : 1 }}>
              <Plus size={14} />
            </button>
          </div>
        </form>
        <div className="space-y-2">
          {codesReduction.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "rgba(18,42,32,0.03)" }}>
              <div>
                <span className="font-mono text-sm" style={{ color: c.actif ? T.ivory : "rgba(18,42,32,0.35)" }}>{c.code}</span>
                <span className="font-mono text-xs ml-2" style={{ color: T.gold }}>{Number(c.montant_reduction).toLocaleString()} FCFA</span>
                {c.proprietaire_nom && (
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(18,42,32,0.5)" }}>
                    {c.proprietaire_nom}{c.proprietaire_contact ? ` — ${c.proprietaire_contact}` : ""}
                  </p>
                )}
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(18,42,32,0.4)" }}>
                  {c.nombre_utilisations || 0} utilisation{(c.nombre_utilisations || 0) > 1 ? "s" : ""}
                  {c.nombre_utilisations_max ? ` / ${c.nombre_utilisations_max} max` : ""}
                  {c.date_expiration ? ` · expire le ${new Date(c.date_expiration).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>
              <button onClick={() => basculerCodeReduction(c)} className="text-[11px] px-2 py-1 rounded-full shrink-0"
                style={{ background: c.actif ? "rgba(217,80,60,0.15)" : "rgba(30,158,100,0.15)", color: c.actif ? T.coral : T.mint }}>
                {c.actif ? "Désactiver" : "Activer"}
              </button>
            </div>
          ))}
          {codesReduction.length === 0 && <p className="text-xs" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun code de réduction.</p>}
        </div>
      </Carte>

      <Carte>
        <div className="flex items-center gap-2 mb-4"><Gift size={16} style={{ color: T.mint }} /><h3 style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Partenaires (sponsoring)</h3></div>
        <form onSubmit={ajouterCodeSponsoring} className="space-y-2 mb-3">
          <div className="flex gap-2">
            <Champ required value={nouveauCodeSpons.code} onChange={(e) => setNouveauCodeSpons({ ...nouveauCodeSpons, code: e.target.value })} placeholder="CODE" />
            <Champ required value={nouveauCodeSpons.beneficiaire_nom} onChange={(e) => setNouveauCodeSpons({ ...nouveauCodeSpons, beneficiaire_nom: e.target.value })} placeholder="Bénéficiaire" />
          </div>
          <div className="flex gap-2">
            <Champ value={nouveauCodeSpons.beneficiaire_contact} onChange={(e) => setNouveauCodeSpons({ ...nouveauCodeSpons, beneficiaire_contact: e.target.value })} placeholder="Contact du bénéficiaire" />
            <input value={nouveauCodeSpons.montant_reduction_utilisateur} onChange={(e) => setNouveauCodeSpons({ ...nouveauCodeSpons, montant_reduction_utilisateur: e.target.value })}
              placeholder="Réduction accordée (FCFA)" type="number" min="0"
              className="w-44 px-2 py-2 rounded-md text-sm outline-none shrink-0" style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
            <button type="submit" className="px-3 rounded-md shrink-0" style={{ background: T.mint, color: T.inkDeep }}><Plus size={14} /></button>
          </div>
        </form>
        <div className="space-y-2">
          {codesSponsoring.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "rgba(18,42,32,0.03)" }}>
              <div>
                <span className="font-mono text-sm" style={{ color: T.ivory }}>{c.code}</span>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(18,42,32,0.5)" }}>{c.beneficiaire_nom}</p>
              </div>
              {Number(c.montant_reduction_utilisateur) > 0 && (
                <span className="font-mono text-xs" style={{ color: T.mint }}>-{Number(c.montant_reduction_utilisateur).toLocaleString()} FCFA</span>
              )}
            </div>
          ))}
          {codesSponsoring.length === 0 && <p className="text-xs" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun code de sponsoring.</p>}
        </div>
      </Carte>
    </div>
  );
}

/* --------------------------- Vue : Forfaits --------------------------- */

const TYPES_FORFAIT = [
  ["abonnement_salon", "Abonnement salon"],
  ["analyse_sectorielle", "Analyse sectorielle"],
  ["autre", "Autre"],
];

function VueForfaits() {
  const [forfaits, setForfaits] = useState([]);
  const [nouveau, setNouveau] = useState({ nom: "", type_forfait: "abonnement_salon", prix: "", duree_mois: "", description: "", avantages: "" });
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    try {
      const f = await listerForfaits(); // GET /api/v1/forfaits/ (tous, vue admin)
      setForfaits(f.results || f);
    } catch {
      setErreur("Impossible de charger les forfaits.");
    }
  };
  useEffect(() => { charger(); }, []);

  const ajouter = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      const f = await creerForfait({
        ...nouveau,
        prix: Number(nouveau.prix),
        duree_mois: nouveau.duree_mois ? Number(nouveau.duree_mois) : null,
        avantages: nouveau.avantages.split(",").map((a) => a.trim()).filter(Boolean),
      });
      setForfaits([f, ...forfaits]);
      setNouveau({ nom: "", type_forfait: "abonnement_salon", prix: "", duree_mois: "", description: "", avantages: "" });
    } catch {
      setErreur("Impossible de créer ce forfait.");
    }
  };

  const basculerActif = async (f) => {
    try {
      const maj = await modifierForfait(f.id, { actif: !f.actif });
      setForfaits(forfaits.map((x) => (x.id === maj.id ? maj : x)));
    } catch {
      setErreur("Impossible de changer le statut de ce forfait.");
    }
  };

  const supprimer = async (f) => {
    try {
      await supprimerForfait(f.id);
      setForfaits(forfaits.filter((x) => x.id !== f.id));
    } catch {
      setErreur("Impossible de supprimer ce forfait.");
    }
  };

  return (
    <div className="space-y-5">
      <Erreur message={erreur} />
      <Carte>
        <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Nouveau forfait</h3>
        <form onSubmit={ajouter} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Champ required value={nouveau.nom} onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })} placeholder="Nom du forfait" />
          <select value={nouveau.type_forfait} onChange={(e) => setNouveau({ ...nouveau, type_forfait: e.target.value })}
            className="px-3 py-2.5 rounded-md text-sm" style={{ background: "rgba(18,42,32,0.05)", color: T.ivory, border: `1px solid ${T.line}` }}>
            {TYPES_FORFAIT.map(([k, l]) => <option key={k} value={k} style={{ background: T.inkDeep, color: T.clair }}>{l}</option>)}
          </select>
          <Champ required type="number" value={nouveau.prix} onChange={(e) => setNouveau({ ...nouveau, prix: e.target.value })} placeholder="Prix (FCFA)" />
          <Champ type="number" value={nouveau.duree_mois} onChange={(e) => setNouveau({ ...nouveau, duree_mois: e.target.value })} placeholder="Durée en mois (optionnel)" />
          <Champ value={nouveau.description} onChange={(e) => setNouveau({ ...nouveau, description: e.target.value })} placeholder="Description courte" className="sm:col-span-2" />
          <Champ value={nouveau.avantages} onChange={(e) => setNouveau({ ...nouveau, avantages: e.target.value })} placeholder="Avantages, séparés par des virgules" className="sm:col-span-2" />
          <button type="submit" className="sm:col-span-2 px-4 py-2.5 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep }}>
            Créer le forfait
          </button>
        </form>
      </Carte>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forfaits.map((f) => (
          <Carte key={f.id}>
            <div className="flex items-start justify-between mb-1">
              <p style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>{f.nom}</p>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full" style={{ background: "rgba(201,147,42,0.12)", color: T.gold }}>
                {TYPES_FORFAIT.find(([k]) => k === f.type_forfait)?.[1] || f.type_forfait}
              </span>
            </div>
            <p className="font-mono text-lg" style={{ color: T.gold }}>{Number(f.prix).toLocaleString()} <span className="text-xs">FCFA</span>{f.duree_mois ? <span className="text-xs" style={{ color: "rgba(18,42,32,0.4)" }}> / {f.duree_mois} mois</span> : null}</p>
            {f.description && <p className="text-xs mt-1" style={{ color: "rgba(18,42,32,0.55)" }}>{f.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => basculerActif(f)} className="text-[11px] px-2.5 py-1.5 rounded-md font-medium"
                style={{ background: f.actif ? "rgba(30,158,100,0.15)" : "rgba(18,42,32,0.08)", color: f.actif ? T.mint : "rgba(18,42,32,0.5)" }}>
                {f.actif ? "Publié" : "Masqué"}
              </button>
              <button onClick={() => supprimer(f)} className="text-[11px] px-2.5 py-1.5 rounded-md font-medium" style={{ background: "rgba(217,80,60,0.1)", color: T.coral }}>
                Supprimer
              </button>
            </div>
          </Carte>
        ))}
        {forfaits.length === 0 && <p className="text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun forfait configuré.</p>}
      </div>
    </div>
  );
}

/* ------------------------ Vue : Bilan financier ------------------------ */

function VueBilan() {
  const [periode, setPeriode] = useState("mois");
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await bilanFinancier(periode); // GET /api/v1/bilan-financier/?periode=
        setDonnees(d);
      } catch {
        setErreur("Impossible de charger le bilan financier.");
      }
    })();
  }, [periode]);

  return (
    <div className="space-y-5">
      <Erreur message={erreur} />
      <div className="flex gap-2">
        {[["mois", "Par mois"], ["trimestre", "Par trimestre"], ["semestre", "Par semestre"], ["annee", "Par année"]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriode(k)}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: periode === k ? T.gold : "rgba(18,42,32,0.06)", color: periode === k ? T.inkDeep : "rgba(18,42,32,0.6)" }}>
            {l}
          </button>
        ))}
      </div>

      {donnees && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Carte>
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(18,42,32,0.45)" }}>Revenu abonnements SAAS (total)</p>
              <p className="font-mono" style={{ fontSize: 26, color: T.gold }}>{donnees.totaux.revenu_abonnements.toLocaleString()} <span className="text-sm">FCFA</span></p>
              <p className="text-xs mt-1" style={{ color: "rgba(18,42,32,0.4)" }}>{donnees.totaux.nombre_paiements} paiement(s) réussi(s)</p>
            </Carte>
            <Carte>
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(18,42,32,0.45)" }}>Chiffre d'affaires des salons (total)</p>
              <p className="font-mono" style={{ fontSize: 26, color: T.mint }}>{donnees.totaux.chiffre_affaires_salons.toLocaleString()} <span className="text-sm">FCFA</span></p>
            </Carte>
          </div>

          <Carte>
            <h3 className="mb-4" style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>
              Évolution {periode === "mois" ? "mensuelle" : periode === "trimestre" ? "trimestrielle" : periode === "semestre" ? "semestrielle" : "annuelle"}
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={donnees.lignes}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="periode" stroke="rgba(18,42,32,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: `1px solid ${T.line}`, borderRadius: 6, fontSize: 12, boxShadow: "0 4px 16px rgba(18,42,32,0.12)" }} labelStyle={{ color: T.ivory }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenu_abonnements" name="Revenu SAAS" fill={T.gold} radius={[4, 4, 0, 0]} />
                <Bar dataKey="chiffre_affaires_salons" name="CA salons" fill={T.mint} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {donnees.lignes.length === 0 && <p className="text-xs text-center py-6" style={{ color: "rgba(18,42,32,0.35)" }}>Aucune donnée sur cette période.</p>}
          </Carte>
        </>
      )}
    </div>
  );
}

/* --------------------------- Vue : Administrateurs --------------------------- */

const DROITS = [
  ["peut_modifier_salon", "Modifier un salon"],
  ["peut_ajouter_administrateur", "Ajouter un administrateur"],
  ["peut_creer_codes_reduction", "Créer des codes de réduction"],
  ["peut_creer_codes_sponsoring", "Créer des codes de sponsoring"],
  ["peut_voir_abonnements", "Voir les abonnements"],
  ["peut_consulter_rendement_employes", "Consulter le rendement des employés"],
  ["peut_consulter_depenses", "Consulter les dépenses"],
];

function VueAdministrateurs() {
  const [administrateurs, setAdministrateurs] = useState([]);
  const [nouvelAdmin, setNouvelAdmin] = useState({
    last_name: "", first_name: "", email: "", telephone: "", username: "", password: "",
  });
  const [nouveauxDroits, setNouveauxDroits] = useState({});
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    try {
      const a = await listerAdministrateurs(); // GET /api/v1/auth/administrateurs/
      setAdministrateurs(a.results || a);
    } catch {
      setErreur("Impossible de charger les administrateurs.");
    }
  };
  useEffect(() => { charger(); }, []);

  const champ = (k) => (e) => setNouvelAdmin({ ...nouvelAdmin, [k]: e.target.value });

  const nommer = async (e) => {
    e.preventDefault();
    setErreur(""); setEnvoi(true);
    try {
      // Crée directement le compte du nouvel administrateur — nom, prénom,
      // email, contact téléphonique et identifiants — sans passer par
      // l'inscription publique (POST /api/v1/auth/administrateurs/nommer/).
      await nommerAdministrateur({ ...nouvelAdmin, ...nouveauxDroits });
      setNouvelAdmin({ last_name: "", first_name: "", email: "", telephone: "", username: "", password: "" });
      setNouveauxDroits({});
      charger();
    } catch (err) {
      const messages = err.body ? Object.values(err.body).flat().join(" ") : "Impossible de désigner cet administrateur.";
      setErreur(messages);
    } finally {
      setEnvoi(false);
    }
  };

  const basculerDroit = async (admin, cle) => {
    try {
      const maj = await modifierDroitsAdministrateur(admin.id, { [cle]: !admin.droits?.[cle] });
      setAdministrateurs(administrateurs.map((a) => (a.id === maj.id ? maj : a)));
    } catch {
      setErreur("Impossible de modifier ce droit.");
    }
  };

  const revoquer = async (admin) => {
    try {
      await revoquerAdministrateur(admin.id);
      setAdministrateurs(administrateurs.filter((a) => a.id !== admin.id));
    } catch {
      setErreur("Impossible de révoquer cet administrateur.");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <Erreur message={erreur} />
      <Carte>
        <h3 className="mb-1" style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Désigner un administrateur</h3>
        <p className="text-xs mb-4" style={{ color: "rgba(18,42,32,0.5)" }}>
          Si le nom d'utilisateur saisi existe déjà, ce compte est simplement promu administrateur.
          Sinon, un nouveau compte est créé avec les informations ci-dessous.
        </p>
        <form onSubmit={nommer} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Champ required value={nouvelAdmin.last_name} onChange={champ("last_name")} placeholder="Nom" />
            <Champ required value={nouvelAdmin.first_name} onChange={champ("first_name")} placeholder="Prénom" />
            <Champ type="email" value={nouvelAdmin.email} onChange={champ("email")} placeholder="Email" />
            <Champ value={nouvelAdmin.telephone} onChange={champ("telephone")} placeholder="Contact téléphonique" />
            <Champ required value={nouvelAdmin.username} onChange={champ("username")} placeholder="Identifiant (nom d'utilisateur)" />
            <Champ required type="password" value={nouvelAdmin.password} onChange={champ("password")} placeholder="Mot de passe" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DROITS.map(([cle, label]) => (
              <label key={cle} className="flex items-center gap-2 text-xs" style={{ color: "rgba(18,42,32,0.7)" }}>
                <input type="checkbox" checked={!!nouveauxDroits[cle]} onChange={(e) => setNouveauxDroits({ ...nouveauxDroits, [cle]: e.target.checked })}
                  style={{ accentColor: T.gold }} />
                {label}
              </label>
            ))}
          </div>
          <button type="submit" disabled={envoi} className="px-4 py-2.5 rounded-md text-sm font-semibold"
            style={{ background: T.gold, color: T.inkDeep, opacity: envoi ? 0.6 : 1 }}>
            {envoi ? "Envoi…" : "Désigner"}
          </button>
        </form>
      </Carte>

      <div className="space-y-3">
        {administrateurs.map((a) => (
          <Carte key={a.id}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ color: T.ivory, fontSize: 14 }}>{a.first_name || a.username}</p>
                <p className="text-xs" style={{ color: "rgba(18,42,32,0.5)" }}>{a.email || a.telephone || a.username}</p>
              </div>
              <button onClick={() => revoquer(a)} className="text-[11px] px-2.5 py-1.5 rounded-md font-medium" style={{ background: "rgba(217,80,60,0.1)", color: T.coral }}>
                Révoquer
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DROITS.map(([cle, label]) => (
                <label key={cle} className="flex items-center gap-2 text-xs" style={{ color: "rgba(18,42,32,0.65)" }}>
                  <input type="checkbox" checked={!!a.droits?.[cle]} onChange={() => basculerDroit(a, cle)} style={{ accentColor: T.mint }} />
                  {label}
                </label>
              ))}
            </div>
          </Carte>
        ))}
        {administrateurs.length === 0 && <p className="text-sm" style={{ color: "rgba(18,42,32,0.4)" }}>Aucun administrateur secondaire.</p>}
      </div>
    </div>
  );
}

/* ---------------------------------- Shell ---------------------------------- */

export default function Admin() {
  const [vue, setVue] = useState("salons");

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <BoutonWhatsAppFlottant />
      <div className="flex flex-1 min-h-0">
        <aside className="w-[260px] shrink-0 p-4 flex flex-col" style={{ borderRight: `1px solid ${T.line}`, background: "rgba(0,0,0,0.12)" }}>
          <Link to="/" className="flex items-center gap-2 px-2 mb-2 mt-1">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.gold }}><Shield size={16} style={{ color: T.inkDeep }} /></div>
            <div>
              <p style={{ fontFamily: "Fraunces, serif", fontSize: 15, color: T.ivory }}>LeBarberShop</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: T.gold }}>Super administrateur</p>
            </div>
          </Link>
          <p className="text-[11px] px-2 mb-6" style={{ color: "rgba(18,42,32,0.35)" }}>Gestion globale de la plateforme</p>
          <nav className="space-y-1">{NAV.map((n) => <NavItem key={n.key} {...n} active={vue === n.key} onClick={() => setVue(n.key)} />)}</nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: T.ivory }}>{NAV.find((n) => n.key === vue)?.label}</h1>
            <UserMenu />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {vue === "salons" && <VueSalons />}
            {vue === "abonnements" && <VueAbonnements />}
            {vue === "demandes" && <VueDemandes />}
            {vue === "codes" && <VueCodes />}
            {vue === "forfaits" && <VueForfaits />}
            {vue === "bilan" && <VueBilan />}
            {vue === "administrateurs" && <VueAdministrateurs />}
          </main>
        </div>
      </div>
      <SiteFooter compact />
    </div>
  );
}
