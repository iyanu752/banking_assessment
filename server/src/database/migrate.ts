import { dbRun, dbGet } from "./client";
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
    await seedIfEmpty();
  } catch (err) {
    logger.error("DB init failed", { error: (err as Error).message });
    process.exit(1);
  }
}

async function seedIfEmpty() {
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
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      accountNumber: "1002",
      accountType: "SAVINGS",
      balance: 10000.0,
      accountHolder: "Jane Smith",
      createdAt: new Date().toISOString(),
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
    logger.info("Seed data inserted");
  } catch (err) {
    await dbRun("ROLLBACK");
    logger.error("Seed transaction rolled back", { error: (err as Error).message });
  }
}
