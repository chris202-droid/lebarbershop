from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from .models import RendementEmployeJournalier, BilanJournalierSalon
from .serializers import RendementEmployeJournalierSerializer, BilanJournalierSalonSerializer


class RendementEmployeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RendementEmployeJournalierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = RendementEmployeJournalier.objects.select_related("employe")
        employe_id = self.request.query_params.get("employe")
        if employe_id:
            qs = qs.filter(employe_id=employe_id)
        debut, fin = self.request.query_params.get("debut"), self.request.query_params.get("fin")
        if debut:
            qs = qs.filter(date__gte=parse_date(debut))
        if fin:
            qs = qs.filter(date__lte=parse_date(fin))
        return qs.order_by("date")


class BilanJournalierViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BilanJournalierSalonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = BilanJournalierSalon.objects.select_related("salon")
        salon_id = self.request.query_params.get("salon")
        if salon_id:
            qs = qs.filter(salon_id=salon_id)
        debut, fin = self.request.query_params.get("debut"), self.request.query_params.get("fin")
        if debut:
            qs = qs.filter(date__gte=parse_date(debut))
        if fin:
            qs = qs.filter(date__lte=parse_date(fin))
        return qs.order_by("date")


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def statistiques_secteur(request):
    """
    Statistiques par secteur géographique et par rentabilité (utilisé pour les
    abonnements 'analyse sectorielle' à 20000/25000 et pour l'admin principal).
    """
    from django.db.models import Sum, Count
    from apps.salons.models import Salon

    data = (
        Salon.objects.values("secteur_geographique", "ville")
        .annotate(nombre_salons=Count("id"))
        .order_by("-nombre_salons")
    )
    return Response(list(data))
