import { useState, useEffect, useRef } from "react";
import type { FC } from "react";
import { Search, X } from "lucide-react";
import { Input, Select, Button } from "../../../shared/ui";
import type { TransactionFilters as TFilters } from "../types";
import type { Account } from "../../accounts/types";
import type { Category } from "../../categories/types";

/* ---------- Helpers ---------- */
function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  const walk = (items: Category[]) => {
    for (const c of items) {
      result.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(cats);
  return result;
}

/* ---------- Component ---------- */
interface TransactionFiltersProps {
  filters: TFilters;
  onChange: (filters: TFilters) => void;
  accounts?: Account[];
  categories?: Category[];
}

export const TransactionFiltersBar: FC<TransactionFiltersProps> = ({
  filters,
  onChange,
  accounts = [],
  categories = [],
}) => {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchValue !== (filters.search ?? "")) {
        onChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Sync external search changes
  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const flat = flattenCategories(categories);
  const hasFilters =
    filters.account_id ||
    filters.category_id ||
    filters.date_from ||
    filters.date_to ||
    filters.search;

  const accountOptions = [
    { value: "", label: "Все счета" },
    ...accounts
      .filter((a) => !a.is_archived)
      .map((a) => ({ value: a.id, label: a.name })),
  ];

  const categoryOptions = [
    { value: "", label: "Все категории" },
    ...flat.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-xl border border-[var(--color-border)]">
      {/* Search */}
      <div className="w-full sm:w-52">
        <Input
          placeholder="Поиск..."
          icon={<Search size={16} />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          rightIcon={
            searchValue ? (
              <button
                onClick={() => setSearchValue("")}
                className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X size={14} />
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Account */}
      <div className="w-full sm:w-44">
        <Select
          options={accountOptions}
          value={filters.account_id ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              account_id: e.target.value || undefined,
            })
          }
        />
      </div>

      {/* Category */}
      <div className="w-full sm:w-44">
        <Select
          options={categoryOptions}
          value={filters.category_id ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              category_id: e.target.value || undefined,
            })
          }
        />
      </div>

      {/* Date from */}
      <div className="w-full sm:w-40">
        <Input
          type="date"
          placeholder="С даты"
          value={filters.date_from ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_from: e.target.value || undefined,
            })
          }
        />
      </div>

      {/* Date to */}
      <div className="w-full sm:w-40">
        <Input
          type="date"
          placeholder="По дату"
          value={filters.date_to ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_to: e.target.value || undefined,
            })
          }
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchValue("");
            onChange({});
          }}
          icon={<X size={14} />}
        >
          Сбросить
        </Button>
      )}
    </div>
  );
};
