from rest_framework import viewsets, permissions
from .models import Employe
from .serializers import EmployeSerializer


class EmployeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Employe.objects.select_related("utilisateur", "salon")
        if user.est_admin_principal or user.est_admin_secondaire:
            return qs
        # Le propriétaire voit les employés de ses salons ; l'employé se voit lui-même.
        return qs.filter(salon__proprietaire=user) | qs.filter(utilisateur=user)
