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
  category: string;
  quantity: number;
  unit: string;
  min_stock: number;
  critical_stock?: number;
  cost_unit?: number;
  supplier?: string;
  sku?: string;
  lead_time_days?: number;
  last_restock_date?: string;
}

export interface InventoryLog {
  id: number;
  item_id?: number;
  item_name: string;
  type: 'Entrada' | 'Salida' | 'Ajuste' | 'Merma';
  qty: number;
  prev_qty?: number;
  new_qty?: number;
  reason?: string;
  user: string;
  date: string;
}

export interface DashboardStats {
  kilosReceived: number;
  boxesPacked: number;
  coldStorageStock: number;
  millStock: number;
  alerts: { id: number; type: string; message: string }[];
}

export interface ProductionRecord {
  id: number;
  batch_id: number;
  batch_folio?: string;
  producer_name?: string;
  orchard?: string;
  calibre: string;
  color: 'verde' | 'alimonado' | 'amarillo';
  quality: 'primera' | 'segunda' | 'industria';
  presentation_id?: string | null;
  presentation_name?: string;
  boxes_count: number;
  weight_total_kg: number;
  destination: 'piso_empaque' | 'camara_fria' | 'transporte_directo' | 'molino';
  operator: string;
  cost_total?: number;
  cost_per_box?: number;
  date: string;
  notes?: string;
}

export interface ProductionPresentation {
  id: string;
  name: string;
  weight_kg: number;
  box_type: string;
}

export interface DiscardReportRow {
  id: number;
  batch_id?: number;
  type: string;
  kg: number;
  impact_percent: number;
  trend: 'Alza' | 'Baja' | 'Estable';
  date: string;
  notes?: string;
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

export interface Pallet {
  id: number;
  pallet_number: string;
  batch_id: number;
  batch_folio?: string;
  producer_name?: string;
  orchard?: string;
  calibre: string;
  color: 'verde' | 'alimonado' | 'amarillo';
  quality: string;
  presentation_name?: string;
  boxes_count: number;
  weight_kg: number;
  location_zone: string; // e.g. 'A1', 'A2', 'B1', 'B2', 'C1', 'Piso Empaque'
  status: 'en_camara' | 'en_piso' | 'en_transito' | 'entregado';
  packed_date: string;
  operator: string;
  treatment?: string;
  notes?: string;
}

export interface Shipment {
  id: number;
  folio: string;
  destination: string;
  client_name?: string;
  carrier_name: string;
  driver_name: string;
  driver_license: string;
  plates_truck: string;
  plates_trailer?: string;
  thermograph_id?: string;
  seal_number?: string;
  total_pallets: number;
  total_boxes: number;
  total_kg: number;
  status: 'preparando' | 'en_transito' | 'entregado' | 'cancelado';
  departure_date: string;
  eta: string;
  temp_celsius: number;
  operator?: string;
  notes?: string;
  pallets?: Pallet[];
}

export type SearchCategory = 'all' | 'tickets' | 'batches' | 'clients' | 'supplies';

export interface SearchMetric {
  label: string;
  value: string;
}

export interface SearchResultItem {
  id: string;
  category: 'tickets' | 'batches' | 'clients' | 'supplies';
  type: 'ticket' | 'production_run' | 'pallet' | 'producer' | 'customer' | 'shipment_client' | 'supply';
  title: string;
  subtitle: string;
  code: string;
  date?: string;
  badge: {
    text: string;
    variant: 'emerald' | 'amber' | 'blue' | 'indigo' | 'purple' | 'rose' | 'slate';
  };
  metrics?: SearchMetric[];
  route: string;
  rawData: any;
}

export interface SearchApiResponse {
  query: string;
  count: number;
  results: SearchResultItem[];
}

