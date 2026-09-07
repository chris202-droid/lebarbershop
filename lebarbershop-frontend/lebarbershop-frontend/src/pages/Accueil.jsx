import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Sparkles, Users2,
  MapPin, Mail, Phone, Send, Gift, Tag, ShieldCheck, TrendingUp,
  Smartphone, CreditCard as CardIcon
} from "lucide-react";
import { T } from "../lib/tokens";
import { envoyerDemandeContact, envoyerDemandePartenariat, demanderCodePromo } from "../api/contact";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import BoutonWhatsAppFlottant from "../components/BoutonWhatsAppFlottant";

function Section({ id, eyebrow, titre, sous_titre, children }) {
  return (
    <section id={id} className="px-6 py-16 max-w-6xl mx-auto scroll-mt-20">
      {eyebrow && (
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.gold, fontFamily: "Manrope, sans-serif" }}>{eyebrow}</p>
      )}
      {titre && <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 32, color: T.ivory }}>{titre}</h2>}
      {sous_titre && <p className="mt-2 max-w-xl text-sm" style={{ color: "rgba(246,239,221,0.6)" }}>{sous_titre}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

export default function Accueil() {
  const location = useLocation();
  const [formContact, setFormContact] = useState({ nom: "", email: "", motif: "information", message: "" });
  const [formPartenaire, setFormPartenaire] = useState({ nom: "", structure: "", contact: "" });
  const [formPromo, setFormPromo] = useState({ email: "" });
  const [envoye, setEnvoye] = useState({ contact: false, partenaire: false, promo: false });
  const [envoi, setEnvoi] = useState({ contact: false, partenaire: false, promo: false });
  const [erreur, setErreur] = useState({ contact: "", partenaire: "", promo: "" });
  const [codePromo, setCodePromo] = useState(null);

  // Permet d'arriver sur "/#forfaits" (ou toute autre ancre) depuis une autre
  // page via SiteHeader/SiteFooter et de défiler automatiquement jusqu'à la
  // section correspondante une fois la landing page montée.
  useEffect(() => {
    if (!location.hash) return;
    const cible = document.querySelector(location.hash);
    if (cible) cible.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  const soumettreContact = async (e) => {
    e.preventDefault();
    setErreur({ ...erreur, contact: "" });
    setEnvoi({ ...envoi, contact: true });
    try {
      await envoyerDemandeContact(formContact); // POST /api/v1/contact/demandes/
      setEnvoye({ ...envoye, contact: true });
    } catch (err) {
      setErreur({ ...erreur, contact: "Envoi impossible, réessayez dans un instant." });
    } finally {
      setEnvoi({ ...envoi, contact: false });
    }
  };

  const soumettrePartenaire = async (e) => {
    e.preventDefault();
    setErreur({ ...erreur, partenaire: "" });
    setEnvoi({ ...envoi, partenaire: true });
    try {
      await envoyerDemandePartenariat(formPartenaire); // POST /api/v1/contact/partenariats/
      setEnvoye({ ...envoye, partenaire: true });
    } catch (err) {
      setErreur({ ...erreur, partenaire: "Envoi impossible, réessayez dans un instant." });
    } finally {
      setEnvoi({ ...envoi, partenaire: false });
    }
  };

  const soumettrePromo = async (e) => {
    e.preventDefault();
    setErreur({ ...erreur, promo: "" });
    setEnvoi({ ...envoi, promo: true });
    try {
      const resultat = await demanderCodePromo(formPromo.email); // POST /api/v1/contact/code-promo/
      setCodePromo(resultat); // { code, pourcentage_reduction, date_expiration }
      setEnvoye({ ...envoye, promo: true });
    } catch (err) {
      setErreur({ ...erreur, promo: "Impossible de générer un code pour le moment." });
    } finally {
      setEnvoi({ ...envoi, promo: false });
    }
  };

  return (
    <div className="w-full min-h-screen" style={{ background: T.ink, fontFamily: "Manrope, sans-serif" }}>
      <BoutonWhatsAppFlottant />
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full" style={{ border: `1px solid ${T.line}` }} />
        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full" style={{ border: `1px solid rgba(232,184,75,0.15)` }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-5"
            style={{ background: "rgba(232,184,75,0.12)", color: T.gold }}>
            <Sparkles size={12} /> Le SaaS des salons de coiffure & d'esthétique en Afrique
          </span>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 44, lineHeight: 1.15, color: T.ivory }}>
            Gérez votre salon, du ticket au bilan, en toute simplicité
          </h1>
          <p className="mt-5 text-base max-w-xl mx-auto" style={{ color: "rgba(246,239,221,0.6)" }}>
            Tickets, employés, stocks, abonnements et statistiques — LeBarberShop
            centralise la gestion de votre salon de coiffure ou d'esthétique,
            avec paiement Orange Money, MTN Mobile Money et carte bancaire.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/inscription" className="flex items-center gap-2 px-5 py-3 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep }}>
              Créer mon salon <ArrowRight size={15} />
            </Link>
            <Link to="/salons" className="flex items-center gap-2 px-5 py-3 rounded-md text-sm font-semibold" style={{ background: "rgba(246,239,221,0.06)", color: T.ivory, border: `1px solid ${T.line}` }}>
              Trouver un salon près de chez moi
            </Link>
          </div>
        </div>
      </section>

      {/* Qui sommes-nous */}
      <Section id="qui-sommes-nous" eyebrow="Qui sommes-nous" titre="Une plateforme pensée pour les salons camerounais"
        sous_titre="LeBarberShop connecte propriétaires, employés et clients autour d'un seul outil, du premier ticket au bilan mensuel.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Users2, titre: "Pour chaque acteur", texte: "Coiffeurs, coiffeuses, caissières, esthéticiennes, gestionnaires : chacun a son espace et ses outils dédiés." },
            { icon: ShieldCheck, titre: "Sécurisé", texte: "Authentification, chiffrement et respect des normes OWASP pour protéger les données de votre salon et de vos clients." },
            { icon: TrendingUp, titre: "Basé sur la donnée", texte: "Rendement par employé, bilans journaliers, statistiques par secteur : décidez avec des chiffres, pas des impressions." },
          ].map((f) => (
            <div key={f.titre} className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
              <f.icon size={20} style={{ color: T.mint }} className="mb-3" />
              <p style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>{f.titre}</p>
              <p className="text-sm mt-2" style={{ color: "rgba(246,239,221,0.55)" }}>{f.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Nos forfaits */}
      <Section id="forfaits" eyebrow="Nos forfaits" titre="Des tarifs simples, pensés pour démarrer vite"
        sous_titre="Abonnement salon pour les gestionnaires, et accès aux statistiques de marché pour les porteurs de projet.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="rounded-lg p-6 relative overflow-hidden" style={{ background: T.inkDeep, border: `2px solid ${T.gold}` }}>
            <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "rgba(232,184,75,0.15)", color: T.gold }}>Tarif de lancement</span>
            <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: T.ivory }}>Premier abonnement salon</p>
            <p className="mt-3"><span className="font-mono text-3xl" style={{ color: T.gold }}>1 500</span> <span className="text-sm" style={{ color: "rgba(246,239,221,0.5)" }}>FCFA / mois</span></p>
            <p className="text-xs mt-1" style={{ color: "rgba(246,239,221,0.5)" }}>Minimum 3 mois, soit 4 500 FCFA</p>
            <div className="space-y-2 mt-5">
              {["Salon illimité en tickets", "Gestion employés & soins", "Bilans et rendements automatiques"].map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm" style={{ color: "rgba(246,239,221,0.75)" }}><CheckCircle2 size={14} style={{ color: T.mint }} /> {a}</div>
              ))}
            </div>
            <Link to="/inscription" className="mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold" style={{ background: T.gold, color: T.inkDeep }}>
              Démarrer <ArrowRight size={14} />
            </Link>
          </div>

          <div className="rounded-lg p-6" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
            <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: T.ivory }}>Renouvellement</p>
            <p className="mt-3"><span className="font-mono text-3xl" style={{ color: T.ivory }}>1 800</span> <span className="text-sm" style={{ color: "rgba(246,239,221,0.5)" }}>FCFA / mois</span></p>
            <p className="text-xs mt-1" style={{ color: "rgba(246,239,221,0.5)" }}>Renouvelable par période de 3 mois minimum</p>
            <div className="space-y-2 mt-5">
              {["Toutes les fonctionnalités incluses", "Paiement Orange Money, MTN MoMo, carte", "Support et mises à jour continues"].map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm" style={{ color: "rgba(246,239,221,0.75)" }}><CheckCircle2 size={14} style={{ color: T.mint }} /> {a}</div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(246,239,221,0.4)" }}>Pour les porteurs de projet</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
            <p style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Secteurs rentables</p>
            <p className="text-xs mt-1" style={{ color: "rgba(246,239,221,0.5)" }}>Où ouvrir votre prochain salon</p>
            <p className="mt-3 font-mono text-xl" style={{ color: T.mint }}>20 000 <span className="text-xs">FCFA</span></p>
            <Link to="/salons#analyse" className="mt-4 inline-flex items-center gap-1.5 text-xs" style={{ color: T.mint }}>Voir le détail <ArrowRight size={12} /></Link>
          </div>
          <div className="rounded-lg p-5" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
            <p style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ivory }}>Analyse de gestion complète</p>
            <p className="text-xs mt-1" style={{ color: "rgba(246,239,221,0.5)" }}>Standards, matériel, salaires, rendements</p>
            <p className="mt-3 font-mono text-xl" style={{ color: T.coral }}>25 000 <span className="text-xs">FCFA</span></p>
            <Link to="/salons#analyse" className="mt-4 inline-flex items-center gap-1.5 text-xs" style={{ color: T.coral }}>Voir le détail <ArrowRight size={12} /></Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-8 pt-6" style={{ borderTop: `1px dashed ${T.line}` }}>
          <span className="text-xs" style={{ color: "rgba(246,239,221,0.45)" }}>Moyens de paiement acceptés :</span>
          {[["Orange Money", Smartphone], ["MTN Mobile Money", Smartphone], ["Carte Visa / Mastercard", CardIcon]].map(([l, Icon]) => (
            <span key={l} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(246,239,221,0.05)", color: "rgba(246,239,221,0.65)" }}>
              <Icon size={12} /> {l}
            </span>
          ))}
        </div>
      </Section>

      {/* Devenir partenaire */}
      <Section id="partenaire" eyebrow="Devenir partenaire" titre="Recevez un code de sponsoring"
        sous_titre="Agents marketing ou gérants de salon : distribuez LeBarberShop autour de vous et suivez les salons rattachés à votre code.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-3">
            {[
              { icon: Gift, titre: "Un code personnel", texte: "Chaque partenaire reçoit un code de sponsoring unique, suivi par l'administration LeBarberShop." },
              { icon: Users2, titre: "Salons rattachés", texte: "Les salons qui s'inscrivent avec votre code apparaissent dans votre suivi partenaire." },
              { icon: TrendingUp, titre: "Commission", texte: "Une commission peut être associée à votre code selon les conditions convenues avec l'équipe." },
            ].map((f) => (
              <div key={f.titre} className="flex gap-3">
                <f.icon size={18} style={{ color: T.gold }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm" style={{ color: T.ivory }}>{f.titre}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(246,239,221,0.5)" }}>{f.texte}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={soumettrePartenaire} className="rounded-lg p-6 space-y-3" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
            {envoye.partenaire ? (
              <p className="text-sm flex items-center gap-2" style={{ color: T.mint }}><CheckCircle2 size={16} /> Demande envoyée — notre équipe vous recontacte sous peu.</p>
            ) : (
              <>
                {erreur.partenaire && <p className="text-xs" style={{ color: T.coral }}>{erreur.partenaire}</p>}
                <input required value={formPartenaire.nom} onChange={(e) => setFormPartenaire({ ...formPartenaire, nom: e.target.value })}
                  placeholder="Votre nom" className="w-full px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <input value={formPartenaire.structure} onChange={(e) => setFormPartenaire({ ...formPartenaire, structure: e.target.value })}
                  placeholder="Salon ou structure (optionnel)" className="w-full px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <input required value={formPartenaire.contact} onChange={(e) => setFormPartenaire({ ...formPartenaire, contact: e.target.value })}
                  placeholder="Email ou téléphone" className="w-full px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <button type="submit" disabled={envoi.partenaire} className="w-full py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2" style={{ background: T.gold, color: T.inkDeep, opacity: envoi.partenaire ? 0.6 : 1 }}>
                  {envoi.partenaire ? "Envoi…" : "Devenir partenaire"} <ArrowRight size={14} />
                </button>
              </>
            )}
          </form>
        </div>
      </Section>

      {/* Code promo */}
      <Section id="code-promo" eyebrow="Code promo" titre="Obtenir un code de réduction"
        sous_titre="Laissez votre email pour recevoir un code de réduction sur votre premier abonnement salon.">
        <div className="rounded-lg p-6 max-w-lg" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
          {envoye.promo && codePromo ? (
            <div>
              <p className="text-sm flex items-center gap-2 mb-3" style={{ color: T.mint }}><CheckCircle2 size={16} /> Voici votre code de réduction :</p>
              <div className="flex items-center justify-between px-4 py-3 rounded-md" style={{ background: "rgba(232,184,75,0.1)", border: `1px dashed ${T.gold}` }}>
                <span className="font-mono text-lg tracking-wide" style={{ color: T.gold }}>{codePromo.code}</span>
                <span className="text-xs" style={{ color: "rgba(246,239,221,0.6)" }}>-{codePromo.pourcentage_reduction}%</span>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "rgba(246,239,221,0.4)" }}>
                Valable jusqu'au {new Date(codePromo.date_expiration).toLocaleDateString("fr-FR")}, à saisir lors de votre souscription.
              </p>
            </div>
          ) : (
            <form onSubmit={soumettrePromo} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(246,239,221,0.4)" }} />
                <input required type="email" value={formPromo.email} onChange={(e) => setFormPromo({ email: e.target.value })}
                  placeholder="votre@email.com" className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
              </div>
              <button type="submit" disabled={envoi.promo} className="px-4 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 shrink-0" style={{ background: T.coral, color: T.inkDeep, opacity: envoi.promo ? 0.6 : 1 }}>
                {envoi.promo ? "Génération…" : "Recevoir mon code"} <Send size={14} />
              </button>
            </form>
          )}
          {erreur.promo && <p className="text-xs mt-2" style={{ color: T.coral }}>{erreur.promo}</p>}
          <p className="text-[11px] mt-3" style={{ color: "rgba(246,239,221,0.4)" }}>
            Un code par salon. Le code sera à saisir lors de la souscription à votre premier abonnement.
          </p>
        </div>
      </Section>

      {/* Contact */}
      <Section id="contact" eyebrow="Nous contacter" titre="Une question ? Écrivez-nous"
        sous_titre="Notre équipe répond sous 24 à 48h ouvrées.">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[
              { icon: Mail, label: "contact@lebarbershop.org" },
              { icon: Phone, label: "+237 6XX XXX XXX" },
              { icon: MapPin, label: "Yaoundé & Douala, Cameroun" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3 text-sm" style={{ color: "rgba(246,239,221,0.7)" }}>
                <c.icon size={16} style={{ color: T.mint }} /> {c.label}
              </div>
            ))}
          </div>
          <form onSubmit={soumettreContact} className="lg:col-span-3 rounded-lg p-6 space-y-3" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
            {envoye.contact ? (
              <p className="text-sm flex items-center gap-2" style={{ color: T.mint }}><CheckCircle2 size={16} /> Message envoyé, merci ! Nous revenons vers vous rapidement.</p>
            ) : (
              <>
                {erreur.contact && <p className="text-xs" style={{ color: T.coral }}>{erreur.contact}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <input required value={formContact.nom} onChange={(e) => setFormContact({ ...formContact, nom: e.target.value })}
                    placeholder="Nom" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                  <input required type="email" value={formContact.email} onChange={(e) => setFormContact({ ...formContact, email: e.target.value })}
                    placeholder="Email" className="px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                </div>
                <select value={formContact.motif} onChange={(e) => setFormContact({ ...formContact, motif: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }}>
                  <option value="information" style={{ background: T.inkDeep }}>Prise d'information</option>
                  <option value="ouverture_salon" style={{ background: T.inkDeep }}>Ouvrir un salon</option>
                  <option value="partenariat" style={{ background: T.inkDeep }}>Devenir partenaire</option>
                  <option value="autre" style={{ background: T.inkDeep }}>Autre</option>
                </select>
                <textarea required rows={4} value={formContact.message} onChange={(e) => setFormContact({ ...formContact, message: e.target.value })}
                  placeholder="Votre message" className="w-full px-3 py-2.5 rounded-md text-sm outline-none resize-none" style={{ background: "rgba(246,239,221,0.05)", color: T.ivory, border: `1px solid ${T.line}` }} />
                <button type="submit" disabled={envoi.contact} className="px-5 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2" style={{ background: T.gold, color: T.inkDeep, opacity: envoi.contact ? 0.6 : 1 }}>
                  {envoi.contact ? "Envoi…" : "Envoyer"} <Send size={14} />
                </button>
              </>
            )}
          </form>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
