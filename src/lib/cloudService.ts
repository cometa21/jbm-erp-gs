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
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { Producer, Batch, InventoryItem, Settlement } from '../types';

// Collection references
export const COLLECTIONS = {
  BATCHES: 'batches',
  PRODUCERS: 'producers',
  INVENTORY: 'inventory',
  SETTLEMENTS: 'settlements',
  SETTINGS: 'company_settings'
} as const;

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
    console.error('Error fetching batches from Cloud Firestore:', error);
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
    console.error('Error saving batch to Cloud Firestore:', error);
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
    console.warn('Firestore live subscription error (using fallback):', err);
  });
}
