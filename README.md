# Minimal Journal

A clean, minimalist journal app built with Electron and TypeScript. Perfect for daily journaling with automatic tag parsing, search functionality, comprehensive settings, and a distraction-free interface.

## Features

### Core Functionality
- **Clean Interface**: Minimalist design with customizable themes and fonts
- **Three Main Screens**: Home (entry list), Journal (writing), and View (reading)
- **Automatic Tagging**: Use `#hashtags` in your entries for automatic tag parsing
- **Search & Filter**: Search by content, filter by tags and date ranges
- **Draft System**: Auto-save drafts with ESC key, continue editing later
- **Text Formatting**: Bold (`**text**`) and italic (`*text*`) markdown support with keyboard shortcuts
- **Local Storage**: All data stored locally in SQLite database
- **Update Safe**: User data persists through app updates

### Advanced Features
- **Arrow Key Navigation**: Navigate home screen with arrow keys, press Enter to activate
- **Keyboard Shortcuts**: Full keyboard navigation for productivity
- **Export Functionality**: Export all entries to markdown format
- **Habits Tracking**: 7x7 streak grid showing writing progress with daily streak counter
- **Security Protection**: Optional passcode protection with secure encryption
- **Comprehensive Settings**: Tabbed interface with 5 categories (Appearance, Habits, Templates, Security, General)
- **Enhanced UI**: Maximized window startup, improved button sizing, settings cogwheel
- **Robust Error Handling**: Graceful error recovery and comprehensive validation

## Installation

### macOS

1. Download the appropriate file from the `release` folder:
   - **Intel Macs**: `minimal-journal-1.3.0-x64.dmg`
   - **Apple Silicon (M1/M2)**: `minimal-journal-1.3.0-arm64.dmg`

2. Open the DMG file and drag "Minimal Journal" to your Applications folder

3. Launch the app from Applications

*Note: The app is not code-signed, so you may need to allow it in System Preferences > Security & Privacy*

## Keyboard Shortcuts

### Navigation
- **CMD+N**: Create new entry (from Home Screen)
- **CMD+F**: Focus search bar (from Home Screen)
- **CMD+,**: Open settings (from Home Screen)
- **Arrow Keys**: Navigate home screen elements (search, filter, settings, entries)
- **Enter**: Activate selected element during arrow key navigation
- **ESC**: Save as draft and go home (from Journal Screen) OR go back home (from View Screen) OR close modals OR deactivate navigation

### Writing & Editing
- **CMD+S**: Save entry (from Journal Screen)
- **CMD+E**: Edit entry (from View Screen)
- **CMD+B**: Bold formatting (from Journal Screen)
- **CMD+I**: Italic formatting (from Journal Screen)
- **CMD+D**: Delete entry (from Journal Screen, when editing existing entry)

### Settings & Themes
- **CMD+M**: Toggle between dark/light theme
- **Enter**: Save settings and close (from Settings Modal)

## Settings

Access settings via the ⚙️ icon in the top-right corner or press **CMD+,** from the home screen. The settings interface features a tabbed layout with 5 categories:

### Appearance Tab
- **Font Family Options**: Choose from 9 different fonts including Courier New (default), Georgia, Times New Roman, Arial, Helvetica, SF Pro Text, Consolas, Fira Code, and Comic Sans MS
- **Font Size**: Adjustable from 12px to 24px via slider with real-time preview
- **Themes**: Switch between Dark Mode (default) and Light Mode with instant preview

### Habits Tab
- **Writing Streak Grid**: 7x7 grid showing last 49 days of writing activity
- **Streak Counter**: Large display of current consecutive writing days
- **Daily Reminders**: Configurable notification settings with time and frequency options

### Templates Tab
- **Entry Templates**: Placeholder for future template functionality

### Security Tab
- **Password Protection**: Optional passcode protection for app access
- **Secure Storage**: Passwords encrypted using industry-standard security
- **Brute Force Protection**: Protection against password attacks with lockout periods
- **Session Management**: Auto-lock after 30 minutes of inactivity

### General Tab
- **Data Export**: Export all entries to markdown format with preserved formatting
- **Backup Options**: Direct access to export functionality

## Usage

### Creating Entries

1. Press **CMD+N** from the home screen to create a new entry
2. Enter a title and write your journal entry
3. Use `#hashtags` anywhere in your text for automatic tagging
4. Use **CMD+B** for **bold** and **CMD+I** for *italic* formatting
5. Press **CMD+S** to save, or **ESC** to save as draft

### Managing Entries

- **Drafts**: Appear with a "DRAFT" indicator, click to continue editing
- **Completed Entries**: Click to view in read-only mode
- **Edit**: Press **CMD+E** while viewing an entry to edit it
- **Delete**: When editing an entry, press **CMD+D** to delete (with confirmation)

### Search & Filter

- **Search**: Type in the search bar to find entries by title or content
- **Filter**: Click "Filter" button for advanced filtering by tags and date ranges
- **Clear**: Use "Clear" in filter modal to reset all filters

### Text Formatting

- **Bold**: Surround text with `**double asterisks**` or use **CMD+B**
- **Italic**: Surround text with `*single asterisks*` or use **CMD+I**
- **Live Preview**: Formatting is displayed in the view screen
- **Keyboard Shortcuts**: Select text and use CMD+B/CMD+I for quick formatting

### Customization

- **Font Family**: Choose from 9 different font options
- **Font Size**: Adjust from 12px to 24px for comfortable reading
- **Theme**: Switch between dark and light modes
- **Settings Persistence**: All preferences are saved and restored on app restart

## Development

### Prerequisites

- Node.js 16 or later
- npm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd minimal-journal

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run end-to-end tests
npm run test

# Count lines of code
node count-lines.js
```

## Technical Details

- **Framework**: Electron 27 with TypeScript
- **Database**: SQLite3 for local data storage
- **Architecture**: Main process (Node.js) + Renderer process (Web)
- **Styling**: CSS with CSS variables for theming and dynamic font sizing
- **Security**: Context isolation enabled, node integration disabled, secure password storage with PBKDF2 and AES encryption
- **Code Quality**: ~4,000 lines of code across 25+ source files
- **Error Handling**: Comprehensive error boundaries and graceful recovery mechanisms
- **Performance**: Memory leak prevention, efficient DOM manipulation, event listener cleanup

## Data Storage

- **Location**: Application data is stored in your system's user data directory
  - **macOS**: `~/Library/Application Support/Minimal Journal/journal.db`
  - **Windows**: `%APPDATA%/Minimal Journal/journal.db`
  - **Linux**: `~/.config/Minimal Journal/journal.db`
- **Format**: SQLite database with entries table
- **Backup**: Database file can be manually backed up from the user data directory
- **Update Safe**: User data persists through application updates

## Utilities

- **Line Counter**: Use `node count-lines.js` to get detailed code statistics
- **Export Tool**: Built-in export functionality for backing up entries
- **Memory Documentation**: See `memory.md` for development notes and architecture details

## License

MIT License - Feel free to use and modify as needed.

## Support

This is an open-source project. For issues or feature requests, please check the project repository.