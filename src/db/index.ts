import Database, { Database as DatabaseType } from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || '/app/data/trade.db';

console.log(`[DB] Initializing SQLite at ${DB_PATH}`);

const db: DatabaseType = new Database(DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS catalogs (
    id TEXT PRIMARY KEY,
    bpp_id TEXT NOT NULL,
    catalog_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    item_id TEXT PRIMARY KEY,
    catalog_id TEXT NOT NULL,
    available_quantity REAL NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log(`[DB] Tables created`);

export default db;
