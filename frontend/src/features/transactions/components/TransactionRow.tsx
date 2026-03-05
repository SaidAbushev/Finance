import { useState } from "react";
import type { FC } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn, formatCurrency, formatDateShort } from "../../../shared/lib/utils";
import { Badge } from "../../../shared/ui";
import type { Transaction, TransactionType } from "../types";
import type { Account } from "../../accounts/types";
import type { Category } from "../../categories/types";

/* ---------- Helpers ---------- */
const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Расход",
  income: "Доход",
  transfer: "Перевод",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-400",
  cleared: "bg-emerald-400",
  reconciled: "bg-sky-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидание",
  cleared: "Проведена",
  reconciled: "Сверена",
};

function getTotalAmount(splits: Transaction["splits"]): number {
  // For display: sum positives for income, sum negatives for expense
  const positive = splits.reduce(
    (s, sp) => (sp.amount > 0 ? s + sp.amount : s),
    0,
  );
  const negative = splits.reduce(
    (s, sp) => (sp.amount < 0 ? s + sp.amount : s),
    0,
  );
  return positive > 0 ? positive : negative;
}

/* ---------- Component ---------- */
interface TransactionRowProps {
  transaction: Transaction;
  accounts?: Account[];
  categories?: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionRow: FC<TransactionRowProps> = ({
  transaction,
  accounts = [],
  categories = [],
  onEdit,
  onDelete,
}) => {
  const [hovered, setHovered] = useState(false);

  const amount = getTotalAmount(transaction.splits);
  const firstSplit = transaction.splits[0];
  const account = accounts.find((a) => a.id === firstSplit?.account_id);

  // Flatten categories tree for lookup
  const flatCategories: Category[] = [];
  const flattenCats = (cats: Category[]) => {
    for (const c of cats) {
      flatCategories.push(c);
      if (c.children?.length) flattenCats(c.children);
    }
  };
  flattenCats(categories);

  const category = flatCategories.find(
    (c) => c.id === firstSplit?.category_id,
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onEdit(transaction)}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent",
        "transition-all duration-150 cursor-pointer",
        "hover:bg-white hover:border-[var(--color-border)] hover:shadow-sm",
      )}
    >
      {/* Date */}
      <div className="w-14 shrink-0 text-center">
        <p className="text-sm font-semibold text-[var(--color-text)]">
          {formatDateShort(transaction.date)}
        </p>
      </div>

      {/* Status dot */}
      <div
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          STATUS_COLORS[transaction.status],
        )}
        title={STATUS_LABELS[transaction.status]}
      />

      {/* Payee + Category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] truncate">
          {transaction.payee}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {category && (
            <Badge variant="default" className="text-[10px]">
              {category.name}
            </Badge>
          )}
          {transaction.type === "transfer" && (
            <Badge variant="info" className="text-[10px]">
              {TYPE_LABELS.transfer}
            </Badge>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="hidden sm:block shrink-0 text-right">
        {account && (
          <span className="text-xs text-[var(--color-muted)]">
            {account.name}
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="w-28 shrink-0 text-right">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            amount > 0 ? "text-emerald-600" : "text-red-500",
          )}
        >
          {amount > 0 ? "+" : ""}
          {formatCurrency(
            amount,
            account?.currency,
          )}
        </span>
      </div>

      {/* Hover actions */}
      <div
        className={cn(
          "flex items-center gap-1 shrink-0 transition-opacity duration-150",
          hovered ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(transaction);
          }}
          className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] transition-colors cursor-pointer"
          title="Редактировать"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transaction.id);
          }}
          className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          title="Удалить"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
