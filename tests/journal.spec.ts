import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ 
    args: ['dist/main.js'],
    timeout: 30000
  });
  page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Journal App', () => {
  test('should display home screen on startup', async () => {
    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#filter-button')).toBeVisible();
    await expect(page.locator('#settings-button')).toBeVisible();
  });

  test('should create a new journal entry', async () => {
    await page.locator('#search-input').press('Meta+n');
    
    await expect(page.locator('#journal-screen')).toBeVisible();
    await expect(page.locator('#title-input')).toBeFocused();
    
    await page.locator('#title-input').fill('Test Entry');
    await page.locator('#body-textarea').fill('This is a test entry with #test and #automation tags.');
    
    await expect(page.locator('#word-count')).toContainText('10 words');
    
    await page.locator('#save-button').click();
    
    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('.entry-item')).toBeVisible();
    await expect(page.locator('.entry-title')).toContainText('Test Entry');
  });

  test('should save entry as draft with escape key', async () => {
    await page.locator('#search-input').press('Meta+n');
    
    await page.locator('#title-input').fill('Draft Entry');
    await page.locator('#body-textarea').fill('This is a draft entry.');
    
    await page.keyboard.press('Escape');
    
    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('.draft-indicator')).toBeVisible();
  });

  test('should edit draft entries', async () => {
    const draftEntry = page.locator('.entry-item').filter({ has: page.locator('.draft-indicator') });
    await draftEntry.click();
    
    await expect(page.locator('#journal-screen')).toBeVisible();
    await expect(page.locator('#title-input')).toHaveValue('Draft Entry');
    
    await page.locator('#body-textarea').fill('This is an updated draft entry.');
    await page.locator('#save-button').click();
    
    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('.draft-indicator')).not.toBeVisible();
  });

  test('should view completed entries', async () => {
    const completedEntry = page.locator('.entry-item').filter({ hasNot: page.locator('.draft-indicator') }).first();
    await completedEntry.click();
    
    await expect(page.locator('#view-screen')).toBeVisible();
    await expect(page.locator('#view-title')).toBeVisible();
    await expect(page.locator('#view-body')).toBeVisible();
    
    await page.locator('#back-button').click();
    await expect(page.locator('#home-screen')).toBeVisible();
  });

  test('should search entries by content', async () => {
    await page.locator('#search-input').fill('test');
    
    const visibleEntries = page.locator('.entry-item');
    await expect(visibleEntries).toHaveCount(1);
    await expect(visibleEntries.first().locator('.entry-title')).toContainText('Test Entry');
    
    await page.locator('#search-input').clear();
  });

  test('should filter entries by tags', async () => {
    await page.locator('#filter-button').click();
    
    await expect(page.locator('#filter-modal')).toBeVisible();
    
    await page.locator('#filter-tags').fill('test');
    await page.locator('#apply-filters').click();
    
    await expect(page.locator('#filter-modal')).not.toBeVisible();
    
    const visibleEntries = page.locator('.entry-item');
    await expect(visibleEntries).toHaveCount(1);
    
    await page.locator('#filter-button').click();
    await page.locator('#clear-filters').click();
  });

  test('should toggle theme', async () => {
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    
    // Open settings modal and switch to appearance tab
    await page.locator('#settings-button').click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    
    // Click the opposite theme button
    if (initialTheme === 'dark') {
      await page.locator('#light-theme').click();
    } else {
      await page.locator('#dark-theme').click();
    }
    
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
    
    // Close settings modal
    await page.locator('#close-settings').click();
  });

  test('should focus search with keyboard shortcut', async () => {
    await page.keyboard.press('Meta+f');
    await expect(page.locator('#search-input')).toBeFocused();
  });

  test('should save entry with keyboard shortcut', async () => {
    await page.locator('#search-input').press('Meta+n');
    
    await page.locator('#title-input').fill('Keyboard Save Test');
    await page.locator('#body-textarea').fill('Testing keyboard save functionality.');
    
    await page.keyboard.press('Meta+s');
    
    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('.entry-title')).toContainText('Keyboard Save Test');
  });

  test('should display tag indicators in entry list', async () => {
    const entryWithTags = page.locator('.entry-item').filter({ has: page.locator('.tag') }).first();
    
    await expect(entryWithTags.locator('.tag')).toBeVisible();
    await expect(entryWithTags.locator('.tag').first()).toContainText('#test');
  });

  test('should show word count in journal screen', async () => {
    await page.locator('#search-input').press('Meta+n');
    
    await expect(page.locator('#word-count')).toContainText('0 words');
    
    await page.locator('#body-textarea').fill('One two three four five');
    
    await expect(page.locator('#word-count')).toContainText('5 words');
    
    await page.keyboard.press('Escape');
  });
});