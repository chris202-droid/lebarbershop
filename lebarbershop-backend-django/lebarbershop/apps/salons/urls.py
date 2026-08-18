from rest_framework.routers import DefaultRouter
from .views import (
    SalonViewSet, AbonnementViewSet, CodeReductionViewSet,
    CodeSponsoringViewSet, AbonnementAnalyseSectorielleViewSet,
)

router = DefaultRouter()
router.register("salons", SalonViewSet, basename="salon")
router.register("abonnements", AbonnementViewSet, basename="abonnement")
router.register("codes-reduction", CodeReductionViewSet, basename="code-reduction")
router.register("codes-sponsoring", CodeSponsoringViewSet, basename="code-sponsoring")
router.register("analyses-sectorielles", AbonnementAnalyseSectorielleViewSet, basename="analyse-sectorielle")

urlpatterns = router.urls
