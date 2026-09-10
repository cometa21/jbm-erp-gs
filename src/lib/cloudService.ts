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
import type { 
  Producer, 
  Batch, 
  InventoryItem, 
  ProductionRecord, 
  DiscardReportRow, 
  POSSale 
} from '../types';

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

// Collection references matching firebase-blueprint.json
export const COLLECTIONS = {
  BATCHES: 'batches',
  PRODUCERS: 'producers',
  INVENTORY: 'inventory',
  SALES: 'sales',
  POS_SALES: 'pos_sales',
  PRODUCTION_RUNS: 'production_runs',
  PRODUCTION_DISCARDS: 'production_discards',
  SETTLEMENTS: 'settlements',
  SETTINGS: 'company_settings'
} as const;

export interface FirestoreRealtimeMetrics {
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
  activeInventory: {
    totalSkusCount: number;
    totalStockUnits: number;
    itemsAboveMin: number;
    lowStockCount: number;
    criticalStockCount: number;
    inventoryValuationMxn: number;
    lastUpdated: string;
  };
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

// ==========================================
// 1. RECEPCIÓN (BATCHES & PRODUCERS)
// ==========================================

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

export async function saveCloudBatch(batchData: Partial<Batch>): Promise<string> {
  try {
    const docId = batchData.folio ? batchData.folio.replace(/[^a-zA-Z0-9_-]/g, '_') : (batchData.id ? `BATCH_${batchData.id}` : `BATCH_${Date.now()}`);
    const docRef = doc(db, COLLECTIONS.BATCHES, docId);
    await setDoc(docRef, {
      ...batchData,
      folio: batchData.folio || docId,
      updatedAt: serverTimestamp(),
      syncedAt: new Date().toISOString()
    }, { merge: true });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.BATCHES);
    throw error;
  }
}

export async function deleteCloudBatch(folioOrId: string | number): Promise<void> {
  try {
    const docId = String(folioOrId).replace(/[^a-zA-Z0-9_-]/g, '_');
    await deleteDoc(doc(db, COLLECTIONS.BATCHES, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.BATCHES);
  }
}

export function subscribeToBatches(callback: (batches: Batch[]) => void) {
  const q = query(collection(db, COLLECTIONS.BATCHES), orderBy('date', 'desc'), limit(150));
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

// ==========================================
// 2. PRODUCCIÓN (RUNS & DISCARDS)
// ==========================================

export async function getCloudProductionRuns(): Promise<ProductionRecord[]> {
  try {
    const q = query(collection(db, COLLECTIONS.PRODUCTION_RUNS), orderBy('date', 'desc'), limit(200));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        batch_id: Number(data.batch_id || 1),
        batch_folio: data.batch_folio || '',
        producer_name: data.producer_name || '',
        orchard: data.orchard || '',
        calibre: data.calibre || 'V-XX',
        color: data.color || 'verde',
        quality: data.quality || 'primera',
        presentation_id: data.presentation_id || null,
        presentation_name: data.presentation_name || 'Caja JBM Export 18 kg (40 lbs)',
        boxes_count: Number(data.boxes_count || 0),
        weight_total_kg: Number(data.weight_total_kg || 0),
        destination: data.destination || 'piso_empaque',
        operator: data.operator || 'Carlos Barragán',
        cost_total: Number(data.cost_total || 0),
        cost_per_box: Number(data.cost_per_box || 0),
        date: data.date || new Date().toISOString(),
        notes: data.notes || ''
      } as ProductionRecord;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTIONS.PRODUCTION_RUNS);
    return [];
  }
}

export async function saveCloudProductionRun(runData: Partial<ProductionRecord>): Promise<string> {
  try {
    const docId = runData.id ? `RUN_${runData.id}` : `RUN_${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.PRODUCTION_RUNS, docId);
    await setDoc(docRef, {
      ...runData,
      id: runData.id || Date.now(),
      updatedAt: serverTimestamp(),
      syncedAt: new Date().toISOString()
    }, { merge: true });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PRODUCTION_RUNS);
    throw error;
  }
}

export function subscribeToCloudProductionRuns(callback: (runs: ProductionRecord[]) => void) {
  const q = query(collection(db, COLLECTIONS.PRODUCTION_RUNS), orderBy('date', 'desc'), limit(200));
  return onSnapshot(q, (snapshot) => {
    const runs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        batch_id: Number(data.batch_id || 1),
        batch_folio: data.batch_folio || '',
        producer_name: data.producer_name || '',
        orchard: data.orchard || '',
        calibre: data.calibre || 'V-XX',
        color: data.color || 'verde',
        quality: data.quality || 'primera',
        presentation_id: data.presentation_id || null,
        presentation_name: data.presentation_name || 'Caja JBM Export 18 kg',
        boxes_count: Number(data.boxes_count || 0),
        weight_total_kg: Number(data.weight_total_kg || 0),
        destination: data.destination || 'piso_empaque',
        operator: data.operator || 'Carlos Barragán',
        cost_total: Number(data.cost_total || 0),
        cost_per_box: Number(data.cost_per_box || 0),
        date: data.date || new Date().toISOString(),
        notes: data.notes || ''
      } as ProductionRecord;
    });
    callback(runs);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, COLLECTIONS.PRODUCTION_RUNS);
  });
}

export async function getCloudDiscards(): Promise<DiscardReportRow[]> {
  try {
    const q = query(collection(db, COLLECTIONS.PRODUCTION_DISCARDS), orderBy('date', 'desc'), limit(150));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        batch_id: data.batch_id,
        type: data.type || 'Merma en selección',
        kg: Number(data.kg || 0),
        impact_percent: Number(data.impact_percent || 0),
        trend: data.trend || 'Estable',
        date: data.date || new Date().toISOString(),
        notes: data.notes || ''
      } as DiscardReportRow;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTIONS.PRODUCTION_DISCARDS);
    return [];
  }
}

export async function saveCloudDiscard(discardData: Partial<DiscardReportRow>): Promise<string> {
  try {
    const docId = discardData.id ? `DISC_${discardData.id}` : `DISC_${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.PRODUCTION_DISCARDS, docId);
    await setDoc(docRef, {
      ...discardData,
      id: discardData.id || Date.now(),
      updatedAt: serverTimestamp(),
      syncedAt: new Date().toISOString()
    }, { merge: true });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PRODUCTION_DISCARDS);
    throw error;
  }
}

// ==========================================
// 3. VENTAS (POS_SALES & GENERAL SALES)
// ==========================================

export async function getCloudPOSSales(): Promise<POSSale[]> {
  try {
    const q = query(collection(db, COLLECTIONS.POS_SALES), orderBy('date', 'desc'), limit(200));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        folio: data.folio || doc.id,
        customer_type: data.customer_type || 'mostrador',
        customer_name: data.customer_name || 'Venta Mostrador',
        customer_phone: data.customer_phone || '',
        customer_rfc: data.customer_rfc || '',
        items_json: data.items_json || (data.items ? JSON.stringify(data.items) : '[]'),
        items: data.items || (data.items_json ? JSON.parse(data.items_json) : []),
        subtotal: Number(data.subtotal || data.total || 0),
        discount_type: data.discount_type || 'none',
        discount_percent: Number(data.discount_percent || 0),
        discount_amount: Number(data.discount_amount || 0),
        discount_reason: data.discount_reason || '',
        discount_authorized_by: data.discount_authorized_by || '',
        tax_amount: Number(data.tax_amount || 0),
        total: Number(data.total || 0),
        payment_method: data.payment_method || 'Efectivo',
        cash_received: Number(data.cash_received || data.total || 0),
        cash_change: Number(data.cash_change || 0),
        payment_reference: data.payment_reference || '',
        status: data.status || 'completada',
        operator: data.operator || 'Ventas CDMX',
        shift_id: data.shift_id,
        date: data.date || new Date().toISOString(),
        notes: data.notes || '',
        invoice_requested: data.invoice_requested ? 1 : 0
      } as POSSale;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTIONS.POS_SALES);
    return [];
  }
}

export async function saveCloudPOSSale(saleData: Partial<POSSale>): Promise<string> {
  try {
    const docId = saleData.folio ? saleData.folio.replace(/[^a-zA-Z0-9_-]/g, '_') : (saleData.id ? `SALE_${saleData.id}` : `SALE_${Date.now()}`);
    const docRef = doc(db, COLLECTIONS.POS_SALES, docId);
    
    // Save to pos_sales
    await setDoc(docRef, {
      ...saleData,
      folio: saleData.folio || docId,
      updatedAt: serverTimestamp(),
      syncedAt: new Date().toISOString()
    }, { merge: true });

    // Also mirror to general sales collection for unified analytics
    const salesMirrorRef = doc(db, COLLECTIONS.SALES, docId);
    await setDoc(salesMirrorRef, {
      id: saleData.id || docId,
      folio: saleData.folio || docId,
      customer_name: saleData.customer_name || 'Venta Mostrador',
      total: Number(saleData.total || 0),
      subtotal: Number(saleData.subtotal || saleData.total || 0),
      tax: Number(saleData.tax_amount || 0),
      payment_method: saleData.payment_method || 'Efectivo',
      date: saleData.date || new Date().toISOString(),
      items_count: Array.isArray((saleData as any).items) ? (saleData as any).items.length : 1,
      status: saleData.status || 'completada',
      syncedAt: new Date().toISOString()
    }, { merge: true });

    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.POS_SALES);
    throw error;
  }
}

export function subscribeToCloudPOSSales(callback: (sales: POSSale[]) => void) {
  const q = query(collection(db, COLLECTIONS.POS_SALES), orderBy('date', 'desc'), limit(200));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: (data.id || doc.id) as any,
        folio: data.folio || doc.id,
        customer_type: data.customer_type || 'mostrador',
        customer_name: data.customer_name || 'Venta Mostrador',
        customer_phone: data.customer_phone || '',
        customer_rfc: data.customer_rfc || '',
        items_json: data.items_json || (data.items ? JSON.stringify(data.items) : '[]'),
        items: data.items || (data.items_json ? JSON.parse(data.items_json) : []),
        subtotal: Number(data.subtotal || data.total || 0),
        discount_type: data.discount_type || 'none',
        discount_percent: Number(data.discount_percent || 0),
        discount_amount: Number(data.discount_amount || 0),
        discount_reason: data.discount_reason || '',
        discount_authorized_by: data.discount_authorized_by || '',
        tax_amount: Number(data.tax_amount || 0),
        total: Number(data.total || 0),
        payment_method: data.payment_method || 'Efectivo',
        cash_received: Number(data.cash_received || data.total || 0),
        cash_change: Number(data.cash_change || 0),
        payment_reference: data.payment_reference || '',
        status: data.status || 'completada',
        operator: data.operator || 'Ventas CDMX',
        shift_id: data.shift_id,
        date: data.date || new Date().toISOString(),
        notes: data.notes || '',
        invoice_requested: data.invoice_requested ? 1 : 0
      } as POSSale;
    });
    callback(sales);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, COLLECTIONS.POS_SALES);
  });
}

// ==========================================
// 4. INVENTARIO & ALMACÉN
// ==========================================

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

// ==========================================
// 5. INITIALIZATION & SYNC ENGINE
// ==========================================

/**
 * Seeds or syncs data to Firestore if empty or on demand
 */
export async function syncLocalDataToFirestore(): Promise<{ batchesSynced: number; inventorySynced: number; salesSynced: number; productionSynced: number }> {
  try {
    const [batchesRes, invRes, salesRes, prodRes, discardsRes] = await Promise.all([
      fetch('/api/batches').then(r => r.ok ? r.json() : []),
      fetch('/api/inventory').then(r => r.ok ? r.json() : []),
      fetch('/api/pos/sales').then(r => r.ok ? r.json() : fetch('/api/sales').then(r => r.ok ? r.json() : [])),
      fetch('/api/production').then(r => r.ok ? r.json() : []),
      fetch('/api/production/discards').then(r => r.ok ? r.json() : [])
    ]);

    let batchesSynced = 0;
    if (Array.isArray(batchesRes) && batchesRes.length > 0) {
      for (const b of batchesRes) {
        const docId = b.folio ? b.folio.replace(/[^a-zA-Z0-9_-]/g, '_') : `BATCH_${b.id}`;
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
        const docId = item.sku ? item.sku.replace(/[^a-zA-Z0-9_-]/g, '_') : `INV_${item.id}`;
        await setDoc(doc(db, COLLECTIONS.INVENTORY, docId), {
          ...item,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        inventorySynced++;
      }
    }

    let salesSynced = 0;
    if (Array.isArray(salesRes) && salesRes.length > 0) {
      for (const sale of salesRes) {
        const docId = sale.folio ? sale.folio.replace(/[^a-zA-Z0-9_-]/g, '_') : `SALE_${sale.id}`;
        await setDoc(doc(db, COLLECTIONS.POS_SALES, docId), {
          ...sale,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        await setDoc(doc(db, COLLECTIONS.SALES, docId), {
          ...sale,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        salesSynced++;
      }
    }

    let productionSynced = 0;
    if (Array.isArray(prodRes) && prodRes.length > 0) {
      for (const run of prodRes) {
        const docId = `RUN_${run.id || Date.now()}`;
        await setDoc(doc(db, COLLECTIONS.PRODUCTION_RUNS, docId), {
          ...run,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        productionSynced++;
      }
    }

    if (Array.isArray(discardsRes) && discardsRes.length > 0) {
      for (const disc of discardsRes) {
        const docId = `DISC_${disc.id || Date.now()}`;
        await setDoc(doc(db, COLLECTIONS.PRODUCTION_DISCARDS, docId), {
          ...disc,
          syncedAt: new Date().toISOString()
        }, { merge: true });
      }
    }

    return { batchesSynced, inventorySynced, salesSynced, productionSynced };
  } catch (error) {
    console.error('Error syncing local data to Firestore:', error);
    throw error;
  }
}

/**
 * Initializes Firestore persistence by ensuring baseline data is present if collections are empty.
 */
let isInitRunning = false;
export async function ensureFirestoreInitialized(): Promise<boolean> {
  if (isInitRunning) return true;
  isInitRunning = true;
  try {
    const isOnline = await testFirestoreConnection();
    if (!isOnline) {
      console.info('Firestore offline or connecting, proceeding in client mode.');
      isInitRunning = false;
      return false;
    }

    // Check if batches collection has documents
    const batchesSnap = await getDocs(query(collection(db, COLLECTIONS.BATCHES), limit(1)));
    if (batchesSnap.empty) {
      console.info('Firestore collections are fresh. Performing initial ERP seed from API endpoints...');
      await syncLocalDataToFirestore();
      console.info('Firestore initial seed completed successfully.');
    }
    isInitRunning = false;
    return true;
  } catch (err) {
    console.warn('ensureFirestoreInitialized notice:', err);
    isInitRunning = false;
    return false;
  }
}
