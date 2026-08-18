from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Utilisateur, DroitAdministrateur


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = [
            "id", "username", "first_name", "last_name", "email", "telephone",
            "langue_preferee", "zone_geographique", "est_admin_principal",
            "est_admin_secondaire", "date_creation",
        ]
        read_only_fields = ["id", "est_admin_principal", "date_creation"]


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Utilisateur
        fields = ["username", "first_name", "last_name", "email", "telephone", "password", "langue_preferee"]

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("telephone"):
            raise serializers.ValidationError("Un email ou un numéro de téléphone est requis.")
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DroitAdministrateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = DroitAdministrateur
        fields = "__all__"
        read_only_fields = ["attribue_par", "date_attribution"]
