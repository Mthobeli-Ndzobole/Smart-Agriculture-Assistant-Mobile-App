from collections import defaultdict
from decimal import Decimal

from django.db.models import Sum
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import FarmRecord
from .serializers import FarmRecordSerializer


class FarmRecordViewSet(viewsets.ModelViewSet):
    serializer_class = FarmRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FarmRecord.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, synced=True)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        user = request.user
        crop_records = FarmRecord.objects.filter(user=user, record_type='crop')
        livestock_records = FarmRecord.objects.filter(user=user, record_type='livestock')

        total_harvest_kg = crop_records.filter(activity_type='harvest').aggregate(total=Sum('harvest_weight'))[
            'total'
        ] or Decimal('0')
        total_input_used = crop_records.aggregate(total=Sum('input_amount'))['total'] or Decimal('0')
        livestock_born = livestock_records.filter(activity_type='breeding').count()
        total_deaths = livestock_records.filter(activity_type='death').count()

        yearly_summary = defaultdict(lambda: {'harvest_kg': 0.0, 'input_kg': 0.0, 'crop_activities': 0})
        for record in crop_records:
            year_key = str(record.date.year)
            if record.activity_type == 'harvest' and record.harvest_weight:
                yearly_summary[year_key]['harvest_kg'] += float(record.harvest_weight)
            if record.input_amount:
                yearly_summary[year_key]['input_kg'] += float(record.input_amount)
            yearly_summary[year_key]['crop_activities'] += 1

        return Response(
            {
                'total_harvest_kg': float(total_harvest_kg),
                'total_input_used': float(total_input_used),
                'livestock_born': livestock_born,
                'total_deaths': total_deaths,
                'yearly_summary': yearly_summary,
            }
        )
