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
          draft INTEGER NOT NULL DEFAULT 0
        )
      `;
      
      this.db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveEntry(entry: Partial<JournalEntry>): Promise<JournalEntry> {
    const id = entry.id || uuidv4();
    const timestamp = entry.timestamp || new Date().toISOString();
    const tags = this.extractTags(entry.body || '');
    
    const fullEntry: JournalEntry = {
      id,
      title: entry.title || '',
      body: entry.body || '',
      timestamp,
      tags,
      draft: entry.draft || false
    };

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO entries (id, title, body, timestamp, tags, draft)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        fullEntry.id,
        fullEntry.title,
        fullEntry.body,
        fullEntry.timestamp,
        JSON.stringify(fullEntry.tags),
        fullEntry.draft ? 1 : 0
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

  async getAllEntries(filters?: SearchFilters): Promise<JournalEntry[]> {
    return new Promise((resolve, reject) => {
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
      tags: JSON.parse(row.tags),
      draft: row.draft === 1
    };
  }

  private extractTags(text: string): string[] {
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      const tag = match[1];
      if (!tags.includes(tag)) {
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