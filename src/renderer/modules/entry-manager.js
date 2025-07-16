// Entry Management Module
class EntryManager {
  constructor(uiManager, utils) {
    this.uiManager = uiManager;
    this.utils = utils;
    this.entries = [];
    this.filteredEntries = [];
    this.appState = {
      currentEntry: null,
      editingEntryId: null
    };
    this.onScreenChange = null; // Callback for screen changes
    this.onEntriesUpdated = null; // Callback for when entries are updated
    this.entryClickHandlers = []; // Store handlers for cleanup
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
      this.uiManager.showError('Failed to load entries. Database may not be initialized.');
    }
  }

  renderEntries() {
    const container = this.uiManager.elements.entriesList;
    
    // Clean up previous event listeners to prevent memory leaks
    this.cleanupEventListeners();
    
    if (this.filteredEntries.length === 0) {
      container.innerHTML = '<div class="empty-state">No entries found. Press Cmd+N to create your first entry.</div>';
      return;
    }

    container.innerHTML = this.filteredEntries
      .map(entry => Utils.createEntryHTML(entry))
      .join('');

    container.querySelectorAll('.entry-item').forEach((item, index) => {
      const handler = () => {
        const entry = this.filteredEntries[index];
        if (entry.draft) {
          const screen = this.editEntry(entry);
          if (this.onScreenChange) {
            this.onScreenChange(screen);
          }
        } else {
          const screen = this.viewEntry(entry);
          if (this.onScreenChange) {
            this.onScreenChange(screen);
          }
        }
      };
      
      item.addEventListener('click', handler);
      // Store handler for cleanup
      this.entryClickHandlers.push({ element: item, handler });
    });

    // Notify navigation manager that entries were updated
    if (this.onEntriesUpdated) {
      this.onEntriesUpdated();
    }
  }

  cleanupEventListeners() {
    // Remove all previously added event listeners
    this.entryClickHandlers.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    this.entryClickHandlers = [];
  }

  newEntry() {
    this.appState.editingEntryId = undefined;
    this.uiManager.elements.titleInput.value = '';
    this.uiManager.elements.bodyTextarea.value = '';
    this.updateWordCount();
    this.uiManager.elements.titleInput.focus();
    return 'journal';
  }

  editEntry(entry) {
    this.appState.editingEntryId = entry.id;
    this.uiManager.elements.titleInput.value = entry.title;
    this.uiManager.elements.bodyTextarea.value = entry.body;
    this.updateWordCount();
    this.uiManager.elements.titleInput.focus();
    return 'journal';
  }

  editCurrentEntry() {
    if (this.appState.currentEntry) {
      this.editEntry(this.appState.currentEntry);
      return 'journal';
    }
    return null;
  }

  viewEntry(entry) {
    this.appState.currentEntry = entry;
    this.uiManager.elements.viewTitle.textContent = entry.title || 'Untitled';
    
    const date = new Date(entry.timestamp);
    this.uiManager.elements.viewTimestamp.textContent = date.toLocaleString();
    
    // Escape tags to prevent XSS
    const tags = entry.tags.map(tag => `<span class="tag">#${Utils.escapeHtml(tag)}</span>`).join('');
    this.uiManager.elements.viewTags.innerHTML = tags;
    
    this.uiManager.elements.viewBody.innerHTML = Utils.renderMarkdown(entry.body);
    
    return 'view';
  }

  async saveEntry() {
    const title = this.uiManager.elements.titleInput.value.trim();
    const body = this.uiManager.elements.bodyTextarea.value.trim();

    if (!title && !body) {
      return null;
    }

    // Client-side validation for better UX
    if (title.length > 10000) {
      this.uiManager.showError('Entry title cannot exceed 10,000 characters.');
      return null;
    }
    
    if (body.length > 1000000) {
      this.uiManager.showError('Entry content cannot exceed 1,000,000 characters.');
      return null;
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
        // Signal to update streak grid
        return { success: true, updateStreak: true };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save entry:', error);
      
      // Show user-friendly error messages
      if (error.message.includes('cannot exceed')) {
        this.uiManager.showError(error.message);
      } else if (error.message.includes('invalid characters')) {
        this.uiManager.showError('Entry contains invalid characters. Please remove any special control characters.');
      } else {
        this.uiManager.showError('Failed to save entry. Please try again.');
      }
      return null;
    }
  }

  async saveAsDraft() {
    const title = this.uiManager.elements.titleInput.value.trim();
    const body = this.uiManager.elements.bodyTextarea.value.trim();

    if (!title && !body) {
      return { success: true, goHome: true };
    }

    // Client-side validation for better UX (same as saveEntry)
    if (title.length > 10000) {
      this.uiManager.showError('Entry title cannot exceed 10,000 characters.');
      return null;
    }
    
    if (body.length > 1000000) {
      this.uiManager.showError('Entry content cannot exceed 1,000,000 characters.');
      return null;
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
      
      return { success: true, goHome: true };
    } catch (error) {
      console.error('Failed to save draft:', error);
      
      // Show user-friendly error messages
      if (error.message.includes('cannot exceed')) {
        this.uiManager.showError(error.message);
      } else if (error.message.includes('invalid characters')) {
        this.uiManager.showError('Entry contains invalid characters. Please remove any special control characters.');
      } else {
        this.uiManager.showError('Failed to save draft. Please try again.');
      }
      return { success: false, goHome: true };
    }
  }

  async deleteCurrentEntry() {
    if (!this.appState.editingEntryId) {
      return false;
    }

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this entry? This action cannot be undone.');
    
    if (!confirmed) {
      return false;
    }

    try {
      console.log('Deleting entry:', this.appState.editingEntryId);
      await window.electronAPI.deleteEntry(this.appState.editingEntryId);
      await this.loadEntries();
      return true;
    } catch (error) {
      console.error('Failed to delete entry:', error);
      this.uiManager.showError('Failed to delete entry. Please try again.');
      return false;
    }
  }

  updateWordCount() {
    Utils.updateWordCount(this.uiManager.elements.bodyTextarea, this.uiManager.elements.wordCount);
  }

  setFilteredEntries(entries) {
    this.filteredEntries = entries;
    this.renderEntries();
  }

  getEntries() {
    return this.entries;
  }

  getFilteredEntries() {
    return this.filteredEntries;
  }

  getCurrentEntry() {
    return this.appState.currentEntry;
  }

  getEditingEntryId() {
    return this.appState.editingEntryId;
  }
}

// Make available globally for browser
window.EntryManager = EntryManager;