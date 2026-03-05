export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  icon: string;
  color: string;
  type: CategoryType;
  sort_order: number;
  children?: Category[];
}

export interface CategoryCreate {
  name: string;
  parent_id?: string;
  icon?: string;
  color?: string;
  type: CategoryType;
}

export interface CategoryUpdate {
  name?: string;
  parent_id?: string | null;
  icon?: string;
  color?: string;
  type?: CategoryType;
}
