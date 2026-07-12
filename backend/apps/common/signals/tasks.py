from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.common.models.records import AuditLog
from apps.tasks.models import Task


@receiver(post_save, sender=Task)
def log_task_change(sender, instance: Task, created: bool, **kwargs):
    action = "created" if created else "updated"
    AuditLog.objects.create(owner=instance.owner, entity_type="task", entity_id=instance.id, action=action)
