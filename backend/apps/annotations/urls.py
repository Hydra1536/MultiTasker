from __future__ import annotations

from django.urls import path

from .api.views import AnnotationDetailView, AnnotationListCreateView, ImageListCreateView

urlpatterns = [
    path("images", ImageListCreateView.as_view(), name="image-list-create"),
    path("annotations", AnnotationListCreateView.as_view(), name="annotation-list-create"),
    path("annotations/<int:annotation_id>", AnnotationDetailView.as_view(), name="annotation-detail"),
    path("images/<int:image_id>/annotations", AnnotationListCreateView.as_view(), name="image-annotations"),
]
