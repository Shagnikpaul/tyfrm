# Typeform Clone Backend

A modular, production-ready backend for a Typeform clone built with **FastAPI**, **SQLAlchemy 2.0**, **Alembic**, **Pydantic v2**, and **SQLite**.

---

## 1. Tech Stack & Environment

| Concern | Choice |
|---|---|
| **Language** | Python 3.12 |
| **Framework** | FastAPI + Uvicorn |
| **Validation / Schemas** | Pydantic v2 + `pydantic-settings` |
| **ORM** | SQLAlchemy 2.0 (typed `Mapped[]` style) |
| **Migrations** | Alembic (with batch mode for SQLite) |
| **Database** | SQLite with WAL mode & `PRAGMA foreign_keys=ON` |
| **Email Validation** | `email-validator` |

---

## 2. Architecture Overview

The backend adheres strictly to a clean, decoupled layered architecture:
```
backend/
├── app/
│   ├── main.py              # Application factory, CORS, exception handlers, router registry
│   ├── core/
│   │   ├── config.py        # Settings management with pydantic-settings (.env precedence)
│   │   ├── database.py      # SQLite engine, connection events (WAL + foreign keys), SessionLocal
│   │   ├── errors.py        # Standardized AppError hierarchy & FastAPI exception handlers
│   │   └── deps.py          # Dependency injection (get_db, get_current_user)
│   ├── models/              # SQLAlchemy 2.0 ORM models (User, Form, Question, Response, Answer)
│   ├── schemas/             # Pydantic v2 request/response and settings validation schemas
│   ├── services/            # Pure business logic services (no FastAPI imports):
│   │   ├── form_service.py      # Form CRUD, duplication, publishing, and slug generation
│   │   ├── question_service.py  # Question CRUD, positioning, reordering, destructive change checks
│   │   ├── response_service.py  # Public form resolution, atomic view counts, submissions
│   │   ├── summary_service.py   # Analytics calculations, orphan handling, rating buckets
│   │   └── validation.py        # Pure answer validation rules across all 8 question types
│   ├── routers/             # Lean HTTP endpoints (no business logic, no SQL):
│   │   ├── forms.py         # Creator form CRUD and summary
│   │   ├── questions.py     # Question management and reordering
│   │   ├── responses.py     # Response listings and details
│   │   ├── public.py        # Public form access and submission
│   │   ├── admin.py         # Admin reset
│   │   └── health.py        # Health probe
│   └── seed.py              # Deterministic database seeder (`--reset` support)
├── alembic/                 # Alembic migrations directory
├── alembic.ini              # Alembic configuration
├── .env.example             # Environment variable template
├── requirements.txt         # Pinned backend dependencies
└── BUILD_LOG.md             # Running engineering build log
```

- **Routers**: Only handle HTTP concerns (status codes, query/body params, invoking services). No business logic and zero direct SQL queries.
- **Services**: Pure business logic with typed function signatures. No FastAPI imports. Transactions committed in services.
- **Validation Engine**: Pure functions in `app.services.validation` enforcing type-specific rules and emitting exact, standard error messages.

---

## 3. Database Schema

All primary keys are UUID4 strings. All foreign keys enforce `ON DELETE CASCADE`.

```
users (1) ──< forms (1) ──< questions (1) ──< answers (*) >── (1) responses (*) >── (1) forms
```

### Table Definitions
- **`users`**: `id` (PK), `email` (Unique), `name`, `created_at`.
- **`forms`**: `id` (PK), `user_id` (FK -> users.id CASCADE), `title`, `slug` (Unique, 8-char URL-safe), `status` (`draft` | `published`), `welcome_enabled`, `welcome_title`, `welcome_description`, `welcome_button_text`, `thankyou_title`, `thankyou_message`, `theme` (JSON), `view_count`, `published_at`, `created_at`, `updated_at`.
- **`questions`**: `id` (PK), `form_id` (FK -> forms.id CASCADE), `position` (0-based, indexed), `type` (Enum), `title`, `description`, `required`, `settings` (JSON), `created_at`, `updated_at`.
- **`responses`**: `id` (PK), `form_id` (FK -> forms.id CASCADE), `submitted_at` (Indexed).
- **`answers`**: `id` (PK), `response_id` (FK -> responses.id CASCADE), `question_id` (FK -> questions.id CASCADE), `value` (JSON). Unique constraint on `(response_id, question_id)`.

---

## 4. API Overview

Base path: `/api/v1`. All endpoints return and accept JSON.

### Form Management (Creator)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/forms` | List current user's forms with question, response, and view counts. |
| `POST` | `/api/v1/forms` | Create a draft form. Generates unique 8-character slug. |
| `GET` | `/api/v1/forms/{id}` | Retrieve full form details with questions in position order. |
| `PATCH` | `/api/v1/forms/{id}` | Update title, welcome screen, thank-you screen, and theme (partial merge). |
| `DELETE` | `/api/v1/forms/{id}` | Delete form (cascades all questions, responses, and answers). |
| `POST` | `/api/v1/forms/{id}/duplicate` | Duplicate form: copies questions with new IDs, resets responses. |
| `POST` | `/api/v1/forms/{id}/publish` | Publish form (requires at least 1 question; 409 if 0 questions). |
| `POST` | `/api/v1/forms/{id}/unpublish` | Unpublish form back to draft status. |
| `GET` | `/api/v1/forms/{id}/summary` | Retrieve summary statistics, response rates, and per-question analytics. |

### Questions (Creator)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/forms/{id}/questions` | Create question. Appends or inserts at `position` shifting later ones. |
| `PATCH` | `/api/v1/forms/{id}/questions/{q_id}` | Edit question. Changing `type` with existing answers requires `?confirm=true` (else 409). |
| `DELETE` | `/api/v1/forms/{id}/questions/{q_id}` | Delete question. If answers exist, requires `?confirm=true` (else 409). Re-compacts positions. |
| `PUT` | `/api/v1/forms/{id}/questions/order` | Reorder all questions in form via `{ "question_ids": [...] }`. |

### Public Endpoints (No Auth)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/public/forms/{slug}` | Get published form for respondents. Returns 404 `FORM_NOT_AVAILABLE` for draft forms. |
| `POST` | `/api/v1/public/forms/{slug}/view` | Atomically increment form view counter on respondent page load. |
| `POST` | `/api/v1/public/forms/{slug}/responses` | Submit response. Validates all answers server-side; atomic transaction. |

### Responses & Admin
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/forms/{id}/responses` | Paginated response list with question answers. |
| `GET` | `/api/v1/forms/{id}/responses/{r_id}` | Retrieve single response item. |
| `POST` | `/api/v1/admin/reset` | Protected by `X-Admin-Token`. Drops all data and reseeds initial forms. |
| `GET` | `/api/v1/health` | Health probe returning `{"status": "ok"}`. |

---

## 5. Question Types & Validation Rules

The backend supports 8 core question types:
1. `short_text`: String with `max_length` (1..1000, default 255).
2. `long_text`: String with `max_length` (1..10000, default 2000).
3. `multiple_choice`: Choice list with options (`[{"id": "...", "label": "..."}]`). Case-insensitive unique labels. Supports `allow_multiple: bool`. Single returns string label, multi returns string array.
4. `dropdown`: Select list with options. Returns selected string label.
5. `email`: String validated via RFC email rules, stored normalized in lowercase.
6. `number`: Finite numeric value (rejects booleans and strings) with optional `min` / `max`.
7. `yes_no`: Strict boolean (`True` or `False`).
8. `rating`: Integer step value from 1 to `steps` (2..10).

### Destructive Operations & Orphan Handling
- **Non-retroactive settings**: Updating question settings (e.g. shortening max length or removing an option) never invalidates old answers.
- **Orphan labels**: In summary stats, options removed after respondents answered them are displayed with `is_orphan: true`.
- **Dynamic rating buckets**: Rating summary buckets span `1..max(steps, highest_stored_rating)` so past ratings are never obscured.
- **Confirmation flow**: Changing a question's type or deleting a question that already has answers requires `?confirm=true`. Without confirmation, the API returns HTTP 409 `CONFIRMATION_REQUIRED` detailing the answer count.

---

## 6. Setup and Running

### 1. Environment Setup
```bash
conda activate tyfrmclone
cd backend
pip install -r requirements.txt
```

### 2. Configuration (`.env`)
Create `.env` or copy `.env.example`:
```env
DATABASE_URL=sqlite:///./app.db
CORS_ORIGINS=http://localhost:3000
ADMIN_TOKEN=change-me
PUBLIC_APP_URL=http://localhost:3000
SEED_ON_STARTUP=true
```

### 3. Migrations
Run Alembic migrations to create tables:
```bash
alembic upgrade head
```

### 4. Database Seeding
To manually seed or reset:
```bash
python -m app.seed --reset
```
*Note: If `SEED_ON_STARTUP=true`, the server automatically seeds on launch if the database is empty.*

### 5. Start the Server
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger documentation is available at: `http://localhost:8000/docs`.

---

## 7. Assumptions & Product Notes

1. **Single shared creator**: All creator requests use a default creator user (`demo@typeform-clone.dev`). Anyone accessing the creator API shares the workspace.
2. **Anonymous respondents**: Public forms require no login. Multiple submissions from the same respondent are permitted.
3. **Non-retroactive settings**: Settings edits apply only to future submissions. Deleting a question or changing its type deletes stored answers for that question after explicit confirmation.
4. **Label-based choice answers**: Multiple choice and dropdown answers store label strings rather than internal IDs. Renamed or removed options appear as orphan entries in summary statistics.
5. **Deterministic seeding**: Deterministic pseudo-random seeds ensure predictable data on initial launch and after `/admin/reset`.
