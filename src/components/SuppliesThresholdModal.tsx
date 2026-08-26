import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Save, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  HelpCircle, 
  Package, 
  Tag, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface SuppliesThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSaveSuccess: () => void;
}

export function SuppliesThresholdModal({
  isOpen,
  onClose,
  items,
  onSaveSuccess
}: SuppliesThresholdModalProps) {
  const [thresholds, setThresholds] = useState<Record<number, { min_stock: number; critical_stock: number }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Initialize state when items change or modal opens
  React.useEffect(() => {
    if (isOpen && items.length > 0) {
      const initial: Record<number, { min_stock: number; critical_stock: number }> = {};
      items.forEach(item => {
        initial[item.id] = {
          min_stock: item.min_stock ?? 100,
          critical_stock: item.critical_stock ?? Math.round((item.min_stock ?? 100) * 0.4)
        };
      });
      setThresholds(initial);
      setSaveMessage(null);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const categories = ['todos', ...Array.from(new Set(items.map(i => i.category || 'Empaque')))];

  const filteredItems = items.filter(item => {
    if (selectedCategory === 'todos') return true;
    return (item.category || 'Empaque') === selectedCategory;
  });

  const handleMinChange = (id: number, val: number) => {
    const safeMin = Math.max(1, isNaN(val) ? 0 : val);
    setThresholds(prev => {
      const current = prev[id] || { min_stock: 100, critical_stock: 40 };
      // If critical is higher than new min, adjust critical down
      const adjustedCritical = current.critical_stock > safeMin ? Math.round(safeMin * 0.4) : current.critical_stock;
      return {
        ...prev,
        [id]: {
          min_stock: safeMin,
          critical_stock: adjustedCritical
        }
      };
    });
  };

  const handleCriticalChange = (id: number, val: number) => {
    const safeCrit = Math.max(0, isNaN(val) ? 0 : val);
    setThresholds(prev => {
      const current = prev[id] || { min_stock: 100, critical_stock: 40 };
      return {
        ...prev,
        [id]: {
          ...current,
          critical_stock: safeCrit
        }
      };
    });
  };

  // Quick preset: Auto-calculate critical threshold at 40% of min_stock for all items
  const handleAutoApply40Percent = () => {
    setThresholds(prev => {
      const next: Record<number, { min_stock: number; critical_stock: number }> = {};
      Object.keys(prev).forEach(key => {
        const id = Number(key);
        const min = prev[id].min_stock;
        next[id] = {
          min_stock: min,
          critical_stock: Math.max(1, Math.round(min * 0.4))
        };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updates = Object.entries(thresholds).map(([idStr, vals]: [string, { min_stock: number; critical_stock: number }]) => ({
        id: Number(idStr),
        min_stock: vals.min_stock,
        critical_stock: vals.critical_stock
      }));

      const res = await fetch('/api/inventory/configure-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!res.ok) {
        throw new Error('Error al guardar la configuración de umbrales.');
      }

      setSaveMessage('¡Umbrales actualizados con éxito!');
      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Configuración de Niveles Críticos y Mínimos</h2>
              <p className="text-xs text-slate-400 font-medium">
                Define los umbrales de advertencia y alerta roja para materiales de empaque
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

        {/* Action / Helper Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'todos' ? '📦 Todos los Insumos' : cat}
              </button>
            ))}
          </div>

          {/* Preset buttons */}
          <button
            type="button"
            onClick={handleAutoApply40Percent}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ajusta el nivel crítico automáticamente al 40% del stock mínimo"
          >
            <Sparkles size={13} />
            <span>Fijar Crítico al 40% del Mínimo</span>
          </button>
        </div>

        {/* Legend Explainer Banner */}
        <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-100 text-xs text-slate-600 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span className="font-black text-rose-900">Nivel Crítico (Alerta Roja):</span>
            <span>Stock disponible ≤ este valor (desabasto inminente en empaque).</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="font-black text-amber-900">Stock Mínimo (Punto de Reorden):</span>
            <span>Momento ideal para emitir orden de compra al proveedor.</span>
          </div>
        </div>

        {/* Item Thresholds Table / Grid */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-4">
          {filteredItems.map((item) => {
            const curThreshold = thresholds[item.id] || { min_stock: item.min_stock, critical_stock: item.critical_stock || 40 };
            const currentQty = item.quantity;
            const isCriticalNow = currentQty <= curThreshold.critical_stock;
            const isLowNow = !isCriticalNow && currentQty <= curThreshold.min_stock;
            const isBox = item.category?.toLowerCase().includes('caja') || item.item_name.toLowerCase().includes('caja');
            const isLabel = item.category?.toLowerCase().includes('etiqueta') || item.item_name.toLowerCase().includes('etiqueta');

            return (
              <div 
                key={item.id}
                className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Item Details */}
                <div className="flex items-start gap-3 md:w-5/12">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isCriticalNow 
                      ? 'bg-rose-100 text-rose-700' 
                      : isLowNow 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isBox ? <Package size={18} /> : isLabel ? <Tag size={18} /> : <Package size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.item_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        Disp: {currentQty.toLocaleString('es-MX')} {item.unit}
                      </span>
                      {isCriticalNow && (
                        <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Crítico
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configuration Inputs */}
                <div className="flex items-center gap-4 md:w-7/12 justify-start md:justify-end">
                  {/* Stock Mínimo */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Stock Mínimo ({item.unit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={curThreshold.min_stock}
                      onChange={(e) => handleMinChange(item.id, parseInt(e.target.value) || 0)}
                      className="w-28 sm:w-32 px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  {/* Nivel Crítico */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-rose-700 block flex items-center gap-1">
                      <ShieldAlert size={11} />
                      Nivel Crítico ({item.unit})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={curThreshold.min_stock}
                      value={curThreshold.critical_stock}
                      onChange={(e) => handleCriticalChange(item.id, parseInt(e.target.value) || 0)}
                      className="w-28 sm:w-32 px-3 py-1.5 rounded-xl border border-rose-300 font-mono font-bold text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/50"
                    />
                  </div>

                  {/* Calculated Ratio Badge */}
                  <div className="hidden sm:block text-right min-w-[70px]">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Ratio Crítico</span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {curThreshold.min_stock > 0 
                        ? `${Math.round((curThreshold.critical_stock / curThreshold.min_stock) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {saveMessage ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check size={16} />
                {saveMessage}
              </span>
            ) : (
              <span>Los cambios afectarán los disparadores de alerta de todo el sistema en tiempo real.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Umbrales'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
