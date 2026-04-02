from django.conf import settings
from django.db import models


class SoapProjectTransaction(models.Model):
    OPERATION_CREATE = 'create'
    OPERATION_MODIFY = 'modify'
    OPERATION_CHOICES = [
        (OPERATION_CREATE, 'Create'),
        (OPERATION_MODIFY, 'Modify'),
    ]

    operation = models.CharField(max_length=20, choices=OPERATION_CHOICES, default=OPERATION_CREATE)
    request_payload = models.JSONField(default=dict)
    response_xml = models.TextField(blank=True)
    parsed_response = models.JSONField(default=dict)

    success = models.BooleanField(default=False)
    project_id = models.CharField(max_length=64, blank=True)
    soap_status = models.CharField(max_length=16, blank=True)
    error_message = models.TextField(blank=True)

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='soap_project_transactions',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = 'OK' if self.success else 'ERR'
        return f'SOAP {self.operation.upper()} Txn {self.id} [{status}] {self.project_id or "-"}'
