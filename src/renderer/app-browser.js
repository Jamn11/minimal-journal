// Plain JavaScript version for browser compatibility

class JournalApp {
  constructor() {
    this.appState = {
      currentScreen: 'home',
    };
    
    this.entries = [];
    this.filteredEntries = [];
    this.currentFilters = {};

    this.elements = this.getElements();
    this.init();
  }

  getElements() {
    return {
      homeScreen: document.getElementById('home-screen'),
      journalScreen: document.getElementById('journal-screen'),
      viewScreen: document.getElementById('view-screen'),
      searchInput: document.getElementById('search-input'),
      filterButton: document.getElementById('filter-button'),
      entriesList: document.getElementById('entries-list'),
      titleInput: document.getElementById('title-input'),
      bodyTextarea: document.getElementById('body-textarea'),
      saveButton: document.getElementById('save-button'),
      wordCount: document.getElementById('word-count'),
      viewTitle: document.getElementById('view-title'),
      viewTimestamp: document.getElementById('view-timestamp'),
      viewTags: document.getElementById('view-tags'),
      viewBody: document.getElementById('view-body'),
      backButton: document.getElementById('back-button'),
      filterModal: document.getElementById('filter-modal'),
      filterTags: document.getElementById('filter-tags'),
      filterDateFrom: document.getElementById('filter-date-from'),
      filterDateTo: document.getElementById('filter-date-to'),
      applyFilters: document.getElementById('apply-filters'),
      clearFilters: document.getElementById('clear-filters'),
      cancelFilters: document.getElementById('cancel-filters'),
    };
  }

  async init() {
    console.log('Initializing JournalApp...');
    
    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.error('electronAPI not found! Preload script may not be working.');
      this.showError('Application not properly initialized. Please restart the app.');
      return;
    }

    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.initializeTheme();
    await this.loadEntries();
    this.showScreen('home');
    
    console.log('JournalApp initialized successfully');
  }

  showError(message) {
    this.elements.entriesList.innerHTML = `<div class="empty-state" style="color: red;">${message}</div>`;
  }

  setupEventListeners() {
    this.elements.searchInput.addEventListener('input', () => this.handleSearch());
    this.elements.filterButton.addEventListener('click', () => this.showFilterModal());
    this.elements.saveButton.addEventListener('click', () => this.saveEntry());
    this.elements.bodyTextarea.addEventListener('input', () => this.updateWordCount());
    this.elements.backButton.addEventListener('click', () => this.showScreen('home'));

    this.elements.applyFilters.addEventListener('click', () => this.applyFilters());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
    this.elements.cancelFilters.addEventListener('click', () => this.hideFilterModal());

    this.elements.filterModal.addEventListener('click', (e) => {
      if (e.target === this.elements.filterModal) {
        this.hideFilterModal();
      }
    });
  }

  setupKeyboardShortcuts() {
    window.electronAPI.onShortcut((shortcut) => {
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
          } else if (this.appState.currentScreen === 'view') {
            this.showScreen('home');
          } else if (this.elements.filterModal.classList.contains('active')) {
            this.hideFilterModal();
          }
          break;
        case 'delete-entry':
          if (this.appState.currentScreen === 'journal' && this.appState.editingEntryId) {
            this.deleteCurrentEntry();
          }
          break;
        case 'toggle-theme':
          this.toggleTheme();
          break;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.filterModal.classList.contains('active')) {
        this.hideFilterModal();
      }
    });
  }

  showScreen(screen) {
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

  async loadEntries() {
    try {
      console.log('Loading entries...');
      this.entries = await window.electronAPI.getAllEntries();
      console.log('Loaded entries:', this.entries.length);
      this.filteredEntries = [...this.entries];
      this.renderEntries();
    } catch (error) {
      console.error('Failed to load entries:', error);
      this.showError('Failed to load entries. Database may not be initialized.');
    }
  }

  renderEntries() {
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

  createEntryHTML(entry) {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const preview = entry.body.slice(0, 80) + (entry.body.length > 80 ? '...' : '');
    const tags = entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    const draftIndicator = entry.draft ? '<span class="draft-indicator">DRAFT</span>' : '';

    return `
      <div class="entry-item">
        <div class="entry-header">
          <div class="entry-title">${entry.title || 'Untitled'}</div>
          <div class="entry-timestamp">${date} ${time}</div>
          <div class="entry-tags">
            ${draftIndicator}
            ${tags}
          </div>
        </div>
        <div class="entry-preview">${preview}</div>
      </div>
    `;
  }

  handleSearch() {
    const query = this.elements.searchInput.value.toLowerCase();
    this.currentFilters.query = query || undefined;
    this.applyCurrentFilters();
  }

  applyCurrentFilters() {
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

  showFilterModal() {
    this.elements.filterModal.classList.add('active');
    this.elements.filterTags.value = this.currentFilters.tags?.join(', ') || '';
    this.elements.filterDateFrom.value = this.currentFilters.dateFrom?.split('T')[0] || '';
    this.elements.filterDateTo.value = this.currentFilters.dateTo?.split('T')[0] || '';
  }

  hideFilterModal() {
    this.elements.filterModal.classList.remove('active');
  }

  applyFilters() {
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

  clearFilters() {
    this.currentFilters = {};
    this.elements.searchInput.value = '';
    this.elements.filterTags.value = '';
    this.elements.filterDateFrom.value = '';
    this.elements.filterDateTo.value = '';
    this.filteredEntries = [...this.entries];
    this.renderEntries();
    this.hideFilterModal();
  }

  newEntry() {
    this.appState.editingEntryId = undefined;
    this.elements.titleInput.value = '';
    this.elements.bodyTextarea.value = '';
    this.updateWordCount();
    this.showScreen('journal');
    this.elements.titleInput.focus();
  }

  editEntry(entry) {
    this.appState.editingEntryId = entry.id;
    this.elements.titleInput.value = entry.title;
    this.elements.bodyTextarea.value = entry.body;
    this.updateWordCount();
    this.showScreen('journal');
    this.elements.titleInput.focus();
  }

  viewEntry(entry) {
    this.appState.currentEntry = entry;
    this.elements.viewTitle.textContent = entry.title || 'Untitled';
    
    const date = new Date(entry.timestamp);
    this.elements.viewTimestamp.textContent = date.toLocaleString();
    
    const tags = entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    this.elements.viewTags.innerHTML = tags;
    
    this.elements.viewBody.textContent = entry.body;
    
    this.showScreen('view');
  }

  async saveEntry() {
    const title = this.elements.titleInput.value.trim();
    const body = this.elements.bodyTextarea.value.trim();

    if (!title && !body) {
      return;
    }

    try {
      const entry = {
        id: this.appState.editingEntryId,
        title,
        body,
        draft: false,
      };

      console.log('Saving entry:', entry);
      await window.electronAPI.saveEntry(entry);
      await this.loadEntries();
      this.showScreen('home');
    } catch (error) {
      console.error('Failed to save entry:', error);
      this.showError('Failed to save entry. Please try again.');
    }
  }

  async saveAsDraft() {
    const title = this.elements.titleInput.value.trim();
    const body = this.elements.bodyTextarea.value.trim();

    if (!title && !body) {
      this.showScreen('home');
      return;
    }

    try {
      const entry = {
        id: this.appState.editingEntryId,
        title,
        body,
        draft: true,
      };

      console.log('Saving draft:', entry);
      await window.electronAPI.saveEntry(entry);
      await this.loadEntries();
      this.showScreen('home');
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.showError('Failed to save draft. Please try again.');
      this.showScreen('home');
    }
  }

  updateWordCount() {
    const text = this.elements.bodyTextarea.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    this.elements.wordCount.textContent = `${wordCount} words`;
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Default to dark mode
    const theme = savedTheme || 'dark';
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('theme', newTheme);
  }

  async deleteCurrentEntry() {
    if (!this.appState.editingEntryId) {
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this entry? This action cannot be undone.');
    
    if (!confirmed) {
      return;
    }

    try {
      console.log('Deleting entry:', this.appState.editingEntryId);
      await window.electronAPI.deleteEntry(this.appState.editingEntryId);
      await this.loadEntries();
      this.showScreen('home');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      this.showError('Failed to delete entry. Please try again.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting JournalApp...');
  new JournalApp();
});