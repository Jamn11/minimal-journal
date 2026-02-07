import Database from 'sqlite3';
import { app } from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JournalEntry, SearchFilters } from '../shared/types';

const sqlite3 = Database.verbose();

export class DatabaseManager {
  private db!: Database.Database;
  private dbPath: string;

  constructor() {
    const userDataPath = process.env.MINIMAL_JOURNAL_USER_DATA_DIR || app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'journal.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          tags TEXT NOT NULL,
          draft INTEGER NOT NULL DEFAULT 0,
          lastModified TEXT
        )
      `;
      
      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          // Add lastModified column if it doesn't exist (for existing databases)
          this.db.run('ALTER TABLE entries ADD COLUMN lastModified TEXT', (alterErr: any) => {
            // Ignore "column already exists" for previously migrated databases.
            if (alterErr && !/duplicate column name/i.test(alterErr.message || '')) {
              reject(alterErr);
              return;
            }
            resolve();
          });
        }
      });
    });
  }

  private validateEntry(entry: Partial<JournalEntry>): void {
    if (entry.title !== undefined && typeof entry.title !== 'string') {
      throw new Error('Entry title must be a string');
    }

    if (entry.body !== undefined && typeof entry.body !== 'string') {
      throw new Error('Entry body must be a string');
    }

    if (entry.id !== undefined && typeof entry.id !== 'string') {
      throw new Error('Entry ID must be a string');
    }

    if (entry.draft !== undefined && typeof entry.draft !== 'boolean') {
      throw new Error('Entry draft flag must be a boolean');
    }

    if (entry.timestamp !== undefined) {
      if (typeof entry.timestamp !== 'string') {
        throw new Error('Entry timestamp must be a string');
      }
      const parsedTimestamp = new Date(entry.timestamp);
      if (Number.isNaN(parsedTimestamp.getTime())) {
        throw new Error('Entry timestamp must be a valid date string');
      }
    }

    if (entry.lastModified !== undefined) {
      if (typeof entry.lastModified !== 'string') {
        throw new Error('Entry lastModified must be a string');
      }
      const parsedLastModified = new Date(entry.lastModified);
      if (Number.isNaN(parsedLastModified.getTime())) {
        throw new Error('Entry lastModified must be a valid date string');
      }
    }

    // Validate title length (max 10,000 characters)
    if (typeof entry.title === 'string' && entry.title.length > 10000) {
      throw new Error('Entry title cannot exceed 10,000 characters');
    }

    // Validate body length (max 1MB characters)
    if (typeof entry.body === 'string' && entry.body.length > 1000000) {
      throw new Error('Entry body cannot exceed 1,000,000 characters');
    }

    // Validate that title/body don't contain control characters
    if (typeof entry.title === 'string' && (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(entry.title))) {
      throw new Error('Entry title contains invalid characters');
    }

    if (typeof entry.body === 'string' && (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(entry.body))) {
      throw new Error('Entry body contains invalid characters');
    }
  }

  async saveEntry(entry: Partial<JournalEntry>): Promise<JournalEntry> {
    // Validate entry data before processing
    this.validateEntry(entry);
    
    const id = entry.id || uuidv4();
    const timestamp = entry.timestamp || new Date().toISOString();
    const lastModified = entry.lastModified;
    const tags = this.extractTags(entry.body || '');
    
    const fullEntry: JournalEntry = {
      id,
      title: entry.title || '',
      body: entry.body || '',
      timestamp,
      lastModified,
      tags,
      draft: entry.draft || false
    };

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO entries (id, title, body, timestamp, tags, draft, lastModified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        fullEntry.id,
        fullEntry.title,
        fullEntry.body,
        fullEntry.timestamp,
        JSON.stringify(fullEntry.tags),
        fullEntry.draft ? 1 : 0,
        fullEntry.lastModified
      ];

      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve(fullEntry);
      });
    });
  }

  async getEntry(id: string): Promise<JournalEntry | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM entries WHERE id = ?';
      
      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }

        resolve(this.rowToEntry(row));
      });
    });
  }

  private normalizeDateFilter(dateValue: string, boundary: 'from' | 'to'): string {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

    if (dateOnlyPattern.test(dateValue)) {
      const boundaryDate = new Date(
        boundary === 'to'
          ? `${dateValue}T23:59:59.999Z`
          : `${dateValue}T00:00:00.000Z`
      );

      if (Number.isNaN(boundaryDate.getTime())) {
        throw new Error(`Invalid ${boundary === 'from' ? 'date from' : 'date to'} value`);
      }

      return boundaryDate.toISOString();
    }

    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid ${boundary === 'from' ? 'date from' : 'date to'} value`);
    }

    return parsedDate.toISOString();
  }

  private validateAndNormalizeSearchFilters(filters: SearchFilters): SearchFilters {
    const normalized: SearchFilters = {};

    // Validate query length and content
    if (filters.query !== undefined) {
      if (typeof filters.query !== 'string') {
        throw new Error('Search query must be a string');
      }
      if (filters.query.length > 1000) {
        throw new Error('Search query too long');
      }
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(filters.query)) {
        throw new Error('Search query contains control characters');
      }
      normalized.query = filters.query;
    }

    // Validate tags
    if (filters.tags !== undefined) {
      if (!Array.isArray(filters.tags)) {
        throw new Error('Tags filter must be an array');
      }
      if (filters.tags.length > 50) {
        throw new Error('Too many tags in filter');
      }
      filters.tags.forEach(tag => {
        if (typeof tag !== 'string') {
          throw new Error('All tags must be strings');
        }
        if (tag.length > 50) {
          throw new Error('Tag too long');
        }
        if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(tag)) {
          throw new Error('Tag contains control characters');
        }
      });
      normalized.tags = filters.tags;
    }

    // Validate date filters
    if (filters.dateFrom !== undefined) {
      if (typeof filters.dateFrom !== 'string') {
        throw new Error('Date from must be a string');
      }
      normalized.dateFrom = this.normalizeDateFilter(filters.dateFrom, 'from');
    }

    if (filters.dateTo !== undefined) {
      if (typeof filters.dateTo !== 'string') {
        throw new Error('Date to must be a string');
      }
      normalized.dateTo = this.normalizeDateFilter(filters.dateTo, 'to');
    }

    if (normalized.dateFrom && normalized.dateTo) {
      const fromDate = new Date(normalized.dateFrom);
      const toDate = new Date(normalized.dateTo);
      if (fromDate.getTime() > toDate.getTime()) {
        throw new Error('Date from must be before or equal to date to');
      }
    }

    return normalized;
  }

  async getAllEntries(filters?: SearchFilters): Promise<JournalEntry[]> {
    return new Promise((resolve, reject) => {
      let normalizedFilters: SearchFilters | undefined;

      // Validate filters before processing
      if (filters) {
        try {
          normalizedFilters = this.validateAndNormalizeSearchFilters(filters);
        } catch (error) {
          reject(error);
          return;
        }
      }
      
      let sql = 'SELECT * FROM entries';
      const params: any[] = [];
      const conditions: string[] = [];

      if (normalizedFilters?.query) {
        conditions.push('(title LIKE ? OR body LIKE ?)');
        const searchTerm = `%${normalizedFilters.query}%`;
        params.push(searchTerm, searchTerm);
      }

      if (normalizedFilters?.tags && normalizedFilters.tags.length > 0) {
        const tagConditions = normalizedFilters.tags.map(() => 'tags LIKE ?').join(' OR ');
        conditions.push(`(${tagConditions})`);
        normalizedFilters.tags.forEach(tag => {
          params.push(`%"${tag}"%`);
        });
      }

      if (normalizedFilters?.dateFrom) {
        conditions.push('timestamp >= ?');
        params.push(normalizedFilters.dateFrom);
      }

      if (normalizedFilters?.dateTo) {
        conditions.push('timestamp <= ?');
        params.push(normalizedFilters.dateTo);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY timestamp DESC';

      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const entries = rows.map(row => this.rowToEntry(row));
        resolve(entries);
      });
    });
  }

  async deleteEntry(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM entries WHERE id = ?';
      
      this.db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private rowToEntry(row: any): JournalEntry {
    let parsedTags: string[] = [];
    try {
      const tagsValue = JSON.parse(row.tags);
      if (Array.isArray(tagsValue)) {
        parsedTags = tagsValue.filter(tag => typeof tag === 'string');
      }
    } catch {
      parsedTags = [];
    }

    return {
      id: row.id,
      title: row.title,
      body: row.body,
      timestamp: row.timestamp,
      lastModified: row.lastModified || undefined,
      tags: parsedTags,
      draft: row.draft === 1
    };
  }

  private extractTags(text: string): string[] {
    // Improved regex that handles Unicode characters and common punctuation
    // \p{L} matches letters in any language, \p{N} matches numbers
    const tagRegex = /#([\p{L}\p{N}_-]+)/gu;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      const tag = match[1];
      // Additional validation: tags should be reasonable length (1-50 chars)
      if (tag.length >= 1 && tag.length <= 50 && !tags.includes(tag)) {
        tags.push(tag);
      }
    }
    
    return tags;
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}
