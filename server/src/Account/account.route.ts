import { Router } from "express";
import * as accountController from "../Account/account.controller";

const router = Router();

router.get("/", accountController.getAccounts);
router.get("/:id", accountController.getAccount);
router.post("/", accountController.createAccount);

export default router;