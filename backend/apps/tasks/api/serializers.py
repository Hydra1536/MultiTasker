from __future__ import annotations

from datetime import date

from rest_framework import serializers

from ..models import Task


class TaskSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "version",
            "tags",
            "created_at",
            "updated_at",
        )

    def get_tags(self, obj: Task) -> list[str]:
        return [task_tag.tag.name for task_tag in obj.tasktag_set.all()]


class TaskWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=Task.Status.choices)
    priority = serializers.ChoiceField(choices=Task.Priority.choices)
    due_date = serializers.DateField()
    version = serializers.IntegerField(required=False)
    tags = serializers.ListField(child=serializers.CharField(max_length=64), required=False)

    def validate_due_date(self, value: date) -> date:
        if value < date.today():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value
