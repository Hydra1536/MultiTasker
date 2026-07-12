from __future__ import annotations

from django.contrib import admin

from .models import Tag, Task

admin.site.register(Task)
admin.site.register(Tag)
