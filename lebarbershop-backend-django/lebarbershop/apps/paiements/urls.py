from rest_framework.routers import DefaultRouter
from .views import PaiementAbonnementViewSet

router = DefaultRouter()
router.register("paiements", PaiementAbonnementViewSet, basename="paiement")
urlpatterns = router.urls
