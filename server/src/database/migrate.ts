import { dbRun, dbGet, dbAll } from "./client";
import logger from "../config/logger";
import { Account } from "../Account/account.schema";

export async function initializeDatabase() {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        accountNumber TEXT UNIQUE NOT NULL,
        accountType TEXT CHECK(accountType IN ('CHECKING', 'SAVINGS')) NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        accountHolder TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
    logger.info("Accounts table ready");

    await dbRun(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        targetAccountId TEXT,
        type TEXT CHECK(type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')) NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        description TEXT NOT NULL,
        idempotencyKey TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(accountId) REFERENCES accounts(id),
        FOREIGN KEY(targetAccountId) REFERENCES accounts(id)
      )
    `);
    await ensureTransactionIdempotencyColumn();
    await dbRun(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency_key
      ON transactions(idempotencyKey)
      WHERE idempotencyKey IS NOT NULL
    `);
    logger.info("Transactions table ready");

    await seedAccountsIfEmpty();
    await seedTransactionsIfEmpty();
  } catch (err) {
    logger.error("DB init failed", { error: (err as Error).message });
    process.exit(1);
  }
}

async function ensureTransactionIdempotencyColumn() {
  const columns = await dbAll<{ name: string }>("PRAGMA table_info(transactions)");
  const hasColumn = columns.some((column) => column.name === "idempotencyKey");

  if (!hasColumn) {
    await dbRun("ALTER TABLE transactions ADD COLUMN idempotencyKey TEXT");
  }
}

async function seedAccountsIfEmpty() {
  // we have a validation to check if accounts already exist, leave user data untouched.
  const existing = await dbGet<{ count: number }>(
    "SELECT COUNT(*) as count FROM accounts"
  );
  if (existing && existing.count > 0) return;

  const seed: Account[] = [
    {
      id: "1",
      accountNumber: "1001",
      accountType: "CHECKING",
      balance: 5000.0,
      accountHolder: "John Doe",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      accountNumber: "1002",
      accountType: "SAVINGS",
      balance: 10000.0,
      accountHolder: "Jane Smith",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ];

  await dbRun("BEGIN TRANSACTION");
  try {
    for (const account of seed) {
      await dbRun(
        `INSERT INTO accounts (id, accountNumber, accountType, balance, accountHolder, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          account.id,
          account.accountNumber,
          account.accountType,
          account.balance,
          account.accountHolder,
          account.createdAt,
        ]
      );
    }
    await dbRun("COMMIT");
    logger.info("Seed account data inserted");
  } catch (err) {
    await dbRun("ROLLBACK");
    logger.error("Seed account transaction rolled back", { error: (err as Error).message });
  }
}

async function seedTransactionsIfEmpty() {
  const existing = await dbGet<{ count: number }>(
    "SELECT COUNT(*) as count FROM transactions"
  );
  if (existing && existing.count > 0) return;

  const seed = [
    ["tx-1", "1", null, "DEPOSIT", 1000, "Received salary deposit", null, "2024-01-15T00:00:00.000Z"],
    ["tx-2", "1", null, "WITHDRAWAL", 50, "Withdrew cash from ATM", null, "2024-01-16T00:00:00.000Z"],
    ["tx-3", "1", "2", "TRANSFER", 200, "Transferred to savings account", null, "2024-01-17T00:00:00.000Z"],
    ["tx-4", "2", null, "DEPOSIT", 2000, "Received investment return", null, "2024-01-15T00:00:00.000Z"],
    ["tx-5", "2", null, "WITHDRAWAL", 100, "Online purchase debit", null, "2024-01-16T00:00:00.000Z"],
    ["tx-6", "2", null, "DEPOSIT", 500, "Received refund", null, "2024-01-17T00:00:00.000Z"],
  ];

  await dbRun("BEGIN TRANSACTION");
  try {
    for (const transaction of seed) {
      await dbRun(
        `INSERT INTO transactions (id, accountId, targetAccountId, type, amount, description, idempotencyKey, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction
      );
    }
    await dbRun("COMMIT");
    logger.info("Seed transaction data inserted");
  } catch (err) {
    await dbRun("ROLLBACK");
    logger.error("Seed transaction rollback", { error: (err as Error).message });
  }
}
