import { useState, useCallback, useMemo } from "react";
import type { FC } from "react";
import { Plus, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react";
import { PageLayout } from "../shared/layout/PageLayout";
import { Button, Spinner, EmptyState } from "../shared/ui";
import { formatCurrency } from "../shared/lib/utils";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "../features/budgets/hooks";
import { BudgetCard } from "../features/budgets/components/BudgetCard";
import { BudgetForm } from "../features/budgets/components/BudgetForm";
import type { Budget } from "../features/budgets/types";

/* ---------- Helpers ---------- */
const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

/* ---------- Page ---------- */
const BudgetsPage: FC = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { data: budgets, isLoading } = useBudgets(year, month + 1);
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  /* --- Navigation --- */
  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  /* --- Actions --- */
  const handleOpenCreate = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const handleEdit = useCallback((budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("Вы уверены, что хотите удалить этот бюджет?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleFormSubmit = (values: {
    name: string;
    amount: number;
    category_id?: string;
  }) => {
    if (editingBudget) {
      updateMutation.mutate(
        { id: editingBudget.id, data: values },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  /* --- Totals --- */
  const totals = useMemo(() => {
    if (!budgets?.length) return { amount: 0, spent: 0, remaining: 0 };
    return budgets.reduce(
      (acc, b) => ({
        amount: acc.amount + b.amount,
        spent: acc.spent + b.spent,
        remaining: acc.remaining + b.remaining,
      }),
      { amount: 0, spent: 0, remaining: 0 },
    );
  }, [budgets]);

  const totalPercentage =
    totals.amount > 0
      ? Math.min(Math.round((totals.spent / totals.amount) * 100), 100)
      : 0;

  /* --- Loading --- */
  if (isLoading) {
    return (
      <PageLayout title="Бюджеты">
        <div className="flex items-center justify-center py-32">
          <Spinner size={32} className="text-[var(--color-accent)]" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Бюджеты"
      actions={
        <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Добавить бюджет
        </Button>
      }
    >
      {/* Month selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-text)] hover:shadow-sm border border-transparent hover:border-[var(--color-border)] transition-all cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-[var(--color-text)] min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-text)] hover:shadow-sm border border-transparent hover:border-[var(--color-border)] transition-all cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Total summary */}
      {budgets && budgets.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-[var(--color-muted)]">
                Общий бюджет
              </p>
              <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">
                {formatCurrency(totals.spent)}{" "}
                <span className="text-base font-normal text-[var(--color-muted)]">
                  / {formatCurrency(totals.amount)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  totalPercentage > 90
                    ? "text-red-500"
                    : totalPercentage > 75
                      ? "text-amber-500"
                      : "text-emerald-500"
                }`}
              >
                {totalPercentage}%
              </span>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Осталось: {formatCurrency(totals.remaining)}
              </p>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalPercentage > 90
                  ? "bg-red-500"
                  : totalPercentage > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${totalPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget cards or empty state */}
      {!budgets?.length ? (
        <EmptyState
          icon={<PiggyBank size={32} />}
          title="Нет бюджетов"
          description="Создайте бюджет, чтобы контролировать свои расходы по категориям."
          action={
            <Button icon={<Plus size={16} />} onClick={handleOpenCreate}>
              Добавить бюджет
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        budget={editingBudget}
      />
    </PageLayout>
  );
};

export default BudgetsPage;
