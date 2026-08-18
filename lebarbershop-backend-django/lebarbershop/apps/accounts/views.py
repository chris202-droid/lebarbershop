from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Utilisateur
from .serializers import UtilisateurSerializer, InscriptionSerializer


class InscriptionView(generics.CreateAPIView):
    """Inscription publique (propriétaire de salon ou utilisateur lambda)."""
    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "utilisateur": UtilisateurSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


class ProfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
