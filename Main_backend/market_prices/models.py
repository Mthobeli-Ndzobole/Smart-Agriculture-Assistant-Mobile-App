from django.contrib.auth.models import User
from django.db import models


class MarketPrice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='market_prices')
    commodity = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='kg')
    market_location = models.CharField(max_length=100)
    trend = models.CharField(max_length=10, default='stable')
    source = models.CharField(max_length=120, blank=True, default='Farmer Input')
    notes = models.TextField(blank=True, default='')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        unique_together = ('user', 'commodity', 'market_location', 'date')

    def __str__(self):
        return f'{self.commodity} {self.price}/{self.unit} ({self.market_location})'
