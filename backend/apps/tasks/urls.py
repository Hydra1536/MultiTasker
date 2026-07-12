from __future__ import annotations

from django.urls import path

from .api.views import TaskDetailView, TaskListCreateView

urlpatterns = [
    path("", TaskListCreateView.as_view(), name="task-list-create"),
    path("<int:task_id>", TaskDetailView.as_view(), name="task-detail"),
]
