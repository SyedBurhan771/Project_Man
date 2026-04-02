from django.contrib import admin
from .models import Resource

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'department', 'availability', 'rating')
    list_filter = ('department', 'availability')
    search_fields = ('name', 'email')