import { useEffect, useMemo } from "react";
import type { FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Drawer, Button, Input, Select } from "../../../shared/ui";
import { cn } from "../../../shared/lib/utils";
import type { Transaction, TransactionType } from "../types";
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

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/* ---------- Schema ---------- */
const transactionSchema = z
  .object({
    type: z.enum(["expense", "income", "transfer"] as const),
    date: z.string().min(1, "Укажите дату"),
    payee: z.string().min(1, "Укажите получателя"),
    account_id: z.string().min(1, "Выберите счёт"),
    category_id: z.string().optional(),
    from_account_id: z.string().optional(),
    to_account_id: z.string().optional(),
    amount: z.coerce.number().positive("Сумма должна быть больше 0"),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (!data.from_account_id) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите счёт списания",
          path: ["from_account_id"],
        });
      }
      if (!data.to_account_id) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите счёт зачисления",
          path: ["to_account_id"],
        });
      }
      if (
        data.from_account_id &&
        data.to_account_id &&
        data.from_account_id === data.to_account_id
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Счета должны быть разными",
          path: ["to_account_id"],
        });
      }
    }
  });

type FormValues = z.infer<typeof transactionSchema>;

/* ---------- Type toggle ---------- */
const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Расход" },
  { value: "income", label: "Доход" },
  { value: "transfer", label: "Перевод" },
];

/* ---------- Props ---------- */
interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  loading?: boolean;
  transaction?: Transaction | null;
  accounts?: Account[];
  categories?: Category[];
}

export type { FormValues as TransactionFormValues };

/* ---------- Component ---------- */
export const TransactionForm: FC<TransactionFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  transaction,
  accounts = [],
  categories = [],
}) => {
  const isEdit = !!transaction;

  const flatCats = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  const accountOptions = useMemo(
    () =>
      accounts
        .filter((a) => !a.is_archived)
        .map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  );

  const expenseCategoryOptions = useMemo(
    () => [
      { value: "", label: "Без категории" },
      ...flatCats
        .filter((c) => c.type === "expense")
        .map((c) => ({ value: c.id, label: c.name })),
    ],
    [flatCats],
  );

  const incomeCategoryOptions = useMemo(
    () => [
      { value: "", label: "Без категории" },
      ...flatCats
        .filter((c) => c.type === "income")
        .map((c) => ({ value: c.id, label: c.name })),
    ],
    [flatCats],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      date: todayStr(),
      payee: "",
      account_id: "",
      category_id: "",
      from_account_id: "",
      to_account_id: "",
      amount: 0,
      note: "",
    },
  });

  const currentType = watch("type");

  useEffect(() => {
    if (open) {
      if (transaction) {
        const firstSplit = transaction.splits[0];
        const isTransfer = transaction.type === "transfer";
        const negativeSplit = transaction.splits.find(
          (s) => s.amount < 0,
        );
        const positiveSplit = transaction.splits.find(
          (s) => s.amount > 0,
        );

        reset({
          type: transaction.type,
          date: transaction.date.split("T")[0],
          payee: transaction.payee,
          account_id: isTransfer ? "" : (firstSplit?.account_id ?? ""),
          category_id: firstSplit?.category_id ?? "",
          from_account_id: isTransfer
            ? (negativeSplit?.account_id ?? "")
            : "",
          to_account_id: isTransfer
            ? (positiveSplit?.account_id ?? "")
            : "",
          amount: Math.abs(
            (isTransfer ? negativeSplit?.amount : firstSplit?.amount) ??
              0,
          ),
          note: transaction.note ?? "",
        });
      } else {
        reset({
          type: "expense",
          date: todayStr(),
          payee: "",
          account_id: accountOptions[0]?.value ?? "",
          category_id: "",
          from_account_id: "",
          to_account_id: "",
          amount: 0,
          note: "",
        });
      }
    }
  }, [open, transaction, reset, accountOptions]);

  const categoryOptions =
    currentType === "income"
      ? incomeCategoryOptions
      : expenseCategoryOptions;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Редактировать транзакцию" : "Новая транзакция"}
      width="max-w-lg"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        {/* Type toggle */}
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Тип
              </label>
              <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                      field.value === opt.value
                        ? opt.value === "expense"
                          ? "bg-red-500 text-white"
                          : opt.value === "income"
                            ? "bg-emerald-500 text-white"
                            : "bg-sky-500 text-white"
                        : "bg-white text-[var(--color-muted)] hover:bg-gray-50",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        {/* Date */}
        <Input
          label="Дата"
          type="date"
          error={errors.date?.message}
          {...register("date")}
        />

        {/* Payee */}
        <Input
          label="Получатель"
          placeholder="Например: Магазин, Зарплата..."
          error={errors.payee?.message}
          {...register("payee")}
        />

        {/* Account / Transfer accounts */}
        {currentType === "transfer" ? (
          <>
            <Select
              label="Со счёта"
              options={accountOptions}
              placeholder="Выберите счёт"
              error={errors.from_account_id?.message}
              {...register("from_account_id")}
            />
            <Select
              label="На счёт"
              options={accountOptions}
              placeholder="Выберите счёт"
              error={errors.to_account_id?.message}
              {...register("to_account_id")}
            />
          </>
        ) : (
          <>
            <Select
              label="Счёт"
              options={accountOptions}
              placeholder="Выберите счёт"
              error={errors.account_id?.message}
              {...register("account_id")}
            />
            <Select
              label="Категория"
              options={categoryOptions}
              error={errors.category_id?.message}
              {...register("category_id")}
            />
          </>
        )}

        {/* Amount */}
        <Input
          label="Сумма"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register("amount")}
        />

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="note"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Заметка
          </label>
          <textarea
            id="note"
            rows={3}
            placeholder="Дополнительная информация..."
            className={cn(
              "w-full px-3 py-2.5 text-sm rounded-lg resize-none",
              "bg-white border border-[var(--color-border)]",
              "text-[var(--color-text)] placeholder:text-[var(--color-muted)]/60",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]",
            )}
            {...register("note")}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-auto border-t border-[var(--color-border)]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
