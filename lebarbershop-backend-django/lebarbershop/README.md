# LEBARBERSHOP — Backend Django REST Framework

SaaS de gestion de salons de coiffure et d'esthétique au Cameroun.

## Installation

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Variables d'environnement (voir config/settings.py) :
# DJANGO_SECRET_KEY, DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Structure des apps

| App              | Rôle |
|-------------------|------|
| `accounts`        | Utilisateurs (admin principal/secondaire, propriétaires, employés), droits d'admin |
| `salons`           | Salons, abonnements SAAS, codes réduction/sponsoring, abonnements d'analyse sectorielle |
| `employes`         | Employés d'un salon et leurs rôles |
| `services`         | Soins/services proposés (avec prix et catégorie) |
| `clients`          | Clients et fidélité par salon |
| `tickets`          | Tickets de soins, lignes de ticket, validation/encaissement |
| `stocks`           | Produits et mouvements de stock (alertes de rupture) |
| `avis`             | Notes et commentaires clients sur les salons |
| `geolocalisation`  | Secteurs géographiques (statistiques par zone) |
| `analytics`        | Bilans journaliers, rendement des employés, statistiques sectorielles |
| `paiements`        | Paiements d'abonnement (Orange Money, MTN MoMo, carte bancaire) |

## Points clés d'implémentation

- **Abonnement SAAS** : 1500 FCFA/mois pour le 1er abonnement (min 3 mois = 4500), 1800 FCFA/mois ensuite (`apps/salons/models.py::Abonnement`). Calcul automatique dans `AbonnementSerializer.create`.
- **Workflow ticket** : un coiffeur/coiffeuse crée le ticket (`POST /api/v1/tickets/`) avec ses lignes de soins (chacune associée à l'employé qui l'exécute) ; la caissière le valide et encaisse (`POST /api/v1/tickets/{id}/valider/`), ce qui met à jour automatiquement la fidélité client et les agrégats de performance/bilan.
- **Analyse sectorielle payante** (20000 / 25000 FCFA) : `apps/salons/models.py::AbonnementAnalyseSectorielle`.
- **Sécurité** : JWT (SimpleJWT), CSRF activé, cookies HttpOnly/SameSite/Secure, X-Frame-Options DENY (clickjacking), throttling DRF, `SECURE_*` settings pour HSTS/SSL en production — voir `config/settings.py`.
- **Internationalisation** : `LANGUAGES = [fr, en]`, `langue_preferee` sur l'utilisateur ; la détection de zone géographique est à brancher côté frontend/IP pour définir la langue par défaut.

## Prochaines étapes suggérées

1. `python manage.py makemigrations && migrate` une fois PostgreSQL configuré.
2. Brancher les passerelles Orange Money / MTN MoMo / carte bancaire dans `apps/paiements/views.py::confirmer`.
3. Ajouter les tâches planifiées (Celery) pour : expiration des abonnements, alertes de rupture de stock, agrégation nocturne des bilans.
4. Déploiement : Vercel (serverless, via `vercel.json` + WSGI adapter) ou cPanel classique (voir `requirements.txt`, `gunicorn`).
