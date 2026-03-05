import apiClient from "../../shared/api/client";
import type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  TransactionFilters,
  TransactionListResponse,
} from "./types";

export async function getTransactions(
  filters?: TransactionFilters,
  cursor?: string,
): Promise<TransactionListResponse> {
  const params: Record<string, string> = {};

  if (filters?.account_id) params.account_id = filters.account_id;
  if (filters?.category_id) params.category_id = filters.category_id;
  if (filters?.date_from) params.date_from = filters.date_from;
  if (filters?.date_to) params.date_to = filters.date_to;
  if (filters?.search) params.search = filters.search;
  if (cursor) params.cursor = cursor;

  const { data } = await apiClient.get<TransactionListResponse>(
    "/transactions",
    { params },
  );
  return data;
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data } = await apiClient.get<Transaction>(
    `/transactions/${id}`,
  );
  return data;
}

export async function createTransaction(
  payload: TransactionCreate,
): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>(
    "/transactions",
    payload,
  );
  return data;
}

export async function updateTransaction(
  id: string,
  payload: TransactionUpdate,
): Promise<Transaction> {
  const { data } = await apiClient.put<Transaction>(
    `/transactions/${id}`,
    payload,
  );
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
