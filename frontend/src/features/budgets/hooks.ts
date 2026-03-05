import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBudgets,
  getBudgetProgress,
  createBudget,
  updateBudget,
  deleteBudget,
} from "./api";
import type { BudgetCreate, BudgetUpdate } from "./types";

const BUDGETS_KEY = ["budgets"] as const;

export function useBudgets(year?: number, month?: number) {
  return useQuery({
    queryKey: [...BUDGETS_KEY, year, month],
    queryFn: () => getBudgets(year, month),
  });
}

export function useBudgetProgress(id: string, year: number, month: number) {
  return useQuery({
    queryKey: [...BUDGETS_KEY, id, "progress", year, month],
    queryFn: () => getBudgetProgress(id, year, month),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetCreate) => createBudget(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdate }) =>
      updateBudget(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}
