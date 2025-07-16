// UI and DOM Management Module
class UIManager {
  constructor() {
    this.elements = this.getElements();
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
    
    return screen;
  }

  showError(message) {
    this.elements.entriesList.innerHTML = `<div class="empty-state" style="color: red;">${message}</div>`;
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
}

// Make available globally for browser
window.UIManager = UIManager;