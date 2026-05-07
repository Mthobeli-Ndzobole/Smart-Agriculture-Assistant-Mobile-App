from rest_framework import serializers
from .models import FarmRecord

class FarmRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FarmRecord
        fields = [
            'id', 'record_type', 'activity_type', 'date', 'season',
            # crop
            'crop_name', 'crop_variety', 'field_name',
            'planting_date', 'harvest_weight',
            # livestock
            'animal_id', 'animal_type', 'animal_age', 'animal_sex',
            'weight_kg', 'breeding_history', 'health_notes', 'death_loss',
            # shared
            'input_used', 'input_amount', 'input_unit',
            'notes', 'synced', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'season']