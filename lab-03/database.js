/**
 * BDF LAB 03 - Database Initialization and Connection Module
 *
 * Student Name: P. Pradeep Yadav
 * Registration Number: 252U1R7083
 * Course: Backend Development Fundamentals
 *
 * Description:
 * Manages SQLite database connection supporting both traditional 'sqlite3'
 * and Node.js built-in 'node:sqlite' driver for high cloud compatibility (e.g. Vercel).
 */

const path = require("path");
const fs = require("fs");

// Determine database file location
// On Vercel Serverless, the root filesystem is read-only. We copy/create database.db in /tmp.
let dbPath;
if (process.env.VERCEL) {
  dbPath = path.join("/tmp", "database.db");
  const sourceDb = path.join(__dirname, "database.db");
  if (!fs.existsSync(dbPath) && fs.existsSync(sourceDb)) {
    try {
      fs.copyFileSync(sourceDb, dbPath);
      console.log("[DB] Pre-existing database copied to /tmp for Vercel write access.");
    } catch (e) {
      console.error("[DB] Note copying database to /tmp:", e.message);
    }
  }
} else {
  dbPath = path.join(__dirname, "database.db");
}

let dbInstance = null;

// Initial 10 sample book records from Lab 02
const initialBooks = [
  { title: "Clean Code", author: "Robert C. Martin", price: 650, pages: 464 },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt & David Thomas", price: 799, pages: 352 },
  { title: "JavaScript: The Good Parts", author: "Douglas Crockford", price: 450, pages: 176 },
  { title: "Eloquent JavaScript", author: "Marijn Haverbeke", price: 550, pages: 472 },
  { title: "You Don't Know JS: Scope & Closures", author: "Kyle Simpson", price: 399, pages: 278 },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", price: 1250, pages: 1312 },
  { title: "Design Patterns", author: "Erich Gamma et al.", price: 899, pages: 395 },
  { title: "Node.js Design Patterns", author: "Mario Casciaro", price: 950, pages: 664 },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", price: 1100, pages: 616 },
  { title: "Refactoring", author: "Martin Fowler", price: 850, pages: 448 }
];

/**
 * Built-in Node.js SQLite adapter (node:sqlite)
 * Provides seamless zero-dependency fallback for cloud environments (Vercel Node 26)
 * where native prebuilds are not available.
 */
class BuiltInSqliteWrapper {
  constructor(filename) {
    const { DatabaseSync } = require("node:sqlite");
    this.db = new DatabaseSync(filename);
  }

  async exec(sql) {
    return this.db.exec(sql);
  }

  async get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params);
    return row ? { ...row } : undefined;
  }

  async all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((r) => ({ ...r }));
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastID: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }
}

/**
 * Creates table schema and seeds records if empty.
 */
async function setupDatabase(db) {
  // Table name is 'book' (addresses Debugging Issue #3: table name typo prevention)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    );
  `);

  const countRow = await db.get("SELECT COUNT(*) AS count FROM book;");
  if (countRow && countRow.count === 0) {
    console.log("[DB] Seeding 10 sample books into 'book' table...");
    for (const book of initialBooks) {
      await db.run(
        `INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);`,
        [book.title, book.author, book.price, book.pages]
      );
    }
    console.log("[DB] Successfully seeded 10 books.");
  }
}

/**
 * Initializes and returns the SQLite database connection.
 * Attempts standard sqlite3 driver, seamlessly falling back to built-in node:sqlite.
 */
async function initializeDB() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const { open } = require("sqlite");
    const sqlite3 = require("sqlite3");
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    console.log(`[DB] Connected via sqlite3 driver at ${dbPath}`);
  } catch (err) {
    console.log(`[DB] Using Node.js built-in node:sqlite engine for cloud runtime: ${err.message}`);
    dbInstance = new BuiltInSqliteWrapper(dbPath);
    console.log(`[DB] Connected via built-in node:sqlite at ${dbPath}`);
  }

  await setupDatabase(dbInstance);
  return dbInstance;
}

/**
 * Getter for current database instance.
 */
function getDB() {
  if (!dbInstance) {
    throw new Error("Database has not been initialized. Call initializeDB() first.");
  }
  return dbInstance;
}

module.exports = {
  initializeDB,
  getDB,
  dbPath,
  initialBooks,
  BuiltInSqliteWrapper
};
