from rest_framework import serializers
from .models import Ticket, LigneTicket


class LigneTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneTicket
        fields = ["id", "soin", "employe_executant", "prix"]
        read_only_fields = ["id", "prix"]


class TicketSerializer(serializers.ModelSerializer):
    lignes = LigneTicketSerializer(many=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "salon", "client", "nom_client_temporaire", "employe_createur",
            "caissiere_validatrice", "statut", "mode_paiement", "reduction_pourcentage",
            "montant_brut", "montant_net", "date_creation", "date_validation", "lignes",
        ]
        read_only_fields = [
            "id", "montant_brut", "montant_net", "date_creation", "date_validation",
            "caissiere_validatrice", "statut",
        ]

    def validate(self, attrs):
        if not attrs.get("client") and not attrs.get("nom_client_temporaire"):
            raise serializers.ValidationError(
                "Renseignez un client existant ou un nom de client temporaire."
            )
        if not attrs.get("lignes"):
            raise serializers.ValidationError("Le ticket doit contenir au moins un soin.")
        return attrs

    def create(self, validated_data):
        lignes_data = validated_data.pop("lignes")
        ticket = Ticket.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneTicket.objects.create(
                ticket=ticket, prix=ligne_data["soin"].prix, **ligne_data
            )
        ticket.recalculer_montants()
        ticket.save()
        return ticket


class TicketValidationSerializer(serializers.Serializer):
    """Utilisé par la caissière pour valider/encaisser un ticket."""
    mode_paiement = serializers.ChoiceField(choices=Ticket.ModePaiement.choices)
