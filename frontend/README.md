# Typeform Clone - Frontend

This is the frontend application for the Typeform clone, built with Next.js (App Router), Tailwind CSS, and `shadcn/ui`. It provides a seamless, dynamic interface for both form creators (Builder) and respondents.

## Features

- **Dashboard**: View all your forms, their statuses (draft/published), and quick metrics. Create new forms instantly.
- **Form Builder**:
  - Distraction-free drag-and-drop interface (powered by `@dnd-kit`).
  - Inline editing of question titles and descriptions.
  - Context-aware settings panel for configuring options, limits, and requirements.
  - Auto-saving functionality.
- **Respondent Experience**:
  - Smooth, one-question-at-a-time flow using `framer-motion` for transitions.
  - Auto-advancing for single-click question types (like multiple choice, rating, yes/no).
  - Robust keyboard navigation (Enter to submit, arrow keys to select, Esc to clear).
  - Client-side validation ensuring required fields and constraints are met before advancing.
- **Analytics / Results**:
  - Real-time summary charts (views, responses, completion rate).
  - Visual breakdown of answers (bar charts for choices, distribution for ratings, lists for text).
  - Detailed response table with pagination.
- **Modern UI/UX**:
  - Dark mode support using `next-themes`.
  - Fully responsive design tailored for both desktop and mobile.

## Tech Stack

- **Framework**: Next.js 15 (React 19) with App Router
- **Styling**: Tailwind CSS v4, `shadcn/ui`, `lucide-react` icons
- **State Management**:
  - **Server State**: `@tanstack/react-query`
  - **Client State**: `zustand`
- **Animations**: `framer-motion`, `tw-animate-css`
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Validation**: Shared logic for UI & Builder

## Getting Started

### Prerequisites

- Node.js >= 20.19.0 (v22+ recommended)
- The Backend server must be running (typically on `http://localhost:8000`).

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables. Create a `.env.local` file in the `frontend/` directory:
   ```env
   # Point this to your backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```text
frontend/
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── (app)/            # Dashboard layout
│   ├── forms/[id]/       # Form Builder & Results
│   └── f/[slug]/         # Public-facing respondent form player
├── components/           # Reusable UI components
│   ├── builder/          # Builder-specific components (canvas, panels)
│   ├── questions/        # Input components for each question type
│   ├── respondent/       # Components for the public form player
│   └── ui/               # Base shadcn/ui components
├── lib/                  # Utilities and API setup
│   ├── api/              # Axios client, TanStack Query hooks, query keys
│   ├── validation/       # Answer validation logic
│   └── utils.ts          # Tailwind merge utility
├── store/                # Zustand stores (builder state)
└── types/                # TypeScript interfaces (matching API contracts)
```

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Runs the built production app.
- `npm run lint`: Runs ESLint to catch errors.
- `npm run typecheck`: Validates TypeScript typings without emitting files.
