// Main application entry point - uses static script loading
// Modules are loaded via static script tags in HTML

let journalAppInstance;

function renderStartupError(message) {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.color = 'red';
  container.textContent = message;
  document.body.innerHTML = '';
  document.body.appendChild(container);
}

// Wait for DOM to be ready, then initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Check if basic DOM elements exist
  const homeScreen = document.getElementById('home-screen');
  const journalScreen = document.getElementById('journal-screen');
  const viewScreen = document.getElementById('view-screen');

  if (!homeScreen || !journalScreen || !viewScreen) {
    renderStartupError('Critical DOM elements missing. Check HTML structure.');
    return;
  }
  
  try {
    // Check if all modules are loaded
    const modules = {
      UIManager: typeof window.UIManager,
      Utils: typeof window.Utils,
      EntryManager: typeof window.EntryManager,
      SearchFilter: typeof window.SearchFilter,
      SettingsManager: typeof window.SettingsManager,
      HabitsManager: typeof window.HabitsManager,
      SecurityManager: typeof window.SecurityManager,
      NavigationManager: typeof window.NavigationManager,
      EventHandler: typeof window.EventHandler,
      JournalApp: typeof window.JournalApp
    };

    // Check if any modules are missing
    const missingModules = Object.entries(modules).filter(([name, type]) => type !== 'function');
    if (missingModules.length > 0) {
      renderStartupError(`Missing modules: ${missingModules.map(([name]) => name).join(', ')}`);
      return;
    }

    // Initialize the app
    journalAppInstance = new JournalApp();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
    renderStartupError(`Failed to initialize application: ${errorMessage}`);
  }
});
