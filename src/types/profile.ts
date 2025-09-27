export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  credits_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  operator: string;
  category: string;
  created_at: string;
  updated_at: string;
  transaction_id?: string;
  notes?: string;
}

export interface OrderStats {
  total_orders: number;
  successful_orders: number;
  pending_orders: number;
  total_spent: number;
}