// Navigation Manager for Home Screen Arrow Key Navigation
class NavigationManager {
  constructor(uiManager, entryManager) {
    this.uiManager = uiManager;
    this.entryManager = entryManager;
    this.currentFocusIndex = -1;
    this.navigationElements = [];
    this.isNavigationActive = false;
    this.onActivateCallback = null;
    this.savedFocusIndex = -1; // Store focus when leaving home screen
  }

  // Initialize navigation elements in order
  initializeNavigation() {
    
    this.navigationElements = [
      {
        element: this.uiManager.elements.searchInput,
        type: 'search',
        activate: () => this.uiManager.elements.searchInput.focus()
      },
      {
        element: this.uiManager.elements.filterButton,
        type: 'button',
        activate: () => this.uiManager.elements.filterButton.click()
      },
      {
        element: this.uiManager.elements.settingsButton,
        type: 'button',
        activate: () => this.uiManager.elements.settingsButton.click()
      }
    ];

    // Add entry elements
    this.refreshEntryElements();
    
    // Restore saved focus if we have one
    this.restoreSavedFocus();
  }

  // Save focus before leaving home screen
  saveFocusBeforeLeaving() {
    if (this.isNavigationActive && this.currentFocusIndex >= 0) {
      this.savedFocusIndex = this.currentFocusIndex;
    }
  }

  // Restore previously saved focus when returning to home screen
  restoreSavedFocus() {
    if (this.savedFocusIndex >= 0 && this.savedFocusIndex < this.navigationElements.length) {
      this.isNavigationActive = true;
      this.currentFocusIndex = this.savedFocusIndex;
      this.updateFocusVisual();
      // Don't clear the saved index yet - in case user switches screens again
    }
  }

  // Refresh the entry elements when entries are updated
  refreshEntryElements() {
    
    // Remove existing entry elements
    this.navigationElements = this.navigationElements.filter(item => item.type !== 'entry');
    
    // Add current entry elements
    const entryItems = this.uiManager.elements.entriesList.querySelectorAll('.entry-item');
    
    entryItems.forEach((entryElement, index) => {
      this.navigationElements.push({
        element: entryElement,
        type: 'entry',
        entryIndex: index,
        activate: () => {
          // Get the entry data and activate it
          const entry = this.entryManager.getFilteredEntries()[index];
          if (entry) {
            if (entry.draft) {
              const screen = this.entryManager.editEntry(entry);
              if (this.onActivateCallback) {
                this.onActivateCallback(screen);
              }
            } else {
              const screen = this.entryManager.viewEntry(entry);
              if (this.onActivateCallback) {
                this.onActivateCallback(screen);
              }
            }
          }
        }
      });
    });
  }

  // Set callback for when navigation activates something that changes screens
  setActivateCallback(callback) {
    this.onActivateCallback = callback;
  }

  // Handle arrow key navigation
  handleArrowKey(direction) {
    
    // Only handle navigation on home screen
    if (!this.isOnHomeScreen()) {
      return false;
    }

    // If navigation isn't active, activate it
    if (!this.isNavigationActive) {
      this.activateNavigation();
      return true;
    }

    switch (direction) {
      case 'up':
        this.moveFocus(-1);
        break;
      case 'down':
        this.moveFocusDown();
        break;
      case 'left':
        // In grid-like layouts, left could move to previous row
        this.moveFocus(-1);
        break;
      case 'right':
        // In grid-like layouts, right could move to next row
        this.moveFocus(1);
        break;
    }
    return true;
  }

  // Handle Enter key activation
  handleEnterKey() {
    if (!this.isNavigationActive || this.currentFocusIndex < 0) {
      return false;
    }

    const currentElement = this.navigationElements[this.currentFocusIndex];
    if (currentElement && currentElement.activate) {
      currentElement.activate();
      return true;
    }
    return false;
  }

  // Handle Escape key (deactivate navigation)
  handleEscapeKey() {
    if (this.isNavigationActive) {
      this.deactivateNavigation();
      return true;
    }
    return false;
  }

  // Activate navigation mode
  activateNavigation() {
    this.isNavigationActive = true;
    this.currentFocusIndex = 0;
    this.updateFocusVisual();
  }

  // Deactivate navigation mode
  deactivateNavigation() {
    this.isNavigationActive = false;
    this.removeFocusVisual();
    this.currentFocusIndex = -1;
  }

  // Move focus to next/previous element
  moveFocus(direction) {
    const newIndex = this.currentFocusIndex + direction;
    
    if (newIndex >= 0 && newIndex < this.navigationElements.length) {
      this.currentFocusIndex = newIndex;
      this.updateFocusVisual();
    }
  }

  // Special down movement logic: jump to first entry when pressing down from header elements
  moveFocusDown() {
    const currentElement = this.navigationElements[this.currentFocusIndex];
    
    // Check if we're currently on a header element (search, filter, or settings)
    if (currentElement && ['search', 'button'].includes(currentElement.type)) {
      // Find the first entry element
      const firstEntryIndex = this.navigationElements.findIndex(item => item.type === 'entry');
      
      if (firstEntryIndex !== -1) {
        this.currentFocusIndex = firstEntryIndex;
        this.updateFocusVisual();
        return;
      }
    }
    
    // Default behavior: move to next element
    this.moveFocus(1);
  }

  // Update visual focus indicator
  updateFocusVisual() {
    // Remove previous focus
    this.removeFocusVisual();
    
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.navigationElements.length) {
      const currentElement = this.navigationElements[this.currentFocusIndex];
      
      if (currentElement && currentElement.element) {
        currentElement.element.classList.add('nav-focused');
        
        // Ensure the element is visible
        currentElement.element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }

  // Remove focus visual from all elements
  removeFocusVisual() {
    document.querySelectorAll('.nav-focused').forEach(el => {
      el.classList.remove('nav-focused');
    });
  }

  // Check if we're on the home screen
  isOnHomeScreen() {
    return this.uiManager.elements.homeScreen.classList.contains('active');
  }

  // Reset navigation when screen changes
  resetNavigation() {
    this.deactivateNavigation();
  }

  // Update navigation when entries change
  onEntriesUpdated() {
    if (this.isNavigationActive) {
      const wasActive = this.isNavigationActive;
      const currentIndex = this.currentFocusIndex;
      
      this.refreshEntryElements();
      
      if (wasActive) {
        // Try to maintain focus position, but ensure it's valid
        this.currentFocusIndex = Math.min(currentIndex, this.navigationElements.length - 1);
        this.updateFocusVisual();
      }
    } else {
      this.refreshEntryElements();
    }
    
    // Also validate saved focus index when entries change
    if (this.savedFocusIndex >= this.navigationElements.length) {
      this.savedFocusIndex = Math.max(0, this.navigationElements.length - 1);
    }
  }
}

// Make available globally for browser
window.NavigationManager = NavigationManager;
