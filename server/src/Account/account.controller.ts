import { Request, Response } from "express";
import { AccountSchema, TransactionSchema, TransactionType } from "../Account/account.schema";
import * as accountService from "../Account/account.service";
import logger from "../config/logger";

export async function getAccounts(_req: Request, res: Response) {
  try {
    const accounts = await accountService.getAllAccounts();
    res.json({ data: accounts, total: accounts.length });
  } catch (err) {
    logger.error("GET /api/accounts", { error: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAccount(req: Request, res: Response) {
  try {
    const account = await accountService.getAccountById(req.params.id);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json({ data: account });
  } catch (err) {
    logger.error("GET /api/accounts/:id", { error: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createAccount(req: Request, res: Response) {
  const parsed = AccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const account = await accountService.createAccount(parsed.data);
    res.status(201).json({ data: account });
  } catch (err) {
    if ((err as { code?: string }).code === "DUPLICATE") {
      res.status(409).json({ error: (err as Error).message });
      return;
    }
    logger.error("POST /api/accounts", { error: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTransactions(req: Request, res: Response) {
  try {
    const account = await accountService.getAccountById(req.params.id);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    
    //  Transaction list workflow:
    //   1. Read page/filter/sort from query params.
    //  2. Validate the values are supported.
    //  3. Ask the service for the paginated transaction rows.
    //  4. Return data with pagination metadata.
     
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const sortBy = req.query.sortBy === "amount" ? "amount" : "date";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      res.status(400).json({ error: "page and limit must be positive integers" });
      return;
    }

    if (type && !["DEPOSIT", "WITHDRAWAL", "TRANSFER"].includes(type)) {
      res.status(400).json({ error: "Invalid transaction type filter" });
      return;
    }

    const result = await accountService.getTransactions(req.params.id, {
      page,
      limit,
      type: type as TransactionType | undefined,
      sortBy,
      sortOrder,
    });

    res.json({ ...result, page, limit });
  } catch (err) {
    logger.error("GET /api/accounts/:id/transactions", { error: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createTransaction(req: Request, res: Response) {
  const parsed = TransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const result = await accountService.createTransaction(req.params.id, parsed.data);
    res.status(201).json({ data: result.transaction, account: result.account });
  } catch (err) {
    const code = (err as { code?: string }).code;

    if (code === "NOT_FOUND") {
      res.status(404).json({ error: (err as Error).message });
      return;
    }

    if (code === "VALIDATION" || code === "INSUFFICIENT_FUNDS") {
      res.status(400).json({ error: (err as Error).message });
      return;
    }

    logger.error("POST /api/accounts/:id/transactions", { error: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
}
