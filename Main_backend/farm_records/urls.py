from rest_framework.routers import DefaultRouter
from .views import FarmRecordViewSet

router = DefaultRouter()
router.register(r'records', FarmRecordViewSet, basename='farmrecords')
urlpatterns = router.urls