import apiClient from '../../shared/api/client';
import type { Category, CategoryCreate, CategoryUpdate } from './types';

function flattenTree(categories: Category[]): Category[] {
  const result: Category[] = [];
  for (const cat of categories) {
    const { children, ...rest } = cat;
    result.push(rest as Category);
    if (children && children.length > 0) {
      result.push(...flattenTree(children));
    }
  }
  return result;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<{ items: Category[] }>('/categories');
  return flattenTree(data.items);
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await apiClient.get<Category>(`/categories/${id}`);
  return data;
}

export async function createCategory(payload: CategoryCreate): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(id: string, payload: CategoryUpdate): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
