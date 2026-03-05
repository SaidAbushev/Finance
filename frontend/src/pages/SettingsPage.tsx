import { useState } from 'react';
import { User, Tag, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { PageLayout } from '../shared/layout/PageLayout';
import { Button, Spinner } from '../shared/ui';
import { useAuth } from '../shared/hooks/useAuth';
import { useCategories, useDeleteCategory } from '../features/categories/hooks';
import CategoryForm from '../features/categories/components/CategoryForm';
import type { Category } from '../features/categories/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const expenseCategories = (categories || []).filter((c: Category) => c.type === 'expense' && !c.parent_id);
  const incomeCategories = (categories || []).filter((c: Category) => c.type === 'income' && !c.parent_id);

  const handleEdit = (cat: Category) => {
    setEditCategory(cat);
    setFormOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    if (confirm(`Удалить категорию "${cat.name}"?`)) {
      await deleteMutation.mutateAsync(cat.id);
    }
  };

  return (
    <PageLayout title="Настройки">
      <div className="max-w-3xl space-y-6">
        {/* Profile */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Профиль</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Имя</span>
              <span className="text-sm font-medium text-gray-900">{user?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Категории</h2>
            </div>
            <Button
              size="sm"
              onClick={() => { setEditCategory(null); setFormOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner size={24} /></div>
          ) : (
            <div className="space-y-6">
              <CategorySection
                title="Расходы"
                categories={expenseCategories}
                allCategories={categories || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <CategorySection
                title="Доходы"
                categories={incomeCategories}
                allCategories={categories || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        {/* About */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">О приложении</h2>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Финансы — управление личным бюджетом</p>
            <p>Версия 1.0.0</p>
          </div>
        </div>
      </div>

      <CategoryForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCategory(null); }}
        category={editCategory}
      />
    </PageLayout>
  );
}

function CategorySection({
  title,
  categories,
  allCategories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  allCategories: Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="space-y-1">
        {categories.map((cat) => {
          const children = allCategories.filter((c: Category) => c.parent_id === cat.id);
          return (
            <div key={cat.id}>
              <CategoryItem category={cat} onEdit={onEdit} onDelete={onDelete} />
              {children.length > 0 && (
                <div className="ml-6 space-y-1">
                  {children.map((child) => (
                    <CategoryItem key={child.id} category={child} onEdit={onEdit} onDelete={onDelete} sub />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 py-2">Нет категорий</p>
        )}
      </div>
    </div>
  );
}

function CategoryItem({
  category,
  onEdit,
  onDelete,
  sub = false,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  sub?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group">
      {sub && <ChevronRight className="w-3 h-3 text-gray-300" />}
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
      <span className={`flex-1 text-sm ${sub ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
        {category.name}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(category)}
          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
