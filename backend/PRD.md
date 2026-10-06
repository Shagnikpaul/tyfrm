# Typeform Clone: Backend + Database PRD

Audience: AI coding agents building `backend/`. This document is the source of truth for scope, schema, API contract, validation, seed data and build order. The frontend PRD (separate document) will be derived from the **API Contract** in section 7, so do not change endpoint paths or JSON shapes without flagging it.

---

## 1. Product context

We are building a functional clone of Typeform. A creator builds forms (ordered questions of 8 types), publishes them to a public shareable link, respondents fill them one question at a time with no login, and the creator views responses, a single response, and per-question summary stats.

The backend's job: persist forms/questions/responses, enforce validation at submit time, serve the public form definition, and compute summary stats.

**Evaluation weights that affect backend decisions:** schema quality (proper relationships), clean API design, code modularity, ability to explain the code. Prefer clear and boring over clever.

---

## 2. Tech stack and environment

| Concern | Choice |
|---|---|
| Language | Python 3.12 |
| Env | conda: `conda create -n tyfrmclone python=3.12` then `conda activate tyfrmclone` |
| Packages | `pip` + `requirements.txt` |
| Framework | FastAPI + Uvicorn |
| Validation / schemas | Pydantic v2 (`pydantic-settings` for config) |
| ORM | SQLAlchemy 2.0 (typed `Mapped[]` style) |
| Migrations | Alembic |
| Database | SQLite (file path from `DATABASE_URL`, default `sqlite:///./app.db`) |
| File storage (P1) | AWS S3 via `boto3`, presigned URLs |
| Tests | Deferred. Will be requested later. Structure code so services are testable. |

Run command: `uvicorn app.main:app --reload --port 8000`
Interactive docs: `/docs` (FastAPI default) must work and be accurate.

### Configuration (`.env`, loaded by `pydantic-settings`)

```
DATABASE_URL=sqlite:///./app.db
CORS_ORIGINS=http://localhost:3000
ADMIN_TOKEN=change-me
PUBLIC_APP_URL=http://localhost:3000        # used to build share links
AWS_REGION=                                  # P1 only
S3_BUCKET=                                   # P1 only
SEED_ON_STARTUP=true
```

### SQLite requirements
- On every connection: `PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;`
- IDs are UUID4 strings (`str`, 36 chars). Timestamps are UTC, serialized as ISO 8601 with `Z`.

---

## 3. Requirement tiers

### P0: must work flawlessly
1. Form CRUD: list (with status, response count), create, rename, duplicate, delete.
2. Publish / unpublish, with a stable public slug and share link.
3. Question CRUD within a form: add, edit, delete, reorder. 8 types: `short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating`.
4. Per-question: `title`, `description` (help text), `required`, type-specific `settings`.
5. Form-level settings: welcome screen, thank-you screen, theme placeholder (stored, minimal use).
6. Public endpoints (no auth): fetch published form by slug, submit response.
7. Server-side validation of submissions (rules in section 8).
8. Responses: paginated list, single response, per-form summary stats per question.
9. Destructive-change protection: deleting a question or changing its type requires explicit confirmation and deletes that question's answers.
10. Seed data (section 9) so the app is usable on first run.
11. OpenAPI docs, README section for the backend.

### P1: do after P0 is complete and verified
1. **File upload question type** (`file_upload`) via S3 presigned URLs (section 7.6).
2. **CSV export** of responses.
3. **Views + completion rate**: public view counter, completion rate in summary. (The counter column and endpoint are cheap, so build them in P0 if trivial. Only the stats display is P1.)
4. Delete a single response.

### P2: stretch
1. "Other" option on choice questions.
2. Basic logic jumps (schema reserves room: see `questions.settings`, but no endpoint work unless asked).

### Placeholders (no implementation, no endpoints needed)
Integrations/webhooks, team collaboration/sharing, payments, advanced logic. The frontend shows "Coming Soon". The backend does nothing.

### Explicit non-goals
- Real authentication (see section 4).
- Partial-response saving or resume.
- Respondent identification or duplicate-submission prevention (multiple submissions allowed).
- Re-validating old answers when settings change (see section 8.3).
- Rate limiting, email notifications, analytics beyond views/completion rate.

---

## 4. Identity model: single shared default creator

Decision: **Option A**. One seeded default user. Every request is treated as that user.

- Table `users` exists and `forms.user_id` is a real foreign key, so the schema is auth-ready.
- FastAPI dependency `get_current_user()` returns the default user (looked up by fixed email `demo@typeform-clone.dev`). **All creator endpoints must use it and filter by `user_id`.** This is the only place real auth would later plug in.
- Public endpoints (`/public/...`) never use it.
- Consequence (document in README): anyone visiting the deployed site shares the same workspace and can edit/delete any form, including seed forms.
- Mitigation: `python -m app.seed --reset` (drops all data, reseeds) and `POST /api/v1/admin/reset` protected by header `X-Admin-Token: <ADMIN_TOKEN>`.

---

## 5. Architecture and folder layout

Layered: **routers (HTTP) -> services (business logic) -> models (DB)**. Routers contain no business logic and no SQL. Services contain no FastAPI imports.

```
backend/
  app/
    main.py                  # app factory, CORS, router registration, exception handlers
    core/
      config.py              # Settings (pydantic-settings)
      database.py            # engine, SessionLocal, get_db dependency, SQLite pragmas
      errors.py              # AppError hierarchy + handlers -> standard error JSON
      deps.py                # get_current_user, get_db
    models/                  # SQLAlchemy models, one file per table
      user.py form.py question.py response.py answer.py file.py
    schemas/                 # Pydantic request/response models
      form.py question.py response.py summary.py common.py
    services/
      form_service.py        # CRUD, duplicate, publish/unpublish, slug generation
      question_service.py    # CRUD, reorder, settings validation, destructive-change checks
      validation.py          # answer validation rules per question type (pure functions)
      response_service.py    # submit, list, get, delete
      summary_service.py     # per-question stats, completion rate
      export_service.py      # CSV (P1)
      storage_service.py     # S3 presign (P1)
    routers/
      forms.py questions.py responses.py public.py admin.py health.py
    seed.py                  # `python -m app.seed [--reset]`
  alembic/ alembic.ini
  requirements.txt
  .env.example
  README.md
```

Rules for agents:
- Question `settings` validation is per-type and lives in one place (`question_service` using a Pydantic discriminated union, e.g. `ShortTextSettings`, `NumberSettings`...). Do not scatter type checks across routers.
- `validation.py` is pure: `validate_answer(question, value) -> cleaned_value or raises AnswerError(message)`. It must be reusable by the submit service and later by tests.
- Use `Depends(get_db)` per request, commit in services, never in routers.

---

## 6. Database schema

All PKs are UUID strings. `created_at` / `updated_at` are UTC datetimes (`updated_at` auto-updates).

### 6.1 `users`
| Column | Type | Notes |
|---|---|---|
| id | str PK | |
| email | str unique not null | |
| name | str not null | |
| created_at | datetime | |

### 6.2 `forms`
| Column | Type | Notes |
|---|---|---|
| id | str PK | |
| user_id | str FK -> users.id, ON DELETE CASCADE, indexed | |
| title | str(200) not null | default `"Untitled form"` |
| slug | str(32) unique not null, indexed | generated at creation, 8 chars URL-safe random, immutable (stable link across unpublish/publish) |
| status | enum `draft` / `published` | default `draft`, indexed |
| welcome_enabled | bool | default false |
| welcome_title | str(200) null | |
| welcome_description | str(1000) null | |
| welcome_button_text | str(50) | default `"Start"` |
| thankyou_title | str(200) | default `"Thanks for completing this form!"` |
| thankyou_message | str(1000) null | default `"Your response has been recorded."` |
| theme | JSON | default `{}`. Placeholder (e.g. `{"mode":"light","accent":"#...","font":"..."}`), stored and returned, not interpreted by the backend |
| view_count | int | default 0 |
| published_at | datetime null | set on publish |
| created_at / updated_at | datetime | |

### 6.3 `questions`
| Column | Type | Notes |
|---|---|---|
| id | str PK | |
| form_id | str FK -> forms.id, ON DELETE CASCADE, indexed | |
| position | int not null | 0-based, contiguous per form. **No unique constraint** on (form_id, position) because reordering rewrites positions in one transaction |
| type | enum | `short_text` `long_text` `multiple_choice` `dropdown` `email` `number` `yes_no` `rating` (+ `file_upload` in P1) |
| title | str(500) not null | |
| description | str(1000) null | help text |
| required | bool | default false |
| settings | JSON not null | type-specific, validated (6.7). Also the reserved extension point for logic jumps later |
| created_at / updated_at | datetime | |

Index: `(form_id, position)`.

### 6.4 `responses`
| Column | Type | Notes |
|---|---|---|
| id | str PK | |
| form_id | str FK -> forms.id, ON DELETE CASCADE, indexed | |
| submitted_at | datetime | default now, indexed |

One row = one completed submission. No respondent identity is stored.

### 6.5 `answers`
| Column | Type | Notes |
|---|---|---|
| id | str PK | |
| response_id | str FK -> responses.id, ON DELETE CASCADE, indexed | |
| question_id | str FK -> questions.id, **ON DELETE CASCADE**, indexed | deleting a question deletes its answers (decision from product owner) |
| value | JSON not null | shape depends on question type (6.6) |

Unique constraint: `(response_id, question_id)`.
Skipped optional questions simply have **no answer row** (do not store null).

No type/title snapshots are needed, since destructive changes delete the answers anyway. Non-destructive edits (title, description, required, settings) never invalidate stored values.

### 6.6 Answer value shapes (JSON in `answers.value`)
| Question type | Stored value |
|---|---|
| short_text, long_text | `"string"` (trimmed) |
| email | `"user@example.com"` (trimmed, lowercased) |
| number | JSON number (int or float) |
| yes_no | `true` / `false` |
| rating | integer |
| multiple_choice (single) | `"Option label"` |
| multiple_choice (multi) | `["Label A","Label B"]` |
| dropdown | `"Option label"` |
| file_upload (P1) | `{"file_id":"...","name":"cv.pdf","size":12345,"content_type":"application/pdf"}` |

Choice answers store the **label text, not an option id**, so renamed/removed options leave "orphan" values in old answers. This is accepted. The summary must handle it (section 7.5).

### 6.7 `questions.settings` per type
Each option object: `{"id": "<uuid>", "label": "<string 1..200>"}`. Option ids are generated by the frontend or backend (backend fills if absent) and are used for stable ordering/keys only.

| Type | Settings (with defaults) | Constraints |
|---|---|---|
| short_text | `max_length` (255), `placeholder` ("") | max_length 1..1000 |
| long_text | `max_length` (2000), `placeholder` ("") | max_length 1..10000 |
| multiple_choice | `options` (min 1), `allow_multiple` (false) | labels unique within the question (case-insensitive) |
| dropdown | `options` (min 1) | same as above |
| email | `{}` | |
| number | `min` (null), `max` (null) | if both set, `min <= max` |
| yes_no | `{}` | |
| rating | `steps` (5) | integer 2..10, stars only |
| file_upload (P1) | `max_size_mb` (10), `allowed_types` ([]  = any) | max_size_mb 1..25 |

Unknown settings keys are rejected (422). Missing keys are filled with defaults on create.

### 6.8 `files` (P1)
| Column | Type | Notes |
|---|---|---|
| id | str PK | |
| form_id | str FK -> forms.id ON DELETE CASCADE | |
| question_id | str FK -> questions.id ON DELETE CASCADE | |
| s3_key | str not null | |
| original_name | str | |
| content_type | str | |
| size_bytes | int | |
| created_at | datetime | |

### 6.9 Relationships
```
users 1---* forms 1---* questions 1---* answers *---1 responses *---1 forms
                  forms 1---* files (P1)
```
All child FKs cascade on delete. Deleting a form removes its questions, responses, answers and files rows (S3 object cleanup: best effort, P1).

### 6.10 Duplicate form semantics
`POST /forms/{id}/duplicate` creates a new form: title `"Copy of <title>"` (truncate to 200), `status=draft`, new slug, `view_count=0`, copies welcome/thank-you/theme, copies all questions with **new ids and new option ids** preserving positions. **Responses are not copied.**

---

## 7. API contract

Base path: `/api/v1`. JSON everywhere. Auth: none (creator endpoints use the default user implicitly).

### 7.1 Conventions

**Success:** 200 for reads/updates, 201 for creates, 204 with empty body for deletes.

**Error format (all errors, including validation):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable summary",
    "details": []
  }
}
```
Error codes: `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `FORM_NOT_AVAILABLE` (404, public form that is draft/unpublished/missing), `CONFIRMATION_REQUIRED` (409), `INVALID_STATE` (409), `UNAUTHORIZED` (401, admin only), `INTERNAL_ERROR` (500).

Override FastAPI's default 422 handler so request-body validation errors also use this shape, with `details` as a list of `{"field": "title", "message": "..."}`.

**Pagination (list endpoints that paginate):** query `page` (default 1), `page_size` (default 20, max 100). Response:
```json
{ "items": [], "total": 0, "page": 1, "page_size": 20 }
```

### 7.2 Object shapes

**FormSummary** (list item):
```json
{
  "id": "uuid", "title": "Customer Feedback", "slug": "k3x9aB2q", "status": "published",
  "question_count": 8, "response_count": 24, "view_count": 60,
  "share_url": "http://localhost:3000/f/k3x9aB2q",
  "created_at": "2026-10-06T12:00:00Z", "updated_at": "2026-10-06T12:30:00Z"
}
```
`share_url` is built from `PUBLIC_APP_URL` and is non-null even for drafts (link just shows "not available" until published). The frontend decides whether to display it.

**Form** (full, creator view):
```json
{
  "id": "uuid", "title": "...", "slug": "...", "status": "draft",
  "share_url": "...",
  "welcome": { "enabled": false, "title": null, "description": null, "button_text": "Start" },
  "thank_you": { "title": "...", "message": "..." },
  "theme": {},
  "view_count": 0, "response_count": 0,
  "published_at": null, "created_at": "...", "updated_at": "...",
  "questions": [ Question, ... ]   // ordered by position
}
```

**Question:**
```json
{
  "id": "uuid", "form_id": "uuid", "position": 0, "type": "multiple_choice",
  "title": "How did you hear about us?", "description": "Pick one",
  "required": true,
  "settings": { "options": [{"id":"uuid","label":"Friend"}], "allow_multiple": false },
  "created_at": "...", "updated_at": "..."
}
```

**PublicForm** (what respondents get; no user_id, no counts, no timestamps):
```json
{
  "slug": "...", "title": "...",
  "welcome": { "enabled": true, "title": "...", "description": "...", "button_text": "Start" },
  "thank_you": { "title": "...", "message": "..." },
  "theme": {},
  "questions": [ { "id","position","type","title","description","required","settings" } ]
}
```

### 7.3 Form management (creator)

| Method | Path | Body | Success | Notes |
|---|---|---|---|---|
| GET | `/forms` | query: `search?`, `status?` (draft/published), `sort?` (`updated_desc` default, `created_desc`, `title_asc`) | 200 `{items: FormSummary[]}` | Not paginated (small list). Only the current user's forms |
| POST | `/forms` | `{ "title"?: string }` | 201 Form | Creates draft, zero questions, generates slug |
| GET | `/forms/{form_id}` | | 200 Form | |
| PATCH | `/forms/{form_id}` | any of `title`, `welcome{...}`, `thank_you{...}`, `theme{}` (partial) | 200 Form | Used for rename and settings and autosave. Partial nested objects merge |
| DELETE | `/forms/{form_id}` | | 204 | Cascades. UI should confirm and mention response count |
| POST | `/forms/{form_id}/duplicate` | | 201 Form | See 6.10 |
| POST | `/forms/{form_id}/publish` | | 200 Form | 409 `INVALID_STATE` if form has zero questions. Sets `status=published`, `published_at` |
| POST | `/forms/{form_id}/unpublish` | | 200 Form | Sets `status=draft`. Slug unchanged. Existing responses kept |

### 7.4 Questions (creator)

| Method | Path | Body | Success | Notes |
|---|---|---|---|---|
| POST | `/forms/{form_id}/questions` | `{ type, title, description?, required?, settings?, position? }` | 201 Question | `position` omitted = append. If given, insert there and shift later ones. `settings` omitted = type defaults. `title` is required, min 1 char (the frontend sends a default like "Your question here") |
| PATCH | `/forms/{form_id}/questions/{question_id}?confirm=true` | any of `title`, `description`, `required`, `settings`, `type` | 200 Question | **If `type` changes** and the question has answers and `confirm` is not true: 409 `CONFIRMATION_REQUIRED` (below). On confirm: delete that question's answers, apply new type, reset settings to new type's defaults unless valid settings supplied in the same request. If the type changes but there are 0 answers, no confirmation needed. `settings` must validate against the resulting type |
| DELETE | `/forms/{form_id}/questions/{question_id}?confirm=true` | | 204 | If the question has answers and `confirm` is not true: 409 `CONFIRMATION_REQUIRED`. With 0 answers, deletes immediately. Re-compacts positions to be contiguous |
| PUT | `/forms/{form_id}/questions/order` | `{ "question_ids": ["id1","id2",...] }` | 200 `{ "questions": Question[] }` | Must contain **exactly** all question ids of the form, otherwise 422. Rewrites `position` 0..n-1 in one transaction |

**CONFIRMATION_REQUIRED response (409):**
```json
{
  "error": {
    "code": "CONFIRMATION_REQUIRED",
    "message": "This question has 12 answers that will be permanently deleted.",
    "details": [{ "answer_count": 12, "action": "delete_question" }]
  }
}
```
`action` is `delete_question` or `change_type`. The frontend shows a warning modal using `answer_count`, and on confirm repeats the same request with `?confirm=true`.

Editing a published form is allowed. Changes are live immediately for new respondents.

**Duplicate question:** no endpoint. The frontend calls `POST .../questions` with the copied fields and `position = current + 1`.

### 7.5 Responses and summary (creator)

| Method | Path | Success | Notes |
|---|---|---|---|
| GET | `/forms/{form_id}/responses?page&page_size&sort=submitted_desc\|submitted_asc` | 200 Paginated `ResponseItem` | |
| GET | `/forms/{form_id}/responses/{response_id}` | 200 `ResponseItem` | |
| DELETE | `/forms/{form_id}/responses/{response_id}` | 204 | P1 |
| GET | `/forms/{form_id}/summary` | 200 Summary | |
| GET | `/forms/{form_id}/responses/export.csv` | 200 `text/csv` attachment | P1. Header row = question titles in position order, first column `Submitted at`. Choice multi-select joined with `; `. Escape properly (use `csv` module). Filename `<slug>-responses.csv` |

**ResponseItem:**
```json
{
  "id": "uuid", "submitted_at": "2026-10-05T09:12:00Z",
  "answers": [ { "question_id": "uuid", "value": "..." } ]
}
```
`answers` only contains questions that were answered. The frontend joins them with `GET /forms/{id}` to render columns and labels. (Rows for questions that were skipped show as empty.)

**Summary:**
```json
{
  "form_id": "uuid",
  "total_responses": 24,
  "views": 60,
  "completion_rate": 0.4,
  "questions": [
    {
      "question_id": "uuid", "type": "multiple_choice", "title": "...",
      "answered_count": 22, "skipped_count": 2,
      "stats": { ... type specific ... }
    }
  ]
}
```
`completion_rate = total_responses / views`, capped at 1.0, `null` if `views == 0`.

`stats` per type:

| Type | `stats` shape |
|---|---|
| multiple_choice, dropdown | `{"options":[{"label":"Friend","count":9,"is_orphan":false}, ...]}` with every **current** option listed (count 0 included) in option order, followed by orphan values (stored labels no longer in the question) with `is_orphan:true`. For multi-select, an answer counts once for each label it contains |
| yes_no | `{"yes": 14, "no": 8}` |
| rating | `{"average": 4.2, "distribution":[{"value":1,"count":0}, ...]}` with buckets 1..max(`steps`, highest stored value), so old values above the current `steps` still appear |
| number | `{"min": 1, "max": 99, "average": 34.5}` (`null`s if no answers) |
| short_text, long_text, email | `{"recent": ["latest 5 values, newest first"]}` |
| file_upload (P1) | `{"file_count": 12}` |

Summary must be computed from stored answers only (never assumes old values satisfy current settings).

### 7.6 Public endpoints (no auth)

| Method | Path | Body | Success | Notes |
|---|---|---|---|---|
| GET | `/public/forms/{slug}` | | 200 PublicForm | 404 `FORM_NOT_AVAILABLE` if slug unknown **or** form is draft. Same response for both (do not leak existence) |
| POST | `/public/forms/{slug}/view` | | 204 | Increments `view_count` atomically (`UPDATE ... SET view_count = view_count + 1`). Called once per page load by the frontend. 404 as above |
| POST | `/public/forms/{slug}/responses` | `{ "answers": [ { "question_id": "...", "value": ... } ] }` | 201 `{ "id": "uuid", "submitted_at": "..." }` | Validates per section 8. All-or-nothing. Single transaction |
| POST | `/public/forms/{slug}/uploads/presign` | `{ question_id, filename, content_type, size }` | 200 `{ file_id, upload_url, method:"PUT", headers:{...} }` | **P1.** Validates question is `file_upload`, size/type rules. Browser PUTs the file directly to S3, then submits `{file_id}` as the answer value. Presigned URL expires in 10 minutes |

**Submit validation error (422)** reports errors per question so the UI can jump to the failing question:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some answers are invalid",
    "details": [
      { "question_id": "uuid", "message": "Enter a valid email address" },
      { "question_id": "uuid", "message": "This question is required" }
    ]
  }
}
```

Presigned GET URLs for viewing uploaded files in the creator's responses view: when serializing `ResponseItem` for a `file_upload` answer, add `"url": "<presigned GET, 1h>"` to the value object (P1).

### 7.7 Admin and utility

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/reset` | Header `X-Admin-Token` must equal `ADMIN_TOKEN`, else 401. Wipes all tables and reseeds. 204 |
| GET | `/health` | `{ "status": "ok" }` |

(Mounted under `/api/v1` like everything else.)

---

## 8. Validation rules

### 8.1 Where
- **Server is authoritative**, validated at submit time against the question settings **as they are right now**.
- The frontend mirrors these rules for instant feedback. Use these exact messages so UX is consistent:

### 8.2 Per-type answer rules

General: the answer set must only reference questions that belong to this form (else 422 with that question_id). Duplicate `question_id` entries in one submission: 422. A missing answer, `null`, empty string, or empty array counts as "not answered". Strings are trimmed first. If a question is required and not answered: `"This question is required"`. If not required and not answered: skip, no row stored. A submission with zero answered questions is rejected with 422 (`"Please answer at least one question"`), even if the form has no required questions.

| Type | Rule | Error message |
|---|---|---|
| short_text / long_text | string, length <= `max_length` | `"Maximum {n} characters"` |
| email | string matching a sane email check (use `email-validator` / Pydantic `EmailStr` logic) | `"Enter a valid email address"` |
| number | JSON number (not bool). If string given, reject (frontend must send numbers). Finite. `>= min` if set, `<= max` if set | `"Enter a valid number"`, `"Must be at least {min}"`, `"Must be at most {max}"` |
| yes_no | boolean | `"Choose Yes or No"` |
| rating | integer, `1 <= v <= steps` | `"Choose a rating between 1 and {steps}"` |
| multiple_choice (single) | string, must equal one current option label | `"Choose one of the available options"` |
| multiple_choice (multi) | array of strings, each a current option label, no duplicates, non-empty when answered | `"Choose from the available options"` |
| dropdown | string, must equal a current option label | `"Choose one of the available options"` |
| file_upload (P1) | `{file_id}` referencing a `files` row for this form + question, not already attached to another answer | `"Upload a valid file"` |

### 8.3 Settings changes are NOT retroactive
Old answers are never re-validated or modified when settings change. Examples: max length 100 -> 60 (old 80-char answers stay), number range changes, rating steps 10 -> 5 (old 8s stay), options renamed/removed (old labels stay and appear as orphans in the summary). The only destructive operations are **deleting a question** and **changing its type**, both behind confirmation (7.4).

### 8.4 Request validation for creator endpoints
- Form title: 1..200 chars after trim. Question title: 1..500. Description: <= 1000.
- Settings validated per 6.7. Option labels 1..200 chars, unique case-insensitively, at least 1 option.
- Publishing requires at least one question.

---

## 9. Seed data

Seed runs automatically on startup **if `users` is empty and `SEED_ON_STARTUP=true`**, and via `python -m app.seed --reset`. Use a fixed random seed (e.g. `random.Random(42)`) so output is deterministic. Everything belongs to the default user.

| Form | Status | Slug (fixed) | Questions |
|---|---|---|---|
| **Customer Feedback Survey** | published | `customer-feedback` | name (short_text, required), email (email, required), overall rating (rating, 5, required), how did you hear about us (multiple_choice single), which features do you use (multiple_choice multi), would you recommend us (yes_no, required), plan tier (dropdown), what could we improve (long_text), team size (number, min 1 max 10000) |
| **Event Registration** | published | `event-registration` | full name (short_text, required), email (email, required), attendees (number, min 1 max 10, required), session track (dropdown, required), dietary needs (multiple_choice multi), will you attend the after-party (yes_no), excitement level (rating, 10), questions for the speakers (long_text) |
| **Job Application** | published | `job-application` | full name, email, years of experience (number 0..50), role applied for (dropdown), preferred work mode (multiple_choice single), why do you want to join (long_text, max 1000), are you willing to relocate (yes_no), self-rated skill (rating 5). Welcome screen enabled. |
| **Product Launch Quiz** | draft | `product-launch-quiz` | 3 to 4 simple questions, 0 responses |

Requirements:
- Together the published forms cover **all 8 question types**.
- Each published form gets **15 to 30 responses** (vary the count), `submitted_at` spread over the last 30 days with realistic timestamps. Answers must be realistic and varied: real-looking names, coherent emails, skewed rating distributions (more 4s and 5s), a mix of skipped optional questions, some multi-select combos, text answers that read like real people wrote them (at least 10 distinct hand-written long-text answers per form, reused with variation).
- Each published form gets a `view_count` of roughly 1.5x to 3x its response count.
- Seed answers must pass the same validation rules as real submissions (run them through `validation.py` while seeding).
- Seed must be idempotent in `--reset` mode (drop all rows in FK-safe order, reinsert).
- The `file_upload` type is never used in seed data.

---

## 10. Suggested build order for agents

Each phase ends with its "Done when" checks. Do not start a phase until the previous one passes.

**Phase 0: Project setup**
- `backend/` scaffold per section 5, `requirements.txt`, `.env.example`, config, DB engine with pragmas, error handlers, `/health`, CORS.
- Done when: `uvicorn app.main:app` runs and `/docs` and `/api/v1/health` respond.

**Phase 1: Schema**
- Models (6.1 to 6.5), Alembic initial migration, enums, indexes, FKs with cascades. `files` table can wait for P1.
- Done when: `alembic upgrade head` creates all tables on a fresh SQLite file and FK/cascade behavior works (delete a form removes children).

**Phase 2: Core logic**
- `schemas/`, per-type settings validation, `validation.py` (answer rules), slug generation.
- Done when: settings and answer rules from sections 6.7 and 8 are implemented as pure, importable functions.

**Phase 3: Form + question APIs**
- Section 7.3 and 7.4, including publish rules, duplicate, reorder, confirmation flow, `get_current_user`.
- Done when: every endpoint works through `/docs`, incl. 409 confirmation flow and position compaction.

**Phase 4: Public + responses**
- Section 7.6 (minus uploads), view counter, submit with full validation, section 7.5 list/get.
- Done when: a draft form returns `FORM_NOT_AVAILABLE`, an invalid submit returns per-question errors, a valid submit appears in the creator's response list.

**Phase 5: Summary stats**
- `summary_service` per the table in 7.5 including orphan handling and completion rate.
- Done when: stats are correct for a hand-built form incl. a removed option and a lowered rating scale.

**Phase 6: Seed + admin**
- Section 9 seed, `--reset`, `/admin/reset`.
- Done when: fresh DB starts populated, every seeded answer is valid, reset restores the original state.

**Phase 7: Documentation (backend part of the README)**
- Setup (conda + pip + alembic + seed + run), tech stack, architecture overview, schema diagram/table, API overview table, assumptions (see section 11).

**Phase 8 (P1, after core frontend works): extras**
- CSV export, delete response, `file_upload` type with S3 presign (+ `files` migration), presigned GET in response items.
- AWS setup (bucket, CORS for browser PUT, IAM user) is done by the owner. Agent only needs env vars.

**Phase 9: Deployment prep (owner-driven)**
- Document env vars. SQLite on ephemeral hosts resets on redeploy, which is why seed-on-empty-startup exists. Persistent disk is optional.

---

## 11. Assumptions to state in the README
1. Single shared default creator, no authentication. Anyone can edit anything.
2. Anonymous respondents, multiple submissions allowed, no duplicate prevention.
3. Settings changes are not retroactive. Deleting a question or changing its type deletes that question's answers after confirmation.
4. Choice answers store labels, so renamed/removed options become orphan values in stats.
5. Seed data is recreated whenever the database is empty or reset.
6. Uploaded files (P1) live in S3, referenced by id in answers.

---

## 12. Open items (decided later, not blocking)
- Backend test suite (owner will request; keep services pure and testable).
- Frontend PRD will consume sections 7 and 8 verbatim. Flag any contract change before editing the API.
