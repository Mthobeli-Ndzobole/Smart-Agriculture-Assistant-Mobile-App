from django.contrib.auth.models import User
from django.db import models


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    CATEGORY_CHOICES = [
        ('weather', 'Weather'),
        ('crop', 'Crop'),
        ('livestock', 'Livestock'),
        ('market', 'Market'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts')
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='system')
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=300, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['is_read', '-created_at']

    def __str__(self):
        return f'[{self.severity}] {self.title}'
