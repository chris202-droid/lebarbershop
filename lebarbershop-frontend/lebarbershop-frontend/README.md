# LEBARBERSHOP — Frontend (Vite + React + React Router)

Interface utilisateur branchée sur le backend Django REST Framework. Couvre les
6 écrans : Connexion/Inscription, Tableau de bord salon, Caisse, Administration
principale, Page publique (recherche + analyse sectorielle payante), Onboarding
propriétaire.

## 1. Installation

```bash
npm install
cp .env.example .env.local
# éditer .env.local : VITE_API_BASE_URL=http://localhost:8000/api/v1
npm run dev        # http://localhost:5173
```

Le backend Django doit tourner en parallèle (`python manage.py runserver`) et
autoriser l'origine du frontend dans `CORS_ALLOWED_ORIGINS` (voir
`config/settings.py` du backend — déjà configuré pour `http://localhost:3000`,
ajouter `http://localhost:5173` en développement).

## 2. Comment le frontend est branché à DRF

### 2.1 Client HTTP central — `src/lib/apiClient.js`

Toutes les requêtes passent par `apiFetch()` :

- Préfixe automatiquement chaque appel avec `VITE_API_BASE_URL`
  (ex. `apiFetch("/salons/")` → `GET {VITE_API_BASE_URL}/salons/`).
- Ajoute `Authorization: Bearer <access_token>` si `auth: true` (par défaut).
- Si la réponse est `401` (token expiré), appelle automatiquement
  `POST /auth/connexion/rafraichir/` avec le refresh token stocké, puis
  rejoue la requête originale une seule fois. En cas d'échec, l'utilisateur
  est redirigé vers `/connexion`.
- Les tokens JWT (`access` / `refresh`, émis par SimpleJWT côté Django) sont
  conservés dans `localStorage` (clés `lbs_access` / `lbs_refresh`).

### 2.2 Modules API — `src/api/*.js`

Chaque fichier correspond à une app Django et à son routeur DRF, avec un
mapping direct fonction ↔ endpoint. Exemple (`src/api/tickets.js`) :

| Fonction JS               | Endpoint DRF                              | Vue Django                              |
|----------------------------|--------------------------------------------|------------------------------------------|
| `listerTickets(salonId)`   | `GET /tickets/?salon=`                     | `apps/tickets/views.py::TicketViewSet`   |
| `creerTicket(payload)`     | `POST /tickets/`                           | idem (création avec lignes imbriquées)   |
| `validerTicket(id, mode)`  | `POST /tickets/{id}/valider/`              | action `@action` `valider`               |

Ce même principe (1 fichier = 1 app backend, 1 fonction = 1 endpoint) est
répété pour `auth`, `salons`, `employes`, `services`, `clients`, `stocks`,
`avis`, `geolocalisation`, `analytics`, `paiements` — voir les commentaires
en tête de chaque fichier dans `src/api/` pour la vue Django exacte appelée.

### 2.3 Authentification — `src/context/AuthContext.jsx`

Au chargement de l'app, si un `access_token` existe, `AuthProvider` appelle
`GET /auth/profil/` pour récupérer l'utilisateur courant et le rendre
disponible via `useAuth()` dans toute l'application (nom, rôle
`est_admin_principal` / `est_admin_secondaire`, etc.).

### 2.4 Routes protégées — `src/components/ProtectedRoute.jsx`

- Sans utilisateur connecté → redirection vers `/connexion`.
- `<ProtectedRoute role="admin">` → réservé aux comptes avec
  `est_admin_principal` ou `est_admin_secondaire` à `true` (utilisé pour
  `/admin`).

### 2.5 Pages ↔ endpoints (résumé)

| Page                          | Route front         | Principaux appels API                                                        |
|--------------------------------|-----------------------|--------------------------------------------------------------------------------|
| `pages/Accueil.jsx`            | `/`                   | Aucun (page vitrine statique — voir §2.7)                                     |
| `pages/Connexion.jsx`          | `/connexion`          | `POST /auth/connexion/`                                                       |
| `pages/Inscription.jsx`        | `/inscription`        | `POST /auth/inscription/`                                                     |
| `pages/Onboarding.jsx`         | `/onboarding`         | `POST /salons/`, `POST /employes/`, `POST /soins/`, `POST /abonnements/`, `POST /paiements/` |
| `pages/DashboardSalon.jsx`     | `/tableau-de-bord`    | `GET /salons/`, `GET /tickets/`, `GET /produits/`, `GET /bilans-journaliers/`, `POST /tickets/{id}/valider/` |
| `pages/Caisse.jsx`             | `/caisse`             | `GET /tickets/?statut=en_attente`, `POST /tickets/{id}/valider/`             |
| `pages/Admin.jsx`              | `/admin`              | `GET /salons/`, `GET/POST /codes-reduction/`, `GET/POST /codes-sponsoring/`, `GET /statistiques-secteurs/` |
| `pages/Public.jsx`             | `/salons`             | `GET /salons/`, `POST /analyses-sectorielles/`, `GET /statistiques-secteurs/` |

> Le tableau de bord salon a été déplacé de `/` vers `/tableau-de-bord` pour
> laisser la racine `/` à la page d'accueil publique.

### 2.6bis Navigation partagée — `components/SiteHeader.jsx`, `SiteFooter.jsx`, `BoutonWhatsAppFlottant.jsx`

Trois composants transverses, montés sur **toutes** les pages (publiques et
applicatives) :

- **`SiteHeader`** — logo cliquable vers `/`, liens de navigation (routes et
  ancres de la landing), mis en valeur (couleur or + gras) selon la route ou
  l'ancre courante via `useLocation()`. Depuis n'importe quelle page, cliquer
  sur un lien d'ancre (ex. « Nos forfaits ») navigue vers `/#forfaits` ; la
  page `Accueil.jsx` défile ensuite automatiquement jusqu'à la section grâce
  à un `useEffect` sur `location.hash`. Utilisé sur `Accueil`, `Connexion`,
  `Inscription`, `Public`.
- **`SiteFooter`** — présent sur **toutes** les pages, y compris les écrans
  applicatifs (`DashboardSalon`, `Caisse`, `Admin`, `Onboarding`) en variante
  `compact` (padding réduit, ligne d'accroche masquée) pour ne pas alourdir
  des interfaces déjà denses. Contient les liens Accueil, Nos forfaits,
  Devenir partenaire, Code promo, **Nous contacter**, Trouver un salon, ainsi
  que la signature « Powered by KALARAI ».
- **`BoutonWhatsAppFlottant`** — bouton flottant bas-droite, présent sur
  toutes les pages, lien direct vers `wa.me/237671729822`.

Sur les écrans applicatifs à sidebar (`DashboardSalon`, `Caisse`, `Admin`,
`Onboarding`), le logo/bloc de marque en haut de la sidebar est désormais un
`<Link to="/">` : possibilité de revenir à l'accueil à tout moment, en plus
du `SiteFooter` en bas de page. La structure de ces pages est passée de
`flex h-screen` (sidebar + contenu, sans défilement de page) à
`flex flex-col` avec un bloc interne `flex-1 flex min-h-0` pour la sidebar et
le contenu défilant, suivi du `SiteFooter` — la zone de contenu principale
garde son propre `overflow-auto` interne, seul le pied de page ajoute un
niveau de défilement de page supplémentaire.

### 2.7 Page d'accueil — `pages/Accueil.jsx`

Landing page publique (inspirée de la structure d'un site comme campay.net :
en-tête sticky, hero, sections ancrées, footer) avec les rubriques demandées
dans le cahier des charges :

- **Qui sommes-nous** — présentation de la plateforme.
- **Nos forfaits** — reprend exactement les tarifs définis côté backend :
  1500 FCFA/mois (1er abonnement, 4500 FCFA sur 3 mois), 1800 FCFA/mois au
  renouvellement, et les deux abonnements d'analyse sectorielle (20 000 et
  25 000 FCFA) avec renvoi vers `/salons#analyse` pour souscrire réellement.
- **Devenir partenaire** — formulaire branché sur `POST /api/v1/contact/partenariats/`.
- **Obtenir un code promo** — formulaire branché sur `POST /api/v1/contact/code-promo/` ;
  le code généré (10 %, valable 30 jours, usage unique) est affiché
  immédiatement dans l'interface, aucun envoi d'email n'étant configuré côté
  backend à ce stade.
- **Nous contacter** — formulaire branché sur `POST /api/v1/contact/demandes/`.

Ces trois formulaires utilisent `src/api/contact.js` (endpoints publics,
`auth: false`, throttlés côté Django contre le spam). Les demandes de
partenariat et de contact atterrissent dans le Django admin
(`DemandeContact`, `DemandePartenariat`) pour traitement manuel ; convertir
une demande de partenariat en `CodeSponsoring` reste une action manuelle de
l'administrateur pour l'instant.

### 2.6 Ce qui reste à brancher pour la production

- **Paiement réel** : `initierPaiement()` (côté front) appelle
  `POST /paiements/` puis attend la confirmation. Il faut brancher les SDK
  Orange Money / MTN MoMo / carte bancaire côté backend
  (`apps/paiements/views.py::confirmer`) et faire pointer leur webhook
  vers cette action.
- **Recherche publique de salons par secteur** : `SalonViewSet` filtre
  actuellement par propriétaire connecté ; pour un catalogue 100% public
  (page `/salons` sans connexion), prévoir un endpoint dédié en lecture
  seule côté Django (`permission_classes = [AllowAny]`).
- **Sélection du salon actif** : `DashboardSalon.jsx` et `Caisse.jsx`
  prennent actuellement le premier salon retourné par
  `GET /salons/` ; pour un propriétaire multi-salons, ajouter un
  sélecteur de salon (stocker l'ID choisi en state/contexte).

## 3. Déploiement sur Vercel (frontend)

Le frontend (Vite/React) se déploie nativement sur Vercel comme site
statique. Le backend Django **n'est pas déployé sur Vercel** dans cette
configuration (voir §4) — il doit tourner ailleurs et être accessible en
HTTPS.

### 3.1 Via l'interface Vercel

1. Poussez ce dossier `lebarbershop-frontend/` dans un dépôt Git
   (GitHub/GitLab/Bitbucket).
2. Sur [vercel.com](https://vercel.com) → **New Project** → importez le dépôt.
3. Vercel détecte Vite automatiquement :
   - Build Command : `npm run build` (déjà défini dans `vercel.json`)
   - Output Directory : `dist`
4. Dans **Settings → Environment Variables**, ajoutez :
   - `VITE_API_BASE_URL` = URL HTTPS de votre backend en production
     (ex. `https://api.lebarbershop.org/api/v1`)
5. Cliquez **Deploy**.

### 3.2 Via la CLI Vercel

```bash
npm install -g vercel
cd lebarbershop-frontend
vercel login
vercel            # déploiement de preview
vercel --prod     # déploiement en production
```

La CLI demande l'org/projet Vercel puis lit automatiquement `vercel.json`
(déjà présent dans ce dossier, avec `outputDirectory: "dist"` et une règle
de réécriture pour que les routes React Router comme `/admin` ou `/caisse`
fonctionnent au rafraîchissement de page).

### 3.3 Domaine et CORS

Une fois le domaine Vercel connu (ex. `lebarbershop.vercel.app` ou un
domaine personnalisé), ajoutez-le dans `CORS_ALLOWED_ORIGINS` côté Django
(`config/settings.py` du backend) pour que l'API accepte les requêtes du
front déployé.

## 4. Où déployer le backend Django (nécessaire avant le frontend)

Vercel n'exécute pas nativement une application Django avec base de données
persistante (fonctions serverless sans état). Options pratiques :

- **Railway / Render / Fly.io** : déploiement simple d'une app Django +
  PostgreSQL managé, HTTPS automatique — recommandé pour démarrer vite.
- **cPanel** (mentionné dans le cahier des charges) : hébergement mutualisé
  classique via `passenger_wsgi.py` ou `gunicorn` derrière Apache/Nginx.
- **Vercel (serverless Python)** : possible techniquement via l'adaptateur
  WSGI de Vercel (`@vercel/python`), mais peu adapté à Django (pas de
  connexions DB persistantes entre invocations, migrations à gérer à part) —
  à réserver à des cas particuliers plutôt qu'à un déploiement standard.

Dans tous les cas : configurez `DJANGO_ALLOWED_HOSTS`, une base PostgreSQL
managée, et `CORS_ALLOWED_ORIGINS` avec l'URL Vercel du frontend.
