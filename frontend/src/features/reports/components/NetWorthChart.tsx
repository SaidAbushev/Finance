import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../../shared/lib/utils';
import type { NetWorthPoint } from '../types';

interface Props {
  data: NetWorthPoint[];
  height?: number;
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function NetWorthChart({ data, height = 300 }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        Нет данных для отображения
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tickFormatter={formatMonth}
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Чистая стоимость']}
          labelFormatter={formatMonth}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#netWorthGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
