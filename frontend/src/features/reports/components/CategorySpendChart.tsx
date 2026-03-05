import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../../shared/lib/utils';
import type { CategorySpendItem } from '../types';

interface Props {
  data: CategorySpendItem[];
  total: number;
}

const DEFAULT_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
];

export default function CategorySpendChart({ data, total }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 h-64">
        Нет данных для отображения
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Donut chart */}
      <div className="flex-shrink-0">
        <ResponsiveContainer width={240} height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="amount"
              nameKey="category_name"
            >
              {data.map((item, index) => (
                <Cell
                  key={item.category_id}
                  fill={item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <div className="text-sm text-gray-500">Всего расходов</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(total)}</div>
        </div>
      </div>

      {/* Category list */}
      <div className="flex-1 space-y-3">
        {data.map((item, index) => {
          const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          return (
            <div key={item.category_id} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {item.category_name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums ml-2">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
