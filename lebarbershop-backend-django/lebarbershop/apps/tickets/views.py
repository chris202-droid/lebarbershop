from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket
from .serializers import TicketSerializer, TicketValidationSerializer
from apps.employes.models import Employe
from apps.clients.models import FideliteClientSalon
from apps.analytics.models import RendementEmployeJournalier, BilanJournalierSalon


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Ticket.objects.select_related("salon", "client", "employe_createur").prefetch_related("lignes")
        salon_id = self.request.query_params.get("salon")
        if salon_id:
            qs = qs.filter(salon_id=salon_id)
        return qs

    @action(detail=True, methods=["post"], url_path="valider")
    def valider(self, request, pk=None):
        """
        La caissière encaisse et valide le ticket : statut -> validé,
        mise à jour de la fidélité client et des agrégats de performance.
        """
        ticket = self.get_object()
        if ticket.statut != Ticket.Statut.EN_ATTENTE:
            return Response({"detail": "Ce ticket a déjà été traité."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TicketValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            caissiere = Employe.objects.get(utilisateur=request.user, salon=ticket.salon, role=Employe.Role.CAISSIERE)
        except Employe.DoesNotExist:
            return Response({"detail": "Seule une caissière du salon peut valider ce ticket."},
                             status=status.HTTP_403_FORBIDDEN)

        ticket.statut = Ticket.Statut.VALIDE
        ticket.mode_paiement = serializer.validated_data["mode_paiement"]
        ticket.caissiere_validatrice = caissiere
        ticket.date_validation = timezone.now()
        ticket.save()

        if ticket.client:
            fidelite, _ = FideliteClientSalon.objects.get_or_create(client=ticket.client, salon=ticket.salon)
            fidelite.nombre_visites += 1
            fidelite.derniere_visite = ticket.date_validation
            fidelite.save()

        aujourd_hui = ticket.date_validation.date()
        for ligne in ticket.lignes.all():
            rendement, _ = RendementEmployeJournalier.objects.get_or_create(
                employe=ligne.employe_executant, date=aujourd_hui
            )
            rendement.nombre_soins += 1
            rendement.montant_total += ligne.prix
            rendement.save()

        bilan, _ = BilanJournalierSalon.objects.get_or_create(salon=ticket.salon, date=aujourd_hui)
        bilan.entrees_total += ticket.montant_net
        champ_categorie = {
            "coiffure_homme": "entrees_coiffure_homme",
            "coiffure_femme": "entrees_coiffure_femme",
            "esthetique": "entrees_esthetique",
            "pedicure": "entrees_pedicure",
            "manucure": "entrees_manucure",
        }
        for ligne in ticket.lignes.all():
            champ = champ_categorie.get(ligne.soin.categorie, "entrees_autre")
            setattr(bilan, champ, getattr(bilan, champ) + ligne.prix)
        bilan.save()

        return Response(TicketSerializer(ticket).data)
