from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from django.db import transaction

from .models import Tag, Task, TaskTag
from .repositories import TaskRepository


@dataclass(slots=True)
class TaskPayload:
    title: str
    description: str
    status: str
    priority: str
    due_date: date
    tags: list[str]


class TaskService:
    @staticmethod
    def list_tasks(owner, due_date: date | None = None):
        if due_date is None:
            return TaskRepository.for_owner(owner)
        return TaskRepository.for_owner_and_date(owner, due_date)

    @staticmethod
    @transaction.atomic
    def create_task(owner, payload: TaskPayload) -> Task:
        task = Task.objects.create(
            owner=owner,
            title=payload.title,
            description=payload.description,
            status=payload.status,
            priority=payload.priority,
            due_date=payload.due_date,
        )
        for tag_name in payload.tags:
            tag, _ = Tag.objects.get_or_create(owner=owner, name=tag_name)
            TaskTag.objects.create(task=task, tag=tag)
        return task

    @staticmethod
    @transaction.atomic
    def update_task(task: Task, payload: TaskPayload) -> Task:
        task.title = payload.title
        task.description = payload.description
        task.status = payload.status
        task.priority = payload.priority
        task.due_date = payload.due_date
        task.version += 1
        task.save()
        task.tasktag_set.all().delete()
        for tag_name in payload.tags:
            tag, _ = Tag.objects.get_or_create(owner=task.owner, name=tag_name)
            TaskTag.objects.create(task=task, tag=tag)
        return task
