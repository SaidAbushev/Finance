export type AccountType =
  | "cash"
  | "checking"
  | "savings"
  | "credit"
  | "investment";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: number;
  balance: number;
  color: string;
  icon: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: number;
  color: string;
  icon: string;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  currency?: string;
  color?: string;
  icon?: string;
}
