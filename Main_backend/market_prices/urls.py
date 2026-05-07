from rest_framework.routers import DefaultRouter

from .views import MarketPriceViewSet

router = DefaultRouter()
router.register(r'entries', MarketPriceViewSet, basename='market-prices')

urlpatterns = router.urls
