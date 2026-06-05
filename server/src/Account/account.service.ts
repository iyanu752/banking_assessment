import { dbAll, dbGet, dbRun } from "../database/client";
import { Account } from "../Account/account.schema";
import logger from "../config/logger";

export async function getAllAccounts(): Promise<Account[]> {
  return dbAll<Account>("SELECT * FROM accounts");
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  return dbGet<Account>("SELECT * FROM accounts WHERE id = ?", [id]);
}

export async function createAccount(
  data: Omit<Account, "id" | "createdAt">
): Promise<Account> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await dbRun(
      `INSERT INTO accounts (id, accountNumber, accountType, balance, accountHolder, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.accountNumber, data.accountType, data.balance, data.accountHolder, createdAt]
    );
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("UNIQUE")) {
      throw Object.assign(new Error("Account number already exists"), { code: "DUPLICATE" });
    }
    logger.error("createAccount failed", { error: msg });
    throw err;
  }

  return { id, ...data, createdAt };
}