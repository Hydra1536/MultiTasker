# MASTER BUILD PROMPT FOR GITHUB COPILOT (VS Code)

## 1. PROJECT OVERVIEW

Build a 2-in-1 web app:

1. **Task Manager** — a date-based Kanban board (`/tasks`)
2. **Image Annotation Tool** — polygon drawing/annotation on uploaded images (`/annotate`)

Plus a **Login / Registration** flow (email + password) gating both.

Target audience: this is a technical assessment/portfolio piece, so code quality, architecture, and UI polish matter as much as functionality.

---

## 2. TECH STACK (NON-NEGOTIABLE)

**Frontend**
- Next.js (App Router) + **TypeScript strict mode** — no `.js`/`.jsx` files, no `any` unless truly unavoidable (and justified with a comment)
- Tailwind CSS for styling
- Zustand for cross-component state (date selection, auth state, annotation state)
- react-dnd or dnd-kit for drag-and-drop Kanban
- A canvas/SVG-based library (e.g. `react-konva` or hand-rolled `<canvas>`) for polygon annotation
- Fetch wrapper for auth-aware API calls

**Backend**
- Django + Django ORM (Django REST Framework allowed and recommended for serializers/viewsets)
- SQLite for dev, structured so swapping to Postgres is a one-line settings change
- Django's built-in auth (`AbstractUser` or custom user model with `email` as `USERNAME_FIELD`) + JWT (`djangorestframework-simplejwt`)
- Pillow for image processing
- Python `async`/`await` for any I/O-bound orchestration that does not need a queue; keep the async boundary explicit so it can be swapped later without changing the API surface

---

## 3. AUTHENTICATION & REGISTRATION

The original spec only asked for login — **add full registration**:

- `POST /api/auth/register` — email, password, password confirmation. Hash with Django's default PBKDF2/Argon2. Validate email uniqueness and password strength (min length, not all-numeric, not too common — reuse Django's built-in validators).
- `POST /api/auth/login` — returns JWT access + refresh token pair.
- `POST /api/auth/refresh`
- `POST /api/auth/logout` — blacklist refresh token.
- Frontend: polished login/register pages sharing a `<AuthForm/>` component, inline validation, loading states, error toasts, redirect-after-login to `/tasks`.
- Protect `/tasks` and `/annotate` with a Next.js middleware or auth guard that checks token validity before render.

---

## 4. UI/UX BAR

This must look like a designed product, not a bootcamp exercise:

- Consistent design system: spacing scale, type scale, a real color palette (not default Tailwind gray/blue), dark mode optional but a nice-to-have.
- Micro-interactions: hover states, drag previews, skeleton loaders while data fetches, optimistic UI updates on task move/edit.
- Empty states designed intentionally (e.g. "No tasks for this day yet — add one" with an illustration or icon, not a blank column).
- Toast/snackbar system for success/error feedback instead of `alert()`.
- Fully responsive down to mobile widths.
- Use `lucide-react` or `heroicons` for iconography — no emoji-as-icons.

---

## 5. FEATURE SPEC

### 5.1 Task Page (`/tasks`)
- `<DateSelector/>` — shared, reusable, controls a global `selectedDate` in Zustand. Must not be tightly coupled to task-fetching logic (it just emits date changes).
- `<Board/>` → `<Column/>` (To Do / In Progress / Done) → `<TaskCard/>`.
- Drag-and-drop cards between columns; on drop, optimistically update UI, then persist via API; roll back on failure.
- Add/Edit/Delete via modal: title, priority (enum: low/medium/high), due date, tags (multi-value, chip input).
- Tasks are always filtered server-side by the selected date (send date as a query param, don't over-fetch and filter client-side).
- Handle edge cases explicitly: no tasks for date, network failure, invalid/past due date, empty tag list.

### 5.2 Annotation Page (`/annotate`)
- Multi-image upload (drag-and-drop + file picker), thumbnails in a horizontally scrollable filmstrip so users can "scroll through multiple images."
- Selecting an image loads it into a canvas workspace.
- Draw polygons point-by-point, close the polygon, see it rendered as an overlay shape.
- Select an existing polygon and delete it independently of others.
- Persist polygon coordinates (as JSON point arrays) + label/metadata per image to the backend.
- Reload: when revisiting an image, previously saved polygons should re-render from the DB.

---

## 6. SYSTEM DESIGN TECHNIQUES — APPLY THESE EXPLICITLY

Don't just namedrop these in comments — actually implement the pattern where it fits. For each, I've told you *where* to apply it:

1. **Idempotency Key implementation**
   On `POST /api/tasks` and `POST /api/annotations` (and image upload), accept an `Idempotency-Key` header. Store a hash of (key + request body) in a small `IdempotencyRecord` model with the response payload and status. If the same key arrives again, return the stored response instead of re-executing.

2. **"200 OK Data Inconsistency Ghost" avoidance**
   Never return `200 OK` for a request that partially failed (e.g. task saved but tag association failed). Wrap multi-step writes in `transaction.atomic()`, and return the correct HTTP status (`207`, `409`, `422`, `500`) with a structured error body when any part of a write fails. Add a code comment explaining this explicitly at each transactional boundary so it's visible in review.

3. **Cursor pagination**
   For `GET /api/tasks` (when unscoped by date) and `GET /api/images`, implement cursor-based pagination (opaque base64 cursor encoding `id`+`created_at`), not offset/limit — avoids skipped/duplicated rows when new items are added mid-scroll. Use DRF's `CursorPagination` class.

4. **Multi-Tenant data isolation**
   Every model (`Task`, `Image`, `Annotation`) has an `owner = ForeignKey(User)`. Every queryset in every view is scoped by `request.user` — never trust a client-supplied user id. Write a shared `IsOwnerQuerySetMixin` so this isn't duplicated per view.

5. **EDA (Event-Driven Architecture)**
   Use Django signals (`post_save` on `Task`, `Annotation`) to decouple side effects — e.g. an `AuditLog` entry, or a placeholder "notify" hook — from the core write path. Structure it so a signal could later be swapped for a Celery task/message broker publish without touching the view logic.

6. **Optimistic Locking**
   Add a `version = IntegerField(default=0)` (or use `updated_at` as a lock token) on `Task` and `Annotation`. On update, require the client to send the version it last read; if it doesn't match the current DB version, reject with `409 Conflict` ("this task was modified elsewhere, please refresh"). Increment version on every successful update.

7. **CAP theorem awareness**
   This is a single-region app on SQLite/Postgres, so it's inherently CP (consistent + partition-tolerant isn't really in play at this scale) — but write a short `ARCHITECTURE.md` note explaining the tradeoff you'd make if this were distributed (e.g. task board favors consistency over availability; a "presence/cursor" feature, if added, would favor availability). This is a documentation deliverable, not code.

8. **Clean Architecture**
   Structure the Django app in layers, not fat views:
   - `models/` — ORM models only
   - `repositories/` — DB query logic (so views never call `.objects.filter()` directly)
   - `services/` — business logic (idempotency checks, optimistic lock checks, image processing orchestration)
   - `api/` (views/serializers) — thin, just translates HTTP ↔ service calls
   This keeps business logic testable without spinning up HTTP.

9. **Database Trigger**
   Use a Postgres/SQLite trigger (or a Django `pre_save` signal if you keep it DB-agnostic) to auto-maintain `updated_at` timestamps and to write an append-only `AuditLog` row whenever a `Task` status changes columns (To Do → In Progress → Done). Document which approach you chose and why.

10. **Strategy Pattern**
    Use it for: (a) annotation shape handling — a `ShapeStrategy` interface with a `PolygonStrategy` implementation now, so `RectangleStrategy`/`CircleStrategy` can be added later without touching the canvas controller; (b) image format conversion — an `ImageOptimizer` interface with `WebPStrategy`/`AvifStrategy` implementations (see §7).

11. **Decoupling**
    Frontend never assumes backend response shape inline — define TypeScript DTOs/interfaces in a shared `types/` folder and map API responses through them. Backend services never import from `api/` (one-directional dependency: api → services → repositories → models).

12. **Optimized ORM usage**
    Use `select_related()` for FK lookups (e.g. `Task.objects.select_related('owner')`) and `prefetch_related()` for reverse/M2M (e.g. tags, annotations per image). Add `db_index=True` on `due_date`, `owner`, `created_at`. Never trigger N+1 queries in a serializer — use `django-debug-toolbar` locally to verify query counts and fix any view that fires more than ~3 queries per request.

---

## 7. PYTHON PERFORMANCE STANDARDS

Apply these across all backend Python code:

- Prefer **built-in C-accelerated functions/libraries** over hand-written Python loops (`sum()`, `sorted()`, `itertools`, `collections.Counter`, etc.) wherever they fit.
- Use **NumPy** for any bulk numeric work (e.g. polygon coordinate math, bounding-box calculations) instead of pure-Python loops. Use **Numba** (`@njit`) for any hot numeric function that isn't already vectorizable (e.g. polygon area/intersection calculations) if profiling shows it's worth it.
- Use `__slots__` on plain data-holder classes (non-Django-model Python classes, e.g. DTOs, strategy classes) to reduce memory overhead and attribute lookup cost.
- Be deliberate about the **garbage collector generations** — for any bulk batch-processing code (e.g. bulk image conversion), consider `gc.disable()` around the batch and `gc.collect()` after, since short-lived object churn in tight loops can otherwise trigger excess GC cycles. Document this in a comment when used.
- **Avoid global mutable state** — no module-level mutable variables; use dependency injection (pass config/clients into functions/classes) or Django settings.
- Prefer **list comprehensions / generator expressions** over explicit `for` loops with `.append()` wherever it improves clarity or speed.

---

## 8. IMAGE HANDLING (STRICT REQUIREMENT)

Do not accept or serve raw JPEG/PNG as the primary format. On upload:

1. **Convert to modern formats** using Pillow: generate a `.webp` version (target ~30% smaller than JPEG at equivalent quality) and, where supported, an `.avif` version (targets a further ~20% reduction over WebP). Implement this via the `ImageOptimizer` strategy pattern from §6.10 — `WebPStrategy` and `AvifStrategy`, selected based on `Accept` header content negotiation or by generating both and letting the frontend pick via `<picture>`.
2. **Generate multiple sizes** per uploaded image — thumbnail (~200px), medium (~800px), large (original capped at a sane max, e.g. 2000px). Store all variants (path + width + format) in an `ImageVariant` model linked to the parent `Image`.
3. **Serve via `srcset`/`<picture>` on the frontend**:
   ```html
   <picture>
     <source type="image/avif" srcset="thumb.avif 200w, medium.avif 800w, large.avif 2000w" />
     <source type="image/webp" srcset="thumb.webp 200w, medium.webp 800w, large.webp 2000w" />
     <img src="medium.jpg" srcset="..." sizes="(max-width: 600px) 200px, 800px" />
   </picture>
   ```
   Let the browser pick the right variant for screen size — never ship a 4000px original to a mobile viewport.
4. Do the conversion **asynchronously** if Celery is set up (upload returns immediately with the original + a "processing" flag; variants populate shortly after); otherwise process synchronously but keep it isolated in the `ImageOptimizer` service so it's swappable later.

---

## 9. DATA MODELS (STARTING POINT — REFINE AS NEEDED)

```
User(email [unique, USERNAME_FIELD], password, created_at)

Task(id, owner FK, title, description, status[todo/in_progress/done],
     priority[low/medium/high], due_date [indexed], tags M2M,
     version [optimistic lock], created_at, updated_at)

Tag(id, name, owner FK)

Image(id, owner FK, original_file, uploaded_at)

ImageVariant(id, image FK, format[webp/avif/jpeg], size[thumb/medium/large],
             file, width, height)

Annotation(id, image FK, owner FK, shape_type[polygon], points [JSONField],
           label, version [optimistic lock], created_at, updated_at)

IdempotencyRecord(id, key [indexed], request_hash, response_body, status_code, created_at)

AuditLog(id, owner FK, entity_type, entity_id, action, timestamp)
```

---

## 10. FOLDER STRUCTURE

**Frontend**
```
/app
  /login
  /register
  /tasks
  /annotate
/components
  /task        (Board, Column, TaskCard, TaskModal)
  /shared      (DateSelector, Toast, Modal, Button)
  /annotate    (Canvas, Filmstrip, ShapeLayer)
/store         (zustand slices: auth, date, tasks, annotations)
/lib           (api client, auth interceptor)
/types         (shared DTOs)
```

**Backend**
```
/core            (settings, urls, wsgi)
/apps/auth
/apps/tasks
  models.py  repositories.py  services.py  serializers.py  views.py  signals.py
/apps/annotations
  (same layered structure)
/apps/common     (IdempotencyRecord, AuditLog, base mixins, ImageOptimizer strategies)
```

---

## 11. DELIVERABLES CHECKLIST

- [ ] Frontend repo (public GitHub)
- [ ] Backend repo (public GitHub)
- [ ] Hosted frontend (Vercel/Netlify)
- [ ] Hosted backend (Render/PythonAnywhere/Railway)
- [ ] `README.md` in **both** repos covering: problems faced + how you solved them, Node version, Python version, step-by-step run instructions
- [ ] `ARCHITECTURE.md` with the CAP theorem tradeoff note (§6.7) and a short diagram of the Clean Architecture layers
- [ ] Demo user email/password seeded or documented
- [ ] ≤2 minute demo video showing both `/tasks` and `/annotate` working end to end

---

## 12. BUILD ORDER (DO IT IN THIS SEQUENCE)

1. Scaffold both repos, TypeScript config, Tailwind config, Django project + apps skeleton per §10.
2. Custom `User` model + register/login/refresh endpoints + frontend auth pages + auth guard.
3. `Task` model/repository/service/API (with idempotency key, optimistic locking, cursor pagination) → then the Kanban UI wired to it.
   4. `Image`/`ImageVariant`/`Annotation` models + upload endpoint with the `ImageOptimizer` strategy (§8) → then the annotation canvas UI wired to it.
   5. Signals/audit log/database timestamp handling (§6.5, §6.9), `django-debug-toolbar` pass to fix N+1 queries (§6.12).
6. Polish pass: loading states, empty states, error toasts, responsiveness, dark mode if time allows.
7. Write both READMEs + ARCHITECTURE.md, seed demo user, deploy, record demo video.

Confirm you understand this whole spec, then start with step 1.
