from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'due_date', 'duration_days', 'team_size', 'progress')
    search_fields = ('name', 'description')