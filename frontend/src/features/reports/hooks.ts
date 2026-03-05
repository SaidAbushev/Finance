import { useQuery } from '@tanstack/react-query';
import { getNetWorth, getCategorySpend } from './api';

export function useNetWorth(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['networth', dateFrom, dateTo],
    queryFn: () => getNetWorth(dateFrom, dateTo),
  });
}

export function useCategorySpend(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['category-spend', dateFrom, dateTo],
    queryFn: () => getCategorySpend(dateFrom, dateTo),
  });
}
