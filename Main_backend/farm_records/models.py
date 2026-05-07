from django.db import models
from django.contrib.auth.models import User

class FarmRecord(models.Model):
    RECORD_TYPES = [
        ('crop',      'Crop'),
        ('livestock', 'Livestock'),
    ]
    ACTIVITY_CHOICES = [
        ('planting',         'Planting'),
        ('fertilizing',      'Fertilizing'),
        ('pest_control',     'Pest Control'),
        ('harvest',          'Harvest'),
        ('feeding',          'Feeding'),
        ('health_treatment', 'Health Treatment'),
        ('breeding',         'Breeding / Calving'),
        ('death',            'Death Loss'),
        ('other',            'Other'),
    ]
    SEASON_CHOICES = [
        ('summer', 'Summer'),
        ('autumn', 'Autumn'),
        ('winter', 'Winter'),
        ('spring', 'Spring'),
    ]

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farm_records')
    record_type = models.CharField(max_length=10, choices=RECORD_TYPES)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_CHOICES)
    date        = models.DateField()
    season      = models.CharField(max_length=10, choices=SEASON_CHOICES, blank=True)

    # Crop specific
    crop_name      = models.CharField(max_length=100, blank=True, null=True)
    crop_variety   = models.CharField(max_length=100, blank=True, null=True)
    field_name     = models.CharField(max_length=100, blank=True, null=True)
    planting_date  = models.DateField(blank=True, null=True)
    harvest_weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Livestock specific
    animal_id        = models.CharField(max_length=50,  blank=True, null=True)
    animal_type      = models.CharField(max_length=50,  blank=True, null=True)
    animal_age       = models.IntegerField(blank=True, null=True)
    animal_sex       = models.CharField(max_length=10,  blank=True, null=True)
    weight_kg        = models.DecimalField(max_digits=7, decimal_places=2, blank=True, null=True)
    breeding_history = models.TextField(blank=True, null=True)
    health_notes     = models.TextField(blank=True, null=True)
    death_loss       = models.BooleanField(default=False)

    # Input usage (shared)
    input_used   = models.CharField(max_length=200, blank=True, null=True)
    input_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    input_unit   = models.CharField(max_length=20, blank=True, null=True)

    notes      = models.TextField(blank=True)
    synced     = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-assign season from date
        if self.date:
            month = self.date.month
            # Southern hemisphere seasons (South Africa)
            if month in [12, 1, 2]:
                self.season = 'summer'
            elif month in [3, 4, 5]:
                self.season = 'autumn'
            elif month in [6, 7, 8]:
                self.season = 'winter'
            else:
                self.season = 'spring'
        super().save(*args, **kwargs)

    def __str__(self):
        if self.record_type == 'crop':
            return f"Crop: {self.crop_name} – {self.activity_type} on {self.date}"
        return f"Livestock: {self.animal_id} – {self.activity_type} on {self.date}"