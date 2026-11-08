/**
 * BDF LAB 03 - Books Router
 *
 * Student Name: P. Pradeep Yadav
 * Registration Number: 252U1R7083
 * Course: Backend Development Fundamentals
 *
 * REST API Endpoints:
 * - GET    /books       - Retrieve books with search, sort, filter, and pagination
 * - GET    /books/:id   - Retrieve single book by ID
 * - POST   /books       - Create a new book with input validation
 * - PUT    /books/:id   - Update an existing book with validation
 * - DELETE /books/:id   - Delete a book by ID
 */

const express = require("express");
const router = express.Router();
// Correct relative import: ../database (Fixes Debugging Issue #2)
const { getDB } = require("../database");

// Whitelist of valid columns for order_by to prevent SQL Injection
const ALLOWED_COLUMNS = ["id", "title", "author", "price", "pages"];
const ALLOWED_ORDERS = ["ASC", "DESC"];

/**
 * TASK 1, 2, 3: GET /books
 * Supports query parameters:
 * - search_q: partial title search (SQL LIKE)
 * - order_by: sorting column (default: 'id')
 * - order: sorting direction (default: 'ASC')
 * - limit: number of records (default: 10)
 * - offset: number of records to skip (default: 0)
 * - min_price: filter books with price >= min_price
 * - max_price: filter books with price <= max_price
 */
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    // Extract query parameters with defaults
    let {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price,
      max_price
    } = req.query;

    // Validate order_by column
    const normalizedOrderBy = String(order_by).trim().toLowerCase();
    if (!ALLOWED_COLUMNS.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid sorting column '${order_by}'. Allowed columns: ${ALLOWED_COLUMNS.join(", ")}`
      });
    }

    // Validate order direction
    const normalizedOrder = String(order).trim().toUpperCase();
    if (!ALLOWED_ORDERS.includes(normalizedOrder)) {
      return res.status(400).json({
        message: `Invalid sorting direction '${order}'. Allowed values: ASC, DESC`
      });
    }

    // Validate and parse limit & offset
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      return res.status(400).json({
        message: "Limit must be a non-negative integer"
      });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: "Offset must be a non-negative integer"
      });
    }

    // Build parameterized query dynamically
    const conditions = [];
    const queryParams = [];

    // Title search filter (case-insensitive partial match)
    if (search_q && String(search_q).trim() !== "") {
      conditions.push("title LIKE ?");
      queryParams.push(`%${String(search_q).trim()}%`);
    }

    // Price range filter
    if (min_price !== undefined && min_price !== "") {
      const parsedMin = Number(min_price);
      if (isNaN(parsedMin)) {
        return res.status(400).json({
          message: "min_price must be a valid number"
        });
      }
      conditions.push("price >= ?");
      queryParams.push(parsedMin);
    }

    if (max_price !== undefined && max_price !== "") {
      const parsedMax = Number(max_price);
      if (isNaN(parsedMax)) {
        return res.status(400).json({
          message: "max_price must be a valid number"
        });
      }
      conditions.push("price <= ?");
      queryParams.push(parsedMax);
    }

    // Assemble WHERE clause
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Assemble final SQL query using parameterized limit & offset
    // Whitelisted column and order are safe to interpolate
    const booksQuery = `
      SELECT
        id,
        title,
        author,
        price,
        pages
      FROM
        book
      ${whereClause}
      ORDER BY
        ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?;
    `;

    queryParams.push(parsedLimit, parsedOffset);

    // Properly await the async database operation (Fixes Debugging Issue #4)
    const books = await db.all(booksQuery, queryParams);

    return res.status(200).json({
      message: "Books retrieved successfully",
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error("Error retrieving books:", error);
    return res.status(500).json({
      message: "Internal server error while fetching books"
    });
  }
});

/**
 * TASK 1: GET /books/:id
 * Retrieve a specific book by primary key ID.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Book ID must be a valid positive integer"
      });
    }

    const db = getDB();
    // Parameterized query using 'book' table (Fixes Debugging Issue #3)
    const book = await db.get(
      "SELECT id, title, author, price, pages FROM book WHERE id = ?;",
      [bookId]
    );

    if (!book) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found`
      });
    }

    return res.status(200).json({
      message: "Book retrieved successfully",
      data: book
    });
  } catch (error) {
    console.error(`Error retrieving book ${req.params.id}:`, error);
    return res.status(500).json({
      message: "Internal server error while fetching book"
    });
  }
});

/**
 * TASK 4 & 5: POST /books
 * Create a new book record with robust request body validation.
 *
 * Validation Rules:
 * - Reject missing/empty title (400)
 * - Reject missing/empty author (400)
 * - Reject missing or non-numeric price (400)
 * - Return 201 on success with new book record
 */
router.post("/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate title
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message: "Title is required"
      });
    }

    // Validate author
    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({
        message: "Author is required"
      });
    }

    // Validate price: must be provided and must be a valid number
    if (price === undefined || price === null || typeof price === "boolean" || isNaN(Number(price))) {
      return res.status(400).json({
        message: "Price must be a valid number"
      });
    }

    const numericPrice = Number(price);
    if (numericPrice < 0) {
      return res.status(400).json({
        message: "Price cannot be negative"
      });
    }

    // Validate pages (optional, default 100 if omitted)
    let parsedPages = 100;
    if (pages !== undefined && pages !== null) {
      if (isNaN(Number(pages)) || Number(pages) <= 0) {
        return res.status(400).json({
          message: "Pages must be a positive integer"
        });
      }
      parsedPages = parseInt(pages, 10);
    }

    const db = getDB();
    const insertQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    // Await database insertion
    const result = await db.run(insertQuery, [
      title.trim(),
      author.trim(),
      numericPrice,
      parsedPages
    ]);

    const createdBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: numericPrice,
      pages: parsedPages
    };

    return res.status(201).json({
      message: "Book created successfully",
      data: createdBook
    });
  } catch (error) {
    console.error("Error creating book:", error);
    return res.status(500).json({
      message: "Internal server error while creating book"
    });
  }
});

/**
 * TASK 1 & 5: PUT /books/:id
 * Update an existing book record.
 *
 * Validation Rules:
 * - Reject non-integer ID (400)
 * - Return 404 if book ID does not exist
 * - Reject missing/invalid fields (400)
 * - Return 200 on success
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Book ID must be a valid positive integer"
      });
    }

    const { title, author, price, pages } = req.body;

    // Validate input fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message: "Title is required"
      });
    }

    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({
        message: "Author is required"
      });
    }

    if (price === undefined || price === null || typeof price === "boolean" || isNaN(Number(price))) {
      return res.status(400).json({
        message: "Price must be a valid number"
      });
    }

    const numericPrice = Number(price);
    if (numericPrice < 0) {
      return res.status(400).json({
        message: "Price cannot be negative"
      });
    }

    let parsedPages = 100;
    if (pages !== undefined && pages !== null) {
      if (isNaN(Number(pages)) || Number(pages) <= 0) {
        return res.status(400).json({
          message: "Pages must be a positive integer"
        });
      }
      parsedPages = parseInt(pages, 10);
    }

    const db = getDB();

    // Check if book exists first
    const existingBook = await db.get("SELECT id FROM book WHERE id = ?;", [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found`
      });
    }

    // Perform update
    const updateQuery = `
      UPDATE book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE
        id = ?;
    `;

    await db.run(updateQuery, [
      title.trim(),
      author.trim(),
      numericPrice,
      parsedPages,
      bookId
    ]);

    const updatedBook = {
      id: bookId,
      title: title.trim(),
      author: author.trim(),
      price: numericPrice,
      pages: parsedPages
    };

    return res.status(200).json({
      message: "Book updated successfully",
      data: updatedBook
    });
  } catch (error) {
    console.error(`Error updating book ${req.params.id}:`, error);
    return res.status(500).json({
      message: "Internal server error while updating book"
    });
  }
});

/**
 * TASK 1 & 5: DELETE /books/:id
 * Delete an existing book by ID.
 *
 * Validation Rules:
 * - Reject non-integer ID (400)
 * - Return 404 if book ID does not exist
 * - Return 200 on success
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bookId = parseInt(id, 10);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Book ID must be a valid positive integer"
      });
    }

    const db = getDB();

    // Check if book exists first
    const existingBook = await db.get("SELECT id FROM book WHERE id = ?;", [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found`
      });
    }

    // Delete record
    await db.run("DELETE FROM book WHERE id = ?;", [bookId]);

    return res.status(200).json({
      message: "Book deleted successfully"
    });
  } catch (error) {
    console.error(`Error deleting book ${req.params.id}:`, error);
    return res.status(500).json({
      message: "Internal server error while deleting book"
    });
  }
});

module.exports = router;
