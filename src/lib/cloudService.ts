import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import type { Producer, Batch, InventoryItem, Settlement } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

/**
 * Validates connection to Cloud Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_health'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info("Firestore client is in offline persistence mode.");
    }
    return false;
  }
}

// Collection references
export const COLLECTIONS = {
  BATCHES: 'batches',
  PRODUCERS: 'producers',
  INVENTORY: 'inventory',
  SALES: 'sales',
  POS_SALES: 'pos_sales',
  PRODUCTION_RUNS: 'production_runs',
  SETTLEMENTS: 'settlements',
  SETTINGS: 'company_settings'
} as const;

export interface FirestoreRealtimeMetrics {
  // 1. Tonelaje Total de Cítricos Recibidos
  citrusReceived: {
    totalTons: number;
    totalNetKg: number;
    batchesCount: number;
    todayTons: number;
    todayKg: number;
    todayBatchesCount: number;
    avgBatchWeightKg: number;
    lastUpdated: string;
  };
  // 2. Recuento de Inventario Activo
  activeInventory: {
    totalSkusCount: number;
    totalStockUnits: number;
    itemsAboveMin: number;
    lowStockCount: number;
    criticalStockCount: number;
    inventoryValuationMxn: number;
    lastUpdated: string;
  };
  // 3. Totales de Ventas Diarias
  dailySales: {
    todaySalesTotalMxn: number;
    todayTransactionsCount: number;
    avgTicketMxn: number;
    cashSalesMxn: number;
    transferCardSalesMxn: number;
    totalBoxesSoldToday: number;
    lastUpdated: string;
  };
  isLive: boolean;
  source: 'firestore_live' | 'syncing' | 'local_fallback';
}

/**
 * Sync / Bridge helper to read and write cloud data to Firestore
 */
export async function getCloudBatches(): Promise<Batch[]> {
  try {
    const q = query(collection(db, COLLECTIONS.BATCHES), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        folio: data.folio || doc.id,
        scale_ticket_folio: data.scale_ticket_folio || '',
        producer_id: data.producer_id || null,
        producer_name: data.producer_name || 'SIN ASIGNAR',
        date: data.date || new Date().toISOString(),
        origin: data.origin || 'Cosecha propia',
        orchard: data.orchard || 'Pedernales',
        variety: data.variety || 'Limón Mexicano',
        quality: data.quality || 'Estándar',
        weight_gross: Number(data.weight_gross || 0),
        weight_tare: Number(data.weight_tare || 0),
        weight_net: Number(data.weight_net || 0),
        price_per_kg: Number(data.price_per_kg || 18.50),
        subtotal: Number(data.subtotal || 0),
        scale_fee: Number(data.scale_fee || 50.00),
        scale_fee_payment: data.scale_fee_payment || 'descuento',
        extra_charge_per_kg: Number(data.extra_charge_per_kg || 0.40),
        extra_charge_total: Number(data.extra_charge_total || 0),
        extra_charge_concept: data.extra_charge_concept || 'Servicios operativos y maniobra',
        total: Number(data.total || 0),
        status: data.status || 'completado',
        operator: data.operator || 'Carlos Barragán',
        notes: data.notes || ''
      } as Batch;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTIONS.BATCHES);
    return [];
  }
}

/**
 * Save a batch directly into Cloud Firestore
 */
export async function saveCloudBatch(batchData: Partial<Batch>): Promise<string> {
  try {
    const colRef = collection(db, COLLECTIONS.BATCHES);
    const docRef = await addDoc(colRef, {
      ...batchData,
      createdAt: serverTimestamp(),
      syncedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.BATCHES);
    throw error;
  }
}

/**
 * Real-time listener for batches
 */
export function subscribeToBatches(callback: (batches: Batch[]) => void) {
  const q = query(collection(db, COLLECTIONS.BATCHES), orderBy('date', 'desc'), limit(100));
  return onSnapshot(q, (snapshot) => {
    const batches = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        folio: data.folio || doc.id,
        scale_ticket_folio: data.scale_ticket_folio || '',
        producer_id: data.producer_id || null,
        producer_name: data.producer_name || 'SIN ASIGNAR',
        date: data.date || new Date().toISOString(),
        origin: data.origin || 'Cosecha propia',
        orchard: data.orchard || 'Pedernales',
        variety: data.variety || 'Limón Mexicano',
        quality: data.quality || 'Estándar',
        weight_gross: Number(data.weight_gross || 0),
        weight_tare: Number(data.weight_tare || 0),
        weight_net: Number(data.weight_net || 0),
        price_per_kg: Number(data.price_per_kg || 18.50),
        subtotal: Number(data.subtotal || 0),
        scale_fee: Number(data.scale_fee || 50.00),
        scale_fee_payment: data.scale_fee_payment || 'descuento',
        extra_charge_per_kg: Number(data.extra_charge_per_kg || 0.40),
        extra_charge_total: Number(data.extra_charge_total || 0),
        extra_charge_concept: data.extra_charge_concept || 'Servicios operativos y maniobra',
        total: Number(data.total || 0),
        status: data.status || 'completado',
        operator: data.operator || 'Carlos Barragán',
        notes: data.notes || ''
      } as Batch;
    });
    callback(batches);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, COLLECTIONS.BATCHES);
  });
}

/**
 * Real-time listener for Inventory in Firestore
 */
export function subscribeToCloudInventory(callback: (items: InventoryItem[]) => void) {
  const q = query(collection(db, COLLECTIONS.INVENTORY));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        item_name: data.item_name || 'Insumo',
        category: data.category || 'Empaque',
        quantity: Number(data.quantity || 0),
        unit: data.unit || 'pza',
        min_stock: Number(data.min_stock || 100),
        critical_stock: Number(data.critical_stock || 50),
        cost_unit: Number(data.cost_unit || 0),
        supplier: data.supplier || '',
        sku: data.sku || '',
        lead_time_days: Number(data.lead_time_days || 3),
        last_restock_date: data.last_restock_date || new Date().toISOString()
      } as InventoryItem;
    });
    callback(items);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, COLLECTIONS.INVENTORY);
  });
}

export interface CloudSaleRecord {
  id: string | number;
  folio?: string;
  customer_name?: string;
  items_count?: number;
  total: number;
  subtotal?: number;
  tax?: number;
  payment_method?: string;
  date: string;
}

/**
 * Real-time listener for Sales in Firestore
 */
export function subscribeToCloudSales(callback: (sales: CloudSaleRecord[]) => void) {
  const q = query(collection(db, COLLECTIONS.SALES), orderBy('date', 'desc'), limit(150));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
        folio: data.folio || `V-${doc.id.slice(0, 6)}`,
        customer_name: data.customer_name || 'Cliente Mostrador',
        items_count: Number(data.items_count || 1),
        total: Number(data.total || 0),
        subtotal: Number(data.subtotal || data.total || 0),
        tax: Number(data.tax || 0),
        payment_method: data.payment_method || 'Efectivo',
        date: data.date || new Date().toISOString()
      } as CloudSaleRecord;
    });
    callback(sales);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, COLLECTIONS.SALES);
  });
}

/**
 * Seeds or syncs data to Firestore if empty or on demand
 */
export async function syncLocalDataToFirestore(): Promise<{ batchesSynced: number; inventorySynced: number; salesSynced: number }> {
  try {
    const [batchesRes, invRes, salesRes] = await Promise.all([
      fetch('/api/batches').then(r => r.ok ? r.json() : []),
      fetch('/api/inventory').then(r => r.ok ? r.json() : []),
      fetch('/api/sales').then(r => r.ok ? r.json() : [])
    ]);

    let batchesSynced = 0;
    if (Array.isArray(batchesRes) && batchesRes.length > 0) {
      for (const b of batchesRes.slice(0, 25)) {
        const docId = b.folio || `BATCH-${b.id}`;
        await setDoc(doc(db, COLLECTIONS.BATCHES, docId), {
          ...b,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        batchesSynced++;
      }
    }

    let inventorySynced = 0;
    if (Array.isArray(invRes) && invRes.length > 0) {
      for (const item of invRes) {
        const docId = item.sku || `INV-${item.id}`;
        await setDoc(doc(db, COLLECTIONS.INVENTORY, docId), {
          ...item,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        inventorySynced++;
      }
    }

    let salesSynced = 0;
    if (Array.isArray(salesRes) && salesRes.length > 0) {
      for (const sale of salesRes.slice(0, 30)) {
        const docId = sale.folio || `SALE-${sale.id}`;
        await setDoc(doc(db, COLLECTIONS.SALES, docId), {
          ...sale,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        salesSynced++;
      }
    }

    return { batchesSynced, inventorySynced, salesSynced };
  } catch (error) {
    console.error('Error syncing local data to Firestore:', error);
    throw error;
  }
}

