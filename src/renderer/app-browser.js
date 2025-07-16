// Main application entry point - uses static script loading
// Modules are loaded via static script tags in HTML

let journalAppInstance;

console.log('app-browser.js loaded');

// Wait for DOM to be ready, then initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, starting app initialization...');
  
  // Check if basic DOM elements exist
  const homeScreen = document.getElementById('home-screen');
  const journalScreen = document.getElementById('journal-screen');
  const viewScreen = document.getElementById('view-screen');
  
  console.log('DOM elements check:', {
    homeScreen: !!homeScreen,
    journalScreen: !!journalScreen,
    viewScreen: !!viewScreen
  });
  
  if (!homeScreen || !journalScreen || !viewScreen) {
    console.error('Critical DOM elements missing!');
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Critical DOM elements missing. Check HTML structure.</div>';
    return;
  }
  
  try {
    // Check if all modules are loaded
    console.log('Checking module availability...');
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
    
    console.log('Module availability:', modules);
    
    // Check if any modules are missing
    const missingModules = Object.entries(modules).filter(([name, type]) => type !== 'function');
    if (missingModules.length > 0) {
      console.error('Missing modules:', missingModules);
      document.body.innerHTML = '<div style="padding: 20px; color: red;">Missing modules: ' + missingModules.map(([name]) => name).join(', ') + '</div>';
      return;
    }
    
    console.log('All modules loaded, checking electronAPI...');
    console.log('electronAPI available:', typeof window.electronAPI);
    
    console.log('Starting JournalApp...');
    
    // Initialize the app
    console.log('About to create JournalApp instance...');
    journalAppInstance = new JournalApp();
    console.log('JournalApp instance created:', !!journalAppInstance);
    console.log('JournalApp ready');
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Failed to initialize application: ' + error.message + '<br>Check console for details.</div>';
  }
});