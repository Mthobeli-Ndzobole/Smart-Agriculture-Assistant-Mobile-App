from django.contrib import admin

from .models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'severity', 'is_read', 'created_at')
    list_filter = ('category', 'severity', 'is_read')
    search_fields = ('title', 'message')
