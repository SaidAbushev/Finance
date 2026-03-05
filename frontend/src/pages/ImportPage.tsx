import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { PageLayout } from '../shared/layout/PageLayout';
import { Button, Select, Spinner } from '../shared/ui';
import { formatCurrency } from '../shared/lib/utils';
import { useAccounts } from '../features/accounts/hooks';
import client from '../shared/api/client';

interface PreviewRow {
  date: string;
  payee: string;
  amount: number;
  category: string;
}

type Step = 'upload' | 'preview' | 'done';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [accountId, setAccountId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const { data: accounts } = useAccounts();

  const accountOptions = (accounts || []).map((a) => ({ value: a.id, label: a.name }));

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setError('');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.name.endsWith('.csv') || f.name.endsWith('.txt'))) {
        handleFile(f);
      } else {
        setError('Поддерживаются только файлы CSV');
      }
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await client.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRows(data.rows || []);
      setStep('preview');
    } catch {
      setError('Не удалось обработать файл. Проверьте формат.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!accountId) {
      setError('Выберите счёт');
      return;
    }
    setConfirming(true);
    setError('');
    try {
      const { data } = await client.post('/import/confirm', {
        rows,
        account_id: accountId,
      });
      setImportedCount(data.imported || rows.length);
      setStep('done');
    } catch {
      setError('Ошибка при импорте транзакций');
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setRows([]);
    setAccountId('');
    setError('');
    setImportedCount(0);
  };

  return (
    <PageLayout title="Импорт">
      <div className="max-w-3xl mx-auto">
        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { key: 'upload', label: 'Загрузка' },
            { key: 'preview', label: 'Предпросмотр' },
            { key: 'done', label: 'Готово' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s.key
                    ? 'bg-indigo-600 text-white'
                    : i < ['upload', 'preview', 'done'].indexOf(step)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${step === s.key ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < 2 && <div className="w-12 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="card p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-12 h-12 text-emerald-500" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} КБ</p>
                  <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:text-red-600">
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <p className="text-lg text-gray-600">Перетащите CSV файл сюда</p>
                  <p className="text-sm text-gray-400">или</p>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Выбрать файл
                    </span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleUpload} disabled={!file} loading={uploading}>
                Загрузить и проверить
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Найдено строк: {rows.length}
              </h3>
              <div className="w-64">
                <Select
                  label="Счёт для импорта"
                  options={accountOptions}
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="Выберите счёт"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Дата</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Получатель</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-600">{row.date}</td>
                      <td className="py-2 px-3 text-gray-900">{row.payee}</td>
                      <td className={`py-2 px-3 text-right tabular-nums font-medium ${
                        row.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && (
                <p className="text-sm text-gray-400 text-center mt-2">
                  ...и ещё {rows.length - 20} строк
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="secondary" onClick={reset}>Назад</Button>
              <Button onClick={handleConfirm} loading={confirming}>
                Импортировать {rows.length} транзакций
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="card p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Импорт завершён</h3>
            <p className="text-gray-500 mb-6">
              Успешно импортировано транзакций: {importedCount}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={reset}>Импортировать ещё</Button>
              <Button onClick={() => window.location.href = '/transactions'}>
                К транзакциям
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
