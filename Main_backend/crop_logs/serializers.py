from rest_framework import serializers
from .models import CropLog

class CropLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CropLog
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']