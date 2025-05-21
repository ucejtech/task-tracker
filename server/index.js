import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbFolder = join(__dirname, 'db');

// Ensure database directory exists
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
}

// Initialize database
const dbPath = join(dbFolder, 'tasktracker.db');
const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(dbPath);

// Convert db.run to Promise-based for easier use
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Convert db.all to Promise-based
const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Convert db.get to Promise-based
const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id INTEGER,
      label_id INTEGER,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    );
  `);

  // Insert default labels if none exist
  db.get('SELECT COUNT(*) as count FROM labels', [], (err, row) => {
    if (err) {
      console.error('Error checking labels:', err);
      return;
    }

    if (row.count === 0) {
      const defaultLabels = [
        { name: 'Work', color: '#0A84FF' },
        { name: 'Personal', color: '#30D158' },
        { name: 'Urgent', color: '#FF453A' },
        { name: 'Learning', color: '#FF9F0A' },
        { name: 'Health', color: '#64D2FF' }
      ];

      const stmt = db.prepare('INSERT INTO labels (name, color) VALUES (?, ?)');
      defaultLabels.forEach((label) => {
        stmt.run(label.name, label.color);
      });
      stmt.finalize();
    }
  });
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// API Routes
import tasksRouter from './routes/tasks.js';
import labelsRouter from './routes/labels.js';

// Create a db wrapper with helper functions to pass to routes
const dbWrapper = {
  db,
  run: runQuery,
  all: allQuery,
  get: getQuery,
  exec: (query) => db.exec(query),
  prepare: (query) => db.prepare(query),
  beginTransaction: () => runQuery('BEGIN TRANSACTION'),
  commit: () => runQuery('COMMIT'),
  rollback: () => runQuery('ROLLBACK')
};

app.use('/api/tasks', tasksRouter(dbWrapper));
app.use('/api/labels', labelsRouter(dbWrapper));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

export { dbWrapper as db };
