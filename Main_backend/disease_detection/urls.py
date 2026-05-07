from rest_framework.routers import DefaultRouter

from .views import DiseaseDetectionViewSet

router = DefaultRouter()
router.register(r'scans', DiseaseDetectionViewSet, basename='disease-detection')

urlpatterns = router.urls
