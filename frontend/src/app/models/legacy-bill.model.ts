export interface LegacyBill {
  id: string;
  rowNum: number | null;
  billNum: number;
  billDate: string;
  customerName: string | null;
  phone: string | null;
  phoneMissing: boolean;
  customerId: string | null;
  brand: string | null;
  primaryProduct: string | null;
  allProducts: string | null;
  qty: number;
  amount: number | null;
  storage: string | null;
  imei: string | null;
  conditionNotes: string | null;
  rawDetails: string | null;
  severity: string;
  doubtReasons: string | null;
  createdAt: string;
}

export interface LegacyBillFilter {
  search?: string;
  page?: number;
  limit?: number;
}

export interface LegacyBillListResponse {
  data: LegacyBill[];
  total: number;
}
