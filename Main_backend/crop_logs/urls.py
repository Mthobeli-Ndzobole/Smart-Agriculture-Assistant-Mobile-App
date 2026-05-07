from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CropLogViewSet

router = DefaultRouter()
router.register(r'logs', CropLogViewSet, basename='croplog')

urlpatterns = [path('', include(router.urls))]