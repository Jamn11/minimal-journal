import { DatabaseManager } from '../database';
import { JournalEntry } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/test-journal'
  }
}));

describe('DatabaseManager', () => {
  let db: DatabaseManager;
  const testDbPath = '/tmp/test-journal/journal.db';

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    const dir = path.dirname(testDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new DatabaseManager();
    await db.initialize();
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should save and retrieve an entry', async () => {
    const entry = {
      title: 'Test Entry',
      body: 'This is a test entry with #tag1 and #tag2.',
      draft: false
    };

    const savedEntry = await db.saveEntry(entry);

    expect(savedEntry.id).toBeDefined();
    expect(savedEntry.title).toBe(entry.title);
    expect(savedEntry.body).toBe(entry.body);
    expect(savedEntry.draft).toBe(entry.draft);
    expect(savedEntry.tags).toEqual(['tag1', 'tag2']);
    expect(savedEntry.timestamp).toBeDefined();

    const retrievedEntry = await db.getEntry(savedEntry.id);
    expect(retrievedEntry).toEqual(savedEntry);
  });

  test('should extract tags correctly', async () => {
    const entry = {
      title: 'Tag Test',
      body: 'This has #health, #work-life #coding123 and #test_tag tags. Also #duplicate and #duplicate again.',
      draft: false
    };

    const savedEntry = await db.saveEntry(entry);
    expect(savedEntry.tags).toEqual(['health', 'work-life', 'coding123', 'test_tag', 'duplicate']);
  });

  test('should handle entries without tags', async () => {
    const entry = {
      title: 'No Tags',
      body: 'This entry has no hashtags.',
      draft: false
    };

    const savedEntry = await db.saveEntry(entry);
    expect(savedEntry.tags).toEqual([]);
  });

  test('should save drafts correctly', async () => {
    const draftEntry = {
      title: 'Draft',
      body: 'This is a draft.',
      draft: true
    };

    const savedDraft = await db.saveEntry(draftEntry);
    expect(savedDraft.draft).toBe(true);

    const retrievedDraft = await db.getEntry(savedDraft.id);
    expect(retrievedDraft?.draft).toBe(true);
  });

  test('should update existing entries', async () => {
    const original = {
      title: 'Original',
      body: 'Original content',
      draft: true
    };

    const savedOriginal = await db.saveEntry(original);

    const updated = {
      id: savedOriginal.id,
      title: 'Updated',
      body: 'Updated content #newtag',
      draft: false
    };

    const savedUpdated = await db.saveEntry(updated);

    expect(savedUpdated.id).toBe(savedOriginal.id);
    expect(savedUpdated.title).toBe('Updated');
    expect(savedUpdated.body).toBe('Updated content #newtag');
    expect(savedUpdated.draft).toBe(false);
    expect(savedUpdated.tags).toEqual(['newtag']);
  });

  test('should get all entries', async () => {
    const entries = [
      { title: 'Entry 1', body: 'Content 1', draft: false },
      { title: 'Entry 2', body: 'Content 2 #tag', draft: true },
      { title: 'Entry 3', body: 'Content 3 #tag', draft: false }
    ];

    for (const entry of entries) {
      await db.saveEntry(entry);
    }

    const allEntries = await db.getAllEntries();
    expect(allEntries).toHaveLength(3);
    expect(allEntries[0].timestamp >= allEntries[1].timestamp).toBe(true);
  });

  test('should filter by search query', async () => {
    await db.saveEntry({ title: 'Test Entry', body: 'Test content', draft: false });
    await db.saveEntry({ title: 'Another Entry', body: 'Different content', draft: false });

    const searchResults = await db.getAllEntries({ query: 'test' });
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].title).toBe('Test Entry');
  });

  test('should filter by tags', async () => {
    await db.saveEntry({ title: 'Entry 1', body: 'Content #work', draft: false });
    await db.saveEntry({ title: 'Entry 2', body: 'Content #personal', draft: false });
    await db.saveEntry({ title: 'Entry 3', body: 'Content #work #important', draft: false });

    const workEntries = await db.getAllEntries({ tags: ['work'] });
    expect(workEntries).toHaveLength(2);

    const personalEntries = await db.getAllEntries({ tags: ['personal'] });
    expect(personalEntries).toHaveLength(1);
  });

  test('should filter by date range', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.saveEntry({ 
      title: 'Old Entry', 
      body: 'Old content', 
      draft: false,
      timestamp: yesterday.toISOString() 
    });
    
    await db.saveEntry({ 
      title: 'New Entry', 
      body: 'New content', 
      draft: false 
    });

    const recentEntries = await db.getAllEntries({ 
      dateFrom: now.toISOString().split('T')[0] 
    });
    
    expect(recentEntries).toHaveLength(1);
    expect(recentEntries[0].title).toBe('New Entry');
  });

  test('should delete entries', async () => {
    const entry = { title: 'To Delete', body: 'Content', draft: false };
    const savedEntry = await db.saveEntry(entry);

    await db.deleteEntry(savedEntry.id);

    const deletedEntry = await db.getEntry(savedEntry.id);
    expect(deletedEntry).toBeNull();
  });

  test('should return null for non-existent entry', async () => {
    const nonExistentEntry = await db.getEntry('non-existent-id');
    expect(nonExistentEntry).toBeNull();
  });
});