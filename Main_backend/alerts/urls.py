from rest_framework.routers import DefaultRouter

from .views import AlertViewSet

router = DefaultRouter()
router.register(r'items', AlertViewSet, basename='alerts')

urlpatterns = router.urls
