from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db import transaction

from .models import Annotation, Image
from .repositories import AnnotationRepository, ImageRepository


@dataclass(slots=True)
class AnnotationPayload:
    shape_type: str
    points: list[dict[str, float]]
    label: str


class AnnotationService:
    @staticmethod
    def list_images(owner):
        return ImageRepository.for_owner(owner)

    @staticmethod
    def list_annotations(owner, image_id: int):
        return AnnotationRepository.for_image(owner, image_id)

    @staticmethod
    @transaction.atomic
    def create_image(owner, file_obj) -> Image:
        return Image.objects.create(owner=owner, original_file=file_obj)

    @staticmethod
    @transaction.atomic
    def create_annotation(owner, image: Image, payload: AnnotationPayload) -> Annotation:
        return Annotation.objects.create(
            owner=owner,
            image=image,
            shape_type=payload.shape_type,
            points=payload.points,
            label=payload.label,
        )

    @staticmethod
    @transaction.atomic
    def delete_annotation(annotation: Annotation) -> None:
        annotation.delete()
