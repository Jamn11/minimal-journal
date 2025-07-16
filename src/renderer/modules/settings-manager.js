// Settings Management Module
class SettingsManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    // Initialize settings will be called explicitly by app controller
  }

  showSettingsModal() {
    this.loadCurrentSettings();
    this.uiManager.elements.settingsModal.classList.add('active');
  }

  hideSettingsModal() {
    this.uiManager.elements.settingsModal.classList.remove('active');
  }

  switchTab(tabName) {
    // Remove active class from all tabs and tab contents
    this.uiManager.elements.tabButtons.forEach(button => button.classList.remove('active'));
    this.uiManager.elements.tabContents.forEach(content => content.classList.remove('active'));
    
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
    this.uiManager.elements.fontFamilySelect.value = currentFontFamily;

    // Load current font size
    const currentFontSize = localStorage.getItem('fontSize') || '16';
    this.uiManager.elements.fontSizeSlider.value = currentFontSize;
    this.uiManager.elements.fontSizeValue.textContent = currentFontSize + 'px';

    // Load current theme
    const currentTheme = localStorage.getItem('theme') || 'dark';
    this.updateThemeButtons(currentTheme);
  }

  updateFontSizeDisplay() {
    const size = this.uiManager.elements.fontSizeSlider.value;
    this.uiManager.elements.fontSizeValue.textContent = size + 'px';
    
    // Apply the font size change immediately for live preview
    document.documentElement.style.setProperty('--app-font-size', size + 'px');
  }

  selectTheme(theme) {
    this.updateThemeButtons(theme);
  }

  updateThemeButtons(theme) {
    this.uiManager.elements.lightTheme.classList.remove('active');
    this.uiManager.elements.darkTheme.classList.remove('active');
    
    if (theme === 'light') {
      this.uiManager.elements.lightTheme.classList.add('active');
    } else {
      this.uiManager.elements.darkTheme.classList.add('active');
    }
  }

  saveSettings() {
    const fontFamily = this.uiManager.elements.fontFamilySelect.value;
    const fontSize = this.uiManager.elements.fontSizeSlider.value;
    const theme = this.uiManager.elements.lightTheme.classList.contains('active') ? 'light' : 'dark';

    // Save to localStorage
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('theme', theme);

    // Apply settings immediately
    this.applySettings(fontFamily, fontSize, theme);

    this.hideSettingsModal();
  }

  autoSaveFontSize() {
    const fontSize = this.uiManager.elements.fontSizeSlider.value;
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.style.setProperty('--app-font-size', fontSize + 'px');
  }

  autoSaveFontFamily() {
    const fontFamily = this.uiManager.elements.fontFamilySelect.value;
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

  async initializeSettings() {
    try {
      const fontFamily = localStorage.getItem('fontFamily') || 'Courier New, Monaco, Menlo, monospace';
      const fontSize = localStorage.getItem('fontSize') || '16';
      const theme = localStorage.getItem('theme') || 'dark';
      
      // Validate settings before applying
      const validatedFontSize = this.validateFontSize(fontSize);
      const validatedTheme = this.validateTheme(theme);
      
      this.applySettings(fontFamily, validatedFontSize, validatedTheme);
    } catch (error) {
      console.error('Error initializing settings:', error);
      // Apply default settings if there's an error
      this.applySettings('Courier New, Monaco, Menlo, monospace', '16', 'dark');
      throw error; // Re-throw to be handled by app controller
    }
  }

  validateFontSize(fontSize) {
    const size = parseInt(fontSize, 10);
    if (isNaN(size) || size < 12 || size > 24) {
      console.warn('Invalid font size:', fontSize, 'using default 16');
      return '16';
    }
    return fontSize;
  }

  validateTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('Invalid theme:', theme, 'using default dark');
      return 'dark';
    }
    return theme;
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
}

// Make available globally for browser
window.SettingsManager = SettingsManager;