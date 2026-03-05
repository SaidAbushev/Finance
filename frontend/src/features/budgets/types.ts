export interface Budget {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category_id: string | null;
  category_name?: string;
  spent: number;
  remaining: number;
  created_at: string;
}

export interface BudgetCreate {
  name: string;
  amount: number;
  category_id?: string;
}

export interface BudgetUpdate {
  name?: string;
  amount?: number;
  category_id?: string;
}

export interface BudgetProgress {
  budget_id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}
