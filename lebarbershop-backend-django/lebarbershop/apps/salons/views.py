from rest_framework import viewsets, permissions
from django.utils import timezone
from .models import Salon, Abonnement, CodeReduction, CodeSponsoring, AbonnementAnalyseSectorielle
from .serializers import (
    SalonSerializer, AbonnementSerializer, CodeReductionSerializer,
    CodeSponsoringSerializer, AbonnementAnalyseSectorielleSerializer,
)
from .permissions import EstProprietaireOuAdmin, EstAdminPrincipal


class SalonViewSet(viewsets.ModelViewSet):
    serializer_class = SalonSerializer
    permission_classes = [permissions.IsAuthenticated, EstProprietaireOuAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.est_admin_principal or user.est_admin_secondaire:
            return Salon.objects.all()
        return Salon.objects.filter(proprietaire=user)

    def perform_create(self, serializer):
        serializer.save(proprietaire=self.request.user, statut=Salon.Statut.EN_ATTENTE)


class AbonnementViewSet(viewsets.ModelViewSet):
    serializer_class = AbonnementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.est_admin_principal or user.est_admin_secondaire:
            return Abonnement.objects.all()
        return Abonnement.objects.filter(salon__proprietaire=user)

    def perform_create(self, serializer):
        salon = serializer.validated_data["salon"]
        est_premier = not salon.abonnements.exists()
        date_debut = timezone.now()
        duree = serializer.validated_data["duree_mois"]
        date_fin = date_debut + timezone.timedelta(days=30 * duree)
        abonnement = serializer.save(
            est_premier_abonnement=est_premier,
            date_debut=date_debut,
            date_fin=date_fin,
        )
        salon.statut = Salon.Statut.ACTIF
        salon.save(update_fields=["statut"])


class CodeReductionViewSet(viewsets.ModelViewSet):
    serializer_class = CodeReductionSerializer
    permission_classes = [permissions.IsAuthenticated, EstAdminPrincipal]
    queryset = CodeReduction.objects.all()

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)


class CodeSponsoringViewSet(viewsets.ModelViewSet):
    serializer_class = CodeSponsoringSerializer
    permission_classes = [permissions.IsAuthenticated, EstAdminPrincipal]
    queryset = CodeSponsoring.objects.all()

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)


class AbonnementAnalyseSectorielleViewSet(viewsets.ModelViewSet):
    """Abonnements payants (20000 / 25000) pour les utilisateurs lambda."""
    serializer_class = AbonnementAnalyseSectorielleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AbonnementAnalyseSectorielle.objects.filter(utilisateur=self.request.user)

    def perform_create(self, serializer):
        duree = timezone.timedelta(days=30)
        serializer.save(
            utilisateur=self.request.user,
            date_debut=timezone.now(),
            date_fin=timezone.now() + duree,
        )
