import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Printer, 
  Copy, 
  Check, 
  Building2, 
  Calendar, 
  AlertTriangle, 
  Package, 
  FileCheck2,
  DollarSign
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface SuppliesPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
}

export function SuppliesPurchaseOrderModal({
  isOpen,
  onClose,
  items
}: SuppliesPurchaseOrderModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter items needing restock (quantity <= min_stock)
  const restockItems = items.filter(item => item.quantity <= item.min_stock).map(item => {
    const isCritical = item.quantity <= (item.critical_stock ?? (item.min_stock * 0.4));
    // Suggested order brings inventory to 150% of min_stock
    const suggestedOrder = Math.max(0, Math.round((item.min_stock * 1.5) - item.quantity));
    const costUnit = item.cost_unit || (item.category?.includes('Caja') ? 45 : item.category?.includes('Etiqueta') ? 0.25 : 15);
    const totalCost = suggestedOrder * costUnit;

    return {
      ...item,
      isCritical,
      suggestedOrder,
      costUnit,
      totalCost
    };
  });

  const totalEstimatedInvestment = restockItems.reduce((sum, i) => sum + i.totalCost, 0);
  const criticalCount = restockItems.filter(i => i.isCritical).length;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const lines = [
      `=== ORDEN DE REABASTECIMIENTO DE INSUMOS DE EMPAQUE ===`,
      `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
      `Empresa: JBM CÍTRICOS BARRAGÁN - Empacadora Martínez de la Torre, Ver.`,
      `Materiales en Desabasto: ${restockItems.length} (${criticalCount} en Nivel Crítico)`,
      `------------------------------------------------------------`,
      ...restockItems.map(i => 
        `- [${i.isCritical ? 'CRÍTICO' : 'REORDEN'}] ${i.item_name} (SKU: ${i.sku || 'N/A'})\n  Cant. Sugerida: ${i.suggestedOrder.toLocaleString('es-MX')} ${i.unit} | Proveedor: ${i.supplier || 'Nacional'} | Est.: $${i.totalCost.toLocaleString('es-MX')} MXN`
      ),
      `------------------------------------------------------------`,
      `Total Estimado Reabastecimiento: $${totalEstimatedInvestment.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Requisición / Orden de Compra de Insumos</h2>
              <p className="text-xs text-slate-400 font-medium">
                Cálculo automático de requerimientos para materiales en nivel crítico y bajo stock
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

        {/* Banner Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Insumos Requeridos</span>
              <span className="text-base font-black text-slate-900">{restockItems.length} materiales</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider block">Nivel Crítico Inmediato</span>
              <span className="text-base font-black text-rose-700">{criticalCount} prioritarios</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Inversión Estimada</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                ${totalEstimatedInvestment.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir Requisición</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {restockItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <FileCheck2 size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-900">No se requieren compras urgentes</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos los insumos de empaque, cajas y etiquetas se encuentran por encima de sus umbrales de seguridad.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Insumo / Descripción</th>
                    <th className="py-3 px-3 text-center">Estado Alerta</th>
                    <th className="py-3 px-3 text-right">Stock Actual</th>
                    <th className="py-3 px-3 text-right">Umbral Mín.</th>
                    <th className="py-3 px-3 text-right font-black text-emerald-800">Pedido Sugerido</th>
                    <th className="py-3 px-4 text-left">Proveedor Recomendado</th>
                    <th className="py-3 px-4 text-right">Costo Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restockItems.map((item) => (
                    <tr key={item.id} className={item.isCritical ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'}>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.item_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku || 'N/A'} • {item.category}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {item.isCritical ? (
                          <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                            Crítico
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                            Reorden
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700">
                        {item.quantity.toLocaleString('es-MX')} {item.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        {item.min_stock.toLocaleString('es-MX')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                        +{item.suggestedOrder.toLocaleString('es-MX')} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.supplier || 'Cartonera del Golfo'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${item.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
