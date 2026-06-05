import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Account,
  AccountTransaction,
  CreateTransactionInput,
  TransactionType,
} from "../types";
import { createTransaction, getAccounts, getTransactions } from "../api";
import styles from "./AccountList.module.css";

const PAGE_SIZE = 5;

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTransactionInput>({
    type: "DEPOSIT",
    amount: 0,
    description: "",
  });

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / PAGE_SIZE));

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    [],
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }),
    [],
  );

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadTransactions(selectedAccountId);
    }
  }, [selectedAccountId, page, typeFilter, sortBy, sortOrder]);

  async function loadAccounts() {
    setLoadingAccounts(true);
    setError(null);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function loadTransactions(accountId: string, pageToLoad = page) {
    setLoadingTransactions(true);
    setError(null);
    try {
      const result = await getTransactions(accountId, {
        page: pageToLoad,
        limit: PAGE_SIZE,
        type: typeFilter,
        sortBy,
        sortOrder,
      });
      setTransactions(result.data);
      setTotalTransactions(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load transactions");
    } finally {
      setLoadingTransactions(false);
    }
  }

  function viewTransactions(accountId: string) {
    setSelectedAccountId(accountId);
    setPage(1);
    setFormError(null);
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAccountId) return;

    if (!form.amount || form.amount <= 0) {
      setFormError("Enter an amount greater than 0.");
      return;
    }

    if (!form.description.trim()) {
      setFormError("Enter a description.");
      return;
    }

    setSavingTransaction(true);
    setFormError(null);
    try {
      const result = await createTransaction(selectedAccountId, {
        ...form,
        description: form.description.trim(),
      });

      setAccounts((current) =>
        current.map((account) => (account.id === result.account.id ? result.account : account)),
      );
      setForm({ type: "DEPOSIT", amount: 0, description: "" });
      setPage(1);
      await loadTransactions(selectedAccountId, 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create transaction");
    } finally {
      setSavingTransaction(false);
    }
  }

  if (loadingAccounts) return <div className={styles.status}>Loading accounts...</div>;
  if (error && accounts.length === 0) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h2>Accounts</h2>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`${styles.card} ${
              selectedAccountId === account.id ? styles.selectedCard : ""
            }`}
          >
            <h3>{account.accountHolder}</h3>
            <p>Account Number: {account.accountNumber}</p>
            <p>Type: {account.accountType}</p>
            <p>Balance: {currencyFormatter.format(account.balance)}</p>
            <button type="button" className={styles.cardButton} onClick={() => viewTransactions(account.id)}>
              View Transactions
            </button>
          </div>
        ))}
      </div>

      {selectedAccount && (
        <section className={styles.transactionSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>{selectedAccount.accountHolder} Transactions</h2>
              <p>Current Balance: {currencyFormatter.format(selectedAccount.balance)}</p>
            </div>
            <button type="button" onClick={() => loadTransactions(selectedAccount.id)}>
              Refresh
            </button>
          </div>

          <form className={styles.transactionForm} onSubmit={submitTransaction}>
            <h3>New Transaction</h3>
            <label>
              Type
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as TransactionType })
                }
              >
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </label>

            <label>
              Amount
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.amount || ""}
                onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
              />
            </label>

            <label>
              Description
              <input
                type="text"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>

            <div className={styles.submitRow}>
              <button type="submit" disabled={savingTransaction}>
                {savingTransaction ? "Saving..." : "Create Transaction"}
              </button>
            </div>

            {formError && <p className={styles.formError}>{formError}</p>}
          </form>

          <div className={styles.controls}>
            <label>
              Type Filter
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value as TransactionType | "");
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </label>

            <label>
              Sort By
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "date" | "amount")}>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
            </label>

            <label>
              Order
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </label>
          </div>

          {loadingTransactions ? (
            <div className={styles.status}>Loading transactions...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No transactions found.</td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{dateFormatter.format(new Date(transaction.createdAt))}</td>
                        <td>{transaction.type}</td>
                        <td>{transaction.description}</td>
                        <td>{currencyFormatter.format(transaction.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.pagination}>
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
