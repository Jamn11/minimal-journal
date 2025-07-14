import { contextBridge, ipcRenderer } from 'electron';
import { JournalEntry, SearchFilters } from '../shared/types';

const electronAPI = {
  saveEntry: (entry: Partial<JournalEntry>): Promise<JournalEntry> =>
    ipcRenderer.invoke('db:save-entry', entry),
  
  getEntry: (id: string): Promise<JournalEntry | null> =>
    ipcRenderer.invoke('db:get-entry', id),
  
  getAllEntries: (filters?: SearchFilters): Promise<JournalEntry[]> =>
    ipcRenderer.invoke('db:get-all-entries', filters),
  
  deleteEntry: (id: string): Promise<void> =>
    ipcRenderer.invoke('db:delete-entry', id),
  
  getPlatform: (): Promise<string> =>
    ipcRenderer.invoke('app:get-platform'),
  
  exportEntries: (): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('app:export-entries'),

  onShortcut: (callback: (shortcut: string) => void) => {
    ipcRenderer.on('shortcut:new-entry', () => callback('new-entry'));
    ipcRenderer.on('shortcut:focus-search', () => callback('focus-search'));
    ipcRenderer.on('shortcut:save-entry', () => callback('save-entry'));
    ipcRenderer.on('shortcut:escape', () => callback('escape'));
    ipcRenderer.on('shortcut:delete-entry', () => callback('delete-entry'));
    ipcRenderer.on('shortcut:toggle-theme', () => callback('toggle-theme'));
    ipcRenderer.on('shortcut:edit-entry', () => callback('edit-entry'));
  },

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('shortcut:new-entry');
    ipcRenderer.removeAllListeners('shortcut:focus-search');
    ipcRenderer.removeAllListeners('shortcut:save-entry');
    ipcRenderer.removeAllListeners('shortcut:escape');
    ipcRenderer.removeAllListeners('shortcut:delete-entry');
    ipcRenderer.removeAllListeners('shortcut:toggle-theme');
    ipcRenderer.removeAllListeners('shortcut:edit-entry');
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;