import React, { useState, useMemo } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  FileText,
  Building2,
  Calendar,
  Package,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface SuppliesRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSuccess: () => void;
}

interface RestockRow {
  itemId: number;
  qty: number;
  costUnit: number;
}

const KNOWN_SUPPLIERS = [
  'Cartonera del Golfo S.A. de C.V.',
  'Etiquetas Industriales del Sureste',
  'Maderas y Tarimas del Papaloapan',
  'Flejados y Empaques Industriales',
  'Agroquímica Poscosecha Veracruz',
  'Empaques Regionales Martínez',
  'Papelera San Rafael'
];

export function SuppliesRestockModal({
  isOpen,
  onClose,
  items,
  onSuccess
}: SuppliesRestockModalProps) {
  const [supplier, setSupplier] = useState<string>('Cartonera del Golfo S.A. de C.V.');
  const [customSupplier, setCustomSupplier] = useState<string>('');
  const [invoiceFolio, setInvoiceFolio] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('Carlos Barragán');
  const [notes, setNotes] = useState<string>('');
  
  // Rows to restock
  const [rows, setRows] = useState<RestockRow[]>([
    { itemId: items[0]?.id || 1, qty: 500, costUnit: items[0]?.cost_unit || 48.50 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && items.length > 0) {
      setRows([
        { itemId: items[0].id, qty: 500, costUnit: items[0].cost_unit || 48.50 }
      ]);
      setInvoiceFolio(`REM-${Math.floor(10000 + Math.random() * 90000)}`);
      setErrorMsg(null);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    const unselectedItem = items.find(i => !rows.some(r => r.itemId === i.id)) || items[0];
    if (unselectedItem) {
      setRows(prev => [
        ...prev,
        { itemId: unselectedItem.id, qty: 100, costUnit: unselectedItem.cost_unit || 0 }
      ]);
    }
  };

  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof RestockRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      if (field === 'itemId') {
        const item = items.find(i => i.id === Number(value));
        next[index] = {
          ...next[index],
          itemId: Number(value),
          costUnit: item?.cost_unit || next[index].costUnit
        };
      } else {
        next[index] = {
          ...next[index],
          [field]: Number(value) || 0
        };
      }
      return next;
    });
  };

  const totalInvestment = rows.reduce((sum, r) => sum + (r.qty * r.costUnit), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) {
      setErrorMsg('Agrega al menos un material a recibir.');
      return;
    }

    const invalidRow = rows.find(r => r.qty <= 0);
    if (invalidRow) {
      setErrorMsg('Todas las cantidades a ingresar deben ser mayores a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const finalSupplier = customSupplier.trim() || supplier;

    try {
      const payload = {
        supplier: finalSupplier,
        invoice_folio: invoiceFolio.trim(),
        received_by: receivedBy.trim(),
        notes: notes.trim(),
        items: rows.map(r => ({
          id: r.itemId,
          qty: r.qty,
          cost_unit: r.costUnit
        }))
      };

      const res = await fetch('/api/inventory/restock-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al registrar reabastecimiento.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Truck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Recepción & Reabastecimiento de Insumos
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Entrada directa de camión con cajas, etiquetas, tarimas y consumibles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-bold">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Supplier & Invoice metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                Proveedor de Insumos
              </label>
              <select
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value);
                  if (e.target.value !== 'Otro') setCustomSupplier('');
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {KNOWN_SUPPLIERS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Otro">Otro Proveedor (Especificar)</option>
              </select>
              {supplier === 'Otro' && (
                <input
                  type="text"
                  value={customSupplier}
                  onChange={(e) => setCustomSupplier(e.target.value)}
                  placeholder="Nombre de la empresa proveedora..."
                  className="w-full h-10 px-3 mt-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                Folio Remisión / Factura
              </label>
              <input
                type="text"
                value={invoiceFolio}
                onChange={(e) => setInvoiceFolio(e.target.value)}
                placeholder="Ej. FAC-99401 / REM-230"
                required
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                Recibido por (Almacenista)
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                Observaciones / Estado del Embarque
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Material recibido en tarimas selladas..."
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Materials Table to Receive */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={16} className="text-emerald-700" />
                <span>Insumos Recibidos en este Embarque</span>
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs font-black text-emerald-800 hover:text-emerald-900 flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Agregar Insumo</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {rows.map((row, idx) => {
                const item = items.find(i => i.id === row.itemId);
                const currentStock = item?.quantity || 0;
                const newStock = currentStock + row.qty;
                const subtotal = row.qty * row.costUnit;

                return (
                  <div 
                    key={idx} 
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Material Select */}
                      <div className="flex-1">
                        <select
                          value={row.itemId}
                          onChange={(e) => handleRowChange(idx, 'itemId', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        >
                          {items.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.item_name} ({i.category}) — Stock Actual: {i.quantity} {i.unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Numeric fields */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Cantidad a Ingresar
                        </span>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={row.qty}
                            onChange={(e) => handleRowChange(idx, 'qty', e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Costo Unitario (MXN)
                        </span>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.costUnit}
                            onChange={(e) => handleRowChange(idx, 'costUnit', e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col justify-center text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Stock Resultante</span>
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          {newStock.toLocaleString('es-MX')} {item?.unit || 'pzas'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                Valor Total del Reabastecimiento
              </span>
              <p className="text-xs text-emerald-700">
                {rows.length} insumo(s) serán ingresados al inventario con folio <strong>{invoiceFolio}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-emerald-950">
                ${totalInvestment.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || rows.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-transform hover:scale-102 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Guardando entrada...' : 'Confirmar Reabastecimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
