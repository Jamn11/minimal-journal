# Minimal Journal App - Development Memory

## Project Overview
This is a minimal journal Electron app with a clean, three-screen architecture built for simplicity and privacy.

## Recent Major Features Implemented

### Settings Redesign (Browser-like Interface)
- **Full-size settings modal** replacing small popup
- **Tabbed interface** with Appearance, Habits, Templates, Security, and General tabs
- **macOS integration** with proper spacing for traffic light buttons
- **Keyboard navigation** using Ctrl+Tab and Ctrl+Shift+Tab between tabs
- **Auto-save functionality** for all settings changes

### Habits Tracking System
- **7x7 streak grid** showing last 49 days of writing activity
- **Large streak counter** displaying current consecutive writing days
- **Responsive layout** with three equal-sized boxes (280px × 320px)
- **Daily notifications settings** (UI complete, backend placeholder)
- **Real-time updates** when new entries are saved

### Advanced Security Features
- **Optional passcode protection** for app access
- **SHA-256 password hashing** for secure storage
- **Enhanced password requirements** (6+ characters, strength validation)
- **Brute force protection**:
  - 10-second lockout after 3 failed attempts
  - 30-second lockout after 5 failed attempts
  - 500ms delay on all password verifications
- **Session management** with 30-minute auto-lock and activity detection
- **Secure modal handling** preventing ESC/click-outside bypass
- **Password verification required** to disable protection

### Entry Management Improvements
- **Timestamp preservation** when editing existing entries (maintains list order)
- **Last modified tracking** showing both created and last modified dates
- **Enhanced display** with improved timestamp formatting

## Database Schema Updates
Added `lastModified` field to entries table:
```sql
- id (UUID primary key)
- title (TEXT)
- body (TEXT)
- timestamp (TEXT, ISO format)
- lastModified (TEXT, ISO format) -- NEW
- tags (TEXT, JSON array)
- draft (INTEGER, 0/1)
```

## Key Technical Implementations

### Security Architecture
- **Password hashing**: SHA-256 with proper encoding
- **Lockout mechanism**: Progressive delays with time-based lockouts
- **Session timeout**: Activity detection with automatic re-locking
- **Modal security**: Event propagation prevention for password inputs
- **Storage security**: Secure localStorage usage for hashed passwords

### UI/UX Patterns
- **Responsive design**: Flexbox layouts that adapt to window size
- **Browser-like tabs**: Native browser tab styling with proper z-index layering
- **Consistent theming**: CSS custom properties for dynamic font/theme changes
- **Visual feedback**: Color-coded success/error messages with theme support

### Code Architecture
- **Dual JavaScript system**: TypeScript source + runtime JavaScript files
- **Event-driven design**: Comprehensive event listeners with proper cleanup
- **State management**: localStorage for persistence + in-memory state
- **Security state tracking**: Failed attempts, lockout timers, session management

## Development Workflow
1. **Always edit** `src/renderer/app-browser.js` for immediate functionality changes
2. **TypeScript source** `src/renderer/app.ts` exists but is not used at runtime
3. **Build process** copies essential files to `dist/renderer/`
4. **Testing** uses Jest for units, Playwright for E2E

## Current App State (v1.1.0+)
- ✅ Complete settings redesign with tabbed interface
- ✅ Full habits tracking with visual progress indicators
- ✅ Enterprise-grade security with passcode protection
- ✅ Enhanced entry management with timestamp preservation
- ✅ Responsive design across all components
- 🔄 Templates tab (placeholder for future functionality)
- 🔄 Notification backend (UI complete, implementation pending)

## Critical File Locations
- **Runtime Logic**: `src/renderer/app-browser.js` (1200+ lines)
- **HTML Structure**: `src/renderer/index.html`
- **Styling**: `src/renderer/styles.css` (980+ lines)
- **Database**: `src/main/database.ts`
- **Main Process**: `src/main/main.ts`

## Future Enhancement Areas
1. **Templates System**: Entry templates with custom placeholders
2. **Notification Backend**: Actual notification scheduling and delivery
3. **Data Sync**: Optional cloud backup/sync functionality
4. **Advanced Filtering**: Date ranges, tag combinations, full-text search
5. **Export Options**: PDF, plain text, other formats beyond JSON

The app maintains its minimalist philosophy while adding powerful features for productivity and security.