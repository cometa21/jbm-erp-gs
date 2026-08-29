import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Package,
  Layers,
  ArrowRight,
  ShoppingCart,
  X,
  CheckCircle2,
  PhoneCall,
  Clock,
  Sparkles,
  Printer
} from 'lucide-react';
import type { SupplyDeduction, LowStockAlert } from '../types';

interface ProductionLowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchFolio: string;
  calibre: string;
  boxesCount: number;
  weightKg: number;
  deductions: SupplyDeduction[];
  lowStockAlerts: LowStockAlert[];
  onNavigateToSupplies?: (focusCategoryId?: string) => void;
  onGeneratePurchaseOrder?: (item: LowStockAlert) => void;
}

export function ProductionLowStockModal({
  isOpen,
  onClose,
  batchFolio,
  calibre,
  boxesCount,
  weightKg,
  deductions,
  lowStockAlerts,
  onNavigateToSupplies,
  onGeneratePurchaseOrder
}: ProductionLowStockModalProps) {
  if (!isOpen) return null;

  const hasCritical = lowStockAlerts.some(a => a.status === 'critical');
  const criticalItems = lowStockAlerts.filter(a => a.status === 'critical');
  const lowItems = lowStockAlerts.filter(a => a.status === 'low');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ribbon */}
        <div className={`p-6 text-white ${
          hasCritical 
            ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700' 
            : lowStockAlerts.length > 0
              ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700'
              : 'bg-gradient-to-r from-emerald-600 to-teal-700'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                {hasCritical ? (
                  <ShieldAlert size={26} className="text-white animate-pulse" />
                ) : lowStockAlerts.length > 0 ? (
                  <AlertTriangle size={26} className="text-white" />
                ) : (
                  <CheckCircle2 size={26} className="text-white" />
                )}
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider mb-1 backdrop-blur-xs">
                  {hasCritical ? 'Alerta Crítica de Insumos' : lowStockAlerts.length > 0 ? 'Aviso de Stock Bajo' : 'Descuento Automático Exitoso'}
                </span>
                <h3 className="text-xl font-black tracking-tight leading-snug">
                  {hasCritical
                    ? 'Desabasto Inminente en Empaque'
                    : lowStockAlerts.length > 0
                      ? 'Insumos por Debajo del Umbral Mínimo'
                      : 'Insumos de Empaque Descontados'}
                </h3>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  Lote: <span className="font-bold">{batchFolio}</span> • {boxesCount > 0 ? `${boxesCount} Cajas/Arpillas` : `${weightKg.toFixed(1)} kg`} ({calibre})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Warning Badges for Low/Critical Stock */}
          {lowStockAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle size={15} className={hasCritical ? "text-rose-600" : "text-amber-600"} />
                  <span>Materiales que Requieren Reorden Inmediata ({lowStockAlerts.length})</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Umbrales configurados en Sistema
                </span>
              </div>

              <div className="space-y-2.5">
                {lowStockAlerts.map(alert => {
                  const isCrit = alert.status === 'critical';
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCrit
                          ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-slate-900">{alert.item_name}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                              isCrit
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-amber-500 text-white'
                            }`}>
                              {isCrit ? 'Peligro de Paro' : 'Punto de Reorden'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap">
                            <span>
                              Stock actual: <strong className={isCrit ? "text-rose-700 font-black text-sm" : "text-amber-800 font-black text-sm"}>{alert.quantity} {alert.unit}</strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>Umbral mínimo: <strong>{alert.min_stock} {alert.unit}</strong></span>
                            <span className="text-slate-300">•</span>
                            <span>Déficit: <strong className="text-rose-600">-{alert.deficit} {alert.unit}</strong></span>
                          </div>

                          {alert.supplier && (
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-medium">
                              <span className="flex items-center gap-1">
                                <Package size={12} className="text-slate-400" />
                                Proveedor: {alert.supplier}
                              </span>
                              {alert.lead_time_days && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} className="text-slate-400" />
                                  Entrega: {alert.lead_time_days} días
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {onGeneratePurchaseOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              onGeneratePurchaseOrder(alert);
                              onClose();
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 shadow-xs transition-all hover:scale-102 cursor-pointer ${
                              isCrit
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                            }`}
                          >
                            <ShoppingCart size={13} />
                            <span>Pedir {alert.reorderSuggestedQty || Math.round(alert.min_stock * 1.5)} {alert.unit}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Full Deduction Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package size={15} className="text-emerald-600" />
              <span>Desglose de Insumos Descontados en esta Corrida</span>
            </h4>

            {deductions.length > 0 ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3.5">Material / Insumo</th>
                      <th className="py-2.5 px-3 text-right">Cant. Descontada</th>
                      <th className="py-2.5 px-3 text-right">Stock Anterior</th>
                      <th className="py-2.5 px-3.5 text-right">Stock Resultante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {deductions.map((d, idx) => {
                      const isLowNow = lowStockAlerts.some(a => a.id === d.insumoId);
                      return (
                        <tr key={idx} className={isLowNow ? "bg-amber-50/40" : "hover:bg-slate-50/80"}>
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {d.insumoNombre}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-600">
                            -{d.cantidadDescontada} {d.unidad}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                            {d.stockAnterior} {d.unidad}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <span className={`font-black ${isLowNow ? 'text-rose-600 underline' : 'text-emerald-700'}`}>
                              {d.stockNuevo} {d.unidad}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Esta corrida a granel/molino no requirió insumos de embalaje.
              </div>
            )}
          </div>

          {/* Quick Notice Info */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
            <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              El sistema ha registrado los movimientos de salida en la <strong>Bitácora de Trazabilidad de Insumos</strong> vinculando el lote <strong>{batchFolio}</strong> y la fecha actual.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onNavigateToSupplies ? (
            <button
              type="button"
              onClick={() => {
                onNavigateToSupplies();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Layers size={14} className="text-slate-500" />
              <span>Ver Módulo de Insumos</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Entendido, Continuar</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
