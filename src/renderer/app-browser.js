// Plain JavaScript version for browser compatibility

class JournalApp {
  constructor() {
    this.appState = {
      currentScreen: 'home',
    };
    
    this.entries = [];
    this.filteredEntries = [];
    this.currentFilters = {};
    
    // Security state
    this.failedPasswordAttempts = 0;
    this.lockoutEndTime = null;
    this.sessionTimeout = null;

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
      exportButton: document.getElementById('export-button'),
      settingsButton: document.getElementById('settings-button'),
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
      settingsModal: document.getElementById('settings-modal'),
      closeSettings: document.getElementById('close-settings'),
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),
      fontFamilySelect: document.getElementById('font-family-select'),
      fontSizeSlider: document.getElementById('font-size-slider'),
      fontSizeValue: document.getElementById('font-size-value'),
      lightTheme: document.getElementById('light-theme'),
      darkTheme: document.getElementById('dark-theme'),
      // Security elements
      passwordProtectionEnabled: document.getElementById('password-protection-enabled'),
      passwordSettings: document.getElementById('password-settings'),
      changePasswordSection: document.getElementById('change-password-section'),
      newPassword: document.getElementById('new-password'),
      confirmPassword: document.getElementById('confirm-password'),
      savePassword: document.getElementById('save-password'),
      passwordFeedback: document.getElementById('password-feedback'),
      currentPassword: document.getElementById('current-password'),
      newPasswordChange: document.getElementById('new-password-change'),
      confirmPasswordChange: document.getElementById('confirm-password-change'),
      changePassword: document.getElementById('change-password'),
      changePasswordFeedback: document.getElementById('change-password-feedback'),
      // Password entry modal
      passwordEntryModal: document.getElementById('password-entry-modal'),
      passwordEntryInput: document.getElementById('password-entry-input'),
      passwordEntrySubmit: document.getElementById('password-entry-submit'),
      passwordEntryError: document.getElementById('password-entry-error'),
      // Disable protection modal
      disableProtectionModal: document.getElementById('disable-protection-modal'),
      disableProtectionInput: document.getElementById('disable-protection-input'),
      disableProtectionConfirm: document.getElementById('disable-protection-confirm'),
      disableProtectionCancel: document.getElementById('disable-protection-cancel'),
      disableProtectionError: document.getElementById('disable-protection-error'),
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
    this.setupSecureModalHandling();
    this.initializeSettings();
    
    // Check if password protection is enabled
    if (this.isPasswordProtectionEnabled()) {
      await this.showPasswordEntry();
    } else {
      await this.loadEntries();
      this.showScreen('home');
    }
    
    console.log('JournalApp initialized successfully');
  }

  showError(message) {
    this.elements.entriesList.innerHTML = `<div class="empty-state" style="color: red;">${message}</div>`;
  }

  setupEventListeners() {
    this.elements.searchInput.addEventListener('input', () => this.handleSearch());
    this.elements.filterButton.addEventListener('click', () => this.showFilterModal());
    this.elements.exportButton.addEventListener('click', () => this.exportEntries());
    this.elements.settingsButton.addEventListener('click', () => this.showSettingsModal());
    this.elements.saveButton.addEventListener('click', () => this.saveEntry());
    this.elements.bodyTextarea.addEventListener('input', () => this.updateWordCount());
    this.elements.backButton.addEventListener('click', () => this.showScreen('home'));

    this.elements.applyFilters.addEventListener('click', () => this.applyFilters());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
    this.elements.cancelFilters.addEventListener('click', () => this.hideFilterModal());

    this.elements.closeSettings.addEventListener('click', () => this.hideSettingsModal());
    this.elements.fontSizeSlider.addEventListener('input', () => {
      this.updateFontSizeDisplay();
      this.autoSaveFontSize();
    });
    this.elements.fontFamilySelect.addEventListener('change', () => this.autoSaveFontFamily());
    this.elements.lightTheme.addEventListener('click', () => this.selectAndSaveTheme('light'));
    this.elements.darkTheme.addEventListener('click', () => this.selectAndSaveTheme('dark'));

    // Security event listeners
    this.elements.passwordProtectionEnabled.addEventListener('change', () => this.togglePasswordProtection());
    this.elements.savePassword.addEventListener('click', () => this.saveNewPassword());
    this.elements.changePassword.addEventListener('click', () => this.changeExistingPassword());
    this.elements.passwordEntrySubmit.addEventListener('click', () => this.submitPasswordEntry());
    this.elements.passwordEntryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.submitPasswordEntry();
      }
    });

    // Disable protection modal event listeners
    this.elements.disableProtectionConfirm.addEventListener('click', () => this.confirmDisableProtection());
    this.elements.disableProtectionCancel.addEventListener('click', () => this.cancelDisableProtection());
    this.elements.disableProtectionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.confirmDisableProtection();
      }
    });

    // Tab switching
    this.elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button.dataset.tab));
    });

    this.elements.filterModal.addEventListener('click', (e) => {
      if (e.target === this.elements.filterModal) {
        this.hideFilterModal();
      }
    });

    this.elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.settingsModal) {
        this.hideSettingsModal();
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
          if (this.elements.settingsModal.classList.contains('active')) {
            this.hideSettingsModal();
          } else if (this.elements.filterModal.classList.contains('active')) {
            this.hideFilterModal();
          } else if (this.appState.currentScreen === 'journal') {
            this.saveAsDraft();
          } else if (this.appState.currentScreen === 'view') {
            this.showScreen('home');
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
        case 'edit-entry':
          if (this.appState.currentScreen === 'view') {
            this.editCurrentEntry();
          }
          break;
      }
    });

    document.addEventListener('keydown', (e) => {
      // Settings shortcut from home screen (CMD+,)
      if (this.appState.currentScreen === 'home' && (e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        this.showSettingsModal();
        return;
      }
      
      // Save settings with Enter key when in settings modal
      if (this.elements.settingsModal.classList.contains('active') && e.key === 'Enter') {
        e.preventDefault();
        this.saveSettings();
        return;
      }

      // Tab navigation in settings modal
      if (this.elements.settingsModal.classList.contains('active') && e.key === 'Tab' && e.ctrlKey) {
        e.preventDefault();
        if (e.shiftKey) {
          this.navigateTabLeft();
        } else {
          this.navigateTabRight();
        }
        return;
      }
      
      // Format shortcuts in journal screen
      if (this.appState.currentScreen === 'journal') {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          this.applyFormat('bold');
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
          e.preventDefault();
          this.applyFormat('italic');
        }
      }
      
      // Edit shortcut in view screen
      if (this.appState.currentScreen === 'view' && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.editCurrentEntry();
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
    const createdDate = new Date(entry.timestamp).toLocaleDateString();
    const createdTime = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const preview = entry.body.slice(0, 80) + (entry.body.length > 80 ? '...' : '');
    const tags = entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    const draftIndicator = entry.draft ? '<span class="draft-indicator">DRAFT</span>' : '';

    let timestampHTML = `<div class="entry-timestamp">Created: ${createdDate} ${createdTime}`;
    if (entry.lastModified) {
      const modifiedDate = new Date(entry.lastModified).toLocaleDateString();
      const modifiedTime = new Date(entry.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timestampHTML += `<br>Last modified: ${modifiedDate} ${modifiedTime}`;
    }
    timestampHTML += '</div>';

    return `
      <div class="entry-item">
        <div class="entry-header">
          <div class="entry-title">${entry.title || 'Untitled'}</div>
          ${timestampHTML}
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

  editCurrentEntry() {
    if (this.appState.currentEntry) {
      this.editEntry(this.appState.currentEntry);
    }
  }

  viewEntry(entry) {
    this.appState.currentEntry = entry;
    this.elements.viewTitle.textContent = entry.title || 'Untitled';
    
    const date = new Date(entry.timestamp);
    this.elements.viewTimestamp.textContent = date.toLocaleString();
    
    const tags = entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    this.elements.viewTags.innerHTML = tags;
    
    this.elements.viewBody.innerHTML = this.renderMarkdown(entry.body);
    
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

      // Preserve original timestamp when editing existing entry
      if (this.appState.editingEntryId) {
        const existingEntry = await window.electronAPI.getEntry(this.appState.editingEntryId);
        if (existingEntry) {
          entry.timestamp = existingEntry.timestamp;
          entry.lastModified = new Date().toISOString();
        }
      }

      console.log('Saving entry:', entry);
      await window.electronAPI.saveEntry(entry);
      await this.loadEntries();
      // Update streak grid if it's visible
      if (document.getElementById('streak-grid')) {
        this.updateStreakGrid();
      }
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

      // Preserve original timestamp when editing existing entry
      if (this.appState.editingEntryId) {
        const existingEntry = await window.electronAPI.getEntry(this.appState.editingEntryId);
        if (existingEntry) {
          entry.timestamp = existingEntry.timestamp;
          entry.lastModified = new Date().toISOString();
        }
      }

      console.log('Saving draft:', entry);
      await window.electronAPI.saveEntry(entry);
      await this.loadEntries();
      // Update streak grid if it's visible (only for non-drafts)
      if (document.getElementById('streak-grid') && !entry.draft) {
        this.updateStreakGrid();
      }
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

  applyFormat(format) {
    const textarea = this.elements.bodyTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    const marker = format === 'bold' ? '**' : '*';
    
    if (selectedText) {
      // If text is selected, wrap it with formatting
      formattedText = `${marker}${selectedText}${marker}`;
    } else {
      // If no text selected, insert markers with cursor in between
      formattedText = `${marker}${marker}`;
    }
    
    // Replace the selected text with formatted text
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.value = newValue;
    
    // Position cursor correctly
    if (selectedText) {
      textarea.setSelectionRange(start + marker.length, start + marker.length + selectedText.length);
    } else {
      textarea.setSelectionRange(start + marker.length, start + marker.length);
    }
    
    textarea.focus();
    this.updateWordCount();
  }

  renderMarkdown(text) {
    // Simple markdown renderer for bold and italic
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  async exportEntries() {
    try {
      const result = await window.electronAPI.exportEntries();
      
      if (result.success) {
        console.log('Entries exported successfully to:', result.path);
        // Could add a toast notification here
      } else if (result.error) {
        console.error('Export failed:', result.error);
        // Could add error notification here
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  // Public methods for testing
  testBold() {
    this.applyFormat('bold');
  }

  testItalic() {
    this.applyFormat('italic');
  }

  getScreenState() {
    return this.appState.currentScreen;
  }

  // Settings methods
  showSettingsModal() {
    this.loadCurrentSettings();
    this.elements.settingsModal.classList.add('active');
  }

  hideSettingsModal() {
    this.elements.settingsModal.classList.remove('active');
  }

  switchTab(tabName) {
    // Remove active class from all tabs and tab contents
    this.elements.tabButtons.forEach(button => button.classList.remove('active'));
    this.elements.tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeButton && activeContent) {
      activeButton.classList.add('active');
      activeContent.classList.add('active');
    }
  }

  navigateTabRight() {
    const tabs = ['appearance', 'habits', 'templates', 'security', 'general'];
    const activeTab = document.querySelector('.tab-button.active');
    if (!activeTab) return;
    
    const currentIndex = tabs.indexOf(activeTab.dataset.tab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    this.switchTab(tabs[nextIndex]);
  }

  navigateTabLeft() {
    const tabs = ['appearance', 'habits', 'templates', 'security', 'general'];
    const activeTab = document.querySelector('.tab-button.active');
    if (!activeTab) return;
    
    const currentIndex = tabs.indexOf(activeTab.dataset.tab);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    this.switchTab(tabs[prevIndex]);
  }

  loadCurrentSettings() {
    // Load current font family
    const currentFontFamily = localStorage.getItem('fontFamily') || 'Courier New, Monaco, Menlo, monospace';
    this.elements.fontFamilySelect.value = currentFontFamily;

    // Load current font size
    const currentFontSize = localStorage.getItem('fontSize') || '16';
    this.elements.fontSizeSlider.value = currentFontSize;
    this.elements.fontSizeValue.textContent = currentFontSize + 'px';

    // Load current theme
    const currentTheme = localStorage.getItem('theme') || 'dark';
    this.updateThemeButtons(currentTheme);
  }

  updateFontSizeDisplay() {
    const size = this.elements.fontSizeSlider.value;
    this.elements.fontSizeValue.textContent = size + 'px';
    
    // Apply the font size change immediately for live preview
    document.documentElement.style.setProperty('--app-font-size', size + 'px');
  }

  selectTheme(theme) {
    this.updateThemeButtons(theme);
  }

  updateThemeButtons(theme) {
    this.elements.lightTheme.classList.remove('active');
    this.elements.darkTheme.classList.remove('active');
    
    if (theme === 'light') {
      this.elements.lightTheme.classList.add('active');
    } else {
      this.elements.darkTheme.classList.add('active');
    }
  }

  saveSettings() {
    const fontFamily = this.elements.fontFamilySelect.value;
    const fontSize = this.elements.fontSizeSlider.value;
    const theme = this.elements.lightTheme.classList.contains('active') ? 'light' : 'dark';

    // Save to localStorage
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('theme', theme);

    // Apply settings immediately
    this.applySettings(fontFamily, fontSize, theme);

    this.hideSettingsModal();
  }

  autoSaveFontSize() {
    const fontSize = this.elements.fontSizeSlider.value;
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.style.setProperty('--app-font-size', fontSize + 'px');
  }

  autoSaveFontFamily() {
    const fontFamily = this.elements.fontFamilySelect.value;
    localStorage.setItem('fontFamily', fontFamily);
    document.documentElement.style.setProperty('--app-font-family', fontFamily);
  }

  selectAndSaveTheme(theme) {
    this.updateThemeButtons(theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  applySettings(fontFamily, fontSize, theme) {
    // Apply font family and size to the entire app
    document.documentElement.style.setProperty('--app-font-family', fontFamily);
    document.documentElement.style.setProperty('--app-font-size', fontSize + 'px');

    // Apply theme
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  initializeSettings() {
    const fontFamily = localStorage.getItem('fontFamily') || 'Courier New, Monaco, Menlo, monospace';
    const fontSize = localStorage.getItem('fontSize') || '16';
    const theme = localStorage.getItem('theme') || 'dark';
    
    this.applySettings(fontFamily, fontSize, theme);
  }

  // Streak tracking methods
  initializeStreakGrid() {
    const grid = document.getElementById('streak-grid');
    if (!grid) return;

    // Clear existing grid
    grid.innerHTML = '';

    // Create 49 squares (7x7 grid)
    for (let i = 0; i < 49; i++) {
      const day = document.createElement('div');
      day.className = 'streak-day';
      grid.appendChild(day);
    }

    this.updateStreakGrid();
  }

  async updateStreakGrid() {
    try {
      const entries = await window.electronAPI.getAllEntries();
      const grid = document.getElementById('streak-grid');
      const streakNumber = document.getElementById('current-streak');
      
      if (!grid || !streakNumber) return;

      // Get dates for the last 49 days (most recent first for top-down filling)
      const today = new Date();
      const dates = [];
      for (let i = 0; i < 49; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date);
      }

      // Create a set of dates that have entries (non-drafts only)
      const entryDates = new Set();
      entries.forEach(entry => {
        if (!entry.draft) {
          const entryDate = new Date(entry.timestamp);
          const dateString = entryDate.toDateString();
          entryDates.add(dateString);
        }
      });

      // Update grid squares
      const daySquares = grid.querySelectorAll('.streak-day');
      dates.forEach((date, index) => {
        const daySquare = daySquares[index];
        const dateString = date.toDateString();
        const hasEntry = entryDates.has(dateString);
        const isToday = date.toDateString() === today.toDateString();

        daySquare.classList.remove('filled', 'today');
        
        if (hasEntry) {
          daySquare.classList.add('filled');
        }
        
        if (isToday) {
          daySquare.classList.add('today');
        }
      });

      // Calculate current streak
      const currentStreak = this.calculateCurrentStreak(entryDates);
      streakNumber.textContent = currentStreak;
      
    } catch (error) {
      console.error('Failed to update streak grid:', error);
    }
  }

  calculateCurrentStreak(entryDates) {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    // Check if today has an entry, if not start from yesterday
    if (!entryDates.has(today.toDateString())) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days with entries going backwards
    while (entryDates.has(currentDate.toDateString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  // Override showSettingsModal to initialize habits when opened
  showSettingsModal() {
    this.loadCurrentSettings();
    this.loadSecuritySettings();
    this.elements.settingsModal.classList.add('active');
    // Initialize streak grid when settings modal opens
    setTimeout(() => this.initializeStreakGrid(), 100);
  }

  // Password Protection Methods
  isPasswordProtectionEnabled() {
    return localStorage.getItem('passwordProtectionEnabled') === 'true';
  }

  getStoredPasswordHash() {
    return localStorage.getItem('appPasswordHash');
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyPassword(password) {
    const storedHash = this.getStoredPasswordHash();
    if (!storedHash) return false;
    const inputHash = await this.hashPassword(password);
    return inputHash === storedHash;
  }

  loadSecuritySettings() {
    const isEnabled = this.isPasswordProtectionEnabled();
    this.elements.passwordProtectionEnabled.checked = isEnabled;
    
    if (isEnabled) {
      this.elements.passwordSettings.style.display = 'none';
      this.elements.changePasswordSection.style.display = 'block';
    } else {
      this.elements.passwordSettings.style.display = 'none';
      this.elements.changePasswordSection.style.display = 'none';
    }
  }

  togglePasswordProtection() {
    const isEnabled = this.elements.passwordProtectionEnabled.checked;
    
    if (isEnabled && !this.getStoredPasswordHash()) {
      // Show password setup
      this.elements.passwordSettings.style.display = 'block';
      this.elements.changePasswordSection.style.display = 'none';
    } else if (isEnabled) {
      // Already has password, show change option
      this.elements.passwordSettings.style.display = 'none';
      this.elements.changePasswordSection.style.display = 'block';
      localStorage.setItem('passwordProtectionEnabled', 'true');
    } else {
      // Trying to disable protection - require password verification
      if (this.getStoredPasswordHash()) {
        // Reset checkbox and show verification modal
        this.elements.passwordProtectionEnabled.checked = true;
        this.showDisableProtectionModal();
      } else {
        // No password set, can disable freely
        this.elements.passwordSettings.style.display = 'none';
        this.elements.changePasswordSection.style.display = 'none';
        localStorage.setItem('passwordProtectionEnabled', 'false');
      }
    }
  }

  async saveNewPassword() {
    const newPassword = this.elements.newPassword.value;
    const confirmPassword = this.elements.confirmPassword.value;
    
    this.clearFeedback('password-feedback');
    
    // Enhanced password validation
    const strengthCheck = this.validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      this.showFeedback('password-feedback', strengthCheck.message, 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showFeedback('password-feedback', 'Passcodes do not match.', 'error');
      return;
    }
    
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      localStorage.setItem('appPasswordHash', hashedPassword);
      localStorage.setItem('passwordProtectionEnabled', 'true');
      
      this.elements.newPassword.value = '';
      this.elements.confirmPassword.value = '';
      this.elements.passwordSettings.style.display = 'none';
      this.elements.changePasswordSection.style.display = 'block';
      
      this.showFeedback('password-feedback', 'Passcode saved successfully!', 'success');
      setTimeout(() => this.clearFeedback('password-feedback'), 3000);
    } catch (error) {
      this.showFeedback('password-feedback', 'Error saving passcode. Please try again.', 'error');
    }
  }

  async changeExistingPassword() {
    const currentPassword = this.elements.currentPassword.value;
    const newPassword = this.elements.newPasswordChange.value;
    const confirmPassword = this.elements.confirmPasswordChange.value;
    
    this.clearFeedback('change-password-feedback');
    
    if (!currentPassword) {
      this.showFeedback('change-password-feedback', 'Please enter your current passcode.', 'error');
      return;
    }
    
    const isCurrentValid = await this.verifyPassword(currentPassword);
    if (!isCurrentValid) {
      this.showFeedback('change-password-feedback', 'Current passcode is incorrect.', 'error');
      return;
    }
    
    const strengthCheck = this.validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      this.showFeedback('change-password-feedback', strengthCheck.message, 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showFeedback('change-password-feedback', 'New passcodes do not match.', 'error');
      return;
    }
    
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      localStorage.setItem('appPasswordHash', hashedPassword);
      
      this.elements.currentPassword.value = '';
      this.elements.newPasswordChange.value = '';
      this.elements.confirmPasswordChange.value = '';
      
      this.showFeedback('change-password-feedback', 'Passcode changed successfully!', 'success');
      setTimeout(() => this.clearFeedback('change-password-feedback'), 3000);
    } catch (error) {
      this.showFeedback('change-password-feedback', 'Error changing passcode. Please try again.', 'error');
    }
  }

  async showPasswordEntry() {
    this.elements.passwordEntryModal.classList.add('active');
    this.elements.passwordEntryInput.focus();
    this.clearFeedback('password-entry-error');
  }

  async submitPasswordEntry() {
    const password = this.elements.passwordEntryInput.value;
    
    if (!password) {
      this.showFeedback('password-entry-error', 'Please enter your passcode.', 'error');
      return;
    }

    // Check for lockout
    if (this.isLockedOut()) {
      const remainingTime = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
      this.showFeedback('password-entry-error', `Too many failed attempts. Try again in ${remainingTime} seconds.`, 'error');
      this.elements.passwordEntryInput.value = '';
      return;
    }
    
    const isValid = await this.verifyPasswordWithBruteForceProtection(password);
    
    if (isValid) {
      this.failedPasswordAttempts = 0;
      this.lockoutEndTime = null;
      this.elements.passwordEntryModal.classList.remove('active');
      this.elements.passwordEntryInput.value = '';
      this.clearFeedback('password-entry-error');
      this.startSessionTimeout();
      await this.loadEntries();
      this.showScreen('home');
    } else {
      this.handleFailedPasswordAttempt();
      this.showFeedback('password-entry-error', 'Incorrect passcode. Please try again.', 'error');
      this.elements.passwordEntryInput.value = '';
      this.elements.passwordEntryInput.focus();
    }
  }

  showFeedback(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.className = `password-feedback ${type}`;
    }
  }

  clearFeedback(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = '';
      element.className = 'password-feedback';
    }
  }

  showDisableProtectionModal() {
    this.elements.disableProtectionModal.classList.add('active');
    this.elements.disableProtectionInput.focus();
    this.elements.disableProtectionInput.value = '';
    this.clearFeedback('disable-protection-error');
  }

  hideDisableProtectionModal() {
    this.elements.disableProtectionModal.classList.remove('active');
    this.elements.disableProtectionInput.value = '';
    this.clearFeedback('disable-protection-error');
  }

  async confirmDisableProtection() {
    const password = this.elements.disableProtectionInput.value;
    
    if (!password) {
      this.showFeedback('disable-protection-error', 'Please enter your current passcode.', 'error');
      return;
    }
    
    // Add delay to prevent rapid attempts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isValid = await this.verifyPassword(password);
    
    if (isValid) {
      // Password correct, disable protection
      this.elements.passwordProtectionEnabled.checked = false;
      this.elements.passwordSettings.style.display = 'none';
      this.elements.changePasswordSection.style.display = 'none';
      localStorage.setItem('passwordProtectionEnabled', 'false');
      
      // Clear session timeout when protection is disabled
      if (this.sessionTimeout) {
        clearTimeout(this.sessionTimeout);
        this.sessionTimeout = null;
      }
      
      this.hideDisableProtectionModal();
    } else {
      this.showFeedback('disable-protection-error', 'Incorrect passcode. Please try again.', 'error');
      this.elements.disableProtectionInput.value = '';
      this.elements.disableProtectionInput.focus();
    }
  }

  cancelDisableProtection() {
    // Keep protection enabled, just close modal
    this.elements.passwordProtectionEnabled.checked = true;
    this.hideDisableProtectionModal();
  }

  // Brute force protection methods
  isLockedOut() {
    return this.lockoutEndTime && Date.now() < this.lockoutEndTime;
  }

  handleFailedPasswordAttempt() {
    this.failedPasswordAttempts++;
    
    if (this.failedPasswordAttempts >= 5) {
      // Lock out for 30 seconds after 5 failed attempts
      this.lockoutEndTime = Date.now() + (30 * 1000);
    } else if (this.failedPasswordAttempts >= 3) {
      // Lock out for 10 seconds after 3 failed attempts
      this.lockoutEndTime = Date.now() + (10 * 1000);
    }
  }

  async verifyPasswordWithBruteForceProtection(password) {
    // Add small delay to prevent rapid attempts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return await this.verifyPassword(password);
  }

  // Session timeout methods
  startSessionTimeout() {
    // Auto-lock after 30 minutes of inactivity
    this.resetSessionTimeout();
    
    // Listen for user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetSessionTimeout(), true);
    });
  }

  resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Only set timeout if password protection is enabled and user is logged in
    if (this.isPasswordProtectionEnabled() && !this.elements.passwordEntryModal.classList.contains('active')) {
      this.sessionTimeout = setTimeout(() => {
        this.lockSession();
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  lockSession() {
    if (this.isPasswordProtectionEnabled()) {
      this.showPasswordEntry();
    }
  }

  // Prevent ESC key from closing password modals
  setupSecureModalHandling() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Prevent ESC from closing password entry or disable protection modals
        if (this.elements.passwordEntryModal.classList.contains('active') ||
            this.elements.disableProtectionModal.classList.contains('active')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }, true);
  }

  // Enhanced password strength validation
  validatePasswordStrength(password) {
    if (password.length < 6) {
      return { valid: false, message: 'Passcode must be at least 6 characters long.' };
    }
    
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password) && password.length < 8) {
      return { valid: false, message: 'Passcode should be at least 8 characters OR contain both letters and numbers.' };
    }
    
    return { valid: true, message: '' };
  }
}

let journalAppInstance;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting JournalApp...');
  journalAppInstance = new JournalApp();
  
  // Make it available for testing in browser console
  window.testApp = journalAppInstance;
});