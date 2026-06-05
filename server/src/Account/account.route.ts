import { Router } from "express";
import * as accountController from "../Account/account.controller";

const router = Router();

router.get("/", accountController.getAccounts);
router.get("/:id", accountController.getAccount);
router.post("/", accountController.createAccount);
router.get("/:id/transactions", accountController.getTransactions);
router.post("/:id/transactions", accountController.createTransaction);

export default router;
