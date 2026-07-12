from __future__ import annotations

from rest_framework import serializers

from ..models import Annotation, Image


class ImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    annotation_count = serializers.IntegerField(source="annotations.count", read_only=True)

    class Meta:
        model = Image
        fields = ("id", "image_url", "uploaded_at", "annotation_count")

    def get_image_url(self, obj: Image) -> str:
        request = self.context.get("request")
        url = obj.original_file.url
        return request.build_absolute_uri(url) if request is not None else url


class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = ("id", "image", "shape_type", "points", "label", "version", "created_at", "updated_at")


class AnnotationCreateSerializer(serializers.Serializer):
    image = serializers.IntegerField()
    shape_type = serializers.ChoiceField(choices=Annotation.ShapeType.choices)
    points = serializers.ListField(child=serializers.DictField(), allow_empty=False)
    label = serializers.CharField(required=False, allow_blank=True)
