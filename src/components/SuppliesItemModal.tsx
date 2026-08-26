import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Tag, 
  Layers, 
  ShieldAlert, 
  DollarSign, 
  Building2, 
  Barcode, 
  Check 
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface SuppliesItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: InventoryItem | null;
  onSuccess: () => void;
}

export function SuppliesItemModal({
  isOpen,
  onClose,
  itemToEdit,
  onSuccess
}: SuppliesItemModalProps) {
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Cajas & Empaque',
    quantity: 1000,
    unit: 'pzas',
    min_stock: 500,
    critical_stock: 200,
    cost_unit: 45.0,
    supplier: 'Cartonera del Golfo S.A. de C.V.',
    sku: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({
          item_name: itemToEdit.item_name,
          category: itemToEdit.category || 'Cajas & Empaque',
          quantity: itemToEdit.quantity,
          unit: itemToEdit.unit || 'pzas',
          min_stock: itemToEdit.min_stock || 500,
          critical_stock: itemToEdit.critical_stock || Math.round((itemToEdit.min_stock || 500) * 0.4),
          cost_unit: itemToEdit.cost_unit || 0,
          supplier: itemToEdit.supplier || 'Cartonera del Golfo S.A.',
          sku: itemToEdit.sku || ''
        });
      } else {
        setFormData({
          item_name: '',
          category: 'Cajas & Empaque',
          quantity: 1000,
          unit: 'pzas',
          min_stock: 500,
          critical_stock: 200,
          cost_unit: 45.0,
          supplier: 'Cartonera del Golfo S.A. de C.V.',
          sku: 'CJ-' + Math.floor(1000 + Math.random() * 9000)
        });
      }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      alert('Por favor ingrese el nombre del material.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = itemToEdit ? `/api/inventory/${itemToEdit.id}` : '/api/inventory';
      const method = itemToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Error al guardar el material en el inventario.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error en la petición');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {itemToEdit ? 'Editar Parámetros de Insumo' : 'Dar de Alta Nuevo Insumo'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Gestión de materiales de empaque y umbrales de alerta
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Categoría de Insumo
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Cajas & Empaque">📦 Cajas & Empaque</option>
                <option value="Etiquetas & Marcaje">🏷️ Etiquetas & Marcaje</option>
                <option value="Tarimas & Estiba">🪵 Tarimas & Estiba</option>
                <option value="Protección & Flejado">🛡️ Protección & Flejado</option>
                <option value="Tratamiento Poscosecha">🧪 Tratamiento Poscosecha</option>
                <option value="Suministros de Campo">🚜 Suministros de Campo</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Código / SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ej. CJ-EXP-40LBS"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
              Nombre / Descripción del Material
            </label>
            <input
              type="text"
              required
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="Ej. Caja Exportación 18.14 kg (40 lbs) JBM Green Lemon"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Stock, Unit & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Stock Físico Actual
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Unidad de Medida
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="pzas">pzas (Piezas)</option>
                <option value="millares">millares</option>
                <option value="rollos">rollos</option>
                <option value="pliegos">pliegos</option>
                <option value="tambos 200L">tambos 200L</option>
                <option value="kg">kg</option>
                <option value="litros">litros</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                Costo Unitario ($)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={formData.cost_unit}
                onChange={(e) => setFormData({ ...formData, cost_unit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Configured Thresholds: Min & Critical */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              <ShieldAlert size={14} className="text-rose-600" />
              <span>Configuración de Umbrales de Alerta Visual</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-amber-700 block mb-1">
                  Stock Mínimo (Punto Reorden)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.min_stock}
                  onChange={(e) => {
                    const min = parseInt(e.target.value) || 1;
                    setFormData({
                      ...formData,
                      min_stock: min,
                      critical_stock: Math.min(formData.critical_stock, min)
                    });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-amber-300 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Dispara alerta amarilla</span>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-rose-700 block mb-1">
                  Nivel Crítico (Alerta Roja)
                </label>
                <input
                  type="number"
                  min={0}
                  max={formData.min_stock}
                  required
                  value={formData.critical_stock}
                  onChange={(e) => setFormData({ ...formData, critical_stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-xl border border-rose-300 font-mono font-bold text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/50"
                />
                <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">Dispara alerta roja urgente</span>
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
              Proveedor Predeterminado
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Ej. Cartonera del Golfo S.A. de C.V."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Footer */}
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
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Guardando...' : (itemToEdit ? 'Actualizar Insumo' : 'Guardar Material')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
