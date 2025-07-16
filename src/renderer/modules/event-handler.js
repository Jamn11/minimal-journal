// Event Handling Module
class EventHandler {
  constructor(uiManager, entryManager, searchFilter, settingsManager, securityManager, habitsManager, navigationManager, utils) {
    this.uiManager = uiManager;
    this.entryManager = entryManager;
    this.searchFilter = searchFilter;
    this.settingsManager = settingsManager;
    this.securityManager = securityManager;
    this.habitsManager = habitsManager;
    this.navigationManager = navigationManager;
    this.utils = utils;
    this.appState = {
      currentScreen: 'home'
    };
  }

  setupEventListeners() {
    this.uiManager.elements.searchInput.addEventListener('input', () => this.searchFilter.handleSearch());
    this.uiManager.elements.filterButton.addEventListener('click', () => this.searchFilter.showFilterModal());
    this.uiManager.elements.exportButton.addEventListener('click', () => Utils.exportEntries());
    this.uiManager.elements.settingsButton.addEventListener('click', () => this.showSettingsModal());
    this.uiManager.elements.saveButton.addEventListener('click', () => this.saveEntry());
    this.uiManager.elements.bodyTextarea.addEventListener('input', () => this.entryManager.updateWordCount());
    this.uiManager.elements.backButton.addEventListener('click', () => this.showScreen('home'));

    this.uiManager.elements.applyFilters.addEventListener('click', () => this.searchFilter.applyFilters());
    this.uiManager.elements.clearFilters.addEventListener('click', () => this.searchFilter.clearFilters());
    this.uiManager.elements.cancelFilters.addEventListener('click', () => this.searchFilter.hideFilterModal());

    this.uiManager.elements.closeSettings.addEventListener('click', () => this.settingsManager.hideSettingsModal());
    this.uiManager.elements.fontSizeSlider.addEventListener('input', () => {
      this.settingsManager.updateFontSizeDisplay();
      this.settingsManager.autoSaveFontSize();
    });
    this.uiManager.elements.fontFamilySelect.addEventListener('change', () => this.settingsManager.autoSaveFontFamily());
    this.uiManager.elements.lightTheme.addEventListener('click', () => this.settingsManager.selectAndSaveTheme('light'));
    this.uiManager.elements.darkTheme.addEventListener('click', () => this.settingsManager.selectAndSaveTheme('dark'));

    // Security event listeners
    this.uiManager.elements.passwordProtectionEnabled.addEventListener('change', () => this.securityManager.togglePasswordProtection());
    this.uiManager.elements.savePassword.addEventListener('click', () => this.securityManager.saveNewPassword());
    this.uiManager.elements.changePassword.addEventListener('click', () => this.securityManager.changeExistingPassword());
    this.uiManager.elements.passwordEntrySubmit.addEventListener('click', () => this.submitPasswordEntry());
    this.uiManager.elements.passwordEntryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.submitPasswordEntry();
      }
    });

    // Disable protection modal event listeners
    this.uiManager.elements.disableProtectionConfirm.addEventListener('click', () => this.securityManager.confirmDisableProtection());
    this.uiManager.elements.disableProtectionCancel.addEventListener('click', () => this.securityManager.cancelDisableProtection());
    this.uiManager.elements.disableProtectionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.securityManager.confirmDisableProtection();
      }
    });

    // Tab switching
    this.uiManager.elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.settingsManager.switchTab(button.dataset.tab));
    });

    this.uiManager.elements.filterModal.addEventListener('click', (e) => {
      if (e.target === this.uiManager.elements.filterModal) {
        this.searchFilter.hideFilterModal();
      }
    });

    this.uiManager.elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.uiManager.elements.settingsModal) {
        this.settingsManager.hideSettingsModal();
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
            this.uiManager.elements.searchInput.focus();
          }
          break;
        case 'save-entry':
          if (this.appState.currentScreen === 'journal') {
            this.saveEntry();
          }
          break;
        case 'escape':
          if (this.uiManager.elements.settingsModal.classList.contains('active')) {
            this.settingsManager.hideSettingsModal();
          } else if (this.uiManager.elements.filterModal.classList.contains('active')) {
            this.searchFilter.hideFilterModal();
          } else if (this.appState.currentScreen === 'home' && this.navigationManager.isNavigationActive) {
            this.navigationManager.deactivateNavigation();
          } else if (this.appState.currentScreen === 'journal') {
            this.saveAsDraft();
          } else if (this.appState.currentScreen === 'view') {
            this.showScreen('home');
          }
          break;
        case 'delete-entry':
          if (this.appState.currentScreen === 'journal' && this.entryManager.getEditingEntryId()) {
            this.deleteCurrentEntry();
          }
          break;
        case 'toggle-theme':
          this.settingsManager.toggleTheme();
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
      if (this.uiManager.elements.settingsModal.classList.contains('active') && e.key === 'Enter') {
        e.preventDefault();
        this.settingsManager.saveSettings();
        return;
      }

      // Tab navigation in settings modal
      if (this.uiManager.elements.settingsModal.classList.contains('active') && e.key === 'Tab' && e.ctrlKey) {
        e.preventDefault();
        if (e.shiftKey) {
          this.settingsManager.navigateTabLeft();
        } else {
          this.settingsManager.navigateTabRight();
        }
        return;
      }
      
      // Format shortcuts in journal screen
      if (this.appState.currentScreen === 'journal') {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          Utils.applyFormat(this.uiManager.elements.bodyTextarea, 'bold');
          this.entryManager.updateWordCount();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
          e.preventDefault();
          Utils.applyFormat(this.uiManager.elements.bodyTextarea, 'italic');
          this.entryManager.updateWordCount();
        }
      }
      
      // Edit shortcut in view screen
      if (this.appState.currentScreen === 'view' && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.editCurrentEntry();
      }

      // Arrow key navigation on home screen
      if (this.appState.currentScreen === 'home' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        console.log('Arrow key detected on home screen:', e.key);
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          console.log('Calling handleArrowKey with up');
          this.navigationManager.handleArrowKey('up');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          console.log('Calling handleArrowKey with down');
          this.navigationManager.handleArrowKey('down');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          console.log('Calling handleArrowKey with left');
          this.navigationManager.handleArrowKey('left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          console.log('Calling handleArrowKey with right');
          this.navigationManager.handleArrowKey('right');
        } else if (e.key === 'Enter') {
          // Only handle Enter for navigation if no input element is focused
          if (!this.isInputFocused()) {
            e.preventDefault();
            console.log('Calling handleEnterKey');
            this.navigationManager.handleEnterKey();
          }
        }
      }
    });
  }

  showScreen(screen) {
    // Save focus before leaving home screen
    if (this.appState.currentScreen === 'home' && screen !== 'home') {
      this.navigationManager.saveFocusBeforeLeaving();
    }
    
    this.appState.currentScreen = this.uiManager.showScreen(screen);
    
    // Reset navigation when screen changes
    this.navigationManager.resetNavigation();
    
    // Initialize navigation when returning to home screen
    if (screen === 'home') {
      this.navigationManager.initializeNavigation();
    }
  }

  // Helper method to check if an input element is focused
  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  }

  newEntry() {
    const screen = this.entryManager.newEntry();
    this.showScreen(screen);
  }

  editCurrentEntry() {
    const screen = this.entryManager.editCurrentEntry();
    if (screen) {
      this.showScreen(screen);
    }
  }

  async saveEntry() {
    const result = await this.entryManager.saveEntry();
    if (result && result.success) {
      if (result.updateStreak) {
        this.habitsManager.updateStreakGrid();
      }
      this.showScreen('home');
    }
  }

  async saveAsDraft() {
    const result = await this.entryManager.saveAsDraft();
    if (result && result.goHome) {
      this.showScreen('home');
    }
  }

  async deleteCurrentEntry() {
    const success = await this.entryManager.deleteCurrentEntry();
    if (success) {
      this.showScreen('home');
    }
  }

  async submitPasswordEntry() {
    const result = await this.securityManager.submitPasswordEntry();
    if (result.success) {
      await this.entryManager.loadEntries();
      this.navigationManager.initializeNavigation();
      this.showScreen('home');
    }
  }

  showSettingsModal() {
    this.settingsManager.showSettingsModal();
    this.securityManager.loadSecuritySettings();
    // Initialize streak grid when settings modal opens
    setTimeout(() => this.habitsManager.initializeStreakGrid(), 100);
  }

  getCurrentScreen() {
    return this.appState.currentScreen;
  }
}

// Make available globally for browser
window.EventHandler = EventHandler;