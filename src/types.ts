export interface Producer {
  id: number;
  name: string;
  location: string;
  balance: number;
}

export interface Batch {
  id: number;
  producer_id: number;
  producer_name: string;
  date: string;
  weight_gross: number;
  weight_tare: number;
  weight_net: number;
  status: string;
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
