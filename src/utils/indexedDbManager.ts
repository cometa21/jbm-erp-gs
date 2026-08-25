/**
 * JBM Cítricos - Gestor Avanzado de Persistencia Local con IndexedDB
 * 
 * Garantiza integridad total de datos de pesajes, boletas de báscula,
 * catálogo de productores y auditoría operativa durante cortes prolongados
 * de internet o reinicios del navegador/sistema.
 */

import type { Batch, Producer } from '../types';
import { saveCloudBatch } from '../lib/cloudService';

export interface OfflineBatchRecord {
  tempId: string;
  created_at: string;
  scale_ticket_folio?: string;
  producer_id: number | null;
  producer_name?: string;
  origin: string;
  orchard: string;
  variety: string;
  weight_gross: number;
  weight_tare: number;
  weight_net: number;
  price_per_kg: number;
  subtotal: number;
  scale_fee: number;
  scale_fee_payment: 'descuento' | 'efectivo';
  extra_charge_per_kg: number;
  extra_charge_total: number;
  extra_charge_concept: string;
  total: number;
  operator: string;
  notes: string;
  sync_status: 'pending' | 'syncing' | 'failed' | 'synced';
  error_message?: string;
  sync_attempts?: number;
  last_attempt?: string;
  server_id?: number | string;
}

export interface OfflineAuditLog {
  id: string;
  timestamp: string;
  event: 'created_offline' | 'sync_success' | 'sync_error' | 'manual_export' | 'cache_updated' | 'retry_sync';
  description: string;
  details?: any;
  operator?: string;
}

const DB_NAME = 'JBM_Citricos_Scale_DB_v2';
const DB_VERSION = 1;

// Object Stores
export const STORES = {
  PENDING_QUEUE: 'scale_pending_queue',
  HISTORICAL_CACHE: 'historical_batches_cache',
  PRODUCERS_CACHE: 'producers_offline_cache',
  AUDIT_LOGS: 'offline_audit_logs',
  APP_CONFIG: 'offline_config'
} as const;

let dbInstance: IDBDatabase | null = null;
let isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;

/**
 * Abre o inicializa la base de datos IndexedDB con todos sus ObjectStores e Índices
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable) {
      return reject(new Error('IndexedDB no está soportado en este entorno.'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store: Cola de boletas pendientes de sincronización
      if (!db.objectStoreNames.contains(STORES.PENDING_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.PENDING_QUEUE, { keyPath: 'tempId' });
        queueStore.createIndex('created_at', 'created_at', { unique: false });
        queueStore.createIndex('sync_status', 'sync_status', { unique: false });
        queueStore.createIndex('producer_id', 'producer_id', { unique: false });
      }

      // 2. Store: Historial persistente local de boletas completadas
      if (!db.objectStoreNames.contains(STORES.HISTORICAL_CACHE)) {
        const historyStore = db.createObjectStore(STORES.HISTORICAL_CACHE, { keyPath: 'tempId' });
        historyStore.createIndex('created_at', 'created_at', { unique: false });
        historyStore.createIndex('folio', 'folio', { unique: false });
      }

      // 3. Store: Catálogo local de productores para modo sin conexión
      if (!db.objectStoreNames.contains(STORES.PRODUCERS_CACHE)) {
        const producerStore = db.createObjectStore(STORES.PRODUCERS_CACHE, { keyPath: 'id' });
        producerStore.createIndex('name', 'name', { unique: false });
      }

      // 4. Store: Registro de auditoría y eventos de báscula offline
      if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
        const auditStore = db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id' });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        auditStore.createIndex('event', 'event', { unique: false });
      }

      // 5. Store: Configuración y tarifas de báscula
      if (!db.objectStoreNames.contains(STORES.APP_CONFIG)) {
        db.createObjectStore(STORES.APP_CONFIG, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Error abriendo IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Registra un evento de auditoría en IndexedDB
 */
export async function logAudit(
  event: OfflineAuditLog['event'],
  description: string,
  details?: any,
  operator: string = 'Báscula JBM'
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.AUDIT_LOGS, 'readwrite');
    const store = tx.objectStore(STORES.AUDIT_LOGS);

    const logEntry: OfflineAuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      event,
      description,
      details,
      operator
    };

    store.put(logEntry);
  } catch (err) {
    console.warn('No se pudo escribir en log de auditoría IndexedDB:', err);
  }
}

/**
 * Guarda una nueva boleta de báscula en IndexedDB (cola pendiente e histórico)
 */
export async function saveOfflineBatchToIndexedDB(
  payload: Omit<OfflineBatchRecord, 'tempId' | 'created_at' | 'sync_status'>
): Promise<OfflineBatchRecord> {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const tempId = `OFF-${Date.now().toString().slice(-6)}-${randomSuffix}`;

  const record: OfflineBatchRecord = {
    ...payload,
    tempId,
    created_at: timestamp,
    sync_status: 'pending',
    sync_attempts: 0
  };

  try {
    const db = await openDB();
    const tx = db.transaction([STORES.PENDING_QUEUE, STORES.HISTORICAL_CACHE], 'readwrite');
    
    // Guardar en cola de pendientes
    tx.objectStore(STORES.PENDING_QUEUE).put(record);
    // Guardar en historial persistente
    tx.objectStore(STORES.HISTORICAL_CACHE).put(record);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Guardar espejo secundario en localStorage para compatibilidad
    backupToLocalStorage(record);

    // Registrar en auditoría
    await logAudit(
      'created_offline',
      `Boleta guardada en almacenamiento local (${tempId}) - Peso Neto: ${record.weight_net} kg`,
      { tempId, producer: record.producer_name, net: record.weight_net, total: record.total },
      record.operator
    );

    return record;
  } catch (err) {
    console.error('Error guardando boleta en IndexedDB, usando fallback de emergencia:', err);
    // Fallback a localStorage
    backupToLocalStorage(record);
    return record;
  }
}

/**
 * Recupera todas las boletas pendientes de sincronización desde IndexedDB
 */
export async function getPendingBatchesFromIndexedDB(): Promise<OfflineBatchRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PENDING_QUEUE, 'readonly');
    const store = tx.objectStore(STORES.PENDING_QUEUE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result || [];
        // Ordenar por fecha descendente
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error leyendo pendientes de IndexedDB, consultando localStorage:', err);
    return getPendingFromLocalStorageFallback();
  }
}

/**
 * Recupera todo el historial de boletas locales (sincronizadas y pendientes)
 */
export async function getHistoricalBatchesFromIndexedDB(): Promise<OfflineBatchRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.HISTORICAL_CACHE, 'readonly');
    const store = tx.objectStore(STORES.HISTORICAL_CACHE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error leyendo histórico de IndexedDB:', err);
    return [];
  }
}

/**
 * Actualiza el estado de sincronización de una boleta
 */
export async function updateBatchStatusInIndexedDB(
  tempId: string,
  status: 'pending' | 'syncing' | 'failed' | 'synced',
  errorMessage?: string,
  serverId?: number | string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORES.PENDING_QUEUE, STORES.HISTORICAL_CACHE], 'readwrite');
    const queueStore = tx.objectStore(STORES.PENDING_QUEUE);
    const historyStore = tx.objectStore(STORES.HISTORICAL_CACHE);

    const getReq = queueStore.get(tempId);

    getReq.onsuccess = () => {
      const item: OfflineBatchRecord = getReq.result;
      if (item) {
        item.sync_status = status;
        item.last_attempt = new Date().toISOString();
        if (errorMessage) item.error_message = errorMessage;
        if (serverId) item.server_id = serverId;
        if (status === 'syncing') item.sync_attempts = (item.sync_attempts || 0) + 1;

        if (status === 'synced') {
          // Si ya se sincronizó, remover de la cola de pendientes pero conservar en histórico
          queueStore.delete(tempId);
        } else {
          queueStore.put(item);
        }

        // Actualizar también en el histórico
        historyStore.put(item);
      }
    };
  } catch (err) {
    console.error('Error actualizando estado en IndexedDB:', err);
  }
}

/**
 * Elimina una boleta de la cola de pendientes
 */
export async function removePendingBatchFromIndexedDB(tempId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PENDING_QUEUE, 'readwrite');
    tx.objectStore(STORES.PENDING_QUEUE).delete(tempId);
    removeFromLocalStorageFallback(tempId);
  } catch (err) {
    console.error('Error eliminando de IndexedDB:', err);
    removeFromLocalStorageFallback(tempId);
  }
}

/**
 * Guarda el catálogo de productores en IndexedDB para disponibilidad offline
 */
export async function cacheProducersInIndexedDB(producers: Producer[]): Promise<void> {
  if (!producers || producers.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRODUCERS_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.PRODUCERS_CACHE);
    
    producers.forEach(p => store.put(p));
    
    await logAudit('cache_updated', `Catálogo offline actualizado con ${producers.length} productores`);
  } catch (err) {
    console.warn('Error guardando productores en caché IndexedDB:', err);
  }
}

/**
 * Recupera el catálogo de productores desde la memoria IndexedDB offline
 */
export async function getCachedProducersFromIndexedDB(): Promise<Producer[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.PRODUCERS_CACHE, 'readonly');
    const store = tx.objectStore(STORES.PRODUCERS_CACHE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error leyendo catálogo de productores de IndexedDB:', err);
    return [];
  }
}

/**
 * Guarda en caché histórico de boletas recibidas del servidor para consulta sin internet
 */
export async function cacheServerBatchesInIndexedDB(serverBatches: Batch[]): Promise<void> {
  if (!serverBatches || serverBatches.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.HISTORICAL_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.HISTORICAL_CACHE);

    serverBatches.forEach(b => {
      const record: OfflineBatchRecord = {
        tempId: `SRV-${b.id || b.folio}`,
        created_at: b.date || new Date().toISOString(),
        scale_ticket_folio: b.scale_ticket_folio,
        producer_id: b.producer_id,
        producer_name: b.producer_name,
        origin: b.origin || 'Cosecha propia',
        orchard: b.orchard || 'Pedernales',
        variety: b.variety || 'Limón Mexicano',
        weight_gross: b.weight_gross || 0,
        weight_tare: b.weight_tare || 0,
        weight_net: b.weight_net || 0,
        price_per_kg: b.price_per_kg || 18.5,
        subtotal: b.subtotal || 0,
        scale_fee: b.scale_fee || 50,
        scale_fee_payment: b.scale_fee_payment || 'descuento',
        extra_charge_per_kg: b.extra_charge_per_kg || 0.4,
        extra_charge_total: b.extra_charge_total || 0,
        extra_charge_concept: b.extra_charge_concept || 'Servicios operativos y maniobra',
        total: b.total || 0,
        operator: b.operator || 'Carlos Barragán',
        notes: b.notes || '',
        sync_status: 'synced',
        server_id: b.id
      };
      store.put(record);
    });
  } catch (err) {
    console.warn('Error guardando histórico en caché IndexedDB:', err);
  }
}

/**
 * Recupera métricas del estado del almacenamiento local
 */
export async function getOfflineStorageMetrics(): Promise<{
  pendingCount: number;
  historyCount: number;
  producersCount: number;
  auditCount: number;
  dbType: 'IndexedDB (Resistente)' | 'LocalStorage (Básico)';
  isReady: boolean;
}> {
  try {
    const db = await openDB();
    const tx = db.transaction([
      STORES.PENDING_QUEUE,
      STORES.HISTORICAL_CACHE,
      STORES.PRODUCERS_CACHE,
      STORES.AUDIT_LOGS
    ], 'readonly');

    const pendingReq = tx.objectStore(STORES.PENDING_QUEUE).count();
    const historyReq = tx.objectStore(STORES.HISTORICAL_CACHE).count();
    const prodReq = tx.objectStore(STORES.PRODUCERS_CACHE).count();
    const auditReq = tx.objectStore(STORES.AUDIT_LOGS).count();

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        resolve({
          pendingCount: pendingReq.result || 0,
          historyCount: historyReq.result || 0,
          producersCount: prodReq.result || 0,
          auditCount: auditReq.result || 0,
          dbType: 'IndexedDB (Resistente)',
          isReady: true
        });
      };
      tx.onerror = () => {
        resolve({
          pendingCount: getPendingFromLocalStorageFallback().length,
          historyCount: 0,
          producersCount: 0,
          auditCount: 0,
          dbType: 'LocalStorage (Básico)',
          isReady: false
        });
      };
    });
  } catch (e) {
    return {
      pendingCount: getPendingFromLocalStorageFallback().length,
      historyCount: 0,
      producersCount: 0,
      auditCount: 0,
      dbType: 'LocalStorage (Básico)',
      isReady: false
    };
  }
}

/**
 * Obtiene los últimos logs de auditoría offline
 */
export async function getAuditLogsFromIndexedDB(limitCount = 50): Promise<OfflineAuditLog[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.AUDIT_LOGS, 'readonly');
    const store = tx.objectStore(STORES.AUDIT_LOGS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const logs = request.result || [];
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(logs.slice(0, limitCount));
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Sincronización masiva de boletas pendientes hacia el servidor central y Firebase Firestore
 */
export async function syncAllIndexedDBBatches(
  onProgress?: (synced: number, total: number) => void
): Promise<{ successCount: number; failCount: number; syncedBatches: Batch[] }> {
  const pending = await getPendingBatchesFromIndexedDB();
  if (pending.length === 0) {
    return { successCount: 0, failCount: 0, syncedBatches: [] };
  }

  let successCount = 0;
  let failCount = 0;
  const syncedBatches: Batch[] = [];

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    await updateBatchStatusInIndexedDB(item.tempId, 'syncing');

    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scale_ticket_folio: item.scale_ticket_folio,
          producer_id: item.producer_id,
          origin: item.origin,
          orchard: item.orchard,
          variety: item.variety,
          weight_gross: item.weight_gross,
          weight_tare: item.weight_tare,
          price_per_kg: item.price_per_kg,
          scale_fee: item.scale_fee,
          scale_fee_payment: item.scale_fee_payment,
          extra_charge_per_kg: item.extra_charge_per_kg,
          extra_charge_concept: item.extra_charge_concept,
          operator: item.operator,
          notes: item.notes ? `${item.notes} [Sincronizado IndexedDB]` : '[Sincronizado desde IndexedDB]'
        })
      });

      if (!response.ok) {
        throw new Error(`Error servidor HTTP ${response.status}: ${response.statusText}`);
      }

      const createdBatch: Batch = await response.json();

      // Guardar también en Firebase Firestore en la nube
      try {
        await saveCloudBatch({
          ...createdBatch,
          indexedDbSynced: true,
          originalTempId: item.tempId
        } as any);
      } catch (cloudErr) {
        console.warn('Aviso sincronización Firestore:', cloudErr);
      }

      // Marcar como sincronizado y registrar en auditoría
      await updateBatchStatusInIndexedDB(item.tempId, 'synced', undefined, createdBatch.id);
      await logAudit(
        'sync_success',
        `Boleta ${item.tempId} sincronizada con folio servidor ${createdBatch.folio}`,
        { tempId: item.tempId, serverBatch: createdBatch }
      );

      syncedBatches.push(createdBatch);
      successCount++;
    } catch (err: any) {
      console.error(`Error sincronizando boleta ${item.tempId}:`, err);
      await updateBatchStatusInIndexedDB(item.tempId, 'failed', err?.message || 'Error de red');
      await logAudit(
        'sync_error',
        `Fallo al sincronizar boleta ${item.tempId}: ${err?.message || 'Sin respuesta'}`,
        { tempId: item.tempId, error: err?.message }
      );
      failCount++;
    }

    if (onProgress) {
      onProgress(i + 1, pending.length);
    }
  }

  return { successCount, failCount, syncedBatches };
}

/**
 * Exporta un respaldo JSON completo de los datos guardados en IndexedDB
 */
export async function exportDatabaseBackupJSON(): Promise<string> {
  const pending = await getPendingBatchesFromIndexedDB();
  const history = await getHistoricalBatchesFromIndexedDB();
  const producers = await getCachedProducersFromIndexedDB();
  const audit = await getAuditLogsFromIndexedDB(200);

  const backup = {
    app: 'JBM Cítricos ERP - Báscula',
    exported_at: new Date().toISOString(),
    version: DB_VERSION,
    records: {
      pendingBatches: pending,
      historicalBatches: history,
      cachedProducers: producers,
      auditLogs: audit
    }
  };

  await logAudit('manual_export', `Respaldo JSON exportado con ${pending.length} pendientes y ${history.length} en historial`);

  return JSON.stringify(backup, null, 2);
}

// -------------------------------------------------------------
// Utilidades de Fallback a LocalStorage
// -------------------------------------------------------------
const LS_FALLBACK_KEY = 'jbm_reception_offline_queue_v1';

function backupToLocalStorage(record: OfflineBatchRecord) {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    const list: OfflineBatchRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(i => i.tempId !== record.tempId);
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify([record, ...filtered]));
  } catch (e) {
    // ignore
  }
}

function getPendingFromLocalStorageFallback(): OfflineBatchRecord[] {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function removeFromLocalStorageFallback(tempId: string) {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return;
    const list: OfflineBatchRecord[] = JSON.parse(raw);
    const filtered = list.filter(i => i.tempId !== tempId);
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(filtered));
  } catch (e) {
    // ignore
  }
}
