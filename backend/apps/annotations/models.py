from __future__ import annotations

from django.conf import settings
from django.db import models


class Image(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="images", db_index=True)
    original_file = models.ImageField(upload_to="images/originals/")
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-uploaded_at", "-id")


class Annotation(models.Model):
    class ShapeType(models.TextChoices):
        POLYGON = "polygon", "Polygon"

    image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name="annotations")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="annotations", db_index=True)
    shape_type = models.CharField(max_length=20, choices=ShapeType.choices, default=ShapeType.POLYGON)
    points = models.JSONField(default=list)
    label = models.CharField(max_length=120, blank=True)
    version = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
