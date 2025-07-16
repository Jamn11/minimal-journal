// Habits and Streak Tracking Module
class HabitsManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
  }

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
}

// Make available globally for browser
window.HabitsManager = HabitsManager;