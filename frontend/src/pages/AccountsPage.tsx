import { useState, useCallback } from "react";
import type { FC } from "react";
import { Plus, Wallet } from "lucide-react";
import { PageLayout } from "../shared/layout/PageLayout";
import { Button, Spinner, EmptyState } from "../shared/ui";
import { formatCurrency } from "../shared/lib/utils";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useArchiveAccount,
} from "../features/accounts/hooks";
import { AccountCard } from "../features/accounts/components/AccountCard";
import { AccountForm } from "../features/accounts/components/AccountForm";
import type { Account, AccountType } from "../features/accounts/types";

/* ---------- Type grouping ---------- */
const GROUP_ORDER: AccountType[] = [
  "cash",
  "checking",
  "savings",
  "credit",
  "investment",
];

const GROUP_LABELS: Record<AccountType, string> = {
  cash: "Наличные",
  checking: "Расчётные счета",
  savings: "Сберегательные счета",
  credit: "Кредитные счета",
  investment: "Инвестиционные счета",
};

function groupByType(accounts: Account[]): Record<AccountType, Account[]> {
  const result = {} as Record<AccountType, Account[]>;
  for (const type of GROUP_ORDER) result[type] = [];
  for (const acc of accounts) {
    if (!acc.is_archived) {
      result[acc.type].push(acc);
    }
  }
  return result;
}

/* ---------- Page ---------- */
const AccountsPage: FC = () => {
  const { data: accounts, isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const archiveMutation = useArchiveAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  const handleEdit = useCallback((account: Account) => {
    setEditingAccount(account);
    setFormOpen(true);
  }, []);

  const handleArchive = useCallback(
    (id: string) => {
      if (window.confirm("Архивировать этот счёт?")) {
        archiveMutation.mutate(id);
      }
    },
    [archiveMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (
        window.confirm(
          "Вы уверены, что хотите удалить этот счёт? Это действие необратимо.",
        )
      ) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleFormSubmit = (values: {
    name: string;
    type: AccountType;
    currency: string;
    initial_balance: number;
    color: string;
    icon: string;
  }) => {
    if (editingAccount) {
      updateMutation.mutate(
        {
          id: editingAccount.id,
          data: {
            name: values.name,
            type: values.type,
            currency: values.currency,
            color: values.color,
            icon: values.icon,
          },
        },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  /* ---------- Computed ---------- */
  const activeAccounts =
    accounts?.filter((a) => !a.is_archived) ?? [];
  const totalBalance = activeAccounts.reduce(
    (sum, a) => sum + a.balance,
    0,
  );
  const grouped = groupByType(activeAccounts);

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <PageLayout title="Счета">
        <div className="flex items-center justify-center py-32">
          <Spinner size={32} className="text-[var(--color-accent)]" />
        </div>
      </PageLayout>
    );
  }

  /* ---------- Empty ---------- */
  if (!activeAccounts.length) {
    return (
      <PageLayout
        title="Счета"
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
          >
            Добавить счёт
          </Button>
        }
      >
        <EmptyState
          icon={<Wallet size={32} />}
          title="Нет счетов"
          description="Создайте свой первый счёт для учёта средств."
          action={
            <Button
              icon={<Plus size={16} />}
              onClick={handleOpenCreate}
            >
              Добавить счёт
            </Button>
          }
        />
        <AccountForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          loading={createMutation.isPending}
        />
      </PageLayout>
    );
  }

  /* ---------- Render ---------- */
  return (
    <PageLayout
      title="Счета"
      actions={
        <Button
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
        >
          Добавить счёт
        </Button>
      }
    >
      {/* Total */}
      <div className="mb-8 p-5 bg-white rounded-xl border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-muted)] mb-1">
          Общий баланс
        </p>
        <p className="text-3xl font-bold text-[var(--color-text)]">
          {formatCurrency(totalBalance)}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          {activeAccounts.length}{" "}
          {activeAccounts.length === 1
            ? "активный счёт"
            : activeAccounts.length < 5
              ? "активных счёта"
              : "активных счетов"}
        </p>
      </div>

      {/* Groups */}
      {GROUP_ORDER.map((type) => {
        const items = grouped[type];
        if (!items.length) return null;
        return (
          <section key={type} className="mb-8">
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
              {GROUP_LABELS[type]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Account Form Dialog */}
      <AccountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={
          createMutation.isPending || updateMutation.isPending
        }
        account={editingAccount}
      />
    </PageLayout>
  );
};

export default AccountsPage;
