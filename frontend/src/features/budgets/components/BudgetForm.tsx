import type { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, Input, Select, Button } from "../../../shared/ui";
import { useCategories } from "../../categories/hooks";
import type { Budget } from "../types";

const budgetSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  category_id: z.string().optional(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: BudgetFormValues) => void;
  loading?: boolean;
  budget?: Budget | null;
}

export const BudgetForm: FC<BudgetFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  budget,
}) => {
  const { data: categories = [] } = useCategories();

  // Flatten categories for select
  const flatCategories: { value: string; label: string }[] = [];
  const flattenCats = (
    cats: typeof categories,
    prefix: string = "",
  ) => {
    for (const c of cats) {
      flatCategories.push({
        value: c.id,
        label: prefix ? `${prefix} / ${c.name}` : c.name,
      });
      if (c.children?.length) flattenCats(c.children, c.name);
    }
  };
  flattenCats(categories);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    values: budget
      ? {
          name: budget.name,
          amount: budget.amount,
          category_id: budget.category_id ?? "",
        }
      : {
          name: "",
          amount: 0,
          category_id: "",
        },
  });

  const handleFormSubmit = (values: BudgetFormValues) => {
    const payload = {
      ...values,
      category_id: values.category_id || undefined,
    };
    onSubmit(payload);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={budget ? "Редактировать бюджет" : "Новый бюджет"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Название"
          placeholder="Например: Продукты"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Сумма"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          error={errors.amount?.message}
          {...register("amount")}
        />

        <Select
          label="Категория"
          options={[
            { value: "", label: "Все расходы" },
            ...flatCategories,
          ]}
          error={errors.category_id?.message}
          {...register("category_id")}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            {budget ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
