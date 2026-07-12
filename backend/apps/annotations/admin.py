from __future__ import annotations

from django.contrib import admin

from .models import Annotation, Image

admin.site.register(Image)
admin.site.register(Annotation)
