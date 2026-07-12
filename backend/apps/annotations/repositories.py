from __future__ import annotations

from django.db.models import QuerySet

from .models import Annotation, Image


class ImageRepository:
    @staticmethod
    def for_owner(owner) -> QuerySet[Image]:
        return Image.objects.filter(owner=owner).prefetch_related("annotations")


class AnnotationRepository:
    @staticmethod
    def for_image(owner, image_id: int) -> QuerySet[Annotation]:
        return Annotation.objects.filter(owner=owner, image_id=image_id)
