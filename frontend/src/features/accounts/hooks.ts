import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  archiveAccount,
} from "./api";
import type { AccountCreate, AccountUpdate } from "./types";

const ACCOUNTS_KEY = ["accounts"] as const;

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: getAccounts,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, id],
    queryFn: () => getAccount(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountCreate) => createAccount(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountUpdate }) =>
      updateAccount(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
