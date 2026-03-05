import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, Input, Select, Button } from '../../../shared/ui';
import { useCategories, useCreateCategory, useUpdateCategory } from '../hooks';
import type { Category } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  type: z.enum(['expense', 'income']),
  parent_id: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
  '#84cc16', '#64748b',
];

interface Props {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export default function CategoryForm({ open, onClose, category }: Props) {
  const { data: categories } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name || '',
      type: category?.type || 'expense',
      parent_id: category?.parent_id || '',
      color: category?.color || '#6366f1',
      icon: category?.icon || 'tag',
    },
  });

  const selectedColor = watch('color');
  const selectedType = watch('type');

  const parentOptions = [
    { value: '', label: 'Без родительской категории' },
    ...(categories || [])
      .filter((c: Category) => c.type === selectedType && c.id !== category?.id && !c.parent_id)
      .map((c: Category) => ({ value: c.id, label: c.name })),
  ];

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      type: data.type as 'expense' | 'income',
      parent_id: data.parent_id || undefined,
      color: data.color,
      icon: data.icon,
    };

    if (category) {
      await updateMutation.mutateAsync({ id: category.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={category ? 'Редактировать категорию' : 'Новая категория'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Название"
          placeholder="Например: Продукты"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue('type', 'expense')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedType === 'expense'
                  ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Расход
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'income')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedType === 'income'
                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Доход
            </button>
          </div>
        </div>

        <Select
          label="Родительская категория"
          options={parentOptions}
          {...register('parent_id')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {category ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
