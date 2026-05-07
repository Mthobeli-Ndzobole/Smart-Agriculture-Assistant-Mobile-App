from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Alert
from .serializers import AlertSerializer


class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()
        unread_count = queryset.filter(is_read=False).count()
        by_severity = {
            severity: queryset.filter(severity=severity).count()
            for severity in ['low', 'medium', 'high', 'critical']
        }
        return Response({'total': queryset.count(), 'unread': unread_count, 'by_severity': by_severity})
