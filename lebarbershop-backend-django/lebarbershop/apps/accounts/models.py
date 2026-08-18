import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class Utilisateur(AbstractUser):
    """
    Utilisateur global du SAAS.
    Peut être : administrateur principal, administrateur secondaire,
    propriétaire de salon, employé (via le modèle Employe dans l'app employes),
    ou simple client/utilisateur lambda (analyses sectorielles payantes).
    """

    class Langue(models.TextChoices):
        FRANCAIS = "fr", "Français"
        ANGLAIS = "en", "English"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    telephone_validator = RegexValidator(
        regex=r"^\+?[0-9]{8,15}$", message="Numéro de téléphone invalide."
    )
    telephone = models.CharField(
        max_length=20, validators=[telephone_validator], blank=True, null=True, unique=True
    )
    email = models.EmailField(unique=True, blank=True, null=True)

    langue_preferee = models.CharField(
        max_length=2, choices=Langue.choices, default=Langue.FRANCAIS
    )
    zone_geographique = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Détectée automatiquement (pays/région) pour adapter la langue par défaut."
    )

    est_admin_principal = models.BooleanField(default=False)
    est_admin_secondaire = models.BooleanField(default=False)

    date_creation = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "username"

    def __str__(self):
        return self.get_full_name() or self.username


class DroitAdministrateur(models.Model):
    """
    Droits attribués par l'administrateur principal à un administrateur secondaire.
    Modèle de droits granulaire (checkbox) plutôt qu'un rôle figé.
    """
    administrateur = models.OneToOneField(
        Utilisateur, on_delete=models.CASCADE, related_name="droits"
    )
    peut_modifier_salon = models.BooleanField(default=False)
    peut_ajouter_administrateur = models.BooleanField(default=False)
    peut_creer_codes_reduction = models.BooleanField(default=False)
    peut_creer_codes_sponsoring = models.BooleanField(default=False)
    peut_voir_abonnements = models.BooleanField(default=False)
    peut_consulter_rendement_employes = models.BooleanField(default=False)
    peut_consulter_depenses = models.BooleanField(default=False)
    attribue_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True,
        related_name="droits_attribues"
    )
    date_attribution = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Droits de {self.administrateur}"
