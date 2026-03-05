export interface NetWorthPoint {
  date: string;
  amount: number;
}

export interface CategorySpendItem {
  category_id: string;
  category_name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface NetWorthResponse {
  points: NetWorthPoint[];
}

export interface CategorySpendResponse {
  items: CategorySpendItem[];
  total: number;
}
