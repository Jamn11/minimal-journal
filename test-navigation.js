// Navigation Test Script
// This script can be run in the browser console to test navigation

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

// Test 4: Test arrow key event directly
function testArrowKeyEvent() {
    console.log('Test 4: Arrow key event simulation');
    
    // Create a fake arrow key event
    const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        keyCode: 40,
        bubbles: true
    });
    
    console.log('Dispatching arrow down event...');
    document.dispatchEvent(event);
    
    // Check if navigation was activated
    setTimeout(() => {
        if (journalAppInstance?.eventHandler?.navigationManager) {
            const nav = journalAppInstance.eventHandler.navigationManager;
            console.log('After arrow key - Navigation active:', nav.isNavigationActive);
            console.log('After arrow key - Focus index:', nav.currentFocusIndex);
        }
    }, 100);
}

// Test 5: Test CSS styles
function testCSSStyles() {
    console.log('Test 5: CSS styles test');
    
    // Find the search input and manually add the nav-focused class
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        console.log('Adding nav-focused class to search input...');
        searchInput.classList.add('nav-focused');
        
        // Check computed styles
        const styles = window.getComputedStyle(searchInput);
        console.log('Outline:', styles.outline);
        console.log('Box shadow:', styles.boxShadow);
        
        // Check if the class is there
        console.log('Has nav-focused class:', searchInput.classList.contains('nav-focused'));
        
        // Remove the class after test
        setTimeout(() => {
            searchInput.classList.remove('nav-focused');
        }, 2000);
    }
}

// Test 6: Test event handler setup
function testEventHandlerSetup() {
    console.log('Test 6: Event handler setup');
    
    if (journalAppInstance?.eventHandler) {
        const handler = journalAppInstance.eventHandler;
        console.log('Event handler exists:', !!handler);
        console.log('Current screen:', handler.appState?.currentScreen);
        
        // Test if keydown listener is working
        let keydownWorking = false;
        const testHandler = (e) => {
            if (e.key === 'ArrowDown') {
                keydownWorking = true;
                console.log('✓ Keydown listener is working');
            }
        };
        
        document.addEventListener('keydown', testHandler);
        
        // Simulate keydown
        const event = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true
        });
        document.dispatchEvent(event);
        
        setTimeout(() => {
            document.removeEventListener('keydown', testHandler);
            console.log('Keydown listener test result:', keydownWorking);
        }, 100);
    }
}

// Run all tests
function runAllTests() {
    console.log('\n=== Running All Navigation Tests ===');
    
    const results = {
        navigationManagerExists: testNavigationManagerExists(),
        appInstance: testAppInstance(),
        navigationInit: testNavigationInit(),
    };
    
    console.log('\n=== Test Results ===');
    console.log(results);
    
    // Run interactive tests
    console.log('\n=== Running Interactive Tests ===');
    testArrowKeyEvent();
    testCSSStyles();
    testEventHandlerSetup();
    
    return results;
}

// Make tests available globally
window.navigationTests = {
    runAllTests,
    testNavigationManagerExists,
    testAppInstance,
    testNavigationInit,
    testArrowKeyEvent,
    testCSSStyles,
    testEventHandlerSetup
};

console.log('Navigation test script loaded. Run navigationTests.runAllTests() to test everything.');