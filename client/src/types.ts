export interface Account {
  id: string;
  accountNumber: string;
  accountType: "CHECKING" | "SAVINGS";
  balance: number;
  accountHolder: string;
  createdAt: string;
}

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";

export interface AccountTransaction {
  id: string;
  accountId: string;
  targetAccountId: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface TransactionListResponse {
  data: AccountTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  description: string;
}
