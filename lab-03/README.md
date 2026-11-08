# Lab 3: REST API, Query Parameters, Validation, Debugging

---

### Student Information
- **Student Name:** P. Pradeep Yadav
- **Registration Number:** `252U1R7083`
- **Section:** `CSE-A` (Placeholder / Default)
- **Course:** B.Tech Computer Science & Engineering - Backend Development Fundamentals (BDF)
- **Lab Session:** Lab 03 - REST API, Query Parameters, Validation and Debugging
- **GitHub Repository:** [https://github.com/pradeepyadavpullagura-droid/LAB-3](https://github.com/pradeepyadavpullagura-droid/LAB-3)
- **Project Folder:** `lab-03/`

---

## 1. Project Description

This project represents the complete university implementation of **BDF Lab 03**, extending the foundation established in **Lab 02**. While Lab 02 introduced basic SQLite database connectivity and primitive CRUD endpoints, Lab 03 transforms the architecture into an enterprise-grade, RESTful web service.

Key architectural improvements introduced in Lab 03 include:
1. **Modular Architecture:** Clean separation of concerns between database management (`database.js`), routing and business logic (`routes/books.js`), and server bootstrap configuration (`server.js`).
2. **Standard RESTful URI Conventions:** Noun-based resource paths (`/books`, `/books/:id`) utilizing standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
3. **Advanced Query Parameters:** Robust implementation of `search_q` (partial case-insensitive search via SQL `LIKE`), dynamic `order_by` with column whitelisting, `order` (`ASC`/`DESC`), and offset-based pagination (`limit`, `offset`).
4. **Price Range Filtering:** Multi-condition filtering via `min_price` and `max_price`, working seamlessly alongside search, sort, and pagination.
5. **Strict Input Validation:** Defensive validation on incoming payloads rejecting missing attributes, empty strings, and non-numeric types with immediate `HTTP 400 Bad Request` feedback before hitting the database.
6. **Consistent JSON Envelopes:** Standardized success and error response formats across all endpoints.
7. **Production Debugging Fixes:** Systematic identification, resolution, and documentation of four critical backend bugs: `EADDRINUSE` port collision, module import paths, table name typos, and unawaited async database promises.

---

## 2. Technologies Used

| Technology | Version / Category | Purpose in Project |
| :--- | :--- | :--- |
| **Node.js** | v18+ (LTS) / v20+ / v22+ | JavaScript runtime environment executing backend server |
| **Express.js** | ^4.19.2 | High-performance minimalist HTTP web routing framework |
| **SQLite3** | ^5.1.7 | Embedded, serverless, self-contained relational SQL database engine |
| **sqlite** | ^5.1.1 | Promise-based `async/await` wrapper for SQLite3 interactions |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing middleware for frontend/client access |
| **Nodemon** | ^3.1.4 (dev) | File-watcher utility for live server hot-reloading during development |
| **Postman** | v10+ / v11+ | REST client used to design, test, and automate API verification |
| **Python / Pillow** | 3.10+ / PIL | Verification test execution capture and artifact generation |
| **Git / GitHub** | Version Control | Modular monorepo course structure tracking code commits |

---

## 3. Database Schema & Seed Data

The project connects to an embedded SQLite database file located at `lab-03/database.db`.

### Table Schema: `book`
```sql
CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);
```

### Initial Seed Records
Upon first startup, `initializeDB()` checks whether the `book` table contains any records. If empty, it automatically populates the following 10 standard computer science texts:

1. **Clean Code** by Robert C. Martin — ₹650 (464 pages)
2. **The Pragmatic Programmer** by Andrew Hunt & David Thomas — ₹799 (352 pages)
3. **JavaScript: The Good Parts** by Douglas Crockford — ₹450 (176 pages)
4. **Eloquent JavaScript** by Marijn Haverbeke — ₹550 (472 pages)
5. **You Don't Know JS: Scope & Closures** by Kyle Simpson — ₹399 (278 pages)
6. **Introduction to Algorithms** by Thomas H. Cormen — ₹1250 (1312 pages)
7. **Design Patterns** by Erich Gamma et al. — ₹899 (395 pages)
8. **Node.js Design Patterns** by Mario Casciaro — ₹950 (664 pages)
9. **Designing Data-Intensive Applications** by Martin Kleppmann — ₹1100 (616 pages)
10. **Refactoring** by Martin Fowler — ₹850 (448 pages)

---

## 4. REST API Endpoint Directory

All endpoints use noun-based resource identifiers and follow standard REST principles:

| HTTP Method | Endpoint Path | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Root health check and endpoint directory | `200 OK` |
| `GET` | `/books` | Retrieve book catalog with search, sort, filter, and pagination | `200 OK`, `400 Bad Request`, `500 Error` |
| `GET` | `/books/:id` | Retrieve single book details by primary key ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/books` | Create a new book record with payload validation | `201 Created`, `400 Bad Request`, `500 Error` |
| `PUT` | `/books/:id` | Update an existing book's complete details by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/books/:id` | Permanently delete an existing book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |

---

## 5. Query Parameters Specification (`GET /books`)

The `GET /books` endpoint supports the following optional query parameters which can be used individually or combined:

| Parameter | Type | Default Value | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `search_q` | String | `""` (empty) | Performs partial case-insensitive search on `title` via SQL `LIKE ?` with `%search_q%`. |
| `order_by` | String | `"id"` | Column name to sort results by. **Allowed values:** `id`, `title`, `author`, `price`, `pages`. Rejects unauthorized columns with `400 Bad Request`. |
| `order` | String | `"ASC"` | Sorting direction. **Allowed values:** `ASC`, `DESC` (case-insensitive). Rejects invalid directions with `400 Bad Request`. |
| `limit` | Integer | `10` | Maximum number of book records returned. Must be a non-negative integer. |
| `offset` | Integer | `0` | Number of initial records to skip for pagination. Must be a non-negative integer. |
| `min_price` | Number | `undefined` | Filters catalog to books where `price >= min_price`. Must be numeric. |
| `max_price` | Number | `undefined` | Filters catalog to books where `price <= max_price`. Must be numeric. |

### Example Query Combinations:
- **Search:** `GET /books?search_q=JavaScript`
- **Sort descending by price:** `GET /books?order_by=price&order=DESC`
- **Pagination (Page 2, 3 books per page):** `GET /books?limit=3&offset=3`
- **Price Range Filter:** `GET /books?min_price=500&max_price=900`
- **Combined Search + Price Range + Sort:** `GET /books?search_q=Code&min_price=600&order_by=price&order=ASC&limit=5`

---

## 6. Request Body Validation & Consistent Responses

### Validation Rules for `POST /books` and `PUT /books/:id`
1. **Title Required:** Missing, empty string, or whitespace-only title rejected with `400 Bad Request`.
   - Message: `{"message": "Title is required"}`
2. **Author Required:** Missing, empty string, or whitespace-only author rejected with `400 Bad Request`.
   - Message: `{"message": "Author is required"}`
3. **Price Validation:** Missing, non-numeric, or negative price rejected with `400 Bad Request`.
   - Message: `{"message": "Price must be a valid number"}`
4. **ID Validation:** Non-integer or non-positive ID parameters rejected with `400 Bad Request`.
   - Message: `{"message": "Book ID must be a valid positive integer"}`
5. **Non-Existent Records:** Target IDs not found in the database return `404 Not Found`.
   - Message: `{"message": "Book with ID <id> not found"}`

### Standardized JSON Response Format

#### Success Example (`201 Created` / `200 OK`):
```json
{
  "message": "Book created successfully",
  "data": {
    "id": 11,
    "title": "The Pragmatic Node.js Architect",
    "author": "P. Pradeep Yadav",
    "price": 750,
    "pages": 380
  }
}
```

#### Error Example (`400 Bad Request` / `404 Not Found`):
```json
{
  "message": "Title is required"
}
```

---

## 7. Debugging Exercises & Solutions (Task 6)

During backend development, four critical issues were analyzed, reproduced, and permanently resolved:

### Issue 1: `EADDRINUSE` – Port Collision
- **Problem Symptom:** Server fails to boot, crashing with `Error: listen EADDRINUSE: address already in use :::3000`.
- **Root Cause:** A preceding background Node.js instance or another service is actively bound to port 3000.
- **Resolution:**
  1. Configured dynamic port assignment using `process.env.PORT || 3000`.
  2. Implemented graceful server error listener on `serverInstance.on("error")` to intercept `EADDRINUSE` and display actionable diagnostic instructions.
  3. Added command to kill stale processes if necessary:
     ```powershell
     Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
     ```

### Issue 2: Wrong Import Path
- **Problem Symptom:** Server crashes immediately on route registration with `Error: Cannot find module './database'`.
- **Root Cause:** The router file `routes/books.js` resides inside a subdirectory. Attempting to require `./database` looks for `routes/database.js` instead of the root `database.js`.
- **Resolution:**
  Corrected relative traversal path to point to parent folder:
  ```javascript
  // BEFORE (Broken):
  const { getDB } = require("./database");

  // AFTER (Corrected):
  const { getDB } = require("../database");
  ```

### Issue 3: Table-Name Typo Causing 'no such table'
- **Problem Symptom:** SQLite query execution fails with `SQLITE_ERROR: no such table: books`.
- **Root Cause:** Table creation DDL specified the singular noun `book` (`CREATE TABLE IF NOT EXISTS book`), but queries in route handlers queried `FROM books`.
- **Resolution:**
  Audited all SQL statements across `database.js` and `routes/books.js` to ensure uniform singular table naming:
  ```sql
  -- Standardized across all endpoints:
  SELECT id, title, author, price, pages FROM book;
  INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);
  UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;
  DELETE FROM book WHERE id = ?;
  ```

### Issue 4: Missing `await` in Asynchronous Database Operations
- **Problem Symptom:** Routes returned empty objects `{}` or pending Promises `Promise { <pending> }`, or threw unhandled promise rejections.
- **Root Cause:** `sqlite` database wrapper methods (`open`, `db.all()`, `db.get()`, `db.run()`) return asynchronous Promises. Omission of the `await` keyword causes Express to send the response before SQLite completes reading or writing to the disk file.
- **Resolution:**
  Ensured every route handler function is declared `async (req, res)` and all database method calls are explicitly prefixed with `await`:
  ```javascript
  // BEFORE (Broken):
  const books = db.all(booksQuery, queryParams);
  res.status(200).json({ data: books }); // Sends unresolved Promise

  // AFTER (Corrected):
  const books = await db.all(booksQuery, queryParams);
  res.status(200).json({ data: books }); // Sends resolved dataset
  ```

---

## 8. Installation & Execution Guide

### Prerequisites
- Node.js (v18.x or later installed)
- npm (v9.x or later installed)

### Step 1: Clone / Navigate to Project Directory
```bash
cd "c:\Users\prade\OneDrive\Desktop\LAB 3 BDS\lab-03"
```

### Step 2: Install Project Dependencies
```bash
npm install
```

### Step 3: Run the Development Server
```bash
# Production mode:
npm start

# Development mode (with live file watching):
npm run dev
```

The server will start listening at:
```
http://localhost:3000/
```

### Step 4: Run Automated 20-Point Test Suite
```bash
npm test
```

---

## 9. Environment Variables

The project operates cleanly with zero external cloud dependencies out of the box. Optional environment configurations:

| Variable | Description | Default Value | Sample Value |
| :--- | :--- | :--- | :--- |
| `PORT` | Local HTTP port for Express server listener | `3000` | `3000` or `5000` |
| `NODE_ENV` | Runtime environment mode | `development` | `production` |

---

## 10. Postman Testing Guide (All 20 Test Cases)

A ready-to-import Postman Collection is provided in the repository:
`lab-03/Lab_03_Postman_Collection.json`

### Import Instructions:
1. Open **Postman**.
2. Click **Import** (top left).
3. Select or drag-and-drop `Lab_03_Postman_Collection.json`.
4. Ensure the `base_url` variable is set to `http://localhost:3000`.
5. Click **Run collection** to execute all 20 test cases sequentially.

### Complete Verification Test Matrix:

| Case # | Category | HTTP Method | Endpoint & Parameters | Expected Status | Verification Check |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **01** | Success | `GET` | `/books` | `200 OK` | Retrieves all 10 books in default order |
| **02** | Success | `GET` | `/books/1` | `200 OK` | Retrieves book ID 1 ("Clean Code") |
| **03** | Success | `POST` | `/books` (Valid JSON body) | `201 Created` | Inserts new book, returns generated ID |
| **04** | Success | `PUT` | `/books/1` (Valid JSON body) | `200 OK` | Updates book ID 1 with revised details |
| **05** | Success | `DELETE` | `/books/10` | `200 OK` | Deletes book ID 10 permanently |
| **06** | Success | `GET` | `/books?search_q=JavaScript` | `200 OK` | Filters books containing "JavaScript" |
| **07** | Success | `GET` | `/books?order_by=price&order=ASC` | `200 OK` | Books sorted by price ascending |
| **08** | Success | `GET` | `/books?order_by=price&order=DESC` | `200 OK` | Books sorted by price descending |
| **09** | Success | `GET` | `/books?limit=3&offset=2` | `200 OK` | Returns 3 books starting from offset 2 |
| **10** | Success | `GET` | `/books?min_price=600` | `200 OK` | Returns only books with `price >= 600` |
| **11** | Success | `GET` | `/books?max_price=800` | `200 OK` | Returns only books with `price <= 800` |
| **12** | Success | `GET` | `/books?min_price=500&max_price=900` | `200 OK` | Returns books within range ₹500–₹900 |
| **13** | Failure | `POST` | `/books` (Missing `title`) | `400 Bad Request` | Error message: `"Title is required"` |
| **14** | Failure | `POST` | `/books` (Missing `author`) | `400 Bad Request` | Error message: `"Author is required"` |
| **15** | Failure | `POST` | `/books` (Non-numeric `price`) | `400 Bad Request` | Error message: `"Price must be a valid number"` |
| **16** | Failure | `GET` | `/books/9999` (Non-existent ID) | `404 Not Found` | Error message: `"Book with ID 9999 not found"` |
| **17** | Failure | `PUT` | `/books/9999` (Non-existent ID) | `404 Not Found` | Error message: `"Book with ID 9999 not found"` |
| **18** | Failure | `DELETE`| `/books/9999` (Non-existent ID) | `404 Not Found` | Error message: `"Book with ID 9999 not found"` |
| **19** | Failure | `GET` | `/books?order_by=invalid_column` | `400 Bad Request` | Error message specifies allowed columns |
| **20** | Failure | `GET` | `/books?order=SIDEWAYS` | `400 Bad Request` | Error message specifies `ASC` or `DESC` |

---

## 11. Screenshots of Working Outputs

All test runs and database states were executed live and captured directly inside `screenshots/`:

### Screenshot 1: Complete 20-Point Test Suite Terminal Execution (100% Pass Rate)
![Test Runner Execution](./screenshots/01_rest_api_crud_execution.png)

### Screenshot 2: Postman Success Cases (12 Endpoints - HTTP 200 & 201)
![Postman Success Suite](./screenshots/02_postman_success_suite.png)

### Screenshot 3: Postman Failure & Validation Cases (8 Endpoints - HTTP 400 & 404)
![Postman Failure Suite](./screenshots/03_postman_failure_suite.png)

### Screenshot 4: Advanced Query Parameters & Price Filtering Results
![Query Parameters & Price Filter](./screenshots/04_query_params_and_price_filter.png)

### Screenshot 5: SQLite Database State Verification (`database.db`)
![SQLite Database State](./screenshots/05_database_sqlite_verification.png)

---

## 12. Problems Faced and Solutions Summary

| Challenge Encountered | Diagnostic Observation | Solution Implemented |
| :--- | :--- | :--- |
| **SQL Injection Risks in Sorting** | Column names in `ORDER BY` cannot use SQL `?` parameter placeholders directly in standard SQL drivers. | Implemented strict whitelist validation: checked against `ALLOWED_COLUMNS = ['id', 'title', 'author', 'price', 'pages']`. Unrecognized columns immediately trigger HTTP 400. |
| **Dynamic Multi-Condition Queries** | Combining search, min price, max price, sorting, and pagination dynamically without messy string concatenation. | Constructed dynamic `conditions` array with corresponding `queryParams` parameter bindings, joined by SQL `AND`. Safe parameter values are passed to `db.all(query, params)`. |
| **Data Type Coercion in Node.js** | Query parameter numbers arrive as strings (`req.query.limit = "3"`). | Parsed and validated all query numeric parameters using `parseInt()` / `Number()` with explicit `isNaN()` validation checks before SQL execution. |
| **Postman Verification Repeatability** | Running test suites multiple times might delete seeded records, altering subsequent test results. | Structured test script to insert a dynamic record and target non-destructive IDs, and provided automatic seed check in `database.js`. |

---

## 13. Deployment Information

### Deployment Options:
- **Vercel Serverless Deployment:**
  The application is pre-configured with `vercel.json` and `api/index.js` targeting Node.js 26.x. On Vercel's serverless platform, the SQLite database is automatically initialized and persisted in the writable `/tmp/database.db` directory, running seamlessly with zero external native compilation dependencies.

- **Render / Railway Deployment:**
  The server is built with standard Node.js/Express and binds to `process.env.PORT || 3000`. To deploy to Render/Railway:
  1. Connect GitHub repository.
  2. Set Root Directory to `lab-03`.
  3. Build Command: `npm install`
  4. Start Command: `npm start`
  5. The service will automatically bind to the cloud-assigned port and initialize SQLite storage.

- **University Local Demonstration Status:**
  Because university lab evaluation is conducted either locally or via instructor evaluation of the course GitHub repository, all 20 test cases have been verified with complete Postman evidence, response payloads, status codes, and screenshots documented above.

