export interface Producer {
  id: number;
  name: string;
  location: string;
  balance: number;
  rfc?: string;
  phone?: string;
  default_orchard?: string;
}

export interface Batch {
  id: number;
  folio?: string;
  scale_ticket_folio?: string;
  producer_id: number | null;
  producer_name: string;
  date: string;
  origin: string; // e.g. "Cosecha propia", "Compra a terceros", "Huerto"
  orchard: string; // e.g. "Pedernales", "San José", "El Limonar"
  variety?: string; // e.g. "Limón Persa", "Naranja Valencia", "Toronja"
  quality?: string; // e.g. "Exportación 1ra", "Nacional 2da", "Molino"
  weight_gross: number;
  weight_tare: number;
  weight_net: number;
  price_per_kg: number;
  subtotal: number;
  scale_fee: number; // default $50.00
  scale_fee_payment?: 'descuento' | 'efectivo';
  extra_charge_per_kg?: number; // default 0.40
  extra_charge_total?: number;
  extra_charge_concept?: string;
  total: number;
  status: 'completado' | 'pendiente' | 'liquidado' | 'en_proceso';
  operator: string;
  notes?: string;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
}

export interface DashboardStats {
  kilosReceived: number;
  boxesPacked: number;
  coldStorageStock: number;
  millStock: number;
  alerts: { id: number; type: string; message: string }[];
}

export interface Settlement {
  id: number;
  folio: string;
  producer_id: number;
  producer_name: string;
  date: string;
  batches_count: number;
  total_kg: number;
  subtotal: number;
  scale_fees: number;
  deductions: number;
  total_paid: number;
  status: 'pagado' | 'pendiente' | 'programado';
  payment_method: 'Transferencia' | 'Cheque' | 'Efectivo';
}

