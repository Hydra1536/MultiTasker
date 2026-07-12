from __future__ import annotations

from datetime import datetime

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Task
from ..services import TaskPayload, TaskService
from .serializers import TaskSerializer, TaskWriteSerializer


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        due_date_raw = request.query_params.get("due_date")
        due_date = datetime.strptime(due_date_raw, "%Y-%m-%d").date() if due_date_raw else None
        tasks = TaskService.list_tasks(request.user, due_date=due_date)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = TaskService.create_task(
            request.user,
            TaskPayload(
                title=serializer.validated_data["title"],
                description=serializer.validated_data.get("description", ""),
                status=serializer.validated_data["status"],
                priority=serializer.validated_data["priority"],
                due_date=serializer.validated_data["due_date"],
                tags=serializer.validated_data.get("tags", []),
            ),
        )
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id: int):
        task = Task.objects.get(id=task_id, owner=request.user)
        serializer = TaskWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expected_version = serializer.validated_data.get("version")
        if expected_version is not None and expected_version != task.version:
            return Response({"detail": "This task was modified elsewhere, please refresh."}, status=status.HTTP_409_CONFLICT)
        updated_task = TaskService.update_task(
            task,
            TaskPayload(
                title=serializer.validated_data["title"],
                description=serializer.validated_data.get("description", ""),
                status=serializer.validated_data["status"],
                priority=serializer.validated_data["priority"],
                due_date=serializer.validated_data["due_date"],
                tags=serializer.validated_data.get("tags", []),
            ),
        )
        return Response(TaskSerializer(updated_task).data)

    def delete(self, request, task_id: int):
        task = Task.objects.get(id=task_id, owner=request.user)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
