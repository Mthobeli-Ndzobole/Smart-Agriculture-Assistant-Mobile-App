from django.contrib import admin

from .models import DiseaseDetection


@admin.register(DiseaseDetection)
class DiseaseDetectionAdmin(admin.ModelAdmin):
    list_display = ('crop_name', 'disease_name', 'confidence', 'risk_level', 'created_at')
    list_filter = ('risk_level', 'created_at')
    search_fields = ('crop_name', 'disease_name', 'notes')
