from __future__ import annotations

from datetime import date

from django.db.models import QuerySet

from .models import Task


class TaskRepository:
    @staticmethod
    def for_owner(owner) -> QuerySet[Task]:
        return Task.objects.select_related("owner").prefetch_related("tasktag_set__tag").filter(owner=owner)

    @staticmethod
    def for_owner_and_date(owner, due_date: date) -> QuerySet[Task]:
        return TaskRepository.for_owner(owner).filter(due_date=due_date)
