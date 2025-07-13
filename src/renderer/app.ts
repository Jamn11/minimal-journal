import { JournalEntry, SearchFilters, AppState } from '../shared/types';

declare global {
  interface Window {
    electronAPI: {
      saveEntry: (entry: Partial<JournalEntry>) => Promise<JournalEntry>;
      getEntry: (id: string) => Promise<JournalEntry | null>;
      getAllEntries: (filters?: SearchFilters) => Promise<JournalEntry[]>;
      deleteEntry: (id: string) => Promise<void>;
      getPlatform: () => Promise<string>;
      onShortcut: (callback: (shortcut: string) => void) => void;
      removeAllListeners: () => void;
    };
  }
}

class JournalApp {
  private appState: AppState = {
    currentScreen: 'home',
  };
  
  private entries: JournalEntry[] = [];
  private filteredEntries: JournalEntry[] = [];
  private currentFilters: SearchFilters = {};

  private elements: {
    homeScreen: HTMLElement;
    journalScreen: HTMLElement;
    viewScreen: HTMLElement;
    searchInput: HTMLInputElement;
    filterButton: HTMLElement;
    entriesList: HTMLElement;
    titleInput: HTMLInputElement;
    bodyTextarea: HTMLTextAreaElement;
    saveButton: HTMLElement;
    wordCount: HTMLElement;
    viewTitle: HTMLElement;
    viewTimestamp: HTMLElement;
    viewTags: HTMLElement;
    viewBody: HTMLElement;
    backButton: HTMLElement;
    filterModal: HTMLElement;
    filterTags: HTMLInputElement;
    filterDateFrom: HTMLInputElement;
    filterDateTo: HTMLInputElement;
    applyFilters: HTMLElement;
    clearFilters: HTMLElement;
    cancelFilters: HTMLElement;
    themeToggle: HTMLElement;
  };

  constructor() {
    this.elements = this.getElements();
    this.init();
  }

  private getElements() {
    return {
      homeScreen: document.getElementById('home-screen')!,
      journalScreen: document.getElementById('journal-screen')!,
      viewScreen: document.getElementById('view-screen')!,
      searchInput: document.getElementById('search-input')! as HTMLInputElement,
      filterButton: document.getElementById('filter-button')!,
      entriesList: document.getElementById('entries-list')!,
      titleInput: document.getElementById('title-input')! as HTMLInputElement,
      bodyTextarea: document.getElementById('body-textarea')! as HTMLTextAreaElement,
      saveButton: document.getElementById('save-button')!,
      wordCount: document.getElementById('word-count')!,
      viewTitle: document.getElementById('view-title')!,
      viewTimestamp: document.getElementById('view-timestamp')!,
      viewTags: document.getElementById('view-tags')!,
      viewBody: document.getElementById('view-body')!,
      backButton: document.getElementById('back-button')!,
      filterModal: document.getElementById('filter-modal')!,
      filterTags: document.getElementById('filter-tags')! as HTMLInputElement,
      filterDateFrom: document.getElementById('filter-date-from')! as HTMLInputElement,
      filterDateTo: document.getElementById('filter-date-to')! as HTMLInputElement,
      applyFilters: document.getElementById('apply-filters')!,
      clearFilters: document.getElementById('clear-filters')!,
      cancelFilters: document.getElementById('cancel-filters')!,
      themeToggle: document.getElementById('theme-toggle')!,
    };
  }

  private async init(): Promise<void> {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.initializeTheme();
    await this.loadEntries();
    this.showScreen('home');
  }

  private setupEventListeners(): void {
    this.elements.searchInput.addEventListener('input', () => this.handleSearch());
    this.elements.filterButton.addEventListener('click', () => this.showFilterModal());
    this.elements.saveButton.addEventListener('click', () => this.saveEntry());
    this.elements.bodyTextarea.addEventListener('input', () => this.updateWordCount());
    this.elements.backButton.addEventListener('click', () => this.showScreen('home'));

    this.elements.applyFilters.addEventListener('click', () => this.applyFilters());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
    this.elements.cancelFilters.addEventListener('click', () => this.hideFilterModal());
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    this.elements.filterModal.addEventListener('click', (e) => {
      if (e.target === this.elements.filterModal) {
        this.hideFilterModal();
      }
    });
  }

  private setupKeyboardShortcuts(): void {
    window.electronAPI.onShortcut((shortcut: string) => {
      switch (shortcut) {
        case 'new-entry':
          if (this.appState.currentScreen === 'home') {
            this.newEntry();
          }
          break;
        case 'focus-search':
          if (this.appState.currentScreen === 'home') {
            this.elements.searchInput.focus();
          }
          break;
        case 'save-entry':
          if (this.appState.currentScreen === 'journal') {
            this.saveEntry();
          }
          break;
        case 'escape':
          if (this.appState.currentScreen === 'journal') {
            this.saveAsDraft();
          } else if (this.elements.filterModal.classList.contains('active')) {
            this.hideFilterModal();
          }
          break;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.filterModal.classList.contains('active')) {
        this.hideFilterModal();
      }
    });
  }

  private showScreen(screen: 'home' | 'journal' | 'view'): void {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    switch (screen) {
      case 'home':
        this.elements.homeScreen.classList.add('active');
        break;
      case 'journal':
        this.elements.journalScreen.classList.add('active');
        break;
      case 'view':
        this.elements.viewScreen.classList.add('active');
        break;
    }
    
    this.appState.currentScreen = screen;
  }

  private async loadEntries(): Promise<void> {
    try {
      this.entries = await window.electronAPI.getAllEntries();
      this.filteredEntries = [...this.entries];
      this.renderEntries();
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  }

  private renderEntries(): void {
    const container = this.elements.entriesList;
    
    if (this.filteredEntries.length === 0) {
      container.innerHTML = '<div class="empty-state">No entries found. Press Cmd+N to create your first entry.</div>';
      return;
    }

    container.innerHTML = this.filteredEntries
      .map(entry => this.createEntryHTML(entry))
      .join('');

    container.querySelectorAll('.entry-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        const entry = this.filteredEntries[index];
        if (entry.draft) {
          this.editEntry(entry);
        } else {
          this.viewEntry(entry);
        }
      });
    });
  }

  private createEntryHTML(entry: JournalEntry): string {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const preview = entry.body.slice(0, 100) + (entry.body.length > 100 ? '...' : '');
    const tags = entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    const draftIndicator = entry.draft ? '<span class="draft-indicator">DRAFT</span>' : '';

    return `
      <div class="entry-item">
        <div class="entry-title">${entry.title || 'Untitled'}</div>
        <div class="entry-preview">${preview}</div>
        <div class="entry-meta">
          <span>${date} ${time}</span>
          <div class="entry-tags">
            ${draftIndicator}
            ${tags}
          </div>
        </div>
      </div>
    `;
  }

  private handleSearch(): void {
    const query = this.elements.searchInput.value.toLowerCase();
    this.currentFilters.query = query || undefined;
    this.applyCurrentFilters();
  }

  private applyCurrentFilters(): void {
    this.filteredEntries = this.entries.filter(entry => {
      if (this.currentFilters.query) {
        const query = this.currentFilters.query.toLowerCase();
        if (!entry.title.toLowerCase().includes(query) && 
            !entry.body.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (this.currentFilters.tags && this.currentFilters.tags.length > 0) {
        const hasTag = this.currentFilters.tags.some(tag => 
          entry.tags.includes(tag)
        );
        if (!hasTag) return false;
      }

      if (this.currentFilters.dateFrom) {
        if (entry.timestamp < this.currentFilters.dateFrom) return false;
      }

      if (this.currentFilters.dateTo) {
        const dateTo = new Date(this.currentFilters.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        if (entry.timestamp > dateTo.toISOString()) return false;
      }

      return true;
    });

    this.renderEntries();
  }

  private showFilterModal(): void {
    this.elements.filterModal.classList.add('active');
    this.elements.filterTags.value = this.currentFilters.tags?.join(', ') || '';
    this.elements.filterDateFrom.value = this.currentFilters.dateFrom?.split('T')[0] || '';
    this.elements.filterDateTo.value = this.currentFilters.dateTo?.split('T')[0] || '';
  }

  private hideFilterModal(): void {
    this.elements.filterModal.classList.remove('active');
  }

  private applyFilters(): void {
    const tags = this.elements.filterTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    this.currentFilters.tags = tags.length > 0 ? tags : undefined;
    this.currentFilters.dateFrom = this.elements.filterDateFrom.value || undefined;
    this.currentFilters.dateTo = this.elements.filterDateTo.value || undefined;

    this.applyCurrentFilters();
    this.hideFilterModal();
  }

  private clearFilters(): void {
    this.currentFilters = {};
    this.elements.searchInput.value = '';
    this.elements.filterTags.value = '';
    this.elements.filterDateFrom.value = '';
    this.elements.filterDateTo.value = '';
    this.filteredEntries = [...this.entries];
    this.renderEntries();
    this.hideFilterModal();
  }

  private newEntry(): void {
    this.appState.editingEntryId = undefined;
    this.elements.titleInput.value = '';
    this.elements.bodyTextarea.value = '';
    this.updateWordCount();
    this.showScreen('journal');
    this.elements.titleInput.focus();
  }

  private editEntry(entry: JournalEntry): void {
    this.appState.editingEntryId = entry.id;
    this.elements.titleInput.value = entry.title;
    this.elements.bodyTextarea.value = entry.body;
    this.updateWordCount();
    this.showScreen('journal');
    this.elements.titleInput.focus();
  }

  private viewEntry(entry: JournalEntry): void {
    this.appState.currentEntry = entry;
    this.elements.viewTitle.textContent = entry.title || 'Untitled';
    
    const date = new Date(entry.timestamp);
    this.elements.viewTimestamp.textContent = date.toLocaleString();
    
    const tags = entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    this.elements.viewTags.innerHTML = tags;
    
    this.elements.viewBody.textContent = entry.body;
    
    this.showScreen('view');
  }

  private async saveEntry(): Promise<void> {
    const title = this.elements.titleInput.value.trim();
    const body = this.elements.bodyTextarea.value.trim();

    if (!title && !body) {
      return;
    }

    try {
      const entry: Partial<JournalEntry> = {
        id: this.appState.editingEntryId,
        title,
        body,
        draft: false,
      };

      await window.electronAPI.saveEntry(entry);
      await this.loadEntries();
      this.showScreen('home');
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  }

  private async saveAsDraft(): Promise<void> {
    const title = this.elements.titleInput.value.trim();
    const body = this.elements.bodyTextarea.value.trim();

    if (!title && !body) {
      this.showScreen('home');
      return;
    }

    try {
      const entry: Partial<JournalEntry> = {
        id: this.appState.editingEntryId,
        title,
        body,
        draft: true,
      };

      await window.electronAPI.saveEntry(entry);
      await this.loadEntries();
      this.showScreen('home');
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.showScreen('home');
    }
  }

  private updateWordCount(): void {
    const text = this.elements.bodyTextarea.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    this.elements.wordCount.textContent = `${wordCount} words`;
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  private toggleTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('theme', newTheme);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new JournalApp();
});