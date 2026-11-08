/**
 * BDF LAB 03 - Automated API Test Suite & Postman Verification
 *
 * Student Name: P. Pradeep Yadav
 * Registration Number: 252U1R7083
 * Course: Backend Development Fundamentals
 *
 * Runs all 20 required test cases (12 Success Cases + 8 Failure Cases)
 * against the live running Express + SQLite backend.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("./server");
const { initializeDB } = require("./database");

const TEST_PORT = 3005;
let serverInstance = null;
const results = [];

// Helper to make HTTP requests
function sendRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (postData) {
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(rawData);
        } catch (e) {
          parsed = rawData;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBody: rawData,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function recordResult(testId, title, method, endpoint, expectedStatus, actualStatus, pass, details) {
  results.push({
    testId,
    title,
    method,
    endpoint,
    expectedStatus,
    actualStatus,
    pass,
    details
  });
  const statusMark = pass ? "[PASS]" : "[FAIL]";
  console.log(`${statusMark} Case ${String(testId).padStart(2, "0")}: ${method} ${endpoint} -> HTTP ${actualStatus} (Expected: ${expectedStatus})`);
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("   BDF LAB 03 - COMPREHENSIVE REST API & POSTMAN VERIFICATION TEST SUITE");
  console.log("   Student: P. Pradeep Yadav | Reg No: 252U1R7083 | Course: Backend Dev");
  console.log("================================================================================\n");

  await initializeDB();

  serverInstance = app.listen(TEST_PORT, () => {
    console.log(`[Test Runner] Test server listening on http://localhost:${TEST_PORT}\n`);
  });

  try {
    // -------------------------------------------------------------------------
    // SUCCESS CASES (1 - 12)
    // -------------------------------------------------------------------------
    console.log("--- SUCCESS CASES (1 to 12) ---");

    // Case 1: Get all books
    {
      const res = await sendRequest("GET", "/books");
      const pass = res.statusCode === 200 && Array.isArray(res.body.data) && res.body.data.length > 0;
      recordResult(1, "Get all books", "GET", "/books", 200, res.statusCode, pass, {
        bookCount: res.body.data ? res.body.data.length : 0,
        sample: res.body.data ? res.body.data[0] : null
      });
    }

    // Case 2: Get a book by ID
    {
      const res = await sendRequest("GET", "/books/1");
      const pass = res.statusCode === 200 && res.body.data && res.body.data.id === 1;
      recordResult(2, "Get a book by ID", "GET", "/books/1", 200, res.statusCode, pass, {
        book: res.body.data
      });
    }

    // Case 3: Create a new book
    let createdBookId = null;
    {
      const newBook = {
        title: "The Pragmatic Node.js Architect",
        author: "P. Pradeep Yadav",
        price: 750,
        pages: 380
      };
      const res = await sendRequest("POST", "/books", newBook);
      const pass = res.statusCode === 201 && res.body.data && res.body.data.title === newBook.title;
      if (pass) createdBookId = res.body.data.id;
      recordResult(3, "Create a new book", "POST", "/books", 201, res.statusCode, pass, {
        created: res.body.data
      });
    }

    // Case 4: Update an existing book
    {
      const updateData = {
        title: "Clean Code: Revised & Updated",
        author: "Robert C. Martin",
        price: 720,
        pages: 475
      };
      const res = await sendRequest("PUT", "/books/1", updateData);
      const pass = res.statusCode === 200 && res.body.data && res.body.data.title === updateData.title;
      recordResult(4, "Update an existing book", "PUT", "/books/1", 200, res.statusCode, pass, {
        updated: res.body.data
      });
    }

    // Case 5: Delete an existing book
    {
      const targetId = createdBookId || 10;
      const res = await sendRequest("DELETE", `/books/${targetId}`);
      const pass = res.statusCode === 200 && res.body.message === "Book deleted successfully";
      recordResult(5, "Delete an existing book", "DELETE", `/books/${targetId}`, 200, res.statusCode, pass, {
        message: res.body.message
      });
    }

    // Case 6: Search by partial title
    {
      const res = await sendRequest("GET", "/books?search_q=JavaScript");
      const pass = res.statusCode === 200 && Array.isArray(res.body.data) &&
        res.body.data.every(b => b.title.toLowerCase().includes("javascript"));
      recordResult(6, "Search by partial title", "GET", "/books?search_q=JavaScript", 200, res.statusCode, pass, {
        matchingCount: res.body.data ? res.body.data.length : 0,
        titles: res.body.data ? res.body.data.map(b => b.title) : []
      });
    }

    // Case 7: Sort in ascending order
    {
      const res = await sendRequest("GET", "/books?order_by=price&order=ASC");
      let isSorted = true;
      if (res.body.data && res.body.data.length > 1) {
        for (let i = 0; i < res.body.data.length - 1; i++) {
          if (res.body.data[i].price > res.body.data[i + 1].price) {
            isSorted = false;
            break;
          }
        }
      }
      const pass = res.statusCode === 200 && isSorted;
      recordResult(7, "Sort in ascending order", "GET", "/books?order_by=price&order=ASC", 200, res.statusCode, pass, {
        prices: res.body.data ? res.body.data.map(b => b.price) : []
      });
    }

    // Case 8: Sort in descending order
    {
      const res = await sendRequest("GET", "/books?order_by=price&order=DESC");
      let isSortedDesc = true;
      if (res.body.data && res.body.data.length > 1) {
        for (let i = 0; i < res.body.data.length - 1; i++) {
          if (res.body.data[i].price < res.body.data[i + 1].price) {
            isSortedDesc = false;
            break;
          }
        }
      }
      const pass = res.statusCode === 200 && isSortedDesc;
      recordResult(8, "Sort in descending order", "GET", "/books?order_by=price&order=DESC", 200, res.statusCode, pass, {
        prices: res.body.data ? res.body.data.map(b => b.price) : []
      });
    }

    // Case 9: Apply limit and offset
    {
      const res = await sendRequest("GET", "/books?limit=3&offset=2");
      const pass = res.statusCode === 200 && Array.isArray(res.body.data) && res.body.data.length === 3;
      recordResult(9, "Apply limit and offset", "GET", "/books?limit=3&offset=2", 200, res.statusCode, pass, {
        count: res.body.data ? res.body.data.length : 0,
        ids: res.body.data ? res.body.data.map(b => b.id) : []
      });
    }

    // Case 10: Filter by minimum price
    {
      const minPrice = 600;
      const res = await sendRequest("GET", `/books?min_price=${minPrice}`);
      const pass = res.statusCode === 200 && Array.isArray(res.body.data) &&
        res.body.data.every(b => b.price >= minPrice);
      recordResult(10, "Filter by minimum price", "GET", `/books?min_price=${minPrice}`, 200, res.statusCode, pass, {
        minPriceFilter: minPrice,
        resultPrices: res.body.data ? res.body.data.map(b => b.price) : []
      });
    }

    // Case 11: Filter by maximum price
    {
      const maxPrice = 800;
      const res = await sendRequest("GET", `/books?max_price=${maxPrice}`);
      const pass = res.statusCode === 200 && Array.isArray(res.body.data) &&
        res.body.data.every(b => b.price <= maxPrice);
      recordResult(11, "Filter by maximum price", "GET", `/books?max_price=${maxPrice}`, 200, res.statusCode, pass, {
        maxPriceFilter: maxPrice,
        resultPrices: res.body.data ? res.body.data.map(b => b.price) : []
      });
    }

    // Case 12: Apply minimum and maximum price together
    {
      const minPrice = 500;
      const maxPrice = 900;
      const res = await sendRequest("GET", `/books?min_price=${minPrice}&max_price=${maxPrice}`);
      const pass = res.statusCode === 200 && Array.isArray(res.body.data) &&
        res.body.data.every(b => b.price >= minPrice && b.price <= maxPrice);
      recordResult(12, "Apply min & max price together", "GET", `/books?min_price=${minPrice}&max_price=${maxPrice}`, 200, res.statusCode, pass, {
        range: `${minPrice} - ${maxPrice}`,
        resultPrices: res.body.data ? res.body.data.map(b => b.price) : []
      });
    }

    // -------------------------------------------------------------------------
    // FAILURE CASES (13 - 20)
    // -------------------------------------------------------------------------
    console.log("\n--- FAILURE CASES (13 to 20) ---");

    // Case 13: Create a book without title
    {
      const invalidBook = {
        author: "Anonymous Author",
        price: 500,
        pages: 200
      };
      const res = await sendRequest("POST", "/books", invalidBook);
      const pass = res.statusCode === 400 && res.body.message === "Title is required";
      recordResult(13, "Create a book without title", "POST", "/books", 400, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    // Case 14: Create a book without author
    {
      const invalidBook = {
        title: "Book Without Author",
        price: 500,
        pages: 200
      };
      const res = await sendRequest("POST", "/books", invalidBook);
      const pass = res.statusCode === 400 && res.body.message === "Author is required";
      recordResult(14, "Create a book without author", "POST", "/books", 400, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    // Case 15: Create a book with non-numeric price
    {
      const invalidBook = {
        title: "Book with Non-Numeric Price",
        author: "Valid Author",
        price: "free_of_cost",
        pages: 200
      };
      const res = await sendRequest("POST", "/books", invalidBook);
      const pass = res.statusCode === 400 && res.body.message === "Price must be a valid number";
      recordResult(15, "Create a book with non-numeric price", "POST", "/books", 400, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    // Case 16: Request a book with a non-existing ID
    {
      const res = await sendRequest("GET", "/books/9999");
      const pass = res.statusCode === 404 && res.body.message.includes("not found");
      recordResult(16, "Request book with non-existing ID", "GET", "/books/9999", 404, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    // Case 17: Update a non-existing book
    {
      const res = await sendRequest("PUT", "/books/9999", {
        title: "Phantom Book",
        author: "Ghost",
        price: 999,
        pages: 100
      });
      const pass = res.statusCode === 404 && res.body.message.includes("not found");
      recordResult(17, "Update a non-existing book", "PUT", "/books/9999", 404, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    // Case 18: Delete a non-existing book
    {
      const res = await sendRequest("DELETE", "/books/9999");
      const pass = res.statusCode === 404 && res.body.message.includes("not found");
      recordResult(18, "Delete a non-existing book", "DELETE", "/books/9999", 404, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    // Case 19: Invalid sorting column
    {
      const res = await sendRequest("GET", "/books?order_by=invalid_column");
      const pass = res.statusCode === 400 && res.body.message.includes("Invalid sorting column");
      recordResult(19, "Invalid sorting column", "GET", "/books?order_by=invalid_column", 400, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    // Case 20: Invalid sorting direction
    {
      const res = await sendRequest("GET", "/books?order=SIDEWAYS");
      const pass = res.statusCode === 400 && res.body.message.includes("Invalid sorting direction");
      recordResult(20, "Invalid sorting direction", "GET", "/books?order=SIDEWAYS", 400, res.statusCode, pass, {
        errorMessage: res.body.message
      });
    }

    console.log("\n================================================================================");
    const passedCount = results.filter(r => r.pass).length;
    console.log(`   TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
    console.log("================================================================================");

    // Save test results JSON
    fs.writeFileSync(
      path.join(__dirname, "test-results.json"),
      JSON.stringify(results, null, 2)
    );

  } finally {
    if (serverInstance) {
      serverInstance.close();
      console.log("\n[Test Runner] Server stopped successfully.");
    }
  }
}

if (require.main === module) {
  runTestSuite().catch(err => {
    console.error("Test execution error:", err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };

