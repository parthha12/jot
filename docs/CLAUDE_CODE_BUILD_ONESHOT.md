# Claude Code — one-shot: build Proactive Recall

Use this document as the **single task specification**. Complete the work in the **proactive-recall** repository (this repo). When stuck or when patterns already exist, read the **jot** repo in the same workspace as reference only—do not copy voice, TTS, STT, or web-search features.

---

## Product name

**Proactive Recall** — a local-first desktop notes app that (1) helps you capture and organize notes with keyboard shortcuts, (2) runs an **in-app-only** AI assistant for search and reorganization, and (3) **surfaces relevant notes when you switch to selected apps** (e.g. Messages, WhatsApp), based on **frontmost application only** (no screen capture, no OCR, no per-contact/thread intelligence in v1).

---

## Non-goals for v1 (do not implement)

- Voice: no microphone, dictation, speech-to-text, or text-to-speech.
- Web: no web search, no URL fetching, no “browse the internet” agent tools.
- Screen: no screen recording, no full-screen or window OCR, no vision APIs for context.
- Per-person / per-chat triggers: only “which app is frontmost,” not window title parsing for contact names (that is a future milestone).

---

## Functional goals (must ship)

### 1. Notes core

- Create, read, update, delete notes (plain text is enough for v1; rich text optional).
- Folders (or equivalent) for organization.
- Autosave or explicit save—behavior should be predictable and documented in README.

### 2. Keyboard-first control

- Global and/or in-app shortcuts for: show/hide main window, new note, focus search, and any other actions needed for daily use.
- Document shortcuts in README.

### 3. In-app AI assistant (local data only)

- A panel or mode where the user chats in **text** with an assistant.
- The assistant may only act through **tools** that read and mutate **data stored by this app** (e.g. list/search notes, move between folders, update content, create folders).
- System instructions must enforce: **no external knowledge as source of truth**; if the user asks about something not in the library, say so and offer to help organize/search what exists.
- Requires API key or config documented in `.env.example` / README (implementation choice is yours).

### 4. Proactive surfacing (frontmost app only)

- Background loop: detect when the **frontmost macOS application** changes (poll at a sensible interval, e.g. 1–2s).
- Normalize identity using **bundle ID** where possible; fallback to stable app name mapping for known apps.
- Data model: notes (or a dedicated “surface rule” entity) can be associated with **one or more bundle IDs** (e.g. `com.apple.MobileSMS`, WhatsApp’s bundle id).
- When the user **switches into** an app that matches at least one linked note/rule, **surface** a non-intrusive UI (e.g. corner overlay or in-app toast): show title/snippet and dismiss/snooze.
- **Cooldown / snooze**: do not re-show the same item every tick while the app stays frontmost; respect snooze and “don’t auto-surface” if you add it.
- **Toggle**: user can disable proactive surfacing globally.
- Document macOS permissions (e.g. Automation / Accessibility) if your detection method requires them.

### 5. Trust and control

- Clear on/off for proactive surfacing.
- Dismiss and snooze on surfaced items.
- Data stays local (SQLite or equivalent); no account or cloud sync required for v1.

---

## Reference repository (optional, when needed)

Workspace sibling: **jot** (Chapter3 notes app).

Use it **only** for patterns such as: Electron main/preload/renderer IPC, SQLite migrations, global shortcuts, scheduler-style loops, and **app-frontmost** detection ideas. **Strip** anything related to voice, TTS, browser URL workflow, or features outside this spec.

Do **not** reuse Jot’s `appId`, product name, or database filename—Proactive Recall must be a **separate app** with its own identity and user data path.

---

## Deliverables

1. **Runnable app** from clone + install + config (README with exact steps).
2. **`.gitignore`** appropriate for the stack you choose.
3. **`README.md`**: what it does, shortcuts, how to configure AI, how surfacing works, macOS permission notes, non-goals.
4. **`.env.example`** (or config template) for secrets; never commit real keys.
5. **Tests** where they add confidence without blocking a first release (e.g. pure logic for matching, cooldowns, tool contracts)—optional but encouraged.

---

## Execution guidance

- Prefer **one coherent vertical slice** over scattered stubs: e.g. notes + DB + window, then shortcuts, then surfacing, then assistant tools.
- Keep the assistant **tool list closed**; no HTTP tools for arbitrary URLs in v1.
- After major milestones, run the app locally and fix obvious breakage before declaring done.

When finished, summarize what was built, how to run it, and list any **known limitations** aligned with the non-goals above.
