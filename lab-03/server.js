/**
 * BDF LAB 03 - REST API Server Entry Point
 *
 * Project Title: Lab 3: REST API, Query Parameters, Validation and Debugging
 * Subject: Backend Development Fundamentals
 *
 * Student Details:
 * - Student Name: P. Pradeep Yadav
 * - Registration Number: 252U1R7083
 * - Section: CSE-A
 *
 * Description:
 * Express.js server providing RESTful endpoints for the 'book' catalog.
 * Supports query parameters, price filtering, request validation,
 * consistent JSON envelopes, and structured error handling.
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeDB } = require("./database");
const booksRouter = require("./routes/books");

const app = express();
// Dynamic port allocation with fallback (Fixes Debugging Issue #1: EADDRINUSE)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Middleware to ensure DB connection is ready before processing requests
app.use(async (req, res, next) => {
  try {
    await initializeDB();
    next();
  } catch (error) {
    console.error("[Server Error] Database connection failure:", error);
    res.status(500).json({
      message: "Database connection failed"
    });
  }
});

// Mount modular routes
app.use("/books", booksRouter);

// Root informational endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    project: "BDF Lab 03 - REST API, Query Parameters, Validation and Debugging",
    student: {
      name: "P. Pradeep Yadav",
      registrationNumber: "252U1R7083",
      section: "CSE-A",
      course: "Backend Development Fundamentals"
    },
    status: "Active",
    endpoints: {
      "GET /books": "Retrieve books with search_q, order_by, order, limit, offset, min_price, max_price",
      "GET /books/:id": "Retrieve a single book by ID",
      "POST /books": "Create a new book (Body: title, author, price, pages)",
      "PUT /books/:id": "Update an existing book by ID",
      "DELETE /books/:id": "Delete a book by ID"
    }
  });
});

// Fallback 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Central error handling middleware (500)
app.use((err, req, res, next) => {
  console.error("[Unhandled Server Error]:", err);
  res.status(500).json({
    message: "Internal server error"
  });
});

/**
 * Initializes database and starts HTTP server listener.
 */
let serverInstance = null;

async function startServer(port = PORT) {
  try {
    await initializeDB();
    return new Promise((resolve, reject) => {
      serverInstance = app.listen(port, () => {
        console.log(`[Server] BDF Lab 03 server running on http://localhost:${port}/`);
        resolve(serverInstance);
      });

      // Handle EADDRINUSE port conflict (Debugging Issue #1)
      serverInstance.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`[Server Error] Port ${port} is already in use (EADDRINUSE).`);
          console.error("Resolution: Set a different PORT in environment variables or terminate the conflicting process.");
        }
        reject(err);
      });
    });
  } catch (error) {
    console.error("[Server Error] Failed to start server:", error);
    process.exit(1);
  }
}

// Start automatically when invoked directly
if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;

