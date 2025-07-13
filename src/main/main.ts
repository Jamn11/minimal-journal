import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import * as path from 'path';
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
  }

  setupKeyboardShortcuts(): void {
    globalShortcut.register('CommandOrControl+N', () => {
      this.mainWindow?.webContents.send('shortcut:new-entry');
    });

    globalShortcut.register('CommandOrControl+F', () => {
      this.mainWindow?.webContents.send('shortcut:focus-search');
    });

    globalShortcut.register('CommandOrControl+S', () => {
      this.mainWindow?.webContents.send('shortcut:save-entry');
    });

    globalShortcut.register('Escape', () => {
      this.mainWindow?.webContents.send('shortcut:escape');
    });

    globalShortcut.register('CommandOrControl+D', () => {
      this.mainWindow?.webContents.send('shortcut:delete-entry');
    });

    globalShortcut.register('CommandOrControl+M', () => {
      this.mainWindow?.webContents.send('shortcut:toggle-theme');
    });
  }

  async initialize(): Promise<void> {
    await app.whenReady();
    await this.db.initialize();
    
    this.setupIpcHandlers();
    this.setupKeyboardShortcuts();
    await this.createWindow();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createWindow();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
      this.db.close();
    });
  }
}

const journalApp = new JournalApp();
journalApp.initialize().catch(console.error);