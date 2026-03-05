import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./api";
import type {
  TransactionFilters,
  TransactionCreate,
  TransactionUpdate,
} from "./types";

const TRANSACTIONS_KEY = ["transactions"] as const;
const ACCOUNTS_KEY = ["accounts"] as const;

export function useTransactions(filters?: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: [...TRANSACTIONS_KEY, filters],
    queryFn: ({ pageParam }) => getTransactions(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionCreate) => createTransaction(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: TransactionUpdate;
    }) => updateTransaction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
