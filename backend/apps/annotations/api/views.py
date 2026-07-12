from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Annotation, Image
from ..services import AnnotationPayload, AnnotationService
from .serializers import AnnotationCreateSerializer, AnnotationSerializer, ImageSerializer


class ImageListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        images = AnnotationService.list_images(request.user)
        return Response(ImageSerializer(images, many=True, context={"request": request}).data)

    def post(self, request):
        image_file = request.FILES.get("file")
        if image_file is None:
            return Response({"detail": "An image file is required."}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        image = AnnotationService.create_image(request.user, image_file)
        return Response(ImageSerializer(image, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AnnotationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, image_id: int):
        annotations = AnnotationService.list_annotations(request.user, image_id)
        return Response(AnnotationSerializer(annotations, many=True).data)

    def post(self, request):
        serializer = AnnotationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image = get_object_or_404(Image, id=serializer.validated_data["image"], owner=request.user)
        annotation = AnnotationService.create_annotation(
            request.user,
            image,
            AnnotationPayload(
                shape_type=serializer.validated_data["shape_type"],
                points=serializer.validated_data["points"],
                label=serializer.validated_data.get("label", ""),
            ),
        )
        return Response(AnnotationSerializer(annotation).data, status=status.HTTP_201_CREATED)


class AnnotationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, annotation_id: int):
        annotation = get_object_or_404(Annotation, id=annotation_id, owner=request.user)
        AnnotationService.delete_annotation(annotation)
        return Response(status=status.HTTP_204_NO_CONTENT)
