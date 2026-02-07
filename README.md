# Minimal Journal

Minimal Journal is a local-first desktop journal built with Electron + TypeScript.

## What It Does

- Create, edit, and delete entries
- Save drafts and finish them later
- Parse `#tags` automatically from entry text
- Search by text and filter by tags/date range
- Export non-draft entries to Markdown
- Track writing streaks in the settings view
- Optional app passcode protection

## Security Defaults

- Electron `contextIsolation` enabled
- Electron `nodeIntegration` disabled
- Strict renderer Content Security Policy
- Main-process IPC payload validation
- Passcode hashes are PBKDF2-derived and stored encrypted via Electron `safeStorage`
- Constant-time passcode comparison (`crypto.timingSafeEqual`)

## Requirements

- Node.js 18+ (20+ recommended)
- npm
- macOS, Windows, or Linux

## Quick Start

```bash
git clone <your-fork-or-repo-url>
cd minimal-journal
npm install
npm run setup:hooks
npm run dev
```

## Scripts

- `npm run build`: compile main/shared TypeScript and copy renderer assets
- `npm run dev`: build and launch app
- `npm start`: launch built app
- `npm run test:unit`: run Jest unit tests
- `npm test`: run Playwright Electron tests
- `npm run dist:mac`: build macOS artifacts
- `npm run dist:win`: build Windows artifacts
- `npm run dist:linux`: build Linux artifacts

## Data Storage

Journal entries are stored locally in SQLite at your Electron user-data directory:

- macOS: `~/Library/Application Support/minimal-journal/journal.db`
- Windows: `%APPDATA%/minimal-journal/journal.db`
- Linux: `~/.config/minimal-journal/journal.db`

For tests/dev automation, you can override this location with:

- `MINIMAL_JOURNAL_USER_DATA_DIR=/path/to/custom/dir`

## Keyboard Shortcuts

- `Cmd/Ctrl+N`: New entry
- `Cmd/Ctrl+S`: Save entry
- `Cmd/Ctrl+F`: Focus search
- `Cmd/Ctrl+E`: Edit viewed entry
- `Cmd/Ctrl+D`: Delete current editable entry
- `Cmd/Ctrl+M`: Toggle theme
- `Escape`: Close modal / back / save as draft (context dependent)

## Release Push Safeguards

This repo ships a managed pre-push hook in `.githooks/pre-push`.

- Blocks pushes to:
  - `refs/tags/v*`
  - `refs/tags/release-*`
  - `refs/heads/release/*`
- Sets `push.followTags=false` for this repo via `npm run setup:hooks`

Override intentionally:

```bash
ALLOW_RELEASE_PUSH=1 git push ...
```

## Testing Status

Current repo validation:

- `npm run build` passes
- `npm run test:unit` passes
- `npm test` passes

## License

MIT
