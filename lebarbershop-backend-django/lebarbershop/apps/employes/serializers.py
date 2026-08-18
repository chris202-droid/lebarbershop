from rest_framework import serializers
from .models import Employe


class EmployeSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Employe
        fields = [
            "id", "utilisateur", "nom_complet", "salon", "role",
            "role_autre_precision", "actif", "date_embauche",
        ]
        read_only_fields = ["id", "date_embauche"]

    def get_nom_complet(self, obj):
        return obj.utilisateur.get_full_name() or obj.utilisateur.username

    def validate(self, attrs):
        salon = attrs.get("salon") or getattr(self.instance, "salon", None)
        if salon and salon.employes.filter(actif=True).exclude(pk=getattr(self.instance, "pk", None)).count() >= salon.nombre_employes_max:
            raise serializers.ValidationError("Le nombre maximal d'employés pour ce salon est atteint.")
        return attrs
