import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
} from 'lucide-react';
import { PageLayout } from '../shared/layout/PageLayout';
import { Spinner } from '../shared/ui';
import { formatCurrency } from '../shared/lib/utils';
import { useAccounts } from '../features/accounts/hooks';
import { useNetWorth, useCategorySpend } from '../features/reports/hooks';
import NetWorthChart from '../features/reports/components/NetWorthChart';
import CategorySpendChart from '../features/reports/components/CategorySpendChart';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: accounts, isLoading: accLoading } = useAccounts();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { data: netWorth } = useNetWorth();
  const { data: monthSpend } = useCategorySpend(monthStart);

  const totalBalance = useMemo(
    () => (accounts || []).reduce((s, a) => s + (a.balance ?? 0), 0),
    [accounts],
  );

  const monthIncome = useMemo(() => {
    if (!monthSpend) return 0;
    return 0; // income is not in category-spend (it's expenses only)
  }, [monthSpend]);

  const monthExpense = useMemo(() => monthSpend?.total ?? 0, [monthSpend]);

  if (accLoading) {
    return (
      <PageLayout title="Обзор">
        <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Обзор">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Wallet className="w-5 h-5 text-indigo-600" />}
            label="Общий баланс"
            value={formatCurrency(totalBalance)}
            bg="bg-indigo-50"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            label="Доходы за месяц"
            value={formatCurrency(monthIncome)}
            bg="bg-emerald-50"
            valueClass="text-emerald-600"
          />
          <SummaryCard
            icon={<TrendingDown className="w-5 h-5 text-red-600" />}
            label="Расходы за месяц"
            value={formatCurrency(monthExpense)}
            bg="bg-red-50"
            valueClass="text-red-600"
          />
          <SummaryCard
            icon={<PiggyBank className="w-5 h-5 text-amber-600" />}
            label="Экономия"
            value={formatCurrency(monthIncome - monthExpense)}
            bg="bg-amber-50"
          />
        </div>

        {/* Accounts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Счета</h2>
            <button
              onClick={() => navigate('/accounts')}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Все счета <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {(accounts || []).length === 0 ? (
            <p className="text-gray-400 text-sm">Нет счетов. Создайте первый счёт.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(accounts || []).slice(0, 6).map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/transactions?account_id=${acc.id}`)}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{acc.name}</div>
                  </div>
                  <div className={`text-sm font-semibold tabular-nums ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(acc.balance)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Net Worth */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Чистая стоимость</h2>
            <NetWorthChart data={netWorth?.points || []} height={220} />
          </div>

          {/* Category spend */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Расходы за месяц</h2>
            <CategorySpendChart data={monthSpend?.items || []} total={monthSpend?.total || 0} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  bg,
  valueClass = 'text-gray-900',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  valueClass?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}
