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
    const userDataPath = app.getPath('userData');
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
          this.db.run('ALTER TABLE entries ADD COLUMN lastModified TEXT', (alterErr) => {
            // Ignore error if column already exists
            resolve();
          });
        }
      });
    });
  }

  private validateEntry(entry: Partial<JournalEntry>): void {
    // Validate title length (max 10,000 characters)
    if (entry.title && entry.title.length > 10000) {
      throw new Error('Entry title cannot exceed 10,000 characters');
    }
    
    // Validate body length (max 1MB characters)
    if (entry.body && entry.body.length > 1000000) {
      throw new Error('Entry body cannot exceed 1,000,000 characters');
    }
    
    // Validate that title and body don't contain null bytes or other control characters
    if (entry.title && (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(entry.title))) {
      throw new Error('Entry title contains invalid characters');
    }
    
    if (entry.body && (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(entry.body))) {
      throw new Error('Entry body contains invalid characters');
    }
    
    // Validate entry structure
    if (entry.title && typeof entry.title !== 'string') {
      throw new Error('Entry title must be a string');
    }
    
    if (entry.body && typeof entry.body !== 'string') {
      throw new Error('Entry body must be a string');
    }
    
    if (entry.id && typeof entry.id !== 'string') {
      throw new Error('Entry ID must be a string');
    }
    
    if (entry.draft !== undefined && typeof entry.draft !== 'boolean') {
      throw new Error('Entry draft flag must be a boolean');
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

  private validateSearchFilters(filters: SearchFilters): void {
    // Validate query length and content
    if (filters.query !== undefined) {
      if (typeof filters.query !== 'string') {
        throw new Error('Search query must be a string');
      }
      if (filters.query.length > 1000) {
        throw new Error('Search query too long');
      }
      // Check for potential SQL injection attempts
      if (/[';\\]/.test(filters.query)) {
        throw new Error('Search query contains invalid characters');
      }
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
        if (/[';\\]/.test(tag)) {
          throw new Error('Tag contains invalid characters');
        }
      });
    }
    
    // Validate date filters
    if (filters.dateFrom !== undefined) {
      if (typeof filters.dateFrom !== 'string') {
        throw new Error('Date from must be a string');
      }
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(filters.dateFrom)) {
        throw new Error('Date from must be in ISO format');
      }
    }
    
    if (filters.dateTo !== undefined) {
      if (typeof filters.dateTo !== 'string') {
        throw new Error('Date to must be a string');
      }
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(filters.dateTo)) {
        throw new Error('Date to must be in ISO format');
      }
    }
  }

  async getAllEntries(filters?: SearchFilters): Promise<JournalEntry[]> {
    return new Promise((resolve, reject) => {
      // Validate filters before processing
      if (filters) {
        try {
          this.validateSearchFilters(filters);
        } catch (error) {
          reject(error);
          return;
        }
      }
      
      let sql = 'SELECT * FROM entries';
      const params: any[] = [];
      const conditions: string[] = [];

      if (filters?.query) {
        conditions.push('(title LIKE ? OR body LIKE ?)');
        const searchTerm = `%${filters.query}%`;
        params.push(searchTerm, searchTerm);
      }

      if (filters?.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
        conditions.push(`(${tagConditions})`);
        filters.tags.forEach(tag => {
          params.push(`%"${tag}"%`);
        });
      }

      if (filters?.dateFrom) {
        conditions.push('timestamp >= ?');
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        conditions.push('timestamp <= ?');
        params.push(filters.dateTo);
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
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      timestamp: row.timestamp,
      lastModified: row.lastModified || undefined,
      tags: JSON.parse(row.tags),
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