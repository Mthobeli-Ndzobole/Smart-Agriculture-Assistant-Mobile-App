from rest_framework import serializers

from .models import MarketPrice


class MarketPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketPrice
        fields = [
            'id',
            'commodity',
            'price',
            'unit',
            'market_location',
            'trend',
            'source',
            'notes',
            'date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
