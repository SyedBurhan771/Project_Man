from django.contrib import admin
from .models import Milestone, Deadline

@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'due_date', 'status')
    list_filter = ('status', 'project')
    search_fields = ('name', 'project')


@admin.register(Deadline)
class DeadlineAdmin(admin.ModelAdmin):
    list_display = ('task', 'project', 'assignee', 'due_date', 'status')
    list_filter = ('status', 'project')
    search_fields = ('task', 'assignee', 'project')