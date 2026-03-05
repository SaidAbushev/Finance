import { useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Archive, Trash2 } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import { formatCurrency } from "../../../shared/lib/utils";
import { Badge } from "../../../shared/ui";
import type { Account, AccountType } from "../types";

const TYPE_LABELS: Record<AccountType, string> = {
  cash: "Наличные",
  checking: "Расчётный",
  savings: "Сберегательный",
  credit: "Кредитный",
  investment: "Инвестиционный",
};

const TYPE_BADGE_VARIANT: Record<
  AccountType,
  "default" | "primary" | "success" | "danger" | "warning" | "info"
> = {
  cash: "warning",
  checking: "primary",
  savings: "success",
  credit: "danger",
  investment: "info",
};

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AccountCard: FC<AccountCardProps> = ({
  account,
  onEdit,
  onArchive,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    navigate(`/transactions?account_id=${account.id}`);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={cn(
        "relative bg-white rounded-xl border border-[var(--color-border)] overflow-hidden",
        "transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5",
        account.is_archived && "opacity-60",
      )}
    >
      {/* Color bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: account.color }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
              {account.name}
            </h3>
            <Badge
              variant={TYPE_BADGE_VARIANT[account.type]}
              className="mt-1.5"
            >
              {TYPE_LABELS[account.type]}
            </Badge>
          </div>

          {/* Hover actions */}
          <div
            className={cn(
              "flex items-center gap-1 transition-opacity duration-150",
              hovered ? "opacity-100" : "opacity-0",
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(account);
              }}
              className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] transition-colors cursor-pointer"
              title="Редактировать"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(account.id);
              }}
              className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
              title="Архивировать"
            >
              <Archive size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(account.id);
              }}
              className="p-1.5 rounded-md text-[var(--color-muted)] hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
              title="Удалить"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Balance */}
        <p
          className={cn(
            "text-2xl font-bold tracking-tight",
            account.balance >= 0 ? "text-emerald-600" : "text-red-500",
          )}
        >
          {formatCurrency(account.balance, account.currency)}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="default">{account.currency}</Badge>
          {account.is_archived && (
            <Badge variant="warning">Архив</Badge>
          )}
        </div>
      </div>
    </div>
  );
};
