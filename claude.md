# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

### Build and Run
- `npm run build` - Compiles TypeScript and copies renderer files to dist/
- `npm run dev` - Builds and starts the Electron app in development mode
- `npm start` - Runs the built Electron app
- `npm run pack` - Builds and packages the app (no installer)
- `npm run dist` - Builds and creates distributable packages

### Testing
- `npm run test` - Runs Playwright end-to-end tests
- `npm run test:unit` - Runs Jest unit tests
- `npm test` - Runs Playwright tests (same as npm run test)

### Distribution
- `npm run dist:mac` - Creates macOS distributable (dmg and zip)
- `npm run dist:win` - Creates Windows distributable (nsis and portable)
- `npm run dist:linux` - Creates Linux distributable (AppImage and deb)

## Project Architecture

### Core Structure
This is an Electron-based minimalist journal app with a three-screen architecture:
1. **Home Screen** - Search, filter, and browse entries
2. **Journal Screen** - Write/edit entries with auto-tagging
3. **View Screen** - Read individual entries

### Critical File Locations
- **Runtime JavaScript**: `src/renderer/app-browser.js` - This is the actual runtime file that must be edited for functionality
- **TypeScript Source**: `src/renderer/app.ts` - Original TypeScript source (not used at runtime)
- **Main Process**: `src/main/main.ts` - Electron main process and menu setup
- **Database**: `src/main/database.ts` - SQLite database operations
- **Preload**: `src/main/preload.ts` - Electron context bridge for IPC

### Database Schema
Uses SQLite with entries table:
- `id` (UUID primary key)
- `title` (TEXT)
- `body` (TEXT)
- `timestamp` (TEXT, ISO format)
- `lastModified` (TEXT, ISO format) - tracks when entries are edited
- `tags` (TEXT, JSON array)
- `draft` (INTEGER, 0/1)

### Key Features
- **Auto-tagging**: Entries are parsed for #hashtags during save
- **Formatting**: CMD+B/CMD+I for bold/italic in journal screen
- **Settings**: Font family (9 options), font size (12-24px), light/dark theme with browser-like tabbed interface
- **Habits Tracking**: 7x7 streak grid showing writing progress, large streak counter, daily notification settings
- **Security**: Optional passcode protection with SHA-256 hashing, brute force protection, session timeout
- **Export**: JSON export of all entries via settings panel
- **Keyboard Shortcuts**: 
  - CMD+N: New entry
  - CMD+E: Edit entry (view screen)
  - CMD+F: Focus search
  - CMD+S: Save draft
  - ESC: Navigate back/close modals
  - CTRL+Tab/CTRL+Shift+Tab: Navigate settings tabs

### Build Process
The build command copies three essential files from `src/renderer/` to `dist/renderer/`:
- `app-browser.js` (runtime JavaScript)
- `index.html` (main HTML)
- `styles.css` (all styling)

### Testing Architecture
- **Unit Tests**: Jest for individual functions (`src/main/__tests__/`, `src/renderer/__tests__/`)
- **E2E Tests**: Playwright for full application testing (`tests/`)
- **Test Database**: Uses in-memory SQLite for testing

### Development Notes
- **Dual JavaScript Architecture**: Both `app.ts` (TypeScript) and `app-browser.js` (runtime JS) exist - always edit the runtime file for immediate changes
- **Settings Persistence**: Uses localStorage for user preferences and security settings
- **CSS Custom Properties**: Dynamic theming via `--app-font-family`, `--app-font-size`
- **Electron Shortcuts**: Global shortcuts handled via `window.electronAPI.onShortcut`
- **Security Architecture**: Password hashing with SHA-256, brute force protection, session management
- **Responsive Design**: Settings tabs and habits page adapt to window size with flexbox layouts

## Important Conventions
- Use Courier New font family as default
- Minimalist aesthetic with dark/light mode support
- Auto-save drafts on ESC key
- Case-sensitive tag system with # prefix
- Word count display in journal screen
- Preserve original timestamps when editing entries to maintain list order
- No external dependencies beyond Electron ecosystem

## Settings Architecture
The app uses a full-size, browser-like tabbed settings interface with five tabs:

### Appearance Tab
- Font family selection (9 options)
- Font size slider (12-24px) with live preview
- Light/Dark theme toggle buttons

### Habits Tab
- **Streak Grid**: 7x7 grid showing last 49 days of writing activity
- **Streak Counter**: Large number display of current consecutive writing days
- **Daily Reminders**: Notification settings (enable/disable, time, frequency)

### Templates Tab
- Placeholder for future entry template functionality

### Security Tab
- **Password Protection Toggle**: Enable/disable app-level security
- **Password Setup**: Set initial passcode (6+ characters, strength validation)
- **Password Change**: Verify current password before setting new one
- **Security Features**:
  - SHA-256 password hashing
  - Brute force protection (lockouts after failed attempts)
  - 30-minute session timeout with activity detection
  - Secure modal handling (ESC disabled, no click-outside-to-close)

### General Tab
- Data export functionality (JSON format)

## Security Implementation Details

### Password Protection Flow
1. **Enable Protection**: User checks checkbox → Password setup form appears
2. **Set Password**: Enter + confirm password → Hashed and stored in localStorage
3. **App Startup**: If protection enabled → Password entry modal blocks access
4. **Disable Protection**: Requires current password verification via modal
5. **Change Password**: Requires current password + new password confirmation

### Security Measures
- **Hashing**: SHA-256 cryptographic hashing for password storage
- **Brute Force Protection**: 
  - 10-second lockout after 3 failed attempts
  - 30-second lockout after 5 failed attempts
  - 500ms delay on all password verifications
- **Session Management**: 30-minute auto-lock with user activity detection
- **Modal Security**: Password modals cannot be closed with ESC or click-outside
- **Input Validation**: Strong password requirements with real-time feedback