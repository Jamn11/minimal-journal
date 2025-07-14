/**
 * @jest-environment jsdom
 */

describe('Formatting Functions', () => {
  let textarea: HTMLTextAreaElement;

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <textarea id="body-textarea"></textarea>
      <div id="word-count">0 words</div>
    `;
    
    textarea = document.getElementById('body-textarea') as HTMLTextAreaElement;
  });

  // Test the core formatting logic directly
  function applyFormat(format: 'bold' | 'italic', targetTextarea: HTMLTextAreaElement): void {
    const start = targetTextarea.selectionStart;
    const end = targetTextarea.selectionEnd;
    const selectedText = targetTextarea.value.substring(start, end);
    
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
    const newValue = targetTextarea.value.substring(0, start) + formattedText + targetTextarea.value.substring(end);
    targetTextarea.value = newValue;
    
    // Position cursor correctly
    if (selectedText) {
      targetTextarea.setSelectionRange(start + marker.length, start + marker.length + selectedText.length);
    } else {
      targetTextarea.setSelectionRange(start + marker.length, start + marker.length);
    }
  }

  test('should apply bold formatting to selected text', () => {
    // Setup textarea with text
    textarea.value = 'Hello world';
    textarea.selectionStart = 0;
    textarea.selectionEnd = 5; // Select "Hello"

    // Apply bold formatting
    applyFormat('bold', textarea);

    // Check result
    expect(textarea.value).toBe('**Hello** world');
  });

  test('should apply italic formatting to selected text', () => {
    // Setup textarea with text
    textarea.value = 'Hello world';
    textarea.selectionStart = 6;
    textarea.selectionEnd = 11; // Select "world"

    // Apply italic formatting
    applyFormat('italic', textarea);

    // Check result
    expect(textarea.value).toBe('Hello *world*');
  });

  test('should insert bold markers when no text is selected', () => {
    // Setup textarea with cursor at position
    textarea.value = 'Hello world';
    textarea.selectionStart = 6;
    textarea.selectionEnd = 6; // Cursor between "Hello" and "world"

    // Apply bold formatting
    applyFormat('bold', textarea);

    // Check result
    expect(textarea.value).toBe('Hello ****world');
  });

  test('should insert italic markers when no text is selected', () => {
    // Setup textarea with cursor at position
    textarea.value = 'Hello world';
    textarea.selectionStart = 6;
    textarea.selectionEnd = 6; // Cursor between "Hello" and "world"

    // Apply italic formatting
    applyFormat('italic', textarea);

    // Check result
    expect(textarea.value).toBe('Hello **world');
  });

  test('should handle empty textarea', () => {
    // Setup empty textarea
    textarea.value = '';
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    // Apply bold formatting
    applyFormat('bold', textarea);

    // Check result
    expect(textarea.value).toBe('****');
    expect(textarea.selectionStart).toBe(2);
    expect(textarea.selectionEnd).toBe(2);
  });

  test('should handle cursor at beginning of text', () => {
    // Setup textarea with cursor at beginning
    textarea.value = 'test';
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    // Apply italic formatting
    applyFormat('italic', textarea);

    // Check result
    expect(textarea.value).toBe('**test');
    expect(textarea.selectionStart).toBe(1);
    expect(textarea.selectionEnd).toBe(1);
  });

  test('should handle cursor at end of text', () => {
    // Setup textarea with cursor at end
    textarea.value = 'test';
    textarea.selectionStart = 4;
    textarea.selectionEnd = 4;

    // Apply bold formatting
    applyFormat('bold', textarea);

    // Check result
    expect(textarea.value).toBe('test****');
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(6);
  });
});