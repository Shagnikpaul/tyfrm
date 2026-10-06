# Typeform Clone

This project is a functional clone of Typeform, designed for creators to build forms and respondents to fill them out seamlessly. It consists of a fast, animated respondent flow and a WYSIWYG builder with drag-and-drop question management, contextual settings, and inline editing.

## Tech Stack Used

**Frontend:**
- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS v4, custom CSS variables for dark/light mode
- **UI Primitives:** shadcn/ui (restyled with custom design tokens)
- **State Management:** TanStack Query (server state), Zustand (local UI state)
- **Drag and Drop:** `@dnd-kit/core` & `@dnd-kit/sortable`
- **Animations:** Framer Motion (`motion`)
- **Icons & Toasts:** `lucide-react`, `sonner`

**Backend:**
- **Language & Framework:** Python 3.12, FastAPI, Uvicorn
- **Validation:** Pydantic v2
- **Database & ORM:** SQLite (default), SQLAlchemy 2.0 (typed `Mapped[]` style), Alembic (migrations)
- **File Storage (P1):** AWS S3 via `boto3`

## Setup Instructions

### Backend Setup
1. **Environment:** Create and activate a conda environment.
   ```bash
   conda create -n tyfrmclone python=3.12
   conda activate tyfrmclone
   ```
2. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. **Database Setup & Seeding:**
   ```bash
   alembic upgrade head
   python -m app.seed
   ```
4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive API docs are available at `http://localhost:8000/docs`.

### Frontend Setup
1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Environment Variables:**
   Copy `.env.example` to `.env.local`. Make sure it includes:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

## Architecture Overview

**Backend Architecture:**
The backend uses a layered architecture: **routers -> services -> models**.
- **Routers (HTTP):** Handle API endpoints and routing (no business logic).
- **Services:** Pure business logic handling CRUD operations, validation rules, and summary stats computation.
- **Models:** SQLAlchemy database definitions.
This ensures a clean separation of concerns and makes testing straightforward.

**Frontend Architecture:**
The frontend heavily relies on the Next.js App Router.
- **Builder:** An inline-editable WYSIWYG canvas, with a drag-and-drop question list and contextual settings panel. Edits are debounced and autosaved.
- **Respondent Flow:** A full-screen, one-question-at-a-time player with smooth Framer Motion transitions and extensive keyboard navigation support.
- **API Client:** A custom typed API wrapper that interfaces with the backend and utilizes TanStack Query for caching and mutations.

## Database Schema

- **`users`**: Represents the form creator (currently uses a single default user).
- **`forms`**: Contains form metadata, title, slug, and settings (welcome/thank-you screens, themes).
- **`questions`**: Individual questions linked to a form, encompassing 8 types with specific settings and ordering.
- **`responses`**: A single submission instance by a respondent.
- **`answers`**: Individual answers linked to a response and specific question. Stores actual values/labels.
- **`files` (P1)**: Used for file upload question types, tracking metadata and S3 keys.

## Assumptions Made

1. **Authentication:** There is a single shared default creator. No real authentication is implemented; anyone can edit, duplicate, or delete any form.
2. **Respondents:** Submissions are entirely anonymous. Multiple submissions from the same user are allowed with no duplicate prevention.
3. **Settings Retroactivity:** Settings changes are not retroactive. Modifying limits or bounds won't invalidate old answers. Deleting a question or changing its type *will* delete that question's answers (after confirmation).
4. **Choice Answers:** Answers to choice-based questions store the *label text*, not an option ID. Renamed or removed options will become "orphan" values in the summary stats.
5. **Seed Data:** Seed data is generated automatically on startup if the database is empty, belonging to the default user.
6. **File Uploads (P1):** Uploaded files will be stored in S3 and referenced by ID in the database.
