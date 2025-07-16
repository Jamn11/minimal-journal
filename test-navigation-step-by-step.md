# Navigation Testing Strategy

## Step 1: Build and Run the App
```bash
cd /Users/jacksonsmacbook/Dropbox/Personal/COde/minimal-journal
npm run build
npm run dev
```

## Step 2: Open Developer Tools
- Press `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux)
- Go to the Console tab

## Step 3: Load the Test Script
Copy and paste this code into the console:

```javascript
// Navigation Test Script
console.log('=== Navigation Test Script ===');

// Test 1: Check if NavigationManager exists
function testNavigationManagerExists() {
    console.log('Test 1: NavigationManager exists?', typeof window.NavigationManager);
    return typeof window.NavigationManager === 'function';
}

// Test 2: Check if app instance exists and has navigation
function testAppInstance() {
    console.log('Test 2: App instance exists?', typeof journalAppInstance);
    if (journalAppInstance) {
        console.log('Navigation manager in app:', !!journalAppInstance.eventHandler?.navigationManager);
        return !!journalAppInstance.eventHandler?.navigationManager;
    }
    return false;
}

// Test 3: Test navigation initialization
function testNavigationInit() {
    console.log('Test 3: Navigation initialization');
    if (journalAppInstance?.eventHandler?.navigationManager) {
        const nav = journalAppInstance.eventHandler.navigationManager;
        console.log('Navigation elements count:', nav.navigationElements?.length);
        console.log('Navigation active:', nav.isNavigationActive);
        console.log('Current focus index:', nav.currentFocusIndex);
        return true;
    }
    return false;
}

// Test 4: Manually activate navigation
function testManualNavigation() {
    console.log('Test 4: Manual navigation activation');
    if (journalAppInstance?.eventHandler?.navigationManager) {
        const nav = journalAppInstance.eventHandler.navigationManager;
        console.log('Before activation - Navigation active:', nav.isNavigationActive);
        
        // Manually activate navigation
        nav.activateNavigation();
        
        console.log('After activation - Navigation active:', nav.isNavigationActive);
        console.log('Focus index:', nav.currentFocusIndex);
        
        // Check if visual focus is applied
        const focusedElements = document.querySelectorAll('.nav-focused');
        console.log('Focused elements count:', focusedElements.length);
        
        if (focusedElements.length > 0) {
            console.log('✓ Visual focus is working');
            const styles = window.getComputedStyle(focusedElements[0]);
            console.log('Outline:', styles.outline);
            console.log('Box shadow:', styles.boxShadow);
        } else {
            console.log('✗ No visual focus found');
        }
        
        return true;
    }
    return false;
}

// Test 5: Test arrow key handling directly
function testArrowKeyDirect() {
    console.log('Test 5: Direct arrow key handling');
    if (journalAppInstance?.eventHandler?.navigationManager) {
        const nav = journalAppInstance.eventHandler.navigationManager;
        console.log('Before arrow key - Focus index:', nav.currentFocusIndex);
        
        // Test arrow key directly
        const result = nav.handleArrowKey('down');
        console.log('Arrow key result:', result);
        console.log('After arrow key - Focus index:', nav.currentFocusIndex);
        console.log('Navigation active:', nav.isNavigationActive);
        
        // Check visual focus
        const focusedElements = document.querySelectorAll('.nav-focused');
        console.log('Focused elements after arrow key:', focusedElements.length);
        
        return result;
    }
    return false;
}

// Test 6: Test CSS styles manually
function testCSSManually() {
    console.log('Test 6: Manual CSS test');
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        console.log('Adding nav-focused class manually...');
        searchInput.classList.add('nav-focused');
        
        const styles = window.getComputedStyle(searchInput);
        console.log('Outline:', styles.outline);
        console.log('Box shadow:', styles.boxShadow);
        console.log('Outline offset:', styles.outlineOffset);
        
        // Check if blue color is present
        if (styles.outline.includes('rgb') || styles.outline.includes('4dab') || styles.outline.includes('#4dab')) {
            console.log('✓ CSS styles are working');
        } else {
            console.log('✗ CSS styles may not be working');
        }
        
        // Remove class after 3 seconds
        setTimeout(() => {
            searchInput.classList.remove('nav-focused');
            console.log('Removed nav-focused class');
        }, 3000);
    }
}

// Run all tests
function runAllTests() {
    console.log('\n=== Running All Navigation Tests ===');
    
    const results = {
        navigationManagerExists: testNavigationManagerExists(),
        appInstance: testAppInstance(),
        navigationInit: testNavigationInit(),
        manualNavigation: testManualNavigation(),
        arrowKeyDirect: testArrowKeyDirect(),
    };
    
    console.log('\n=== Test Results ===');
    console.log(results);
    
    // Run CSS test
    testCSSManually();
    
    return results;
}

// Make tests available globally
window.navigationTests = {
    runAllTests,
    testNavigationManagerExists,
    testAppInstance,
    testNavigationInit,
    testManualNavigation,
    testArrowKeyDirect,
    testCSSManually
};

console.log('Navigation test script loaded. Run navigationTests.runAllTests() to test everything.');
```

## Step 4: Run the Tests
After pasting the code, run:
```javascript
navigationTests.runAllTests()
```

## Step 5: Test Manual Arrow Keys
After running the tests, try pressing arrow keys on your keyboard and watch the console for log messages.

## Step 6: Report Results
Based on the console output, report back:
1. Which tests passed/failed
2. Whether you can see the blue outline when CSS is manually applied
3. Whether arrow keys generate any console output
4. Any error messages that appear

## Expected Behavior
- You should see a blue outline appear on the search input when CSS is manually applied
- Arrow keys should generate console messages
- Navigation should activate and show focused elements
- Focus should move between elements when arrow keys are pressed

## Troubleshooting Steps
If tests fail:
1. Check if all modules are loaded properly
2. Verify the app is on the home screen
3. Check if the event handlers are properly set up
4. Verify CSS styles are loading correctly