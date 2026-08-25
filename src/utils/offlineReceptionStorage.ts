/**
 * Gestor de persistencia y sincronización fuera de línea (Offline Storage & Sync)
 * para el módulo de Recepción y Báscula de Cítricos JBM.
 */

import type { Batch } from '../types';
import { saveCloudBatch } from '../lib/cloudService';

export interface OfflineBatchPayload {
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
  sync_status: 'pending' | 'syncing' | 'failed';
  error_message?: string;
}

const STORAGE_KEY = 'jbm_reception_offline_queue_v1';

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

export function saveOfflineBatch(payload: Omit<OfflineBatchPayload, 'tempId' | 'created_at' | 'sync_status'>): OfflineBatchPayload {
  const current = getOfflineBatches();
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const tempId = `OFF-${Date.now().toString().slice(-6)}-${randomSuffix}`;

  const newOfflineBatch: OfflineBatchPayload = {
    ...payload,
    tempId,
    created_at: timestamp,
    sync_status: 'pending'
  };

  const updated = [newOfflineBatch, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error writing offline batch to localStorage:', err);
  }

  return newOfflineBatch;
}

export function updateOfflineBatchStatus(tempId: string, status: 'pending' | 'syncing' | 'failed', errorMessage?: string): void {
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
    console.error('Error updating offline batch:', err);
  }
}

export function removeOfflineBatch(tempId: string): void {
  const current = getOfflineBatches();
  const updated = current.filter(item => item.tempId !== tempId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting offline batch:', err);
  }
}

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
    notes: item.notes ? `${item.notes} [Guardado Offline]` : '[Guardado Offline sin conexión]'
  };
}

/**
 * Sincroniza todos los lotes pendientes hacia el servidor
 */
export async function syncAllOfflineBatches(onProgress?: (syncedCount: number, total: number) => void): Promise<{ successCount: number; failCount: number; syncedBatches: Batch[] }> {
  const pending = getOfflineBatches();
  if (pending.length === 0) {
    return { successCount: 0, failCount: 0, syncedBatches: [] };
  }

  let successCount = 0;
  let failCount = 0;
  const syncedBatches: Batch[] = [];

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    updateOfflineBatchStatus(item.tempId, 'syncing');

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
          notes: item.notes ? `${item.notes} [Sincronizado tras reconexión]` : '[Sincronizado tras reconexión]'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const createdBatch: Batch = await response.json();
      
      // Save also to Cloud Firestore for cloud backup & remote dashboard access
      try {
        await saveCloudBatch({
          ...createdBatch,
          offlineSynced: true,
          originalTempId: item.tempId
        } as any);
      } catch (cloudErr) {
        console.warn('Cloud sync mirror error (non-fatal):', cloudErr);
      }

      syncedBatches.push(createdBatch);
      removeOfflineBatch(item.tempId);
      successCount++;
    } catch (err: any) {
      console.error(`Error synchronizing offline batch ${item.tempId}:`, err);
      updateOfflineBatchStatus(item.tempId, 'failed', err?.message || 'Fallo de conexión');
      failCount++;
    }

    if (onProgress) {
      onProgress(i + 1, pending.length);
    }
  }

  return { successCount, failCount, syncedBatches };
}
