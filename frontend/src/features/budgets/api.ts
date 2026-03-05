import apiClient from "../../shared/api/client";
import type { Budget, BudgetCreate, BudgetUpdate, BudgetProgress } from "./types";

export async function getBudgets(year?: number, month?: number): Promise<Budget[]> {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  if (month) params.month = month;
  const { data } = await apiClient.get<{ items: Budget[] }>("/budgets", { params });
  return data.items;
}

export async function createBudget(payload: BudgetCreate): Promise<Budget> {
  const { data } = await apiClient.post<Budget>("/budgets", payload);
  return data;
}

export async function updateBudget(
  id: string,
  payload: BudgetUpdate,
): Promise<Budget> {
  const { data } = await apiClient.put<Budget>(`/budgets/${id}`, payload);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}

export async function getBudgetProgress(
  id: string,
  year: number,
  month: number,
): Promise<BudgetProgress> {
  const { data } = await apiClient.get<BudgetProgress>(
    `/budgets/${id}/progress`,
    { params: { year, month } },
  );
  return data;
}
