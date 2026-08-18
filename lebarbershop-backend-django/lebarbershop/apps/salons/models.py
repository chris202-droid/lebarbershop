import uuid
from django.db import models
from django.core.validators import MinValueValidator
from apps.accounts.models import Utilisateur


class Salon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=150)
    proprietaire = models.ForeignKey(
        Utilisateur, on_delete=models.PROTECT, related_name="salons_possedes"
    )
    nombre_employes_max = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    # Localisation
    adresse = models.CharField(max_length=255)
    ville = models.CharField(max_length=100)
    pays = models.CharField(max_length=100, default="Cameroun")
    secteur_geographique = models.CharField(
        max_length=100,
        help_text="Quartier / secteur utilisé pour les statistiques par zone."
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    telephone_contact = models.CharField(max_length=20)
    email_contact = models.EmailField(blank=True, null=True)

    class Statut(models.TextChoices):
        ACTIF = "actif", "Actif"
        SUSPENDU = "suspendu", "Suspendu"
        EN_ATTENTE = "en_attente", "En attente de paiement"

    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE)

    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

    @property
    def abonnement_actif(self):
        return self.abonnements.filter(statut=Abonnement.Statut.ACTIF).order_by("-date_fin").first()


class Abonnement(models.Model):
    """
    Abonnement mensuel du salon au SAAS.
    Premier abonnement : 1500/mois (4500 pour 3 mois). Ensuite 1800/mois. Minimum 3 mois.
    """
    PRIX_PREMIER_ABONNEMENT_MENSUEL = 1500
    PRIX_RENOUVELLEMENT_MENSUEL = 1800
    DUREE_MINIMALE_MOIS = 3

    class Statut(models.TextChoices):
        ACTIF = "actif", "Actif"
        EXPIRE = "expire", "Expiré"
        ANNULE = "annule", "Annulé"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name="abonnements")
    est_premier_abonnement = models.BooleanField(default=False)
    duree_mois = models.PositiveSmallIntegerField(validators=[MinValueValidator(DUREE_MINIMALE_MOIS)])
    prix_mensuel = models.DecimalField(max_digits=10, decimal_places=2)
    montant_total = models.DecimalField(max_digits=10, decimal_places=2)

    code_reduction = models.ForeignKey(
        "salons.CodeReduction", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="abonnements"
    )
    code_sponsoring = models.ForeignKey(
        "salons.CodeSponsoring", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="abonnements"
    )

    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.ACTIF)

    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Abonnement {self.salon.nom} ({self.date_debut:%d/%m/%Y} - {self.date_fin:%d/%m/%Y})"


class CodeReduction(models.Model):
    """Codes de réduction créés par l'administrateur principal (ou secondaire habilité)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=30, unique=True)
    pourcentage_reduction = models.DecimalField(max_digits=5, decimal_places=2)
    cree_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateTimeField(null=True, blank=True)
    actif = models.BooleanField(default=True)
    nombre_utilisations_max = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.code


class CodeSponsoring(models.Model):
    """Codes distribués à des tiers (autres gérants de salon, agents marketing)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=30, unique=True)
    beneficiaire_nom = models.CharField(max_length=150)
    beneficiaire_contact = models.CharField(max_length=100, blank=True, null=True)
    commission_pourcentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cree_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} -> {self.beneficiaire_nom}"


class AbonnementAnalyseSectorielle(models.Model):
    """
    Abonnement payant pour utilisateurs lambda :
    - 20000 : accès aux statistiques de secteurs rentables / non occupés.
    - 25000 : accès complet (standards, matériel, salaires, rendements).
    """
    class Type(models.TextChoices):
        SECTEURS_RENTABLES = "secteurs_rentables", "Analyse des secteurs rentables (20000)"
        GESTION_COMPLETE = "gestion_complete", "Analyse de gestion complète (25000)"

    PRIX = {
        Type.SECTEURS_RENTABLES: 20000,
        Type.GESTION_COMPLETE: 25000,
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name="abonnements_analyse"
    )
    type_abonnement = models.CharField(max_length=30, choices=Type.choices)
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2)
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.utilisateur} - {self.get_type_abonnement_display()}"
