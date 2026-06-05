import { Request, Response } from "express";
import { AccountSchema } from "../Account/account.schema";
import * as accountService from "../Account/account.service";
import logger from "../Logger/logger";

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
    if ((err as any).code === "DUPLICATE") {
      res.status(409).json({ error: (err as Error).message });
      return;
    }
    logger.error("POST /api/accounts", { error: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
}