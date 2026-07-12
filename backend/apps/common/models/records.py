from __future__ import annotations

from django.conf import settings
from django.db import models


class IdempotencyRecord(models.Model):
    key = models.CharField(max_length=128, db_index=True)
    request_hash = models.CharField(max_length=64)
    response_body = models.JSONField()
    status_code = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="audit_logs", db_index=True)
    entity_type = models.CharField(max_length=64)
    entity_id = models.PositiveIntegerField()
    action = models.CharField(max_length=64)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
