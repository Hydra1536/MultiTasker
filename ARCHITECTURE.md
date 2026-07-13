# Architecture

This document explains how MultiTasker is structured and why, covering the backend's layering, the data model, the auth flow, and the tradeoffs made along the way.

---

## 1. High-Level Overview

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│   Next.js Frontend   │ ──────────────────────────▶│  Django + DRF Backend │
│  (multitasker1       │◀────────────────────────── │                       │
│   .onrender.com)     │      JWT in Authorization    │  SQLite / Postgres    │
└─────────────────────┘            header            └──────────────────────┘
```

- The frontend is a pure client — it never talks to the database directly, only to the REST API.
- Every request that touches user data (tasks, images, annotations) carries a JWT access token in the `Authorization: Bearer <token>` header.
- The backend never trusts a client-supplied user ID; the authenticated user is always resolved server-side from the token, and every query is scoped to that user (see §4).

---

## 2. Backend Layering (Clean Architecture)

Each Django app (`auth`, `tasks`, `annotations`) is structured in layers so business logic stays independent of the HTTP framework and is easy to test in isolation:

```
apps/<name>/
  models.py        — ORM models only, no business logic
  repositories.py   — DB query logic; views/services never call .objects.filter() directly
  services.py       — business rules (validation, orchestration, multi-step writes)
  api/
    serializers.py  — request/response shape, field-level validation
    views.py        — thin HTTP layer; translates requests into service calls
```

The dependency direction is one-way: `api → services → repositories → models`. Services never import from `api`, which keeps business logic (e.g. "a task's due date can't be in the past," "a polygon must have at least 3 points") testable without spinning up an HTTP server.

---

## 3. Authentication Flow

1. **Register** (`POST /api/auth/register`) — email + password + confirmation. Password strength is validated server-side using Django's built-in validators (minimum length, not entirely numeric, not a commonly used password).
2. **Login** (`POST /api/auth/login`) — returns a short-lived **access token** and a longer-lived **refresh token**.
3. The frontend stores both tokens and attaches the access token to every authenticated request.
4. **Silent refresh** — if a request comes back `401 Unauthorized` because the access token expired, the API client automatically calls `POST /api/auth/refresh` once, swaps in the new access token, and retries the original request. Only if the refresh itself fails does the user get redirected to `/login`. This is what keeps a user's session alive across a normal working session without forcing them to re-authenticate every few minutes.
5. **Logout** blacklists the refresh token server-side so it can't be reused.

---

## 4. Multi-Tenant Data Isolation

Every user-owned model (`Task`, `Image`, `Annotation`) has an `owner` foreign key to the `User` model. Every queryset in every view/service is filtered by `request.user` — never by an ID the client sends. This means:

- User A can never see, edit, or delete User B's tasks or annotations, even by guessing an ID in the URL.
- The "date-based board" query (`GET /api/tasks/?due_date=...`) is always implicitly scoped as `Task.objects.filter(owner=request.user, due_date=...)`.

---

## 5. Data Model

```
User
  email (unique, used as login identifier)
  password (hashed)

Task
  owner        → FK User
  title
  description
  status       → todo | in_progress | done
  priority     → low | medium | high
  due_date     (indexed — this is what the board queries against)
  tags         (comma-separated or M2M, depending on implementation)
  created_at / updated_at

Image
  owner        → FK User
  file         (stored under MEDIA_ROOT, served via MEDIA_URL in dev)
  uploaded_at

Annotation
  image        → FK Image
  owner        → FK User
  label        (free-text tag entered by the user, e.g. "yo")
  points       (JSON array of polygon vertex coordinates)
  created_at / updated_at
```

**Why `due_date` is indexed:** the entire Tasks page is one query — "give me everything for this date" — run every time the user changes the date picker. An index here keeps that lookup fast even as the number of tasks grows.

**Why annotation points are stored as JSON rather than a separate table per point:** a polygon's vertices are always read and written together as a single unit (there's no use case for querying "all points at x=50 across all polygons"), so a JSON array on the `Annotation` row avoids an unnecessary join and keeps save/load operations atomic and simple.

---

## 6. Image Handling

- Images are uploaded via multipart form data and stored under `MEDIA_ROOT` (`backend/media/`), served at `MEDIA_URL` (`/media/`) in development via Django's `static()` helper appended to `urlpatterns` when `DEBUG=True`.
- In production, media would move to persistent object storage (e.g. S3-compatible storage on the hosting provider) rather than local disk, since platforms like Render don't guarantee persistent local filesystem storage across deploys.
- Annotation polygons reference their parent image by foreign key, so reloading an image re-renders any previously saved polygons from the database rather than losing them on page refresh.

---

## 7. Frontend Structure

The frontend mirrors the two product surfaces directly:

- `/tasks` — the Kanban board. Task-fetching is always parameterized by the currently selected date, so the date picker and the board itself stay in sync through a single source of truth for `selectedDate`.
- `/annotate` — the annotation workspace. Upload, filmstrip selection, and the canvas are composed together on one page: uploading adds to the filmstrip, selecting a filmstrip thumbnail loads that image into the canvas, and saved polygons persist back to that image's record.

Both surfaces share the same authenticated API client (`lib/api.ts`), which centralizes token attachment and the silent-refresh behavior described in §3 — so no individual component has to know about auth mechanics.

---

## 8. Deployment

- **Frontend**: hosted on Render (`multitasker1.onrender.com`) as a Next.js app.
- **Backend**: Django + DRF, intended to run behind Render/Railway/PythonAnywhere with `DEBUG=False` in production, `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` set to the deployed frontend origin, and a persistent database (Postgres recommended over SQLite for anything beyond a demo, since SQLite's single-writer model doesn't suit a hosted multi-request environment well).

---

## 9. Consistency Tradeoff Note (CAP)

This app runs as a single backend instance against a single database — there's no multi-region replication or partition tolerance concern in play at this scale, so it's straightforwardly consistency-favoring (every read reflects the latest write). If this were to grow into a distributed system — for example, real-time collaborative annotation where two users edit the same image simultaneously — the natural tradeoff would shift toward favoring availability for presence/cursor-style features (where slightly stale data is acceptable) while still keeping the actual polygon save operation strongly consistent, since losing or corrupting a saved annotation is worse than a user seeing a momentarily stale collaborator cursor.
