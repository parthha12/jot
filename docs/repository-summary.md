# Jot Repository Summary

This document is a comprehensive technical overview of the `jot` repository for onboarding, handoff, and maintenance.

**Purpose, stack, infra, and product behavior at a glance:** see [jot-overview.md](./jot-overview.md).

## 1) What this repo is

`jot` is a local-first macOS desktop notes app built with Electron. It captures notes quickly, links notes to app context, and proactively surfaces relevant notes when specific apps become frontmost.

The app combines:

- local note storage (SQLite) and on-disk attachments
- context detection (frontmost app polling on macOS via AppleScript / System Events)
- proactive surfacing (corner overlay with ranked cards)
- optional AI features (Anthropic Claude) when the user sets an API key: folder organization chat + apply, and a separate “night” assistant that suggests what to do from existing notes

There is no menu-bar tray in the current build: three windows (search, capture, overlay) plus a background watcher.

## 2) Runtime stack and tooling

### Core runtime

- Electron (desktop shell + multi-window app)
- Node.js (main process + app logic)
- SQLite via `better-sqlite3` (local persistence)

### Build and packaging

- `electron-builder` for macOS artifacts
- notarization hook in `scripts/notarize.js`
- entitlements in `build/entitlements.mac.plist`

### Package manager

- npm (`package-lock.json` present)

### Scripts (from `package.json`)

- `npm start` - run app in development
- `npm test` - run tests via Node test runner
- `npm run rebuild` - rebuild native modules
- `npm run clean:dist` - remove `dist/` (electron-builder output)
- `npm run dist` / `dist:arm64` - clean then build arm64 distribution
- `npm run dist:universal` - clean then build universal distribution
- `npm run dist:signed` - clean then build signed distribution

## 3) High-level architecture

### Main process

`app-main.js` is the central orchestrator:

- creates/manages capture, search, and overlay windows
- registers IPC handlers used by renderer processes
- initializes DB and background services
- coordinates app watcher → `surfaceEngine` → overlay
- registers the privileged `jot-image:` protocol for loading pasted images under CSP
- handles attachment storage, DB import/export menu actions, and overlay focus/restoration (re-activate the surfaced-from app when the overlay closes)

### Preload security boundary

- `preload.js` (main/search/capture bridge — exposes `window.mvp`)
- `overlay/overlay-preload.js` (overlay bridge)

These expose constrained APIs through `contextBridge`.

### Data and persistence

`database.js` handles:

- schema creation and in-place migration from older shapes (e.g. legacy title/content columns)
- CRUD, folders, app links, surface state, participants, attachments
- import/export and DB replacement; merge from legacy paths; deduplication helper
- `surface_events` logging and scoring for ranking (opens and recency)

### Context and surfacing domain

- `appWatcher.js` - polls frontmost app (~1.5s) on macOS; maintains a short buffer of recent app transitions for scoring
- `knownApps.js` - bundle IDs, display names, and resolver helpers
- `noteAppScan.js` - keyword / alias matching from note text to apps
- `surfaceEngine.js` - merges explicit app links + keyword candidates, applies per-note caps, time-of-day and recency bonuses, transition boost, and DB-backed engagement score

### Reminder shorthand

- `remindWorkflowParser.js` - parses capture text of the form `remind me this: … when i open this <app>` into reminder body + app query (wired through IPC from `renderer/capture.js`)

### UI layers

- `renderer/` - main search UI, capture flow, folders, attachments, AI panels
- `overlay/` - proactive surfaced-note overlay

Key files:

- `renderer/renderer.js`
- `renderer/capture.js`
- `overlay/overlay.js`

### AI integration

`aiOrganize.js` integrates with the Anthropic Messages API:

- **Organize chat**: model returns JSON with a human `reply` and a `plan` (create folders, move notes). Main process applies the plan via `applyOrganizePlan`.
- **Night chat**: separate system prompt; suggests a few concrete actions from the user’s notes given their message (evening / energy context).

Credentials are read **only** from the app’s user-data directory `.env` (see `readAnthropicCredentials`) or the in-app API key flow that writes there — not from the repo working directory or shell `process.env`, so packaged installs do not accidentally pick up developer keys.

## 4) Main product workflows

### Workflow A: App startup

1. Electron app initializes.
2. DB is opened/initialized (migrations and optional legacy DB merge).
3. Windows and IPC endpoints are registered; `jot-image` protocol handler is attached to the session.
4. App watcher starts polling the frontmost app (macOS only).

### Workflow B: Quick capture

1. User enters text in the capture window (or uses meeting quick-capture from the main UI).
2. Optional: `remind me this: … when i open this …` is parsed; body and app link are derived automatically.
3. Renderer invokes preload API; main process persists the note and optional app link.
4. Capture window can hide after save.

### Workflow C: Search and edit notes

1. **Global** shortcut **⌘P** (Control+P) shows the search window.
2. From the search window, **⌘N** opens capture (this is not a separate global shortcut in `app-main.js`).
3. Main UI loads recent/search results, folders, note detail, images, and whitelisted file attachments.
4. Updates go through IPC; `text` is the primary note field (first line is often used as preview in lists and AI snapshots).

### Workflow D: Proactive surfacing

1. Watcher detects frontmost app change (skips when Jot itself is frontmost to avoid wrong context).
2. Surface engine resolves bundle ID, gathers linked + keyword-matched notes, ranks with analytics/recency/time-of-day/transition signals.
3. Up to three notes are sent to the overlay; `surface_events` records `surfaced`.
4. Overlay shows cards (including participants when present). Auto-dismiss timer (~12s in `APP_CONFIG`) applies.
5. User actions record events (`opened`, `snoozed`, `completed`, etc.) and update `note_surface_state` / completion.

### Workflow E: Attachments

1. Images: pasted or picked; stored under `userData/note-images`; served in UI via `jot-image://` IDs.
2. Files: whitelist extensions only (`pdf`, `md`, `rmd`, `txt`); stored under `userData/note-files`; open via validated path + `shell.openPath`.

### Workflow F: Meeting quick capture

1. From the main UI, quick-capture can create a note prefixed `[Meeting]`, optionally tag a participant, auto-link the note to Zoom (`us.zoom.xos`), and store the participant in `note_participants`.

### Workflow G: AI-assisted organization and night mode

1. User sets Anthropic API key (in-app or userData `.env`).
2. Organize: renderer sends message + history; main process attaches a JSON snapshot of folders and note previews; user can apply returned plan.
3. Night: renderer sends message + history; model replies with short suggestions grounded in note previews (no automatic DB writes from that path).

## 5) Data model and storage

### Database

Core tables (managed in `database.js`):

- `notes` — `text`, timestamps, `completed_at` for done state
- `note_app_links` — explicit note ↔ bundle ID links
- `note_surface_state` — snooze, dismiss, per-day surfacing caps
- `note_images` / `note_files` — attachment metadata
- `folders` / `folder_app_links`
- `surface_events` — analytics stream (`surfaced`, `opened`, `snoozed`, `completed`, …)
- `note_participants` — optional people tags (e.g. meetings)

### File storage

- Images and files live under the app’s `userData` subfolders; DB holds paths and metadata.

### Migration strategy

- Migration is handled in-process inside `database.js` (no separate migrations directory).

## 6) Integrations and external dependencies

- **Anthropic API** (`https://api.anthropic.com/v1/messages`) in `aiOrganize.js` — **optional**, user-provided key
- **macOS AppleScript / System Events** in `appWatcher.js` for frontmost app (Automation permission for the app)
- **OS-level open behavior** via Electron `shell` APIs
- **Apple notarization** through `@electron/notarize` in the release pipeline

## 7) Testing and quality status

Tests under `tests/` (Node’s built-in test runner):

- `tests/test-note-app-scan.js`
- `tests/test-surface-engine.js`
- `tests/test-remind-workflow-parser.js`

Observations:

- no broad integration tests for IPC + DB flows
- no E2E test suite for core user journeys
- no explicit lint/typecheck script in `package.json`

## 8) Security and privacy considerations

### Good patterns present

- context isolation and preload bridge model
- constrained IPC surface between renderer and main
- local-first storage for notes and attachments
- API keys scoped to userData `.env`, not repo environment

### Areas to watch closely

- real keys must never be committed (see `.env.example`)
- attachment path validation on open (main process checks paths stay under attachment roots)
- privacy UX around continuous app-context polling
- overlay CSP (inline styles, custom protocol) — hardening opportunity

## 9) Known operational notes

- `docs/packaged-app-data-mismatch.md` documents a packaged-vs-dev data-path mismatch investigation and should be reviewed before release work.

## 10) Configuration notes

- **Runtime tuning** (overlay dismiss, min gap between surfaces, max surfaced notes, default snooze) lives in `APP_CONFIG` in `app-main.js`.
- **Watcher poll interval** is the `POLL_INTERVAL_MS` constant in `appWatcher.js`.
- **UserData `.env`**: `ANTHROPIC_API_KEY` and optional `PROACTIVE_RECALL_MODEL` are consumed by `aiOrganize.js`. Other `PROACTIVE_RECALL_*` variables may appear in `.env.example` as documentation for future wiring; verify `aiOrganize.js` and `app-main.js` before relying on them.

## 11) Suggested reading order (new contributors)

1. `README.md`
2. `package.json`
3. `app-main.js`
4. `database.js`
5. `preload.js`
6. `renderer/renderer.js`
7. `renderer/capture.js`
8. `appWatcher.js`
9. `surfaceEngine.js`
10. `aiOrganize.js`
11. `remindWorkflowParser.js`
12. `overlay/overlay.js`
13. `docs/packaged-app-data-mismatch.md`

## 12) Suggested next improvements

- add integration tests for IPC + DB boundaries
- add E2E tests for capture → surface → open workflows
- add lint/typecheck scripts to CI
- strengthen secret scanning and pre-commit checks
- continue simplifying DB path/migration behavior for packaged builds
- wire optional `PROACTIVE_RECALL_*` env overrides if product needs runtime tuning without code changes
