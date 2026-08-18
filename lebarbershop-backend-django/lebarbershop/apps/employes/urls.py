from rest_framework.routers import DefaultRouter
from .views import EmployeViewSet

router = DefaultRouter()
router.register("employes", EmployeViewSet, basename="employe")
urlpatterns = router.urls
