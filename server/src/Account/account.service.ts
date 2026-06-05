
//   Transaction creation workflow:
//     1. Validate account and funds before changing balances.
//     2. Start a SQL transaction.
//     3. Update the selected account balance.
//     4. If this is a transfer, update the target account balance.
//     5. Insert the transaction history record.
//    6. Commit everything together, or rollback everything on failure.
// TODO: I need to add indempotencey key feature to prevent duplicate transactions

//Indempotencey key workflow:
  
//    1. Begin an immediate SQL transaction to serialize balance-changing writes.
//    2. If Idempotency-Key was already used, return the saved transaction.
//    3. Validate account, funds, and transfer target.
//    4. Update balances and insert the transaction with the key.
//    5. Commit everything together, or rollback everything on failure.

//Alltogether is should work like this

//POST/transaction -> Indempotencey key(not used) -> perform atomic operations(validations, updates on accounts etc) -> send logs

//things that can probably be added , audit service to keep audit trails, ledger service for book keeping records, rabbitmq for processing queues redis for caching response
   

import { randomUUID } from "crypto";
import { dbAll, dbGet, dbRun } from "../database/client";
import {
  Account,
  AccountTransaction,
  TransactionType,
} from "../Account/account.schema";
import logger from "../config/logger";

type TransactionInput = {
  type: TransactionType;
  amount: number;
  description: string;
  targetAccountId?: string;
  idempotencyKey?: string;
};

type TransactionQuery = {
  page: number;
  limit: number;
  type?: TransactionType;
  sortBy: "date" | "amount";
  sortOrder: "asc" | "desc";
};

export async function getAllAccounts(): Promise<Account[]> {
  return dbAll<Account>("SELECT * FROM accounts ORDER BY accountNumber");
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  return dbGet<Account>("SELECT * FROM accounts WHERE id = ?", [id]);
}

export async function createAccount(
  data: Omit<Account, "id" | "createdAt">
): Promise<Account> {
  const id = randomUUID();
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

export async function getTransactions(
  accountId: string,
  query: TransactionQuery
): Promise<{ data: AccountTransaction[]; total: number }> {
  const filters = ["accountId = ?"];
  const params: unknown[] = [accountId];

  if (query.type) {
    filters.push("type = ?");
    params.push(query.type);
  }

  const where = filters.join(" AND ");
  const sortColumn = query.sortBy === "amount" ? "amount" : "createdAt";
  const offset = (query.page - 1) * query.limit;

  const data = await dbAll<AccountTransaction>(
    `SELECT * FROM transactions
     WHERE ${where}
     ORDER BY ${sortColumn} ${query.sortOrder.toUpperCase()}
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset]
  );

  const count = await dbGet<{ total: number }>(
    `SELECT COUNT(*) as total FROM transactions WHERE ${where}`,
    params
  );

  return { data, total: count?.total ?? 0 };
}

export async function createTransaction(
  accountId: string,
  input: TransactionInput
): Promise<{ transaction: AccountTransaction; account: Account }> {

  await dbRun("BEGIN IMMEDIATE TRANSACTION");

  try {
    if (input.idempotencyKey) {
      const existing = await dbGet<AccountTransaction>(
        "SELECT * FROM transactions WHERE idempotencyKey = ?",
        [input.idempotencyKey]
      );

      if (existing) {
        if (existing.accountId !== accountId) {
          throw Object.assign(new Error("Idempotency key was used for a different account"), {
            code: "IDEMPOTENCY_CONFLICT",
          });
        }

        const currentAccount = await getAccountById(accountId);
        if (!currentAccount) {
          throw Object.assign(new Error("Account not found"), { code: "NOT_FOUND" });
        }

        await dbRun("COMMIT");
        return { transaction: existing, account: currentAccount };
      }
    }

    const account = await getAccountById(accountId);
    if (!account) {
      throw Object.assign(new Error("Account not found"), { code: "NOT_FOUND" });
    }

    if (input.type !== "DEPOSIT" && account.balance < input.amount) {
      throw Object.assign(new Error("Insufficient funds"), { code: "INSUFFICIENT_FUNDS" });
    }

    const targetAccount =
      input.type === "TRANSFER" ? await findTransferTarget(accountId, input.targetAccountId) : null;

    const transaction: AccountTransaction = {
      id: randomUUID(),
      accountId,
      targetAccountId: targetAccount?.id ?? null,
      type: input.type,
      amount: input.amount,
      description: input.description.trim(),
      idempotencyKey: input.idempotencyKey ?? null,
      createdAt: new Date().toISOString(),
    };
    const balanceChange = input.type === "DEPOSIT" ? input.amount : -input.amount;
    await dbRun("UPDATE accounts SET balance = balance + ? WHERE id = ?", [
      balanceChange,
      accountId,
    ]);

    if (targetAccount) {
      await dbRun("UPDATE accounts SET balance = balance + ? WHERE id = ?", [
        input.amount,
        targetAccount.id,
      ]);
    }

    await dbRun(
      `INSERT INTO transactions (id, accountId, targetAccountId, type, amount, description, idempotencyKey, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.accountId,
        transaction.targetAccountId,
        transaction.type,
        transaction.amount,
        transaction.description,
        transaction.idempotencyKey,
        transaction.createdAt,
      ]
    );

    const updatedAccount = await getAccountById(accountId);
    if (!updatedAccount) {
      throw Object.assign(new Error("Account not found"), { code: "NOT_FOUND" });
    }

    await dbRun("COMMIT");
    return { transaction, account: updatedAccount };
  } catch (err) {
    await dbRun("ROLLBACK");
    logger.error("createTransaction failed", { error: (err as Error).message });
    throw err;
  }
}

async function findTransferTarget(accountId: string, targetAccountId?: string) {
  const target = targetAccountId
    ? await getAccountById(targetAccountId)
    : await dbGet<Account>("SELECT * FROM accounts WHERE id <> ? ORDER BY accountNumber LIMIT 1", [
        accountId,
      ]);

  if (!target || target.id === accountId) {
    throw Object.assign(new Error("Target account not found"), { code: "VALIDATION" });
  }

  return target;
}
