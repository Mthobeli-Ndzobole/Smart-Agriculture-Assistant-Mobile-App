from rest_framework import serializers

from .models import DiseaseDetection


class DiseaseDetectionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = DiseaseDetection
        fields = [
            'id',
            'crop_name',
            'image',
            'image_url',
            'disease_name',
            'confidence',
            'recommendation',
            'risk_level',
            'notes',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'image_url',
            'disease_name',
            'confidence',
            'recommendation',
            'risk_level',
            'created_at',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return ''
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url
