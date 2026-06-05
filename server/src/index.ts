/**
 * Banking Dashboard API Server
 *
 * TECHNICAL ASSESSMENT NOTES:
 * This is a basic implementation with intentional areas for improvement:
 * - Currently uses in-memory SQLite (not persistent)
 * - Basic error handling
 * - No authentication/authorization
 * - No input validation
 * - No rate limiting
 * - No caching
 * - No logging system
 * - No tests
 *
 * Candidates should consider:
 * - Data persistence
 * - Security measures
 * - API documentation
 * - Error handling
 * - Performance optimization
 * - Code organization
 * - Testing strategy
 */
import app from './app'
import { connectDb, getDb } from './database/client';
import { initializeDatabase } from './database/migrate';
import config from "./config/config"
import logger from './config/logger'

async function start() {
  await connectDb();
  await initializeDatabase();
 
  const server = app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
  });
 
  const shutdown = () => {
    logger.info("Shutting down...");
    server.close(() => {
      getDb().close(() => {
        logger.info("DB connection closed");
        process.exit(0);
      });
    });
  };
 
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
 
start().catch((err) => {
  logger.error("Failed to start server", { error: (err as Error).message });
  process.exit(1);
});

// import cors from "cors";
// import sqlite3 from "sqlite3";
// import { Database } from "sqlite3";

// const app = express();
// const PORT = 3001;

// Basic middleware setup - Consider additional security middleware
// app.use(cors());
// app.use(express.json());

// Database setup - Currently using in-memory SQLite for simplicity
// Consider: Production database, connection pooling, error handling
// const db: Database = new sqlite3.Database(":memory:", (err) => {
//   if (err) {
//     console.error("Error opening database:", err);
//   } else {
//     console.log("Connected to in-memory SQLite database");
//     initializeDatabase();
//   }
// });

// Basic database initialization
// Consider: Migration system, seed data management, error handling
// function initializeDatabase() {
//   const createTableQuery = `
//     CREATE TABLE IF NOT EXISTS accounts (
//       id TEXT PRIMARY KEY,
//       accountNumber TEXT UNIQUE,
//       accountType TEXT CHECK(accountType IN ('CHECKING', 'SAVINGS')),
//       balance REAL,
//       accountHolder TEXT,
//       createdAt TEXT
//     )
//   `;

//   db.run(createTableQuery, (err) => {
//     if (err) {
//       console.error("Error creating table:", err);
//     } else {
//       console.log("Accounts table created");
//       insertSampleData();
//     }
//   });
// }

// Sample data insertion
// Consider: Data validation, error handling, transaction management
// function insertSampleData() {
//   const sampleAccounts = [
//     {
//       id: "1",
//       accountNumber: "1001",
//       accountType: "CHECKING",
//       balance: 5000.0,
//       accountHolder: "John Doe",
//       createdAt: new Date().toISOString(),
//     },
//     {
//       id: "2",
//       accountNumber: "1002",
//       accountType: "SAVINGS",
//       balance: 10000.0,
//       accountHolder: "Jane Smith",
//       createdAt: new Date().toISOString(),
//     },
//   ];

//   const insertQuery = `
//     INSERT OR REPLACE INTO accounts (id, accountNumber, accountType, balance, accountHolder, createdAt)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `;

//   sampleAccounts.forEach((account) => {
//     db.run(
//       insertQuery,
//       [
//         account.id,
//         account.accountNumber,
//         account.accountType,
//         account.balance,
//         account.accountHolder,
//         account.createdAt,
//       ],
//       (err) => {
//         if (err) {
//           console.error("Error inserting sample data:", err);
//         }
//       }
//     );
//   });
// }

// Basic API routes
// Consider: Input validation, authentication, rate limiting, response formatting
// app.get("/api/accounts", (req, res) => {
//   db.all("SELECT * FROM accounts", (err, rows) => {
//     if (err) {
//       res.status(500).json({ error: err.message });
//       return;
//     }
//     res.json(rows);
//   });
// });

// app.get("/api/accounts/:id", (req, res) => {
//   db.get("SELECT * FROM accounts WHERE id = ?", [req.params.id], (err, row) => {
//     if (err) {
//       res.status(500).json({ error: err.message });
//       return;
//     }
//     if (!row) {
//       res.status(404).json({ error: "Account not found" });
//       return;
//     }
//     res.json(row);
//   });
// });

// Server startup
// Consider: Graceful shutdown, environment configuration, clustering
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
