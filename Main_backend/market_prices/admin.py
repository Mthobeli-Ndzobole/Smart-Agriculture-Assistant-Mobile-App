from django.contrib import admin

from .models import MarketPrice


@admin.register(MarketPrice)
class MarketPriceAdmin(admin.ModelAdmin):
    list_display = ('commodity', 'price', 'unit', 'market_location', 'trend', 'date')
    list_filter = ('trend', 'date', 'market_location')
    search_fields = ('commodity', 'market_location', 'source')

# Register your models here.
