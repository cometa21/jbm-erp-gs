/**
 * Gestor de persistencia y sincronización fuera de línea (Offline Storage & Sync)
 * para el módulo de Recepción y Báscula de Cítricos JBM.
 * 
 * Integra IndexedDB de alto rendimiento con respaldo en localStorage.
 */

import type { Batch } from '../types';
import {
  saveOfflineBatchToIndexedDB,
  getPendingBatchesFromIndexedDB,
  updateBatchStatusInIndexedDB,
  removePendingBatchFromIndexedDB,
  syncAllIndexedDBBatches,
  type OfflineBatchRecord
} from './indexedDbManager';

export type OfflineBatchPayload = OfflineBatchRecord;

const STORAGE_KEY = 'jbm_reception_offline_queue_v1';

/**
 * Obtiene las boletas pendientes desde localStorage (síncrono)
 */
export function getOfflineBatches(): OfflineBatchPayload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading offline batches from localStorage:', err);
    return [];
  }
}

/**
 * Obtiene las boletas pendientes desde IndexedDB (asíncrono)
 */
export async function getOfflineBatchesAsync(): Promise<OfflineBatchPayload[]> {
  return await getPendingBatchesFromIndexedDB();
}

/**
 * Guarda una nueva boleta offline tanto en IndexedDB como en localStorage
 */
export function saveOfflineBatch(
  payload: Omit<OfflineBatchPayload, 'tempId' | 'created_at' | 'sync_status'>
): OfflineBatchPayload {
  const current = getOfflineBatches();
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const tempId = `OFF-${Date.now().toString().slice(-6)}-${randomSuffix}`;

  const newOfflineBatch: OfflineBatchPayload = {
    ...payload,
    tempId,
    created_at: timestamp,
    sync_status: 'pending',
    sync_attempts: 0
  };

  // 1. Guardar síncrono en localStorage
  const updated = [newOfflineBatch, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error writing offline batch to localStorage:', err);
  }

  // 2. Guardar asíncrono en IndexedDB para máxima durabilidad
  saveOfflineBatchToIndexedDB(payload).catch(err => {
    console.warn('Error delegating to IndexedDB:', err);
  });

  return newOfflineBatch;
}

/**
 * Guarda de forma asíncrona directamente en IndexedDB
 */
export async function saveOfflineBatchAsync(
  payload: Omit<OfflineBatchPayload, 'tempId' | 'created_at' | 'sync_status'>
): Promise<OfflineBatchPayload> {
  return await saveOfflineBatchToIndexedDB(payload);
}

/**
 * Actualiza el estado de una boleta offline
 */
export function updateOfflineBatchStatus(
  tempId: string,
  status: 'pending' | 'syncing' | 'failed' | 'synced',
  errorMessage?: string
): void {
  const current = getOfflineBatches();
  const updated = current.map(item => {
    if (item.tempId === tempId) {
      return { ...item, sync_status: status, error_message: errorMessage };
    }
    return item;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error updating offline batch in localStorage:', err);
  }

  // Actualizar también en IndexedDB
  updateBatchStatusInIndexedDB(tempId, status, errorMessage).catch(() => {});
}

/**
 * Elimina una boleta de la cola offline
 */
export function removeOfflineBatch(tempId: string): void {
  const current = getOfflineBatches();
  const updated = current.filter(item => item.tempId !== tempId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting offline batch from localStorage:', err);
  }

  // Eliminar también en IndexedDB
  removePendingBatchFromIndexedDB(tempId).catch(() => {});
}

/**
 * Limpia todas las boletas offline
 */
export function clearAllOfflineBatches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing offline batches:', err);
  }
}

/**
 * Convierte un lote offline a formato Batch para visualización en tablas y tickets
 */
export function offlineBatchToBatch(item: OfflineBatchPayload): Batch {
  return {
    id: -1 * Math.abs(parseInt(item.tempId.replace(/\D/g, '').slice(-5)) || 9999),
    folio: `TEMPORAL (${item.tempId})`,
    scale_ticket_folio: item.scale_ticket_folio,
    producer_id: item.producer_id || 0,
    producer_name: item.producer_name || 'Productor Local',
    date: item.created_at,
    origin: item.origin,
    orchard: item.orchard,
    variety: item.variety,
    quality: 'Estándar',
    weight_gross: item.weight_gross,
    weight_tare: item.weight_tare,
    weight_net: item.weight_net,
    price_per_kg: item.price_per_kg,
    subtotal: item.subtotal,
    scale_fee: item.scale_fee,
    scale_fee_payment: item.scale_fee_payment,
    extra_charge_per_kg: item.extra_charge_per_kg,
    extra_charge_total: item.extra_charge_total,
    extra_charge_concept: item.extra_charge_concept,
    total: item.total,
    status: 'completado',
    operator: item.operator,
    notes: item.notes ? `${item.notes} [Persistencia IndexedDB]` : '[Persistencia IndexedDB]'
  };
}

/**
 * Sincroniza todos los lotes pendientes hacia el servidor mediante IndexedDB y API
 */
export async function syncAllOfflineBatches(
  onProgress?: (syncedCount: number, total: number) => void
): Promise<{ successCount: number; failCount: number; syncedBatches: Batch[] }> {
  // Sincronizar usando el gestor de IndexedDB
  const result = await syncAllIndexedDBBatches(onProgress);
  
  // Limpiar los sincronizados de localStorage
  result.syncedBatches.forEach(b => {
    // Si tenemos tempIds en localStorage, sincronizar
    const current = getOfflineBatches();
    const remaining = current.filter(item => item.sync_status !== 'synced');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {}
  });

  return result;
}
