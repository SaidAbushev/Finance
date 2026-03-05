import client from '../../shared/api/client';
import type { NetWorthResponse, CategorySpendResponse } from './types';

export async function getNetWorth(dateFrom?: string, dateTo?: string): Promise<NetWorthResponse> {
  const params: Record<string, string> = {};
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  const { data } = await client.get('/reports/networth', { params });
  return data;
}

export async function getCategorySpend(dateFrom?: string, dateTo?: string): Promise<CategorySpendResponse> {
  const params: Record<string, string> = {};
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  const { data } = await client.get('/reports/category-spend', { params });
  return data;
}
