# Jot

Jot is a local-first proactive memory layer for macOS. It watches workflow context (frontmost app) and resurfaces the most relevant notes in a corner overlay when you switch apps. Notes and attachments stay on disk (SQLite); optional Anthropic-powered helpers can organize folders or suggest what to do from your notes after you add an API key.

**Shortcuts:** ⌘P (⌃P) opens search from anywhere. ⌘N opens capture from the main window.

## Tech Stack

- Electron
- Node.js
- SQLite (`better-sqlite3`)
- Electron Builder

## Download

**macOS (Apple Silicon + Intel):** download the universal `.dmg` from the **[latest GitHub release](https://github.com/parthha12/jot/releases/latest)**. **Jot Launch** (v2.0.0) is the current shipping line for macOS.

## Docs

- **[Purpose, stack, infra, and functionality](docs/jot-overview.md)** — start here for what Jot is and how it is built/shipped
- **[Technical deep dive](docs/repository-summary.md)** — architecture, modules, data model

## Getting Started

```bash
npm install
npm start
```

## Scripts

- `npm start` - Run app in development
- `npm test` - Run tests (`node --test tests/*.js`)
- `npm run rebuild` - Rebuild native modules
- `npm run clean:dist` - Delete `dist/` (build artifacts only; safe to run anytime)
- `npm run dist` - Build macOS arm64 distribution
- `npm run dist:universal` - Build macOS universal distribution
- `npm run dist:signed` - Build signed macOS distribution
