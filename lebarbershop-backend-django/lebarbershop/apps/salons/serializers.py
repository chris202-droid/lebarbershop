from rest_framework import serializers
from .models import Salon, Abonnement, CodeReduction, CodeSponsoring, AbonnementAnalyseSectorielle


class SalonSerializer(serializers.ModelSerializer):
    abonnement_actif_id = serializers.SerializerMethodField()

    class Meta:
        model = Salon
        fields = [
            "id", "nom", "proprietaire", "nombre_employes_max", "adresse", "ville",
            "pays", "secteur_geographique", "latitude", "longitude",
            "telephone_contact", "email_contact", "statut", "date_creation",
            "abonnement_actif_id",
        ]
        read_only_fields = ["id", "statut", "date_creation", "proprietaire"]

    def get_abonnement_actif_id(self, obj):
        actif = obj.abonnement_actif
        return actif.id if actif else None


class AbonnementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Abonnement
        fields = "__all__"
        read_only_fields = ["id", "montant_total", "date_creation"]

    def validate_duree_mois(self, value):
        if value < Abonnement.DUREE_MINIMALE_MOIS:
            raise serializers.ValidationError(
                f"La durée minimale d'abonnement est de {Abonnement.DUREE_MINIMALE_MOIS} mois."
            )
        return value

    def create(self, validated_data):
        est_premier = validated_data.get("est_premier_abonnement", False)
        prix_mensuel = (
            Abonnement.PRIX_PREMIER_ABONNEMENT_MENSUEL if est_premier
            else Abonnement.PRIX_RENOUVELLEMENT_MENSUEL
        )
        validated_data["prix_mensuel"] = prix_mensuel
        validated_data["montant_total"] = prix_mensuel * validated_data["duree_mois"]
        return super().create(validated_data)


class CodeReductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeReduction
        fields = "__all__"
        read_only_fields = ["id", "cree_par", "date_creation"]


class CodeSponsoringSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeSponsoring
        fields = "__all__"
        read_only_fields = ["id", "cree_par", "date_creation"]


class AbonnementAnalyseSectorielleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbonnementAnalyseSectorielle
        fields = "__all__"
        read_only_fields = ["id", "utilisateur", "montant_paye"]

    def create(self, validated_data):
        type_abo = validated_data["type_abonnement"]
        validated_data["montant_paye"] = AbonnementAnalyseSectorielle.PRIX[type_abo]
        return super().create(validated_data)
