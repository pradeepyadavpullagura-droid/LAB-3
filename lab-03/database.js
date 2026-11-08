/**
 * BDF LAB 03 - Database Initialization and Connection Module
 *
 * Student Name: P. Pradeep Yadav
 * Registration Number: 252U1R7083
 * Course: Backend Development Fundamentals
 *
 * Description:
 * Manages SQLite database connection using 'sqlite' and 'sqlite3'.
 * Handles table creation, initial data seeding, and query execution.
 */

const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

// Determine database file location
const dbPath = process.env.VERCEL
  ? path.join("/tmp", "database.db")
  : path.join(__dirname, "database.db");

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
 * Uses cached instance if already opened.
 */
async function initializeDB() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await setupDatabase(dbInstance);
  console.log(`[DB] Connected to SQLite database at ${dbPath}`);
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
  initialBooks
};
