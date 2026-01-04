const Database = require("better-sqlite3")

const db = new Database("data.db")

db.prepare(`
  CREATE TABLE IF NOT EXISTS pastes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    max_views INTEGER,
    views INTEGER NOT NULL
  )
`).run()

module.exports = db
