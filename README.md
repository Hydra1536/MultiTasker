# MultiTasker

A focused workspace combining a **date-based Kanban task board** and a **polygon image-annotation workspace**, built with Next.js + TypeScript on the frontend and Django + Django REST Framework on the backend.

> *Sign up to continue to the date-based board and annotation tools.*

---

## Live Links

| | Link |
|---|---|
| Frontend (hosted) | https://multitasker1.onrender.com |

---

## Tech Stack

**Frontend**
- Next.js (App Router), TypeScript
- Client-side auth state (JWT stored and attached to API requests)
- Native HTML5 date input + drag-and-drop for the task board

**Backend**
- Django + Django REST Framework
- JWT authentication (`djangorestframework-simplejwt`) — register, sign in, session persists across page reloads
- SQLite (dev) — swappable to Postgres via `DATABASES` in `settings.py`
- Pillow for handling uploaded annotation images

**Versions used**
- Node.js: *fill in your version*
- Python: 3.14.6
- Django: 5.2.16

---

## Features

### Authentication
- **Register** (`/register`) — email, password, confirm password. Registration is email-based and uses Django's built-in password validators on the backend.
- **Sign in** (`/login`) — email + password, JWT issued on success
- **Logout** — clears the session and returns to the sign-in state

### Tasks — Date-based Board (`/tasks`)
- Three columns: **To Do**, **In Progress**, **Done**, each with a live task count badge
- A date picker (with prev/next arrows) at the top scopes the whole board to a single day — tasks are created, fetched, and shown per selected date
- **Add task** opens a modal to capture:
  - Title
  - Description
  - Status (`todo` / `in progress` / `done`)
  - Priority (`low` / `medium` / `high`)
  - Due date
  - Tags (comma-separated, e.g. `design, urgent, backend`)
- Drag-and-drop task cards between columns to change status
- A dedicated **"Drag here to delete a task"** drop zone at the bottom of the board removes a task
- Clean empty state per column: *"No tasks for this day yet. Add one."*

### Annotate — Polygon Annotation Workspace (`/annotate`)
- **Upload zone** — click to upload one or more images for annotation
- **Filmstrip** — uploaded images appear as thumbnails with a live annotation count (e.g. *"0 annotations"*); click a thumbnail to load it into the workspace below
- **Canvas workspace** — draw polygons point by point directly on the selected image
- **Label** field — name/tag each polygon before saving (e.g. labeling a region as `"yo"` in the demo)
- **Undo / Clear / Save** controls above the canvas for correcting mistakes and persisting changes
- **Saved polygons list** — every saved shape appears with its label and a **Delete** button to remove it independently of the others
- **Back / Cancel / Save changes** controls to move between images without losing work

---

## Getting Started

### Prerequisites
- Node.js *(version)* and npm
- Python 3.14+
- Git

### Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # optional, for /admin access

python manage.py runserver
```

Backend runs at `http://localhost:8000`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

### Environment variables

**Backend** (`backend/.env` or set directly in `settings.py` for local dev):
```
DEBUG=True
SECRET_KEY=your-secret-key
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Difficulties Faced & How I Overcame Them

A few classic Django/Next.js integration issues came up while building this — documented here as they're useful notes for anyone extending the project:

1. **`OperationalError: no such table`** — new models (`ImageCollection`, `Image`, `Annotation`, etc.) were added to `models.py`, but `makemigrations` + `migrate` hadn't been run yet, so the tables didn't exist in SQLite. Fixed by running both commands and confirming with `python manage.py showmigrations`.

2. **Uploaded images returning 404 in dev (`/media/...`)** — Django doesn't serve `MEDIA_ROOT` automatically even with `DEBUG=True`; it has to be explicitly appended to `urlpatterns` via `static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`. Easy to miss since static assets "just work" via `staticfiles`, but media uploads don't.

3. **`IntegrityError: NOT NULL constraint failed: annotations_image.order`** — the `order` field on the `Image` model had no default, and one upload path never supplied a value. Fixed by adding `default=0` to the field and explicitly setting `order` per file (via `enumerate()`) in the upload-handling service.

4. **`Given token not valid for any token type`** — the JWT access token expired mid-session with no refresh logic on the frontend, so authenticated requests started failing with 401 once the token aged out. Fixed by adding a refresh-and-retry wrapper to the API client: on a 401, it silently calls the refresh endpoint, swaps in the new access token, and retries the original request once before redirecting to `/login`.

Each of these was diagnosed by reading the full Django traceback rather than guessing — it names the exact table, field, or line at fault, so it was a matter of tracing the exception back to root cause instead of treating the symptom.

---

## Project Structure

```
backend/
  apps/
    auth/          — registration, login, JWT
    tasks/         — Kanban task models, API
    annotations/   — image upload, polygon storage
    common/        — shared mixins/utilities
  core/             — settings, urls
  media/            — uploaded images (dev only; gitignored)

frontend/
  src/
    app/
      login/ register/
      tasks/
      annotate/
    components/
      task/        — Board, Column, TaskCard, TaskModal
      annotate/    — Uploader, Filmstrip, Canvas
      shared/      — DatePicker, Modal
    lib/            — API client (with JWT + refresh handling)
```

See `ARCHITECTURE.md` for the reasoning behind this structure and the backend design decisions.
