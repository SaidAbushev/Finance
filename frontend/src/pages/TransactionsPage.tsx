import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { FC } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { PageLayout } from "../shared/layout/PageLayout";
import { Button, Spinner, EmptyState } from "../shared/ui";
import { formatCurrency } from "../shared/lib/utils";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../features/transactions/hooks";
import { TransactionRow } from "../features/transactions/components/TransactionRow";
import {
  TransactionForm,
  type TransactionFormValues,
} from "../features/transactions/components/TransactionForm";
import { TransactionFiltersBar } from "../features/transactions/components/TransactionFilters";
import type {
  TransactionFilters,
  Transaction,
  SplitCreate,
} from "../features/transactions/types";
import { useAccounts } from "../features/accounts/hooks";
import { useCategories } from "../features/categories/hooks";

/* ---------- Page ---------- */
const TransactionsPage: FC = () => {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const accountId = searchParams.get("account_id");
    return accountId ? { account_id: accountId } : {};
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  /* ----- Queries ----- */
  const {
    data: transactionsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTransactions(filters);

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  /* ----- Flatten pages ----- */
  const transactions = useMemo(
    () => transactionsData?.pages.flatMap((p) => p.items) ?? [],
    [transactionsData],
  );

  /* ----- Summaries ----- */
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce(
          (sum, t) =>
            sum +
            t.splits.reduce(
              (s, sp) => (sp.amount > 0 ? s + sp.amount : s),
              0,
            ),
          0,
        ),
    [transactions],
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce(
          (sum, t) =>
            sum +
            Math.abs(
              t.splits.reduce(
                (s, sp) => (sp.amount < 0 ? s + sp.amount : s),
                0,
              ),
            ),
          0,
        ),
    [transactions],
  );

  /* ----- Infinite scroll ----- */
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* ----- Handlers ----- */
  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("Удалить эту транзакцию?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleFormSubmit = (values: TransactionFormValues) => {
    // Build splits based on type
    let splits: SplitCreate[];

    if (values.type === "transfer") {
      splits = [
        {
          account_id: values.from_account_id!,
          amount: -Math.abs(values.amount),
        },
        {
          account_id: values.to_account_id!,
          amount: Math.abs(values.amount),
        },
      ];
    } else if (values.type === "income") {
      splits = [
        {
          account_id: values.account_id,
          category_id: values.category_id || undefined,
          amount: Math.abs(values.amount),
        },
      ];
    } else {
      // expense
      splits = [
        {
          account_id: values.account_id,
          category_id: values.category_id || undefined,
          amount: -Math.abs(values.amount),
        },
      ];
    }

    const payload = {
      date: values.date,
      payee: values.payee,
      note: values.note || undefined,
      type: values.type,
      splits,
    };

    if (editingTransaction) {
      updateMutation.mutate(
        { id: editingTransaction.id, data: payload },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  /* ----- Sync search params ----- */
  useEffect(() => {
    const accountId = searchParams.get("account_id");
    if (accountId && accountId !== filters.account_id) {
      setFilters((prev) => ({ ...prev, account_id: accountId }));
    }
    // Only sync on mount / URL change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <PageLayout title="Транзакции">
        <div className="flex items-center justify-center py-32">
          <Spinner size={32} className="text-[var(--color-accent)]" />
        </div>
      </PageLayout>
    );
  }

  /* ---------- Render ---------- */
  return (
    <PageLayout
      title="Транзакции"
      actions={
        <Button
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
        >
          Добавить транзакцию
        </Button>
      }
    >
      {/* Filters */}
      <div className="mb-6">
        <TransactionFiltersBar
          filters={filters}
          onChange={setFilters}
          accounts={accounts}
          categories={categories}
        />
      </div>

      {/* Summary cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <div className="p-2.5 rounded-lg bg-emerald-50">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">
                Доходы
              </p>
              <p className="text-lg font-bold text-emerald-600">
                +{formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[var(--color-border)]">
            <div className="p-2.5 rounded-lg bg-red-50">
              <TrendingDown size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">
                Расходы
              </p>
              <p className="text-lg font-bold text-red-500">
                -{formatCurrency(totalExpense)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight size={32} />}
          title="Нет транзакций"
          description="Добавьте свою первую транзакцию, чтобы начать отслеживать расходы и доходы."
          action={
            <Button
              icon={<Plus size={16} />}
              onClick={handleOpenCreate}
            >
              Добавить транзакцию
            </Button>
          }
        />
      ) : (
        <div className="space-y-1">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              accounts={accounts}
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-8" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner
                size={20}
                className="text-[var(--color-accent)]"
              />
            </div>
          )}

          {!hasNextPage && transactions.length > 0 && (
            <p className="text-center text-xs text-[var(--color-muted)] py-4">
              Все транзакции загружены
            </p>
          )}
        </div>
      )}

      {/* Transaction Form Drawer */}
      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={
          createMutation.isPending || updateMutation.isPending
        }
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
      />
    </PageLayout>
  );
};

export default TransactionsPage;
