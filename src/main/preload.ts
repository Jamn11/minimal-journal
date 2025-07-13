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

  onShortcut: (callback: (shortcut: string) => void) => {
    ipcRenderer.on('shortcut:new-entry', () => callback('new-entry'));
    ipcRenderer.on('shortcut:focus-search', () => callback('focus-search'));
    ipcRenderer.on('shortcut:save-entry', () => callback('save-entry'));
    ipcRenderer.on('shortcut:escape', () => callback('escape'));
    ipcRenderer.on('shortcut:delete-entry', () => callback('delete-entry'));
    ipcRenderer.on('shortcut:toggle-theme', () => callback('toggle-theme'));
  },

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('shortcut:new-entry');
    ipcRenderer.removeAllListeners('shortcut:focus-search');
    ipcRenderer.removeAllListeners('shortcut:save-entry');
    ipcRenderer.removeAllListeners('shortcut:escape');
    ipcRenderer.removeAllListeners('shortcut:delete-entry');
    ipcRenderer.removeAllListeners('shortcut:toggle-theme');
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;