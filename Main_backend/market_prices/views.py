from datetime import date, timedelta

from django.db.models import Avg
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import MarketPrice
from .serializers import MarketPriceSerializer


class MarketPriceViewSet(viewsets.ModelViewSet):
    serializer_class = MarketPriceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MarketPrice.objects.filter(user=self.request.user).order_by('-date', '-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        queryset = self.get_queryset()
        week_ago = date.today() - timedelta(days=7)
        recent = queryset.filter(date__gte=week_ago)

        by_crop = {}
        for item in recent:
            key = item.commodity.lower().strip()
            if key not in by_crop:
                by_crop[key] = {
                    'commodity': item.commodity,
                    'latest_price': float(item.price),
                    'latest_unit': item.unit,
                    'avg_price': float(item.price),
                    'entries': 1,
                }
            else:
                prev_entries = by_crop[key]['entries']
                by_crop[key]['avg_price'] = (
                    by_crop[key]['avg_price'] * prev_entries + float(item.price)
                ) / (prev_entries + 1)
                by_crop[key]['entries'] = prev_entries + 1

        top_markets = (
            recent.values('market_location')
            .annotate(avg_price=Avg('price'))
            .order_by('-avg_price')[:5]
        )

        return Response(
            {
                'records_count': queryset.count(),
                'recent_records_count': recent.count(),
                'by_crop': list(by_crop.values()),
                'top_markets': [
                    {
                        'market_location': row['market_location'],
                        'avg_price': float(row['avg_price']) if row['avg_price'] else 0,
                    }
                    for row in top_markets
                ],
            }
        )
