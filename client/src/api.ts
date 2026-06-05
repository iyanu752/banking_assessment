import {
  Account,
  CreateTransactionInput,
  TransactionListResponse,
  TransactionType,
} from "./types";

const API_URL = "http://localhost:3001/api";

type ApiResponse<T> = {
  data: T;
  total?: number;
};

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    throw new Error(result.error || fallbackMessage);
  }

  return result;
}

export const getAccounts = async (): Promise<Account[]> => {
  const response = await fetch(`${API_URL}/accounts`);
  const result = await parseResponse<ApiResponse<Account[]>>(
    response,
    "Failed to fetch accounts",
  );
  return result.data;
};

export const getAccount = async (id: string): Promise<Account> => {
  const response = await fetch(`${API_URL}/accounts/${id}`);
  const result = await parseResponse<ApiResponse<Account>>(
    response,
    "Failed to fetch account",
  );
  return result.data;
};

export const getTransactions = async (
  accountId: string,
  options: {
    page: number;
    limit: number;
    type: TransactionType | "";
    sortBy: "date" | "amount";
    sortOrder: "asc" | "desc";
  },
): Promise<TransactionListResponse> => {
  const params = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  });

  if (options.type) {
    params.set("type", options.type);
  }

  const response = await fetch(`${API_URL}/accounts/${accountId}/transactions?${params}`);
  return parseResponse<TransactionListResponse>(response, "Failed to fetch transactions");
};

export const createTransaction = async (
  accountId: string,
  input: CreateTransactionInput,
): Promise<{ data: TransactionListResponse["data"][number]; account: Account }> => {
  const response = await fetch(`${API_URL}/accounts/${accountId}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(input),
  });

  return parseResponse(response, "Failed to create transaction");
};
