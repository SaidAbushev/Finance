import apiClient from "../../shared/api/client";
import type { Account, AccountCreate, AccountUpdate } from "./types";

export async function getAccounts(): Promise<Account[]> {
  const { data } = await apiClient.get<{ items: Account[] }>("/accounts");
  return data.items;
}

export async function getAccount(id: string): Promise<Account> {
  const { data } = await apiClient.get<Account>(`/accounts/${id}`);
  return data;
}

export async function createAccount(
  payload: AccountCreate,
): Promise<Account> {
  const { data } = await apiClient.post<Account>("/accounts", payload);
  return data;
}

export async function updateAccount(
  id: string,
  payload: AccountUpdate,
): Promise<Account> {
  const { data } = await apiClient.put<Account>(
    `/accounts/${id}`,
    payload,
  );
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  await apiClient.delete(`/accounts/${id}`);
}

export async function archiveAccount(id: string): Promise<Account> {
  const { data } = await apiClient.post<Account>(
    `/accounts/${id}/archive`,
  );
  return data;
}
