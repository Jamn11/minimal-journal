// Utility functions module
class Utils {
  static updateWordCount(bodyTextarea, wordCountElement) {
    const text = bodyTextarea.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    wordCountElement.textContent = `${wordCount} words`;
  }

  static applyFormat(bodyTextarea, format) {
    const textarea = bodyTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    const marker = format === 'bold' ? '**' : '*';
    
    if (selectedText) {
      // If text is selected, wrap it with formatting
      formattedText = `${marker}${selectedText}${marker}`;
    } else {
      // If no text selected, insert markers with cursor in between
      formattedText = `${marker}${marker}`;
    }
    
    // Replace the selected text with formatted text
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.value = newValue;
    
    // Position cursor correctly
    if (selectedText) {
      textarea.setSelectionRange(start + marker.length, start + marker.length + selectedText.length);
    } else {
      textarea.setSelectionRange(start + marker.length, start + marker.length);
    }
    
    textarea.focus();
  }

  static escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  static renderMarkdown(text) {
    // Simple markdown renderer for bold and italic with HTML escaping
    // First escape HTML to prevent XSS
    const escaped = Utils.escapeHtml(text);
    
    // Then apply markdown formatting
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  static async exportEntries() {
    try {
      const result = await window.electronAPI.exportEntries();
      
      if (result.success) {
        console.log('Entries exported successfully to:', result.path);
        // Could add a toast notification here
      } else if (result.error) {
        console.error('Export failed:', result.error);
        // Could add error notification here
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  static validatePasswordStrength(password) {
    if (password.length < 6) {
      return { valid: false, message: 'Passcode must be at least 6 characters long.' };
    }
    
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password) && password.length < 8) {
      return { valid: false, message: 'Passcode should be at least 8 characters OR contain both letters and numbers.' };
    }
    
    return { valid: true, message: '' };
  }

  static createEntryHTML(entry) {
    const createdDate = new Date(entry.timestamp).toLocaleDateString();
    const createdTime = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Escape HTML to prevent XSS
    const escapedTitle = Utils.escapeHtml(entry.title || 'Untitled');
    const escapedPreview = Utils.escapeHtml(entry.body.slice(0, 80) + (entry.body.length > 80 ? '...' : ''));
    const tags = entry.tags.map(tag => `<span class="tag">#${Utils.escapeHtml(tag)}</span>`).join('');
    const draftIndicator = entry.draft ? '<span class="draft-indicator">DRAFT</span>' : '';

    let timestampHTML = `<div class="entry-timestamp">Created: ${createdDate} ${createdTime}`;
    if (entry.lastModified) {
      const modifiedDate = new Date(entry.lastModified).toLocaleDateString();
      const modifiedTime = new Date(entry.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timestampHTML += `<br>Last modified: ${modifiedDate} ${modifiedTime}`;
    }
    timestampHTML += '</div>';

    return `
      <div class="entry-item">
        <div class="entry-header">
          <div class="entry-title">${escapedTitle}</div>
          ${timestampHTML}
          <div class="entry-tags">
            ${draftIndicator}
            ${tags}
          </div>
        </div>
        <div class="entry-preview">${escapedPreview}</div>
      </div>
    `;
  }
}

// Make available globally for browser
window.Utils = Utils;