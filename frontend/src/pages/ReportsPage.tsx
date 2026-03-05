import { useState, useMemo } from 'react';
import { PageLayout } from '../shared/layout/PageLayout';
import { Spinner } from '../shared/ui';
import { useNetWorth, useCategorySpend } from '../features/reports/hooks';
import NetWorthChart from '../features/reports/components/NetWorthChart';
import CategorySpendChart from '../features/reports/components/CategorySpendChart';

type Period = 'month' | '3months' | '6months' | 'year' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'month', label: 'Этот месяц' },
  { value: '3months', label: '3 месяца' },
  { value: '6months', label: '6 месяцев' },
  { value: 'year', label: 'Этот год' },
  { value: 'all', label: 'Всё время' },
];

function getDateRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  switch (period) {
    case 'month': {
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { from, to };
    }
    case '3months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case '6months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case 'year': {
      return { from: `${now.getFullYear()}-01-01`, to };
    }
    case 'all':
      return {};
  }
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('6months');
  const range = useMemo(() => getDateRange(period), [period]);

  const { data: netWorth, isLoading: nwLoading } = useNetWorth(range.from, range.to);
  const { data: catSpend, isLoading: csLoading } = useCategorySpend(range.from, range.to);

  const isLoading = nwLoading || csLoading;

  return (
    <PageLayout title="Отчёты">
      <div className="space-y-6">
        {/* Period selector */}
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Чистая стоимость</h2>
              <NetWorthChart data={netWorth?.points || []} height={350} />
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Расходы по категориям</h2>
              <CategorySpendChart data={catSpend?.items || []} total={catSpend?.total || 0} />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
