# Minimal Journal

A clean, minimalist journal app built with Electron and TypeScript. Perfect for daily journaling with automatic tag parsing, search functionality, and a distraction-free interface.

## Features

- **Clean Interface**: Minimalist design with dark mode default and Courier New font
- **Three Main Screens**: Home (entry list), Journal (writing), and View (reading)
- **Automatic Tagging**: Use `#hashtags` in your entries for automatic tag parsing
- **Search & Filter**: Search by content, filter by tags and date ranges
- **Draft System**: Auto-save drafts with ESC key, continue editing later
- **Keyboard Shortcuts**: Full keyboard navigation for productivity
- **Local Storage**: All data stored locally in SQLite database

## Installation

### macOS

1. Download the appropriate file from the `release` folder:
   - **Intel Macs**: `minimal-journal-1.0.0-x64.dmg`
   - **Apple Silicon (M1/M2)**: `minimal-journal-1.0.0-arm64.dmg`

2. Open the DMG file and drag "Minimal Journal" to your Applications folder

3. Launch the app from Applications

*Note: The app is not code-signed, so you may need to allow it in System Preferences > Security & Privacy*

## Keyboard Shortcuts

- **CMD+N**: Create new entry (from Home Screen)
- **CMD+F**: Focus search bar (from Home Screen)  
- **CMD+S**: Save entry (from Journal Screen)
- **CMD+D**: Delete entry (from Journal Screen, when editing existing entry)
- **CMD+M**: Toggle between dark/light theme
- **ESC**: Save as draft and go home (from Journal Screen) OR go back home (from View Screen)

## Usage

### Creating Entries

1. Press **CMD+N** from the home screen to create a new entry
2. Enter a title and write your journal entry
3. Use `#hashtags` anywhere in your text for automatic tagging
4. Press **CMD+S** to save, or **ESC** to save as draft

### Managing Entries

- **Drafts**: Appear with a "DRAFT" indicator, click to continue editing
- **Completed Entries**: Click to view in read-only mode
- **Delete**: When editing an entry, press **CMD+D** to delete (with confirmation)

### Search & Filter

- **Search**: Type in the search bar to find entries by title or content
- **Filter**: Click "Filter" button for advanced filtering by tags and date ranges
- **Clear**: Use "Clear" in filter modal to reset all filters

### Themes

- **Default**: Dark mode (minimalist dark theme)
- **Toggle**: Press **CMD+M** to switch between light and dark modes
- **Persistence**: Theme choice is saved and restored on app restart

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
```

## Technical Details

- **Framework**: Electron 27 with TypeScript
- **Database**: SQLite3 for local data storage
- **Architecture**: Main process (Node.js) + Renderer process (Web)
- **Styling**: CSS with CSS variables for theming
- **Security**: Context isolation enabled, node integration disabled

## Data Storage

- **Location**: Application data is stored in your system's user data directory
- **Format**: SQLite database with entries table
- **Backup**: Database file can be manually backed up from the user data directory

## License

MIT License - Feel free to use and modify as needed.

## Support

This is an open-source project. For issues or feature requests, please check the project repository.