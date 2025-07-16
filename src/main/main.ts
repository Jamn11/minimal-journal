import { app, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseManager } from './database';
import { JournalEntry, SearchFilters } from '../shared/types';
import * as crypto from 'crypto';

class JournalApp {
  private mainWindow: BrowserWindow | null = null;
  private db: DatabaseManager;
  private securityConfigPath: string;

  constructor() {
    this.db = new DatabaseManager();
    const userDataPath = app.getPath('userData');
    this.securityConfigPath = path.join(userDataPath, 'security.json');
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
      this.mainWindow?.maximize();
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

    // Security-related IPC handlers
    ipcMain.handle('security:is-password-protection-enabled', () => {
      return this.isPasswordProtectionEnabled();
    });

    ipcMain.handle('security:set-password', async (_, password: string) => {
      return await this.setPassword(password);
    });

    ipcMain.handle('security:verify-password', async (_, password: string) => {
      return await this.verifyPassword(password);
    });

    ipcMain.handle('security:disable-password-protection', () => {
      return this.disablePasswordProtection();
    });

    ipcMain.handle('security:change-password', async (_, currentPassword: string, newPassword: string) => {
      return await this.changePassword(currentPassword, newPassword);
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

  // Security Methods
  private getSecurityConfig(): any {
    try {
      if (fs.existsSync(this.securityConfigPath)) {
        const configData = fs.readFileSync(this.securityConfigPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('Error reading security config:', error);
    }
    return {};
  }

  private saveSecurityConfig(config: any): void {
    try {
      fs.writeFileSync(this.securityConfigPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving security config:', error);
      throw new Error('Failed to save security configuration');
    }
  }

  private isPasswordProtectionEnabled(): boolean {
    const config = this.getSecurityConfig();
    return config.passwordProtectionEnabled === true;
  }

  private async setPassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate password
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }

      // Generate a salt
      const salt = crypto.randomBytes(32).toString('hex');
      
      // Hash the password with salt
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      
      // Encrypt the hash using Electron's safeStorage
      let encryptedHash: Buffer;
      try {
        encryptedHash = safeStorage.encryptString(hash);
      } catch (error) {
        return { success: false, error: 'Failed to encrypt password securely' };
      }

      // Save configuration
      const config = {
        passwordProtectionEnabled: true,
        salt: salt,
        encryptedHash: encryptedHash.toString('base64'),
        createdAt: new Date().toISOString()
      };

      this.saveSecurityConfig(config);
      return { success: true };
    } catch (error) {
      console.error('Error setting password:', error);
      return { success: false, error: 'Failed to set password' };
    }
  }

  private async verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getSecurityConfig();
      
      if (!config.passwordProtectionEnabled || !config.salt || !config.encryptedHash) {
        return { success: false, error: 'Password protection not properly configured' };
      }

      // Decrypt the stored hash
      let storedHash: string;
      try {
        const encryptedBuffer = Buffer.from(config.encryptedHash, 'base64');
        storedHash = safeStorage.decryptString(encryptedBuffer);
      } catch (error) {
        return { success: false, error: 'Failed to decrypt stored password' };
      }

      // Hash the provided password with the same salt
      const inputHash = crypto.pbkdf2Sync(password, config.salt, 100000, 64, 'sha512').toString('hex');
      
      // Compare hashes
      const isValid = inputHash === storedHash;
      
      return { success: isValid, error: isValid ? undefined : 'Invalid password' };
    } catch (error) {
      console.error('Error verifying password:', error);
      return { success: false, error: 'Failed to verify password' };
    }
  }

  private disablePasswordProtection(): { success: boolean; error?: string } {
    try {
      const config = this.getSecurityConfig();
      config.passwordProtectionEnabled = false;
      // Keep the password data in case they want to re-enable
      this.saveSecurityConfig(config);
      return { success: true };
    } catch (error) {
      console.error('Error disabling password protection:', error);
      return { success: false, error: 'Failed to disable password protection' };
    }
  }

  private async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify the current password
      const verificationResult = await this.verifyPassword(currentPassword);
      if (!verificationResult.success) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Set the new password
      return await this.setPassword(newPassword);
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Failed to change password' };
    }
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

  private escapeMarkdown(text: string): string {
    // Escape potential HTML/script content for security
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
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

      // Escape content for security
      const safeTitle = this.escapeMarkdown(entry.title || 'Untitled');
      const safeBody = this.escapeMarkdown(entry.body);
      const safeTags = entry.tags.map(tag => `#${this.escapeMarkdown(tag)}`).join(', ');

      markdown += `## ${safeTitle}\n\n`;
      markdown += `**Date:** ${formattedDate} ${formattedTime}\n\n`;
      
      if (entry.tags.length > 0) {
        markdown += `**Tags:** ${safeTags}\n\n`;
      }

      markdown += `${safeBody}\n\n`;
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