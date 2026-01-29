/**
 * Sale Entity
 * Records a completed phone sale
 * Database table: sales
 * Owner Module: M-07 Sales
 */
export interface Sale {
  id: string;
  phone_id: string;
  sale_date: string;
  sale_price: number;
  cost_price: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SaleInsert {
  id?: string;
  phone_id: string;
  sale_date: string;
  sale_price: number;
  cost_price: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface SaleUpdate {
  id?: string;
  phone_id?: string;
  sale_date?: string;
  sale_price?: number;
  cost_price?: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  notes?: string | null;
  updated_at?: string | null;
}

export interface SaleWithRelations extends Sale {
  phone?: {
    id: string;
    model: string;
    brand: {
      id: string;
      name: string;
    };
  };
}
