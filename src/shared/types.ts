export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  lastModified?: string;
  tags: string[];
  draft: boolean;
}

export interface SearchFilters {
  query?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export type Screen = 'home' | 'journal' | 'view';

export interface AppState {
  currentScreen: Screen;
  currentEntry?: JournalEntry;
  editingEntryId?: string;
}