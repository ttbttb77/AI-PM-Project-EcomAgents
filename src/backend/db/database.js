const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'ecommerce.db');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY, workflow_type TEXT NOT NULL, user_id TEXT DEFAULT 'demo',
      status TEXT DEFAULT 'running', input_text TEXT, started_at TEXT, completed_at TEXT,
      total_duration_seconds INTEGER, agent_count INTEGER DEFAULT 0,
      human_intervention_count INTEGER DEFAULT 0, output_quality_score REAL,
      total_tokens_used INTEGER, total_cost_yuan REAL, output_summary TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_tasks (
      id TEXT PRIMARY KEY, execution_id TEXT REFERENCES workflow_executions(id),
      agent_id TEXT NOT NULL, task_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending', dispatch_mode TEXT DEFAULT 'sequential',
      dispatched_at TEXT, completed_at TEXT, duration_seconds INTEGER,
      retry_count INTEGER DEFAULT 0, quality_score REAL, result_text TEXT,
      error_message TEXT, created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, event_name TEXT NOT NULL,
      category TEXT, user_id TEXT, workflow_id TEXT,
      properties TEXT, timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_te_name ON tracking_events(event_name, timestamp);

    CREATE TABLE IF NOT EXISTS sales_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE,
      gmv REAL NOT NULL, order_count INTEGER NOT NULL, avg_order_value REAL NOT NULL,
      conversion_rate REAL NOT NULL, refund_rate REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY, role TEXT NOT NULL, content TEXT NOT NULL,
      workflow_id TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ 数据库初始化完成:', DB_PATH);
  return d;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initDb, closeDb };
