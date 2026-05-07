from django.contrib.auth.models import User
from django.db import models


class DiseaseDetection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disease_detections')
    image = models.ImageField(upload_to='disease_images/')
    crop_name = models.CharField(max_length=120, blank=True, default='')
    disease_name = models.CharField(max_length=200)
    confidence = models.FloatField()
    recommendation = models.TextField()
    risk_level = models.CharField(max_length=20, default='medium')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        label = self.crop_name or 'Unknown crop'
        return f'{label}: {self.disease_name} ({self.confidence:.2f})'
