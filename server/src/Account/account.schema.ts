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
