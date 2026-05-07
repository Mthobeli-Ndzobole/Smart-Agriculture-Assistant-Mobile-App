from rest_framework import viewsets, permissions
from .models import CropLog
from .serializers import CropLogSerializer

class CropLogViewSet(viewsets.ModelViewSet):
    serializer_class = CropLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CropLog.objects.filter(user=self.request.user).order_by('-planting_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)