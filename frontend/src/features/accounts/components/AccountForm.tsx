import { useEffect } from "react";
import type { FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, Button, Input, Select } from "../../../shared/ui";
import type { Account, AccountType } from "../types";

/* ---------- Schema ---------- */
const accountSchema = z.object({
  name: z.string().min(1, "Введите название"),
  type: z.enum(["cash", "checking", "savings", "credit", "investment"] as const, {
    message: "Выберите тип счёта",
  }),
  currency: z.enum(["RUB", "USD", "EUR", "KZT"] as const, {
    message: "Выберите валюту",
  }),
  initial_balance: z.coerce.number({ message: "Введите число" }),
  color: z.string().min(1, "Выберите цвет"),
  icon: z.string().min(1, "Выберите иконку"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

/* ---------- Constants ---------- */
const TYPE_OPTIONS = [
  { value: "cash", label: "Наличные" },
  { value: "checking", label: "Расчётный" },
  { value: "savings", label: "Сберегательный" },
  { value: "credit", label: "Кредитный" },
  { value: "investment", label: "Инвестиционный" },
];

const CURRENCY_OPTIONS = [
  { value: "RUB", label: "RUB — Российский рубль" },
  { value: "USD", label: "USD — Доллар США" },
  { value: "EUR", label: "EUR — Евро" },
  { value: "KZT", label: "KZT — Казахстанский тенге" },
];

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
  "#1e293b",
];

const PRESET_ICONS = [
  "wallet",
  "banknote",
  "credit-card",
  "piggy-bank",
  "landmark",
  "trending-up",
  "coins",
  "circle-dollar-sign",
  "hand-coins",
  "receipt",
  "briefcase",
  "gem",
];

const ICON_LABELS: Record<string, string> = {
  wallet: "Кошелёк",
  banknote: "Купюра",
  "credit-card": "Карта",
  "piggy-bank": "Копилка",
  landmark: "Банк",
  "trending-up": "Инвестиции",
  coins: "Монеты",
  "circle-dollar-sign": "Доллар",
  "hand-coins": "Вклад",
  receipt: "Чек",
  briefcase: "Портфель",
  gem: "Драгоценность",
};

/* ---------- Component ---------- */
interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AccountFormValues) => void;
  loading?: boolean;
  account?: Account | null;
}

export const AccountForm: FC<AccountFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  account,
}) => {
  const isEdit = !!account;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "checking" as AccountType,
      currency: "RUB",
      initial_balance: 0,
      color: PRESET_COLORS[0],
      icon: PRESET_ICONS[0],
    },
  });

  useEffect(() => {
    if (open) {
      if (account) {
        reset({
          name: account.name,
          type: account.type,
          currency: account.currency,
          initial_balance: account.initial_balance,
          color: account.color,
          icon: account.icon,
        });
      } else {
        reset({
          name: "",
          type: "checking",
          currency: "RUB",
          initial_balance: 0,
          color: PRESET_COLORS[0],
          icon: PRESET_ICONS[0],
        });
      }
    }
  }, [open, account, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Редактировать счёт" : "Новый счёт"}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Name */}
        <Input
          label="Название"
          placeholder="Например: Основная карта"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* Type */}
        <Select
          label="Тип счёта"
          options={TYPE_OPTIONS}
          error={errors.type?.message}
          {...register("type")}
        />

        {/* Currency */}
        <Select
          label="Валюта"
          options={CURRENCY_OPTIONS}
          error={errors.currency?.message}
          {...register("currency")}
        />

        {/* Initial Balance */}
        <Input
          label="Начальный баланс"
          type="number"
          step="0.01"
          placeholder="0"
          error={errors.initial_balance?.message}
          {...register("initial_balance")}
        />

        {/* Color Picker */}
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Цвет
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => field.onChange(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-150 cursor-pointer ${
                      field.value === color
                        ? "border-[var(--color-text)] scale-110 shadow-md"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>
          )}
        />

        {/* Icon Picker */}
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Иконка
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => field.onChange(icon)}
                    className={`flex items-center justify-center h-10 rounded-lg border text-xs font-medium transition-all duration-150 cursor-pointer ${
                      field.value === icon
                        ? "border-[var(--color-accent)] bg-indigo-50 text-[var(--color-accent)]"
                        : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    title={ICON_LABELS[icon] ?? icon}
                  >
                    {(ICON_LABELS[icon] ?? icon).slice(0, 3)}
                  </button>
                ))}
              </div>
              {errors.icon && (
                <p className="text-xs text-red-500">{errors.icon.message}</p>
              )}
            </div>
          )}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
    </Dialog>
  );
};
