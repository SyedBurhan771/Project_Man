from django.contrib import admin

from .models import SoapProjectTransaction


@admin.register(SoapProjectTransaction)
class SoapProjectTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'success', 'project_id', 'soap_status', 'created_at')
    list_filter = ('success', 'soap_status', 'created_at')
    search_fields = ('project_id', 'error_message')
    readonly_fields = ('created_at', 'updated_at')
