import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Trash2, 
  User, 
  FileText, 
  Package, 
  Check,
  AlertCircle
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface SuppliesMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  defaultType?: 'Entrada' | 'Salida' | 'Ajuste';
  onSuccess: () => void;
}

export function SuppliesMovementModal({
  isOpen,
  onClose,
  item,
  defaultType = 'Entrada',
  onSuccess
}: SuppliesMovementModalProps) {
  const [type, setType] = useState<'Entrada' | 'Salida' | 'Ajuste' | 'Merma'>(defaultType);
  const [qty, setQty] = useState<number>(100);
  const [reason, setReason] = useState<string>('');
  const [user, setUser] = useState<string>('Carlos Barragán');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setQty(defaultType === 'Entrada' ? 500 : 50);
      setReason(
        defaultType === 'Entrada' 
          ? 'Recepción de pedido de proveedor' 
          : defaultType === 'Salida' 
            ? 'Consumo en línea de empaque' 
            : 'Ajuste de inventario físico'
      );
    }
  }, [isOpen, defaultType]);

  if (!isOpen || !item) return null;

  const currentQty = item.quantity;
  const delta = (type === 'Entrada') ? qty : (type === 'Ajuste' ? (qty - currentQty) : -qty);
  const projectedQty = Math.max(0, currentQty + delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0 && type !== 'Ajuste') {
      alert('Por favor ingrese una cantidad válida mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          delta,
          type,
          reason: reason.trim() || 'Movimiento de almacén',
          user: user.trim() || 'Almacén'
        })
      });

      if (!res.ok) {
        throw new Error('Error al registrar el movimiento de inventario.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error en el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Registrar Movimiento de Insumo</h2>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[260px] sm:max-w-xs">
                {item.item_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Movement Type Tabs */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('Entrada');
                  setReason('Recepción de pedido de proveedor');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'Entrada'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowDownRight size={15} />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('Salida');
                  setReason('Consumo en línea de empaque');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'Salida'
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowUpRight size={15} />
                <span>Salida</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('Ajuste');
                  setReason('Ajuste de inventario físico');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'Ajuste'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <RefreshCw size={14} />
                <span>Ajuste Total</span>
              </button>
            </div>
          </div>

          {/* Current & Projected Stock Preview */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-center">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Stock Actual</span>
              <span className="text-xl font-black font-mono text-slate-800">
                {currentQty.toLocaleString('es-MX')}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">{item.unit}</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Stock Resultante</span>
              <span className={`text-xl font-black font-mono ${
                projectedQty <= (item.critical_stock || 40)
                  ? 'text-rose-600'
                  : projectedQty <= item.min_stock
                    ? 'text-amber-600'
                    : 'text-emerald-700'
              }`}>
                {projectedQty.toLocaleString('es-MX')}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">{item.unit}</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
              {type === 'Ajuste' ? 'Nuevo Stock Total' : 'Cantidad del Movimiento'} ({item.unit})
            </label>
            <input
              type="number"
              min={0}
              required
              value={qty}
              onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            {/* Quick buttons */}
            <div className="flex gap-2 mt-2">
              {[50, 100, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQty(val)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Concept */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1">
              <FileText size={13} className="text-slate-400" />
              Concepto / Motivo
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Consumo lote de exportación #4048"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Operator / User */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1">
              <User size={13} className="text-slate-400" />
              Responsable / Operador de Almacén
            </label>
            <input
              type="text"
              required
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Nombre del responsable"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer ${
                type === 'Entrada' 
                  ? 'bg-emerald-700 hover:bg-emerald-800' 
                  : type === 'Salida' 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar Movimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
