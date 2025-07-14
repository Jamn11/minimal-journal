import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseManager } from './database';
import { JournalEntry, SearchFilters } from '../shared/types';

class JournalApp {
  private mainWindow: BrowserWindow | null = null;
  private db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager();
  }

  async createWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hiddenInset',
      show: false,
    });

    await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupIpcHandlers(): void {
    ipcMain.handle('db:save-entry', async (_, entry: Partial<JournalEntry>) => {
      return await this.db.saveEntry(entry);
    });

    ipcMain.handle('db:get-entry', async (_, id: string) => {
      return await this.db.getEntry(id);
    });

    ipcMain.handle('db:get-all-entries', async (_, filters?: SearchFilters) => {
      return await this.db.getAllEntries(filters);
    });

    ipcMain.handle('db:delete-entry', async (_, id: string) => {
      return await this.db.deleteEntry(id);
    });

    ipcMain.handle('app:get-platform', () => {
      return process.platform;
    });

    ipcMain.handle('app:export-entries', async () => {
      return await this.exportEntries();
    });
  }

  setupKeyboardShortcuts(): void {
    this.mainWindow?.webContents.on('before-input-event', (event, input) => {
      // Only handle shortcuts when window is focused and visible
      if (!this.mainWindow?.isFocused() || !this.mainWindow?.isVisible()) {
        return;
      }

      const { control, meta, key, type } = input;
      const cmdOrCtrl = process.platform === 'darwin' ? meta : control;

      if (type === 'keyDown') {
        if (cmdOrCtrl && key.toLowerCase() === 'n') {
          event.preventDefault();
          this.mainWindow?.webContents.send('shortcut:new-entry');
        } else if (cmdOrCtrl && key.toLowerCase() === 'f') {
          event.preventDefault();
          this.mainWindow?.webContents.send('shortcut:focus-search');
        } else if (cmdOrCtrl && key.toLowerCase() === 's') {
          event.preventDefault();
          this.mainWindow?.webContents.send('shortcut:save-entry');
        } else if (key === 'Escape') {
          event.preventDefault();
          this.mainWindow?.webContents.send('shortcut:escape');
        } else if (cmdOrCtrl && key.toLowerCase() === 'd') {
          event.preventDefault();
          this.mainWindow?.webContents.send('shortcut:delete-entry');
        } else if (cmdOrCtrl && key.toLowerCase() === 'm') {
          event.preventDefault();
          this.mainWindow?.webContents.send('shortcut:toggle-theme');
        } else if (cmdOrCtrl && key.toLowerCase() === 'e') {
          event.preventDefault();
          this.mainWindow?.webContents.send('shortcut:edit-entry');
        }
        // Note: CMD+B and CMD+I are handled in the renderer for journal screen only
      }
    });
  }

  private async exportEntries(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        title: 'Export Journal Entries',
        defaultPath: 'journal-entries.md',
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return { success: false };
      }

      const entries = await this.db.getAllEntries();
      const markdown = this.generateMarkdownFromEntries(entries);

      await fs.promises.writeFile(result.filePath!, markdown, 'utf8');
      
      return { success: true, path: result.filePath };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private generateMarkdownFromEntries(entries: JournalEntry[]): string {
    const sortedEntries = entries
      .filter(entry => !entry.draft)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let markdown = '# Journal Entries\n\n';
    markdown += `Exported on ${new Date().toLocaleDateString()}\n\n`;
    markdown += '---\n\n';

    for (const entry of sortedEntries) {
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();

      markdown += `## ${entry.title || 'Untitled'}\n\n`;
      markdown += `**Date:** ${formattedDate} ${formattedTime}\n\n`;
      
      if (entry.tags.length > 0) {
        markdown += `**Tags:** ${entry.tags.map(tag => `#${tag}`).join(', ')}\n\n`;
      }

      markdown += `${entry.body}\n\n`;
      markdown += '---\n\n';
    }

    return markdown;
  }

  async initialize(): Promise<void> {
    await app.whenReady();
    await this.db.initialize();
    
    this.setupIpcHandlers();
    await this.createWindow();
    this.setupKeyboardShortcuts();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createWindow();
        this.setupKeyboardShortcuts();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('will-quit', () => {
      this.db.close();
    });
  }
}

const journalApp = new JournalApp();
journalApp.initialize().catch(console.error);