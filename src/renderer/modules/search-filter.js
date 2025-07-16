// Search and Filter Module
class SearchFilter {
  constructor(uiManager, entryManager) {
    this.uiManager = uiManager;
    this.entryManager = entryManager;
    this.currentFilters = {};
    this.searchDebounceTimer = null;
  }

  handleSearch() {
    // Clear existing debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    // Set new debounce timer for 300ms
    this.searchDebounceTimer = setTimeout(() => {
      const query = this.uiManager.elements.searchInput.value.toLowerCase();
      this.currentFilters.query = query || undefined;
      this.applyCurrentFilters();
    }, 300);
  }

  applyCurrentFilters() {
    const entries = this.entryManager.getEntries();
    const filteredEntries = entries.filter(entry => {
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

    this.entryManager.setFilteredEntries(filteredEntries);
  }

  showFilterModal() {
    this.uiManager.elements.filterModal.classList.add('active');
    this.uiManager.elements.filterTags.value = this.currentFilters.tags?.join(', ') || '';
    this.uiManager.elements.filterDateFrom.value = this.currentFilters.dateFrom?.split('T')[0] || '';
    this.uiManager.elements.filterDateTo.value = this.currentFilters.dateTo?.split('T')[0] || '';
  }

  hideFilterModal() {
    this.uiManager.elements.filterModal.classList.remove('active');
  }

  applyFilters() {
    const tags = this.uiManager.elements.filterTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    this.currentFilters.tags = tags.length > 0 ? tags : undefined;
    this.currentFilters.dateFrom = this.uiManager.elements.filterDateFrom.value || undefined;
    this.currentFilters.dateTo = this.uiManager.elements.filterDateTo.value || undefined;

    this.applyCurrentFilters();
    this.hideFilterModal();
  }

  clearFilters() {
    this.currentFilters = {};
    this.uiManager.elements.searchInput.value = '';
    this.uiManager.elements.filterTags.value = '';
    this.uiManager.elements.filterDateFrom.value = '';
    this.uiManager.elements.filterDateTo.value = '';
    
    const entries = this.entryManager.getEntries();
    this.entryManager.setFilteredEntries([...entries]);
    this.hideFilterModal();
  }
}

// Make available globally for browser
window.SearchFilter = SearchFilter;