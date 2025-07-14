# Memory - Minimal Journal App Development

## Key Implementation Details

### File Structure
- **Source files**: `/src/renderer/` contains the main application files
- **Compiled files**: `/dist/renderer/` contains the built application
- **Main files to edit**: `app-browser.js`, `index.html`, `styles.css` in `/src/renderer/`
- **Build command**: `npm run build` copies files from src to dist

### Critical Bug Fixes Completed
1. **Formatting shortcuts (CMD+B/CMD+I)**: Fixed by implementing directly in `app-browser.js` (the actual runtime file)
2. **Edit functionality (CMD+E)**: Implemented keyboard shortcut instead of buttons per user request
3. **Escape key handling**: Fixed by using Electron's shortcut system instead of document event listeners

### Settings System Implementation
- **Location**: Settings modal accessible via cog wheel (™) in top-right corner
- **Features**: Font family (9 options including Comic Sans MS), font size slider (12-24px), light/dark theme
- **Persistence**: Uses localStorage for all settings
- **CSS Integration**: Uses CSS custom properties (`--app-font-family`, `--app-font-size`) for dynamic styling

### Export Functionality
- **Location**: Moved from home header into settings panel per user request
- **Implementation**: Full-width button in settings modal for better organization

### Keyboard Shortcuts
- **CMD+B/CMD+I**: Bold/italic formatting in journal screen
- **CMD+E**: Edit entry in view screen
- **Escape**: Close modals (settings, filter) and navigate back
- **Global shortcuts**: Handled by Electron's shortcut system via `window.electronAPI.onShortcut`

### Code Architecture Notes
- **Dual JavaScript files**: `app.ts` (TypeScript source) and `app-browser.js` (runtime JavaScript)
- **Critical**: Always edit `app-browser.js` for immediate functionality
- **Event handling**: Electron shortcuts take precedence over document event listeners
- **Modal system**: Uses CSS classes `.modal.active` for visibility

### User Preferences
- Prefers keyboard shortcuts over buttons
- Wants comprehensive settings with many font options
- Values clean, organized UI (moving export to settings panel)
- Requires thorough testing and debugging

### Next Priority Task
- Password/thumbprint protection for app security (remaining high-priority item)