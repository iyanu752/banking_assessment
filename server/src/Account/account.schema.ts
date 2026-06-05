import { z } from 'zod';

export interface Account {
 id: string;
 accountNumber: string;
 accountType: "CHECKING" | "SAVINGS";
 balance: number;
 accountHolder: string;
 createdAt: string;
}

export const AccountSchema = z.object({
    accountNumber: z.string().min(1),
    accountType: z.enum(["CHECKING", "SAVINGS"]),
    balance: z.number().nonnegative(),
    accountHolder: z.string().min(1),
})

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";

export interface AccountTransaction {
 id: string;
 accountId: string;
 targetAccountId: string | null;
 type: TransactionType;
 amount: number;
 description: string;
 createdAt: string;
}

export const TransactionSchema = z.object({
    type: z.enum(["DEPOSIT", "WITHDRAWAL", "TRANSFER"]),
    amount: z.number().positive(),
    description: z.string().min(1),
    targetAccountId: z.string().optional(),
})
