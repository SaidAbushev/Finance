import { useState } from "react";
import type { FC } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "../../../shared/lib/utils";
import type { Budget } from "../types";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

export const BudgetCard: FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
}) => {
  const [hovered, setHovered] = useState(false);

  const percentage =
    budget.amount > 0
      ? Math.min(Math.round((budget.spent / budget.amount) * 100), 100)
      : 0;

  const barColor =
    percentage > 90
      ? "bg-red-500"
      : percentage > 75
        ? "bg-amber-500"
        : "bg-emerald-500";

  const barBg =
    percentage > 90
      ? "bg-red-100"
      : percentage > 75
        ? "bg-amber-100"
        : "bg-emerald-100";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="card p-5 transition-all duration-200 hover:shadow-md hover:border-[#cbd5e1]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
            {budget.name}
          </h3>
          {budget.category_name && (
            <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">
              {budget.category_name}
            </p>
          )}
          {!budget.category_id && (
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Все расходы
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 shrink-0 transition-opacity duration-150 ml-2",
            hovered ? "opacity-100" : "opacity-0",
          )}
        >
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] transition-colors cursor-pointer"
            title="Редактировать"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
            title="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={cn("w-full h-2 rounded-full", barBg)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-3">
        <div>
          <span className="text-sm font-semibold text-[var(--color-text)] tabular-nums">
            {formatCurrency(budget.spent)}
          </span>
          <span className="text-sm text-[var(--color-muted)]">
            {" / "}
            {formatCurrency(budget.amount)}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            percentage > 90
              ? "bg-red-50 text-red-600"
              : percentage > 75
                ? "bg-amber-50 text-amber-600"
                : "bg-emerald-50 text-emerald-600",
          )}
        >
          {percentage}%
        </span>
      </div>

      {/* Remaining */}
      <p className="text-xs text-[var(--color-muted)] mt-2">
        Осталось:{" "}
        <span
          className={cn(
            "font-medium tabular-nums",
            budget.remaining < 0 ? "text-red-500" : "text-[var(--color-text)]",
          )}
        >
          {formatCurrency(budget.remaining)}
        </span>
      </p>
    </div>
  );
};
