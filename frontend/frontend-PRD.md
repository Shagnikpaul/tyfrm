# Typeform Clone: Frontend PRD

Audience: AI coding agent (Antigravity) building `frontend/`.
Companions: `PRD.md` (backend, source of truth for the API) and `typeform_clone_Design.md` (visual approximation).

**Precedence rule:** where this PRD and `typeform_clone_Design.md` disagree, this PRD wins. `typeform_clone_Design.md` supplies visual direction, spacing and tone. This PRD supplies layout, behavior and scope. Where this PRD and the backend PRD disagree about the API, the backend PRD wins and you must flag it instead of working around it.

---

## 1. Product summary

A Typeform clone for creators and respondents. The two hardest and most important pieces are:

1. The **builder** (inline-editable WYSIWYG canvas, drag-and-drop question list, contextual settings).
2. The **respondent flow** (full-screen, one question at a time, animated, keyboard-driven).

Everything else (dashboard, results) is conventional and should be clean but quick to build.

The app must feel like a polished conversation (respondent) and a visual editor for that conversation (builder), never like a generic form website or admin dashboard.

---

## 2. Scope

### P0 (build now, all must work)
- Dashboard: list, search, filter by status, sort, create, rename, duplicate, delete, copy link.
- Builder: inline editing, add/edit/duplicate/delete/reorder questions (8 types), per-question settings, welcome screen, ending (thank-you) screen, autosave, publish/unpublish, share modal, full-screen preview.
- Respondent flow at `/f/[slug]`: welcome, one-at-a-time questions, transitions, keyboard nav, progress, client + server validation, thank-you.
- Results: summary tab, responses table, single-response drawer with prev/next.
- Toasts, confirmation modals, loading skeletons, empty states.
- Light/dark mode toggle (see section 13).
- Responsive: respondent flow fully responsive; builder desktop-first with tablet fallback.

### P1 (later, after the owner refines the UI; do NOT build now, but leave clean extension points)
- CSV export, delete a single response, file-upload question type, views/completion-rate display polish.
- Render a **disabled button with a "Coming soon" tooltip** for Export CSV and Delete response so the layout is stable. Do not call those endpoints.

### Placeholders ("Coming soon" only, no logic)
- Connect tab (integrations/webhooks), Logic tab in the right panel, Design tab beyond the light/dark mode control, templates in the Create modal, team/collaboration, billing, payments.

### Non-goals
Real auth, branching logic, advanced themes, analytics beyond what the summary endpoint returns, offline support, i18n.

---

## 3. Tech stack and conventions

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable), App Router, TypeScript `strict: true` |
| Styling | Tailwind CSS + CSS variables for all colors (see section 13) |
| UI primitives | shadcn/ui for behavior-heavy primitives only: Dialog, AlertDialog, DropdownMenu, Popover, Command (combobox), Switch, Select, Sheet, Tabs, Tooltip, Skeleton, Table. **Restyle them with the design tokens.** Do not ship default shadcn styling. |
| Custom (not shadcn) | The whole respondent player, the question canvas, question list items, choice/rating/yes-no controls, progress UI, form cards, thumbnails |
| Server state | TanStack Query |
| Local UI state | Zustand (small store, see section 8.4). Plain React state for component-local things |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Animation | `motion` (Framer Motion). CSS transitions for hover/focus |
| Icons | `lucide-react` only |
| Toasts | `sonner`, bottom-right |
| Theme | `next-themes` (class strategy) |
| Font | Inter via `next/font` (see design doc section 3) |

Env: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` in `.env.local` and `.env.example`.

Code conventions:
- No `any`. Types for all API shapes live in `src/types/api.ts` and mirror the backend PRD section 7.2.
- Components are small and single-purpose. No file over ~250 lines; split instead.
- No hardcoded hex colors inside components. Use semantic tokens only (needed for dark mode).
- All API calls go through `src/lib/api/` (never `fetch` inside components).
- Accessible by default: visible focus rings, `aria-label` on icon buttons, correct roles on custom controls (radiogroup for single choice, group of checkboxes for multi).

---

## 4. Routes

| Route | Purpose | Notes |
|---|---|---|
| `/` | Redirect to `/forms` | |
| `/forms` | Dashboard | App shell with sidebar |
| `/forms/[id]/edit` | Builder (Create tab) | Full-screen, no app sidebar |
| `/forms/[id]/connect` | Connect tab | "Coming soon" page inside the builder top bar |
| `/forms/[id]/results` | Results, Summary tab | |
| `/forms/[id]/results/responses` | Results, Responses tab | `?r=<responseId>` opens the response drawer; `?page=` for pagination |
| `/forms/[id]/preview` | Full-screen preview | Renders the **creator's own form data** (not the public endpoint, because drafts 404 there). Submission disabled. Exit button returns to `/forms/[id]/edit` |
| `/f/[slug]` | Public respondent flow | No auth, no app chrome |
| `not-found` | Generic 404 | Plus a dedicated "This form is not available" screen for `FORM_NOT_AVAILABLE` |

---

## 5. API layer

### 5.1 Client
`src/lib/api/client.ts`: a thin typed `request<T>(path, options)` over `fetch`:
- Base URL from `NEXT_PUBLIC_API_URL`. JSON in, JSON out. 204 returns `undefined`.
- On non-2xx, parse the backend error body (`{ error: { code, message, details } }`) and throw `ApiError` with `status`, `code`, `message`, `details`. If the body is not in that shape (network failure, proxy error), throw `ApiError` with `code: "NETWORK_ERROR"`.
- Never show raw error JSON to users.

### 5.2 Types (mirror the backend, section 7.2)
```ts
type QuestionType = "short_text" | "long_text" | "multiple_choice" | "dropdown"
  | "email" | "number" | "yes_no" | "rating";

interface Option { id: string; label: string }

type QuestionSettings =
  | { max_length: number; placeholder: string }                       // short_text, long_text
  | { options: Option[]; allow_multiple?: boolean }                   // multiple_choice (allow_multiple), dropdown
  | { min: number | null; max: number | null }                        // number
  | { steps: number }                                                 // rating
  | Record<string, never>;                                            // email, yes_no
// Prefer a discriminated mapping by QuestionType in code (SettingsByType) instead of this loose union.

interface Question {
  id: string; form_id: string; position: number; type: QuestionType;
  title: string; description: string | null; required: boolean;
  settings: QuestionSettings; created_at: string; updated_at: string;
}
interface FormSummaryItem { id: string; title: string; slug: string; status: "draft" | "published";
  question_count: number; response_count: number; view_count: number; share_url: string;
  created_at: string; updated_at: string }
interface Form { id: string; title: string; slug: string; status: "draft" | "published"; share_url: string;
  welcome: { enabled: boolean; title: string | null; description: string | null; button_text: string };
  thank_you: { title: string; message: string | null };
  theme: { mode?: "light" | "dark" } & Record<string, unknown>;
  view_count: number; response_count: number; published_at: string | null;
  created_at: string; updated_at: string; questions: Question[] }
interface PublicForm { slug: string; title: string; welcome: Form["welcome"]; thank_you: Form["thank_you"];
  theme: Form["theme"]; questions: Pick<Question, "id"|"position"|"type"|"title"|"description"|"required"|"settings">[] }
```
Also types for `ResponseItem`, `Paginated<T>`, `Summary` and per-type `stats` exactly as in backend PRD 7.5.

### 5.3 Endpoints and the hooks that wrap them
All hooks live in `src/lib/api/hooks/`. Query keys are centralized in `src/lib/api/keys.ts`.

| Hook | Endpoint |
|---|---|
| `useForms({search,status,sort})` | `GET /forms` |
| `useForm(id)` | `GET /forms/{id}` |
| `useCreateForm()` | `POST /forms` |
| `useUpdateForm(id)` | `PATCH /forms/{id}` (rename, welcome, thank_you, theme) |
| `useDeleteForm()` | `DELETE /forms/{id}` |
| `useDuplicateForm()` | `POST /forms/{id}/duplicate` |
| `usePublishForm(id)` / `useUnpublishForm(id)` | `POST /forms/{id}/publish` / `/unpublish` |
| `useCreateQuestion(formId)` | `POST /forms/{id}/questions` |
| `useUpdateQuestion(formId)` | `PATCH /forms/{id}/questions/{qid}?confirm=true` |
| `useDeleteQuestion(formId)` | `DELETE /forms/{id}/questions/{qid}?confirm=true` |
| `useReorderQuestions(formId)` | `PUT /forms/{id}/questions/order` |
| `useResponses(formId,{page,sort})` | `GET /forms/{id}/responses` |
| `useResponse(formId,rid)` | `GET /forms/{id}/responses/{rid}` |
| `useSummary(formId)` | `GET /forms/{id}/summary` |
| `usePublicForm(slug)` | `GET /public/forms/{slug}` |
| `recordView(slug)` | `POST /public/forms/{slug}/view` (plain function, not a query) |
| `useSubmitResponse(slug)` | `POST /public/forms/{slug}/responses` |

### 5.4 Cache rules
- `useForm` is the **single source of truth** for the builder. Question and form mutations write their server responses into the cache with `setQueryData` (no blind refetch flicker).
- Create/delete/duplicate/publish on forms: invalidate `forms` list.
- Submitting a response invalidates nothing on the public side.
- Default `staleTime` 30s for lists; `0` for the builder form while editing.

### 5.5 Error handling
- `VALIDATION_ERROR` on creator endpoints: show first `details[].message` in a toast and, where a field is identifiable, inline.
- `CONFIRMATION_REQUIRED` (409): never toast. Open the destructive-confirm modal using `details[0].answer_count` and `action` (`delete_question` | `change_type`). On confirm, repeat the same request with `confirm=true`.
- `INVALID_STATE` on publish: toast "Add at least one question before publishing."
- `FORM_NOT_AVAILABLE` / `NOT_FOUND`: dedicated unavailable screens, not toasts.
- Network errors: toast "Couldn't reach the server. Try again." and keep local edits (do not discard typed text).

---

## 6. Dashboard (`/forms`)

Layout per design doc section 5, with these specifics:
- **App shell:** top bar (logo/workspace name left, theme toggle + avatar menu right) and left sidebar 220-250px. Sidebar items: **All forms**, **Drafts**, **Published**. Below, a muted "Coming soon" group (Integrations, Team). Selected item: subtle gray background, no color block.
- **Header row:** "Forms" title, search input (debounced 300ms, sent as `search`), sort select (`updated_desc` default, `created_desc`, `title_asc`), primary **+ Create form** button (dark).
- **Filtering:** sidebar Drafts/Published maps to the `status` query param. Persist search/status/sort in the URL query string.
- **Grid:** responsive cards, 280-340px wide.
- **Form card:** generated thumbnail (top ~60%): deterministic muted background color derived from `slug` hash plus the form title in large type, truncated, to mimic a form preview. Below: title, "{n} responses", status chip (Draft: gray dot, Published: green dot). Whole card clicks through to `/forms/[id]/edit`. Hover: slight lift, border darkens, the `⋯` menu becomes visible.
- **Card menu (`⋯`):** Edit, View results, Copy link (only if published; copies `share_url`, toast "Link copied"), Rename (small dialog with input, Enter saves), Duplicate (toast "Form duplicated", stay on list), Delete.
- **Delete:** AlertDialog "Delete this form?" with copy "This will permanently delete the form and its {response_count} responses. This action cannot be undone." Destructive-styled button.
- **Create modal:** per design doc section 7. "Start from scratch" calls `POST /forms` with `{}`, then navigates to `/forms/[id]/edit`. "Choose a template" is shown disabled with a "Coming soon" tag.
- **States:** skeleton cards while loading; empty state "You don't have any forms yet." with create CTA; separate "No forms match your search" state.

---

## 7. Builder (`/forms/[id]/edit`): PRIMARY SCREEN

This follows the real Typeform builder: a left **Content** panel, a central **WYSIWYG canvas** that is the live preview and is edited inline, and a right **settings panel**. There is **no separate preview panel**.

### 7.1 Shell
Full viewport, no app sidebar.

**Top bar (56-64px):**
- Left: back arrow (to `/forms`), **form title** (inline editable: click to edit, Enter or blur saves via `PATCH`, Escape cancels, empty is rejected and reverts), status chip (Draft/Published), save indicator.
- Center: tabs **Create** (active) | **Connect** (route to the Coming soon page) | **Results**.
- Right: **Preview** (outline button, navigates to `/forms/[id]/preview`) and the primary action: **Publish** when draft, **Share** when published. Publish calls `publish`, then opens the Share modal. Share just opens it.

**Save indicator:** "Saving..." while any mutation is in flight, "Saved" (muted, with a check) for ~2s after success, "Couldn't save" with a retry action on failure.

**Columns (desktop 1280+):** left 240-280px, canvas flexible, right 280-340px. At tablet width the right panel becomes a Sheet opened by a "Settings" button. Below 768px show a simple notice-friendly layout: the left panel becomes a Sheet and the canvas fills the screen (full mobile builder polish is out of scope).

### 7.2 Left panel: "Content"
A vertical list, top to bottom:
1. **Welcome screen** item. If `welcome.enabled` is false, show a muted "+ Add welcome screen" row; clicking it PATCHes `welcome.enabled: true` and selects it. If enabled, show as a list item (not draggable) with a `⋯` menu containing "Remove" (PATCH enabled false).
2. **Question items** (draggable), each: drag handle (visible on hover), number badge (1-based), question-type icon (small, colored), truncated title (1-2 lines), `⋯` menu (Duplicate, Delete). Active item has a subtle background. Height 52-64px.
3. **+ Add question** button, opening the type picker (7.5).
4. **Ending** item (the thank-you screen), always present, not draggable, not deletable.

Selection state: `selectedItem` is `{ kind: "welcome" } | { kind: "question", id } | { kind: "ending" }`.

### 7.3 Drag and drop (questions only)
- dnd-kit sortable, vertical list, pointer + keyboard sensors, 4px activation distance so clicks still select.
- Dragging: the dragged item is elevated with a subtle shadow and reduced opacity; a thin insertion line shows the drop target. Use a `DragOverlay`. No browser-default ghost.
- On drop: **optimistically** reorder in the cache, call `PUT /questions/order` with the full id list, and select the dropped question. On error: roll back and toast "Couldn't reorder questions."
- Question numbers update immediately.

### 7.4 Canvas (center)
A calm, spacious area using the secondary background with the question rendered as the respondent would see it, **inline editable**. It reuses the same `QuestionRenderer` components as the real player, in `mode="edit"`.

For a selected **question**:
- Number + arrow ("1 →") then the **title** as contenteditable-style large text (use an auto-growing `textarea` styled as heading). Placeholder "Your question here". Required questions show a small asterisk-style marker as in Typeform.
- **Description** (muted, smaller) shown only if the description toggle is on; inline editable with placeholder "Description (optional)".
- The type-specific answer preview (non-submittable). For choice/dropdown types, options are editable inline: rename in place, Enter adds a new option below, Backspace on an empty option deletes it (min 1 option), a visible "+ Add choice" row, and a remove icon on hover.
- A decorative "OK" button as in the player (non-functional in the builder).
- Title edits: debounce 500ms (and flush on blur/selection change), then `PATCH`. **Never PATCH an empty title** (backend requires min 1 char): keep the local text, show a subtle inline hint "Question title can't be empty", and revert to the last saved title on blur.

For **Welcome screen**: editable title, description, and button text ("Start" default); shows as it would in the player.
For **Ending**: editable thank-you title and message (maps to `thank_you.title` / `thank_you.message`), shown as it would in the player. This satisfies the "customizable thank-you text" requirement.

Empty form (0 questions): canvas shows a calm empty state with a prominent **Add your first question** button that opens the type picker.

### 7.5 Question type picker
Popover anchored to "+ Add question" (also opened from the empty state), 8 entries per design doc section 13: colored type icon, name, one-line description. Keyboard: arrows to move, Enter to choose, Escape to close, type-to-filter optional. Choosing a type:
1. `POST /forms/{id}/questions` with `type`, `title: "Your question here"`, `required: false`, and **explicit default settings** (below), `position` omitted (append) unless added via a left-panel "insert below" action.
2. Select the new question and focus its title field with the text selected.

**Default settings sent on create** (the backend requires at least one option for choice types, so do not rely on omitted settings there):

| Type | Settings sent |
|---|---|
| short_text | `{ max_length: 255, placeholder: "" }` |
| long_text | `{ max_length: 2000, placeholder: "" }` |
| multiple_choice | `{ options: [Choice 1, Choice 2, Choice 3], allow_multiple: false }` with `crypto.randomUUID()` option ids |
| dropdown | `{ options: [Option 1, Option 2, Option 3] }` with ids |
| email | `{}` |
| number | `{ min: null, max: null }` |
| yes_no | `{}` |
| rating | `{ steps: 5 }` |

### 7.6 Right panel (tabs: Question | Design | Logic)
**Question tab** (for a selected question), quiet visual style, section labels, no cards-in-cards:
- **Type**: select showing icon + name. Changing type: send `PATCH {type, settings: <new type defaults>}`. If the server returns `CONFIRMATION_REQUIRED` with `action: change_type`, show the confirm modal ("This question has {n} answers that will be permanently deleted. Change type anyway?"), then repeat with `?confirm=true`.
- **Required**: toggle (immediate PATCH).
- **Description**: toggle. On shows the description field in the canvas. Off sends `description: null`.
- **Type-specific settings:**
  - short_text / long_text: Maximum characters (number input, bounds 1-1000 / 1-10000), Placeholder.
  - multiple_choice: "Allow multiple selection" toggle (maps to `allow_multiple`).
  - dropdown, multiple_choice: options are edited on the canvas; the panel may show the option count.
  - number: Min and Max inputs (empty = null; if both set and min > max, show inline error and do not save).
  - rating: Steps select, 2-10.
  - email, yes_no: no extra settings.
- **Delete question** (text button at the bottom). Server 409 triggers the confirm modal with the answer count (action `delete_question`), then repeat with `confirm=true`. After delete, select the neighboring question (next, else previous, else empty state) and toast "Question deleted".

Settings PATCH sends the **complete settings object** for the question. Unknown keys are rejected by the backend (422), so only send keys defined in section 7.5.

**Design tab:** a single **Mode** segmented control (Light / Dark) that PATCHes `theme.mode` and drives the respondent form's color mode (section 13). Below it, muted text "More themes coming soon".
**Logic tab:** "Coming soon" empty state.
When the **Welcome** or **Ending** is selected, the Question tab shows "Welcome screen" / "Ending" controls (button text for welcome; nothing else is needed) instead of question controls.

### 7.7 Autosave rules
- Text fields: local component state, debounced 500ms, flushed on blur and when selection changes or the page unloads (`beforeunload` best effort).
- Toggles, selects, reorder, add/delete: immediate.
- Serialize writes per question (never two in-flight PATCHes for the same question; queue the latest). The form-level title/welcome/thank-you are one stream.
- On every successful response, write the returned object into the `useForm` cache.
- Duplicate question: no endpoint. Call create with copied `type`, `title`, `description`, `required`, `settings` (with **new option ids**), and `position = current + 1`. Title unchanged. Select the copy.

### 7.8 Share modal
- Draft form: "Publish to get a shareable link." with a **Publish** button. On `INVALID_STATE`, toast "Add at least one question before publishing."
- Published form: read-only input with `share_url`, **Copy** button (toast "Link copied"), an "Open form" link (new tab), a muted "Your form is live." line, and **Unpublish** as a secondary text action (confirm lightly, toast "Form unpublished"). **Done** closes.
- Because `share_url` comes from the backend `PUBLIC_APP_URL`, display it exactly as received.

---

## 8. Shared question rendering

### 8.1 One renderer, three modes
`QuestionRenderer` renders a question inside the same full-screen layout and accepts:
```ts
mode: "play" | "preview" | "edit"
question, value, onChange, onSubmit, error, index, total
```
- `play`: public respondent.
- `preview`: identical to play, but data from the creator's form and submit disabled.
- `edit`: builder canvas; title/description/options are editable and inputs are non-submittable.

This guarantees "preview looks identical to the public form".

### 8.2 Per-type behavior (respondent)

| Type | Control | Value sent | Client validation (exact messages) | Notes |
|---|---|---|---|---|
| short_text | Large borderless input with a bottom border | trimmed string | required: "This question is required"; over limit: "Maximum {n} characters" | Placeholder from settings, fallback "Type your answer here..." |
| long_text | Auto-growing textarea, bottom border | trimmed string | same, limit from settings | **Enter advances, Shift+Enter inserts a newline.** Hint text "Shift + Enter for a new line" |
| email | Input `type="email"` styled like short text | trimmed string | "Enter a valid email address" | Placeholder "name@example.com" |
| number | Text input with `inputMode="decimal"` | **JSON number** (parse before sending) | "Enter a valid number", "Must be at least {min}", "Must be at most {max}" | Reject non-finite. Never send a string |
| yes_no | Two large pill buttons Yes / No | `true` / `false` | "Choose Yes or No" | Keys Y and N select. Auto-advance after ~350ms |
| rating | Row of stars, count = `steps` | integer 1..steps | "Choose a rating between 1 and {steps}" | Hover fills up to the hovered star. Number keys select (1-9). Auto-advance after ~350ms |
| multiple_choice (single) | Vertical list of bordered options with letter badges (A, B, C...) | option **label** string | "Choose one of the available options" | Click or press the letter. Auto-advance after ~350ms |
| multiple_choice (multi) | Same list with checkbox-style selection | array of **label** strings | "Choose from the available options" | Toggle, then OK/Enter to advance. Show hint "Choose as many as you like" |
| dropdown | Popover + Command combobox with type-to-filter | option **label** string | "Choose one of the available options" | Escape closes. Arrow keys move, Enter picks |

General: required unanswered shows "This question is required". Empty string, empty array and `null` count as unanswered; **unanswered optional questions are omitted from the submission** (never send null).

### 8.3 Error presentation
Error text appears directly under the input, small and muted-red, with a short fade/slide-in (150ms). The input underline also turns red. No alert boxes, no shake bigger than ~4px.

### 8.4 Zustand store (small)
`useBuilderStore`: `selectedItem`, `pickerOpen`, `rightPanelTab`, `saveStatus` (derived from an in-flight counter plus last error). Everything else is server state in TanStack Query or component-local state.

---

## 9. Respondent flow (`/f/[slug]`)

This is the most important UI after the builder. Follow design doc sections 21-32 with these decisions.

### 9.1 State machine
Screens in order: `welcome?` → `question[0..n-1]` → `ending`.
State: `screenIndex`, `direction` (+1 forward, -1 back), `answers: Record<questionId, value>`, `errors: Record<questionId, string>`, `submitting`.

### 9.2 Flow
1. Fetch `GET /public/forms/{slug}`. On `FORM_NOT_AVAILABLE`, show a minimal "This form is not available" screen.
2. After a successful load (and **not in preview**), call `recordView(slug)` **exactly once** per page load. Guard with a `useRef` so React strict-mode double effects don't double count. Ignore failures silently.
3. If `welcome.enabled`, show the welcome screen with the start button (`welcome.button_text`) and hint "press Enter". Otherwise start at question 1.
4. On **OK / Enter / next chevron**: validate the current question client-side. If invalid, show the error and stay. If valid, move forward. Optional and empty: allowed.
5. On the **last question**, the button reads **Submit**. Validate, then `POST /public/forms/{slug}/responses` with `{ answers: [{question_id, value}] }`, answered questions only.
6. On success: ending screen with `thank_you.title` and `thank_you.message`. No back navigation from the ending.
7. On a **422 submit error** with `details[].question_id`: store the messages in `errors`, jump (reverse or forward animation) to the **first failing question by position**, and show its message. If the error is the "Please answer at least one question" case (no `question_id`), show it under the Submit button.
8. Network/other errors: keep answers, toast "Couldn't submit. Please try again.", re-enable Submit.
9. **Back:** the up chevron button (or ArrowUp where allowed, see 9.5). Answers are retained when going back and forth.

### 9.3 Layout
- Full viewport, `100dvh`, no card, no border, no app chrome.
- Content column max ~800px, horizontally centered, vertically slightly above center.
- Question: number then arrow (e.g. `1 →`, smaller, accent-colored, part of the type line), then the title at 36-52px desktop / 28-34px mobile, weight 500-600, line-height ~1.1. Description below in muted body text. Input follows with generous spacing.
- Primary button "OK ✓" (or "Submit") in the dark action color with a muted "press Enter ↵" hint beside it. 44px minimum touch target on mobile.
- **Bottom-left:** thin progress bar and a small "{pct}% completed" label (pct from answered position, `round(index / total * 100)`). **Bottom-right:** a small up/down chevron pair for previous/next question (disabled at the ends). Verify exact placement against reference screenshots if provided.
- Optional small "Powered by" footer is **not** required; leave it out.

### 9.4 Transitions
- Library: `motion` (`AnimatePresence`, `mode="wait"` or `popLayout`; choose whichever gives the smoothest result).
- Forward: current exits upward (y: -32px, opacity 0), next enters from below (y: 32px to 0, opacity 1). Back reverses direction.
- Duration 300ms (range 250-400ms), `ease-out`. No springs, no bounce.
- Respect `prefers-reduced-motion`: fall back to a 150ms opacity-only fade.
- Block input during the transition (ignore keystrokes while animating, or ~300ms).
- Auto-advance (choice, yes/no, rating): wait ~350ms after selection so the selected state is visible, then advance.
- The ending screen enters with a gentle fade/up and a subtle check mark animation.

### 9.5 Keyboard
- **Enter**: validate and advance (long text: Enter advances, Shift+Enter newline; dropdown open: Enter selects the highlighted option, not advance).
- **Choice list focused:** ArrowUp/ArrowDown move the highlighted option, letter keys select, Enter confirms.
- **ArrowUp/ArrowDown** navigate between questions **only when the focus is not in a text input, textarea, choice list, or open dropdown** (so normal editing is never hijacked). The chevron buttons always work.
- **Escape**: closes the dropdown.
- First input of each screen autofocuses (after the transition completes, to avoid mobile scroll jumps).
- All keyboard handling must not interfere with browser shortcuts (Cmd/Ctrl combos pass through).

### 9.6 Modes
- `play` (public): as above.
- `preview` (`/forms/[id]/preview`): same component, **no view ping, no submission**. Show a thin top strip "Preview mode" with an **Exit preview** button. When the user presses Submit on the last question, run client validation, then show the ending screen and a toast "Preview only. This response wasn't saved."

### 9.7 Theme of the player
Reads `theme.mode` from the form: wrap the player in a container with class `dark` when `theme.mode === "dark"`, regardless of the creator's app-level theme. See section 13.

---

## 10. Results

### 10.1 Shell
Builder top bar stays (with the **Results** tab active) and below it a sub-nav: **Summary** | **Responses**. Show the response count next to the form title.

### 10.2 Summary (`/forms/[id]/results`)
- Header strip with three simple numbers from `GET /summary`: **Responses**, **Views**, **Completion rate** (`null` shows "-", otherwise percentage).
- Then one block per question, separated by hairlines (not cards): type icon + number + title, "{answered} answered, {skipped} skipped" in muted text, then:
  - **multiple_choice, dropdown:** horizontal bars per option with label, count, percentage of answered. Orphan options (`is_orphan`) are listed after current options with a muted "(removed)" tag.
  - **yes_no:** two horizontal bars (Yes/No).
  - **rating:** average shown large ("4.2 / {steps}") plus a bar distribution for each value 1..N using `distribution`.
  - **number:** three small stats: Min, Max, Average (show "-" for null).
  - **short_text, long_text, email:** list of the `recent` values (latest 5), each as a quiet row. No "view all" link needed (see Responses).
- Zero responses: the "No responses yet" empty state.

### 10.3 Responses (`/forms/[id]/results/responses`)
- Table (shadcn Table, restyled to the light, spacious style in design doc section 35). Columns: **#**, **Submitted**, then one column per question in position order. Cells truncated with ellipsis; a skipped answer shows a muted "-".
- Join `GET /responses` items with the form's questions (from `useForm`) client-side.
- **Response number:** the backend does not provide one. With default sort `submitted_desc`, number = `total - ((page - 1) * page_size) - rowIndex`; with ascending sort number = `((page - 1) * page_size) + rowIndex + 1`. Display as `#001` style.
- Sortable by Submitted (asc/desc toggle). Server-side pagination (`page_size` 20) with prev/next and a "Showing x-y of z" line. Keep `page` and `r` in the URL.
- Value formatting: yes_no as Yes/No, rating as `4 / 5` (steps from the question), multi-select as comma-joined text, long text truncated, numbers as-is.
- Hover row background; click opens the drawer.
- Disabled "Export CSV" button with "Coming soon" tooltip (P1).

### 10.4 Response drawer
- Sheet from the right (about 480-560px), opened by `?r=<id>`, closeable with Escape / click outside (removes `r`).
- Header: "Response #NNN", "Submitted {formatted date and time}", **Previous / Next** buttons that move within the **currently loaded page** (disabled at the page edges). Disabled "Delete" with "Coming soon" tooltip (P1).
- Body: vertical conversational layout (design doc section 36). For each question in position order: question title (muted, small) then the answer in larger text. Unanswered questions show a muted "No answer". Never dump JSON.
- If the `r` id is not found on the current page, fetch via `GET /responses/{id}`.

---

## 11. Global UI states

- **Toasts** (sonner, bottom-right, 2-3s): Form saved (only on explicit save actions, not every autosave), Question deleted, Form published, Form unpublished, Link copied, Form duplicated, Form deleted, plus error toasts from section 5.5.
- **Loading:** skeletons for the dashboard grid, builder panels, results; "Saving..." indicator in the builder; disabled buttons while mutating. No full-screen spinners (the public player may show a minimal centered fade-in instead).
- **Empty states:** per design doc section 41.
- **Confirmations:** AlertDialog for destructive actions with a visually distinct destructive button. Never use `window.alert/confirm`.

---

## 12. Responsive behavior

| Surface | Desktop (>=1280) | Tablet (~768-1279) | Mobile (<768) |
|---|---|---|---|
| Dashboard | Sidebar + grid | Collapsible sidebar | Single column, sidebar in a Sheet |
| Builder | 3 columns | Left + canvas, right panel in a Sheet | Basic: left panel and settings in Sheets, canvas full width (polish later) |
| Player | Centered column | Same | Full-screen, larger touch targets, no desktop-only hints (hide "press Enter" hint on touch devices), use `100dvh` |
| Results table | Full table | Horizontal scroll | Horizontal scroll, drawer becomes a full-screen Sheet |

---

## 13. Design tokens and dark mode

Use CSS variables (shadcn-compatible naming where possible) so dark mode is a single class swap. **No hardcoded colors in components.** Starting values (light values come from the design doc; dark values are the proposal):

| Token | Light | Dark |
|---|---|---|
| `--background` | `#FFFFFF` | `#111111` |
| `--surface` (secondary bg, sidebar) | `#F7F7F5` / `#FAFAF9` | `#1A1A1A` |
| `--foreground` | `#1A1A1A` | `#F2F2F2` |
| `--muted-foreground` | `#666666` | `#A3A3A3` |
| `--subtle-foreground` | `#8A8A8A` | `#7A7A7A` |
| `--border` | `#E5E5E5` | `#2A2A2A` |
| `--action` (primary button bg) | `#1A1A1A` | `#F2F2F2` |
| `--action-foreground` | `#FFFFFF` | `#111111` |
| `--destructive` | `#D93025` | `#F26B60` |
| `--success` | `#1E8E3E` | `#4CC38A` |
| `--accent` (selected states, question arrow) | pick one restrained color (e.g. a calm blue) | lighter variant |

Question-type icon colors: define `--qt-*` tokens, one muted hue per type with light and dark variants (suggested: short_text blue, long_text indigo, multiple_choice orange, dropdown pink, email teal, number purple, yes_no green, rating amber). Use Lucide icons: `Type`, `AlignLeft`, `ListChecks`, `ChevronDown`, `AtSign`, `Hash`, `ThumbsUp`, `Star`.

Dark mode:
- **App-level** (dashboard, builder, results): `next-themes`, class strategy, system default, with a toggle (Light / Dark / System) in the avatar menu and in the builder top bar. Define tokens under `:root` and `.dark`.
- **Respondent player**: follows the **form's** `theme.mode` (set in the builder's Design tab), by wrapping the player in a `.dark` container. It must not depend on the viewer's app theme. Make sure the Tailwind `dark:` variant matches `.dark` ancestors, not only `<html>`.
- The preview route follows `theme.mode` too, so it matches the public form.

Other design values (type scale, spacing, radius, shadows, animation timings 150/250/400ms) come from the design doc sections 3, 4, 45, 46, 49 and apply unchanged.

---

## 14. Folder structure

```
frontend/src/
  app/
    (app)/forms/page.tsx
    forms/[id]/edit/page.tsx
    forms/[id]/connect/page.tsx
    forms/[id]/results/page.tsx
    forms/[id]/results/responses/page.tsx
    forms/[id]/preview/page.tsx
    f/[slug]/page.tsx
    layout.tsx  providers.tsx  globals.css  not-found.tsx
  components/
    ui/               # shadcn primitives, restyled
    layout/           # AppShell, DashboardSidebar, BuilderTopBar, ThemeToggle
    dashboard/        # FormCard, FormThumbnail, FormGrid, CreateFormModal, RenameFormDialog
    builder/          # BuilderShell, ContentPanel, SortableQuestionItem, QuestionCanvas,
                      # WelcomeCanvas, EndingCanvas, QuestionTypePicker, SettingsPanel,
                      # ShareModal, DestructiveConfirmDialog, SaveIndicator
    questions/        # QuestionRenderer + ShortText, LongText, MultipleChoice, Dropdown,
                      # Email, Number, YesNo, Rating, questionTypeMeta.ts
    respondent/       # FormPlayer, WelcomeScreen, QuestionScreen, EndingScreen,
                      # ProgressIndicator, NavChevrons, OkButton
    results/          # SummaryView, QuestionStats/*, ResponseTable, ResponseDrawer
    common/           # EmptyState, ErrorState, InlineEditableText, Kbd
  lib/
    api/ (client.ts, keys.ts, errors.ts, hooks/*)
    validation/ (answerValidation.ts)    # mirrors backend messages exactly
    format.ts  thumbnail.ts  utils.ts
  store/ builderStore.ts
  types/ api.ts
```

`lib/validation/answerValidation.ts` is a pure `validateAnswer(question, value) -> string | null` using the exact messages in section 8.2. It must be reusable by the player and unit-testable later.

---

## 15. Build phases (each ends with a hard stop for the owner to test)

Do not start a phase until the owner confirms the previous one.

- **F0 Setup:** Next.js app, Tailwind, shadcn init (+ optional MCP), tokens + dark mode scaffolding, Inter, providers (Query, Theme, Toaster), API client, types, keys, health check wired to `GET /health`. *Done when:* app runs, `/forms` shows a placeholder, a typed `GET /forms` call returns the seeded forms in the browser console or a debug list.
- **F1 Dashboard:** section 6 entirely. *Done when:* the 4 seeded forms render with thumbnails, search/filter/sort work, create/rename/duplicate/delete/copy-link work with toasts, empty and loading states exist.
- **F2 Respondent flow + shared renderer:** sections 8-9 (play and preview modes, but preview route can come in F3). *Done when:* `/f/customer-feedback`, `/f/event-registration`, `/f/job-application` can be completed end to end, validation messages match, a 422 jumps to the failing question, the thank-you screen shows, the view counter increments once per load, `/f/product-launch-quiz` shows the unavailable screen.
- **F3 Builder:** section 7 plus the preview route. *Done when:* all 8 types can be added, edited inline, configured, duplicated, deleted (with the 409 flow), reordered by drag and drop, welcome and ending edited, publish/unpublish and share modal work, and Preview matches the public form.
- **F4 Results:** section 10. *Done when:* summary stats, table, pagination, sorting and the response drawer work on seeded data.
- **F5 Polish + docs:** dark mode QA across all screens, responsive pass, animation pass, skeleton/empty/error pass, frontend README section (setup, stack, structure, assumptions). Stop for the owner's UI refinement round.

---

## 16. Reference screenshots (optional but preferred)

If `frontend/docs/reference/` exists, **view the images in it before building each phase and compare**. Expected names (any subset): `dashboard.png`, `create-modal.png`, `builder-main.png`, `type-picker.png`, `builder-settings.png`, `respondent-question.png`, `respondent-choice.png`, `respondent-end.png`, `results-summary.png`, `results-responses.png`. If no images are present, build from this PRD and the design doc, and do not invent pixel-perfect claims.

---

## 17. Items to verify against the running backend (`/docs` or curl) before relying on them

1. Does `PATCH /forms/{id}/questions/{qid}` replace `settings` fully or merge? (Assumption: replace, so always send the complete object.)
2. Does `PATCH` accept `description: null` to clear it? If not, fall back to an empty string and flag it.
3. Does the questions `POST` accept explicit option `id`s and honor them? (Assumption: yes; backend fills if absent.)
4. Exact shape of `PATCH /forms/{id}` for partial nested `welcome` / `thank_you` / `theme` (assumption: partial objects merge, per backend PRD 7.3).
5. Whether the CORS config allows `http://localhost:3000` for all methods used (PATCH, PUT, DELETE).

If any assumption fails, adapt in `lib/api` only and report it in the phase summary. Do not change the API contract without flagging it.
