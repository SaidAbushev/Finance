import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import { formatCurrency } from "../../../shared/lib/utils";
import { Spinner } from "../../../shared/ui";
import { useAccounts } from "../hooks";
import type { Account, AccountType } from "../types";

const TYPE_GROUP_LABELS: Record<string, string> = {
  cash: "Наличные",
  bank: "Банковские",
  credit: "Кредитные",
  investment: "Инвестиционные",
};

function groupLabel(type: AccountType): string {
  if (type === "cash") return "cash";
  if (type === "checking" || type === "savings") return "bank";
  if (type === "credit") return "credit";
  return "investment";
}

function groupAccounts(
  accounts: Account[],
): Record<string, Account[]> {
  const groups: Record<string, Account[]> = {};
  for (const acc of accounts) {
    if (acc.is_archived) continue;
    const key = groupLabel(acc.type);
    if (!groups[key]) groups[key] = [];
    groups[key].push(acc);
  }
  return groups;
}

interface AccountSidebarProps {
  onAddAccount?: () => void;
}

export const AccountSidebar: FC<AccountSidebarProps> = ({
  onAddAccount,
}) => {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading) {
    return (
      <div className="px-3 py-4 flex justify-center">
        <Spinner size={16} className="text-white/40" />
      </div>
    );
  }

  const activeAccounts = accounts?.filter((a) => !a.is_archived) ?? [];
  const totalBalance = activeAccounts.reduce(
    (sum, a) => sum + a.balance,
    0,
  );
  const grouped = groupAccounts(activeAccounts);

  return (
    <div className="px-3 py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 mb-3">
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Счета
          </p>
          <p className="text-sm font-semibold text-white/90 mt-0.5">
            {formatCurrency(totalBalance)}
          </p>
        </div>
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Добавить счёт"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {(["cash", "bank", "credit", "investment"] as const).map(
          (groupKey) => {
            const items = grouped[groupKey];
            if (!items?.length) return null;
            return (
              <div key={groupKey}>
                <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                  {TYPE_GROUP_LABELS[groupKey]}
                </p>
                {items.map((acc) => (
                  <NavLink
                    key={acc.id}
                    to={`/transactions?account_id=${acc.id}`}
                    className={cn(
                      "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs",
                      "transition-colors duration-150",
                      "text-white/60 hover:bg-white/5 hover:text-white/80",
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="truncate">{acc.name}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 ml-2 font-medium",
                        acc.balance >= 0
                          ? "text-emerald-400/80"
                          : "text-red-400/80",
                      )}
                    >
                      {formatCurrency(acc.balance, acc.currency)}
                    </span>
                  </NavLink>
                ))}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};
