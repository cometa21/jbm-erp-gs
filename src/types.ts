export interface Producer {
  id: number;
  name: string;
  location: string;
  balance: number;
  rfc?: string;
  phone?: string;
  email?: string;
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

// ==========================================
// POS CDMX MODULE TYPES
// ==========================================

export type POSUserRole = 'admin' | 'ventas' | 'almacen' | 'finanzas';
export type POSTabType = 'ventas' | 'historial' | 'analisis' | 'recepciones' | 'inventario' | 'corte_caja' | 'gastos' | 'rentabilidad';

export interface POSDailySalesPoint {
  date: string;
  label: string;
  dayOfWeek: string;
  totalRevenue: number;
  totalBoxes: number;
  totalKg: number;
  ticketCount: number;
  cashRevenue: number;
  bankRevenue: number;
  creditRevenue: number;
  avgTicketValue: number;
}

export interface POSTopProductItem {
  id: string;
  name: string;
  calibre: string;
  itemType: 'caja' | 'granel';
  boxesSold: number;
  kgSold: number;
  revenue: number;
  orderCount: number;
  avgPrice: number;
  volumePercent: number;
  revenuePercent: number;
  color?: string;
}

export interface POSCustomerTypeMetric {
  type: string;
  label: string;
  revenue: number;
  boxes: number;
  kg: number;
  count: number;
  percentage: number;
}

export interface POSPaymentMethodMetric {
  method: string;
  label: string;
  revenue: number;
  count: number;
  percentage: number;
}

export interface POSHourlySalesMetric {
  hour: string;
  label: string;
  revenue: number;
  boxes: number;
  tickets: number;
}

export interface POSAnalyticsData {
  dailySales: POSDailySalesPoint[];
  topProducts: POSTopProductItem[];
  customerTypes: POSCustomerTypeMetric[];
  paymentMethods: POSPaymentMethodMetric[];
  hourlySales: POSHourlySalesMetric[];
  summary: {
    totalRevenue: number;
    totalBoxes: number;
    totalKg: number;
    totalTickets: number;
    avgTicket: number;
    peakDay: { date: string; label: string; boxes: number; revenue: number };
    topProduct: { name: string; boxes: number; revenue: number; share: number };
    avgBoxesPerDay: number;
    avgRevenuePerDay: number;
  };
}

export interface POSTransferItem {
  presentation_id: string;
  presentation_name: string;
  calibre: string;
  quality?: string;
  boxes_sent: number;
  kg_per_box: number;
  total_kg_sent: number;
  cost_unit_kg: number;
  default_sale_price_kg?: number;
  default_sale_price_box?: number;
}

export interface POSTransferReceivedItem extends POSTransferItem {
  boxes_received: number;
  total_kg_received: number;
  discrepancy_boxes: number;
  discrepancy_kg: number;
  sale_price_kg: number;
  sale_price_box: number;
}

export interface POSTransfer {
  id: number;
  folio: string;
  origin: string;
  destination_bodega: string;
  driver_name: string;
  driver_license?: string;
  plates_truck: string;
  departure_date: string;
  arrival_date?: string;
  status: 'en_transito' | 'recibido' | 'con_discrepancia';
  thermograph_temp: number;
  items_json: string;
  items_received_json?: string;
  discrepancy_notes?: string;
  evidence_photo_url?: string;
  operator_departure: string;
  operator_reception?: string;
  reception_date?: string;
  notes?: string;
  items: POSTransferItem[];
  items_received?: POSTransferReceivedItem[];
}

export interface POSInventoryItem {
  id: number;
  item_type: 'caja' | 'granel';
  presentation_name: string;
  calibre: string;
  quality: string;
  lot_code: string;
  barcode?: string;
  sku?: string;
  boxes_stock: number;
  kg_per_box: number;
  kg_stock: number;
  base_cost_per_kg: number;
  min_price_per_unit: number;
  default_sale_price: number;
  status: 'disponible' | 'bajo_stock' | 'agotado';
  received_date: string;
  notes?: string;
  costPerUnit?: number;
  marginAmount?: number;
  marginPercent?: number;
}

export interface POSCartItem {
  inventory_id: number;
  name: string;
  item_type: 'caja' | 'granel';
  calibre: string;
  lot_code: string;
  barcode?: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  cost_unit_kg: number;
  kg_total: number;
  min_price_per_unit: number;
  // Item-level discounts
  discount_type?: 'none' | 'percent' | 'amount';
  discount_value?: number;
  discount_amount?: number;
  discount_reason?: string;
  discount_authorized_by?: string;
  original_price?: number;
}

export interface POSSale {
  id: number;
  folio: string;
  customer_type: 'mostrador' | 'mayorista' | 'taqueria' | 'fruteria' | 'restaurante';
  customer_name: string;
  customer_phone?: string;
  customer_rfc?: string;
  items_json: string;
  subtotal: number;
  discount_type?: 'none' | 'percent' | 'amount';
  discount_percent: number;
  discount_amount: number;
  discount_reason?: string;
  discount_authorized_by?: string;
  tax_amount: number;
  total: number;
  payment_method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto' | 'Credito';
  cash_received: number;
  cash_change: number;
  payment_reference?: string;
  status: 'completada' | 'cancelada';
  operator: string;
  shift_id?: number;
  date: string;
  notes?: string;
  invoice_requested: number;
  items: POSCartItem[];
}

export interface POSLocalExpense {
  id: number;
  folio: string;
  date: string;
  concept: string;
  category: 'Maniobra y Descarga' | 'Combustible y Flete Local' | 'Alimentos Personal' | 'Empaque y Cintas' | 'Mantenimiento y Servicios' | 'Renta y Servicios' | 'Otros';
  amount: number;
  payment_source: 'caja_efectivo' | 'transferencia_banco';
  supplier?: string;
  invoice_folio?: string;
  receipt_image_url?: string;
  operator: string;
  ocr_data_json?: string;
  notes?: string;
}

export interface POSCashCut {
  id: number;
  folio: string;
  date: string;
  shift: 'Matutino' | 'Vespertino' | 'Nocturno';
  operator: string;
  initial_fund: number;
  declared_cash: number;
  calculated_cash: number;
  difference: number;
  status: 'cuadrado' | 'sobrante' | 'faltante';
  total_sales_amount: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_transfer_sales: number;
  total_credit_sales: number;
  total_local_expenses_cash: number;
  total_boxes_sold: number;
  total_kg_granel_sold: number;
  denominations_json?: string;
  denominations?: Record<string, number>;
  notes?: string;
}

export interface POSProfitabilityData {
  totalGrossRevenue: number;
  totalFruitBaseCost: number;
  totalFreightCost: number;
  totalCostOfGoods: number;
  totalLocalExpenses: number;
  grossMargin: number;
  grossMarginPercent: number;
  netProfit: number;
  netMarginPercent: number;
  roi: number;
  totalKgSold: number;
  totalBoxesSold: number;
  avgSalePricePerKg: number;
  avgCostPerKg: number;
  salesByCalibre: Record<string, { revenue: number; kg: number; cost: number; profit: number }>;
  expensesByCategory: Record<string, number>;
}

export interface SalesReportFilter {
  period: '7d' | '30d' | 'this_month' | 'last_month' | 'custom';
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  customerType?: string;
  search?: string;
}

export interface SalesReportData {
  period?: string;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  generatedDate: string;
  generatedBy?: string;
  totalRevenue: number;
  totalKgSold: number;
  totalBoxesSold: number;
  totalTickets: number;
  avgTicketValue: number;
  totalDiscounts: number;
  summary?: {
    totalRevenue: number;
    totalKg: number;
    totalBoxes: number;
    totalTransactions: number;
    avgTicket: number;
    totalDiscounts: number;
    cashRevenue: number;
    bankRevenue: number;
    cardRevenue: number;
    creditRevenue: number;
  };
  dailySales: {
    date: string;
    label: string;
    dayOfWeek?: string;
    revenue?: number;
    totalAmount?: number;
    totalKg: number;
    totalBoxes: number;
    ticketCount?: number;
    transactionsCount?: number;
    avgTicket: number;
    discountsGiven?: number;
    cashAmount?: number;
    transferAmount?: number;
    cardAmount?: number;
    creditAmount?: number;
  }[];
  salesList?: POSSale[];
  topProducts: {
    name: string;
    calibre?: string;
    itemType?: string;
    boxesSold: number;
    kgSold: number;
    revenue: number;
    share?: number;
    volumePercent: number;
  }[];
  paymentMethods: {
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  customerTypes: {
    type: string;
    label: string;
    revenue: number;
    boxes: number;
    kg: number;
    count: number;
    percentage: number;
  }[];
}

export interface MonthlyBalanceData {
  monthName: string;
  year: number;
  periodLabel: string;
  folio: string;
  generatedDate: string;
  generatedBy?: string;
  // Income (Ingresos)
  citrusSalesRevenue: number; // Ventas de fruta / mostrador / mayoristas
  scaleServicesRevenue: number; // Servicios de pesaje báscula a terceros
  subproductsRevenue: number; // Merma / Molino / Subproductos
  totalIncome: number;
  
  // Cost of Goods Sold (Costo de Materia Prima)
  fruitAcquisitionCost: number; // Liquidaciones de fruta pagadas a productores
  totalFruitKgPurchased: number;
  avgFruitCostPerKg: number;
  totalGrossProfit: number; // Ingresos Totales - Costo Fruta
  grossMarginPercent: number;

  // Operating Expenses (Gastos de Operación)
  maneuverAndTolvaExpenses: number; // Maniobra y descarga ($0.40/kg)
  localAndFreightExpenses: number; // Combustible, Fletes y Transporte
  payrollAndStaffExpenses: number; // Nómina operativa y alimentos
  suppliesAndPackagingExpenses: number; // Insumos, Cajas, Tarimas
  maintenanceAndUtilitiesExpenses: number; // Energía cámaras frías, mantenimiento
  otherExpenses: number;
  totalOperatingExpenses: number;

  // Net Operating Income (Utilidad Neta de Operación)
  netOperatingIncome: number;
  netMarginPercent: number;

  // Working Capital & Balance Sheet Reconciliation
  producersPayablesBalance: number; // Cuentas por pagar a productores
  cashInHandAndBank: number; // Saldo disponible en caja y bancos
  inventoryValuation: number; // Valoración de existencias en frío/piso
  
  // Detailed breakdowns
  settlementsBreakdown?: Settlement[];
  expensesBreakdown?: POSLocalExpense[];
  batchesCount?: number;
  producersCount?: number;
}


