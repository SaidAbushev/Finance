export type TransactionType = "expense" | "income" | "transfer";
export type TransactionStatus = "pending" | "cleared" | "reconciled";

export interface TransactionSplit {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  memo: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  payee: string;
  note: string;
  type: TransactionType;
  status: TransactionStatus;
  splits: TransactionSplit[];
  created_at: string;
  updated_at: string;
}

export interface SplitCreate {
  account_id: string;
  category_id?: string;
  amount: number;
  memo?: string;
}

export interface TransactionCreate {
  date: string;
  payee: string;
  note?: string;
  type: TransactionType;
  splits: SplitCreate[];
}

export interface TransactionUpdate {
  date?: string;
  payee?: string;
  note?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  splits?: SplitCreate[];
}

export interface TransactionFilters {
  account_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  next_cursor: string | null;
  has_more: boolean;
}
