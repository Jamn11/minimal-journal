// Main Application Controller
class JournalApp {
  constructor() {
    this.appState = {
      currentScreen: 'home',
    };
    
    // Initialize modules
    this.uiManager = new UIManager();
    this.entryManager = new EntryManager(this.uiManager, Utils);
    this.searchFilter = new SearchFilter(this.uiManager, this.entryManager);
    this.settingsManager = new SettingsManager(this.uiManager);
    this.securityManager = new SecurityManager(this.uiManager, Utils);
    this.habitsManager = new HabitsManager(this.uiManager);
    this.navigationManager = new NavigationManager(this.uiManager, this.entryManager);
    this.eventHandler = new EventHandler(
      this.uiManager,
      this.entryManager,
      this.searchFilter,
      this.settingsManager,
      this.securityManager,
      this.habitsManager,
      this.navigationManager,
      Utils
    );

    // Set up entry manager callback for screen changes
    this.entryManager.onScreenChange = (screen) => {
      this.eventHandler.showScreen(screen);
    };

    // Set up navigation manager callback for screen changes
    this.navigationManager.setActivateCallback((screen) => {
      this.eventHandler.showScreen(screen);
    });

    // Set up entry manager callback for navigation updates
    this.entryManager.onEntriesUpdated = () => {
      this.navigationManager.onEntriesUpdated();
    };

    this.init();
  }

  async init() {
    console.log('Initializing JournalApp...');
    
    try {
      // Check if electronAPI is available
      if (!window.electronAPI) {
        console.error('electronAPI not found! Preload script may not be working.');
        this.uiManager.showError('Application not properly initialized. Please restart the app.');
        return;
      }

      // Set up error boundary for uncaught errors
      this.setupErrorBoundary();

      this.eventHandler.setupEventListeners();
      this.eventHandler.setupKeyboardShortcuts();
      this.securityManager.setupSecureModalHandling();
      
      // Initialize settings with error handling
      try {
        await this.settingsManager.initializeSettings();
      } catch (error) {
        console.error('Failed to initialize settings:', error);
        this.uiManager.showError('Failed to load settings. Using defaults.');
      }
      
      // Wait a moment for database to fully initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if password protection is enabled (now async)
      try {
        const isPasswordProtectionEnabled = await this.securityManager.isPasswordProtectionEnabled();
        if (isPasswordProtectionEnabled) {
          await this.securityManager.showPasswordEntry();
        } else {
          await this.entryManager.loadEntries();
          this.navigationManager.initializeNavigation();
          this.eventHandler.showScreen('home');
        }
      } catch (error) {
        console.error('Failed to check password protection:', error);
        this.uiManager.showError('Failed to initialize security. Please restart the app.');
        return;
      }
      
      console.log('JournalApp initialized successfully');
    } catch (error) {
      console.error('Critical error during app initialization:', error);
      this.uiManager.showError('Critical error during initialization. Please restart the app.');
      this.handleCriticalError(error);
    }
  }

  setupErrorBoundary() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      this.uiManager.showError('An unexpected error occurred. Please try again.');
      this.handleCriticalError(event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.uiManager.showError('An unexpected error occurred. Please try again.');
      this.handleCriticalError(event.reason);
    });
  }

  handleCriticalError(error) {
    // Log error details for debugging
    console.error('Critical error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      currentScreen: this.appState.currentScreen
    });

    // Try to gracefully recover if possible
    try {
      // Reset to home screen
      this.eventHandler.showScreen('home');
    } catch (recoveryError) {
      console.error('Failed to recover from error:', recoveryError);
    }
  }

  showScreen(screen) {
    try {
      this.appState.currentScreen = this.uiManager.showScreen(screen);
      this.eventHandler.appState.currentScreen = screen; // Keep EventHandler in sync
    } catch (error) {
      console.error('Error showing screen:', error);
      this.uiManager.showError('Failed to navigate to screen. Please try again.');
    }
  }

  // Public methods for testing
  testBold() {
    Utils.applyFormat(this.uiManager.elements.bodyTextarea, 'bold');
    this.entryManager.updateWordCount();
  }

  testItalic() {
    Utils.applyFormat(this.uiManager.elements.bodyTextarea, 'italic');
    this.entryManager.updateWordCount();
  }

  getScreenState() {
    return this.appState.currentScreen;
  }

  // Getter methods for module access
  getUIManager() { return this.uiManager; }
  getEntryManager() { return this.entryManager; }
  getSearchFilter() { return this.searchFilter; }
  getSettingsManager() { return this.settingsManager; }
  getSecurityManager() { return this.securityManager; }
  getHabitsManager() { return this.habitsManager; }
  getEventHandler() { return this.eventHandler; }
}

// Make available globally for browser
window.JournalApp = JournalApp;