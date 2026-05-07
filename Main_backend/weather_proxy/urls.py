from django.urls import path
from . import views

urlpatterns = [
    path('geo/', views.geocode, name='geocode'),
    path('current/', views.current_weather, name='current_weather'),
    path('forecast/', views.forecast, name='forecast'),
    path('alerts/', views.alerts, name='alerts'),
    path('reverse-geo/', views.reverse_geocode, name='reverse_geocode'),
]