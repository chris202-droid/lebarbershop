from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import InscriptionView, ProfilView

urlpatterns = [
    path("inscription/", InscriptionView.as_view(), name="inscription"),
    path("connexion/", TokenObtainPairView.as_view(), name="connexion"),
    path("connexion/rafraichir/", TokenRefreshView.as_view(), name="connexion-refresh"),
    path("profil/", ProfilView.as_view(), name="profil"),
]
