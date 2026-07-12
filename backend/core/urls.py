from __future__ import annotations

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.auth.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/annotations/", include("apps.annotations.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
