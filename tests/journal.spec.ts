import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type EntryPayload = {
  title: string;
  body: string;
  draft: boolean;
  timestamp?: string;
};

type StoredEntry = {
  id: string;
  title: string;
  body: string;
  draft: boolean;
};

type SecurityResult = {
  success: boolean;
  error?: string;
};

let electronApp: ElectronApplication;
let page: Page;
let testUserDataDir: string;

async function getAllEntries(): Promise<StoredEntry[]> {
  return page.evaluate(() => window.electronAPI.getAllEntries());
}

async function saveEntry(entry: EntryPayload): Promise<void> {
  await page.evaluate((payload) => window.electronAPI.saveEntry(payload), entry);
}

async function clearAllEntries(): Promise<void> {
  const entries = await getAllEntries();
  await Promise.all(
    entries.map(entry =>
      page.evaluate((entryId) => window.electronAPI.deleteEntry(entryId), entry.id)
    )
  );
}

async function disablePasswordProtectionIfEnabled(): Promise<void> {
  const isEnabled = await page.evaluate(() => window.electronAPI.isPasswordProtectionEnabled());
  if (isEnabled) {
    await page.evaluate(() => window.electronAPI.disablePasswordProtection());
  }
}

async function resetToCleanHomeScreen(): Promise<void> {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await disablePasswordProtectionIfEnabled();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await clearAllEntries();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#home-screen')).toBeVisible();
}

test.beforeAll(async () => {
  testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'minimal-journal-e2e-'));
  electronApp = await electron.launch({
    args: ['dist/main/main.js'],
    env: {
      ...process.env,
      MINIMAL_JOURNAL_USER_DATA_DIR: testUserDataDir
    },
    timeout: 30000
  });
  page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.beforeEach(async () => {
  await resetToCleanHomeScreen();
});

test.afterAll(async () => {
  await electronApp.close();
  fs.rmSync(testUserDataDir, { recursive: true, force: true });
});

test.describe('Journal App', () => {
  test('should display home screen on startup', async () => {
    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#filter-button')).toBeVisible();
    await expect(page.locator('#settings-button')).toBeVisible();
  });

  test('should persist and render a new journal entry', async () => {
    await saveEntry({
      title: 'Test Entry',
      body: 'This is a test entry with #test and #automation tags.',
      draft: false
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('.entry-item')).toBeVisible();
    await expect(page.locator('.entry-title')).toContainText('Test Entry');
  });

  test('should show draft indicator for draft entries', async () => {
    await saveEntry({
      title: 'Draft Entry',
      body: 'This is a draft entry.',
      draft: true
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.draft-indicator')).toBeVisible();
  });

  test('should edit draft entries and save as completed', async () => {
    await saveEntry({
      title: 'Draft Entry',
      body: 'This is a draft entry.',
      draft: true
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    const draftEntry = page.locator('.entry-item').filter({ has: page.locator('.draft-indicator') });
    await draftEntry.click();

    await expect(page.locator('#journal-screen')).toBeVisible();
    await expect(page.locator('#title-input')).toHaveValue('Draft Entry');

    await page.locator('#body-textarea').fill('This is an updated draft entry.');
    await page.locator('#save-button').click();

    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('.draft-indicator')).toHaveCount(0);
  });

  test('should view completed entries', async () => {
    await saveEntry({
      title: 'Completed Entry',
      body: 'Finished content',
      draft: false
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    const completedEntry = page.locator('.entry-item').first();
    await completedEntry.click();

    await expect(page.locator('#view-screen')).toBeVisible();
    await expect(page.locator('#view-title')).toContainText('Completed Entry');
    await expect(page.locator('#view-body')).toBeVisible();

    await page.locator('#back-button').click();
    await expect(page.locator('#home-screen')).toBeVisible();
  });

  test('should search entries by content', async () => {
    await saveEntry({ title: 'Test Entry', body: 'Test content', draft: false });
    await saveEntry({ title: 'Another Entry', body: 'Different content', draft: false });

    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.locator('#search-input').fill('test');

    const visibleEntries = page.locator('.entry-item');
    await expect(visibleEntries).toHaveCount(1);
    await expect(visibleEntries.first().locator('.entry-title')).toContainText('Test Entry');
  });

  test('should filter entries by tags', async () => {
    await saveEntry({ title: 'Tagged Entry', body: 'Content #test', draft: false });
    await saveEntry({ title: 'Other Entry', body: 'Content #other', draft: false });

    const filteredEntries = await page.evaluate(() =>
      window.electronAPI.getAllEntries({ tags: ['test'] })
    );

    expect(filteredEntries).toHaveLength(1);
    expect(filteredEntries[0].title).toBe('Tagged Entry');
  });

  test('should toggle theme', async () => {
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    await page.locator('#settings-button').click();
    await expect(page.locator('#settings-modal')).toBeVisible();

    if (initialTheme === 'dark') {
      await page.locator('#light-theme').click();
    } else {
      await page.locator('#dark-theme').click();
    }

    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should focus search input when clicked', async () => {
    await page.locator('#search-input').click();
    await expect(page.locator('#search-input')).toBeFocused();
  });

  test('should save entry changes from journal screen', async () => {
    await saveEntry({
      title: 'Draft To Save',
      body: 'Original draft body',
      draft: true
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    const draftEntry = page.locator('.entry-item').filter({ has: page.locator('.draft-indicator') });
    await draftEntry.click();
    await expect(page.locator('#journal-screen')).toBeVisible();

    await page.locator('#title-input').fill('Saved Entry');
    await page.locator('#body-textarea').fill('Testing save functionality.');
    await page.locator('#save-button').click();

    await expect(page.locator('#home-screen')).toBeVisible();
    await expect(page.locator('.entry-title')).toContainText('Saved Entry');
  });

  test('should display tag indicators in entry list', async () => {
    await saveEntry({
      title: 'Tagged',
      body: 'Body with #test',
      draft: false
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    const entryWithTags = page.locator('.entry-item').filter({ has: page.locator('.tag') }).first();
    await expect(entryWithTags.locator('.tag')).toBeVisible();
    await expect(entryWithTags.locator('.tag').first()).toContainText('#test');
  });

  test('should show word count in journal screen', async () => {
    await saveEntry({
      title: 'Word Count Draft',
      body: 'Initial content',
      draft: true
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    const draftEntry = page.locator('.entry-item').filter({ has: page.locator('.draft-indicator') }).first();
    await draftEntry.click();

    await expect(page.locator('#journal-screen')).toBeVisible();
    await page.locator('#body-textarea').fill('One two three four five');
    await expect(page.locator('#word-count')).toContainText('5 words');
  });

  test('should support passcode set, verify, and disable lifecycle', async () => {
    const setResult = await page.evaluate(() =>
      window.electronAPI.setPassword('Secure123')
    ) as SecurityResult;
    expect(setResult.success).toBe(true);

    const enabled = await page.evaluate(() =>
      window.electronAPI.isPasswordProtectionEnabled()
    );
    expect(enabled).toBe(true);

    const validResult = await page.evaluate(() =>
      window.electronAPI.verifyPassword('Secure123')
    ) as SecurityResult;
    expect(validResult.success).toBe(true);

    const invalidResult = await page.evaluate(() =>
      window.electronAPI.verifyPassword('WrongPassword')
    ) as SecurityResult;
    expect(invalidResult.success).toBe(false);

    const disableResult = await page.evaluate(() =>
      window.electronAPI.disablePasswordProtection()
    ) as SecurityResult;
    expect(disableResult.success).toBe(true);
  });

  test('should reject invalid passcode in unlock modal and unlock with valid passcode', async () => {
    const setResult = await page.evaluate(() =>
      window.electronAPI.setPassword('Lock1234')
    ) as SecurityResult;
    expect(setResult.success).toBe(true);

    await page.reload({ waitUntil: 'domcontentloaded' });

    const passwordModal = page.locator('#password-entry-modal');
    const passwordInput = page.locator('#password-entry-input');
    const submitButton = page.locator('#password-entry-submit');
    const errorMessage = page.locator('#password-entry-error');

    await expect(passwordModal).toHaveClass(/active/);

    await passwordInput.fill('wrong-passcode');
    await submitButton.click();
    await expect(errorMessage).toContainText('Incorrect passcode');
    await expect(passwordModal).toHaveClass(/active/);

    await passwordInput.fill('Lock1234');
    await submitButton.click();
    await expect(passwordModal).not.toHaveClass(/active/);

    await page.evaluate(() => window.electronAPI.disablePasswordProtection());
  });
});
