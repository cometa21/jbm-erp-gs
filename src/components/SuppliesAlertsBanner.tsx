import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  BellRing, 
  Sliders, 
  ShoppingCart, 
  Package, 
  Tag, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import type { InventoryItem } from '../types';

interface SuppliesAlertsBannerProps {
  items: (InventoryItem & { status?: string; isCritical?: boolean; isLow?: boolean; deficit?: number; criticalDeficit?: number })[];
  onOpenThresholdConfig: () => void;
  onOpenPurchaseOrder: () => void;
  onFilterCritical: () => void;
  activeFilter: string;
}

export function SuppliesAlertsBanner({
  items,
  onOpenThresholdConfig,
  onOpenPurchaseOrder,
  onFilterCritical,
  activeFilter,
}: SuppliesAlertsBannerProps) {
  const criticalItems = items.filter(item => (item.quantity <= (item.critical_stock ?? (item.min_stock * 0.4))));
  const lowItems = items.filter(item => (
    item.quantity > (item.critical_stock ?? (item.min_stock * 0.4)) && 
    item.quantity <= item.min_stock
  ));
  const optimalItems = items.filter(item => item.quantity > item.min_stock);

  // Focus especially on boxes and labels
  const criticalBoxes = criticalItems.filter(i => 
    i.category?.toLowerCase().includes('caja') || i.item_name.toLowerCase().includes('caja')
  );
  const criticalLabels = criticalItems.filter(i => 
    i.category?.toLowerCase().includes('etiqueta') || i.item_name.toLowerCase().includes('etiqueta')
  );

  const hasCritical = criticalItems.length > 0;
  const hasLow = lowItems.length > 0;

  return (
    <div 
      id="supplies-alerts-center" 
      className={`rounded-2xl border transition-all relative overflow-hidden ${
        hasCritical 
          ? 'bg-rose-50/70 border-rose-200 shadow-sm' 
          : hasLow 
            ? 'bg-amber-50/70 border-amber-200 shadow-sm'
            : 'bg-emerald-50/60 border-emerald-200'
      }`}
    >
      {/* Ambient background decoration */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Header Section with Alarm Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              hasCritical 
                ? 'bg-rose-600 text-white animate-pulse' 
                : hasLow 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-emerald-600 text-white'
            }`}>
              {hasCritical ? (
                <ShieldAlert size={24} className="text-white" />
              ) : hasLow ? (
                <AlertTriangle size={22} className="text-white" />
              ) : (
                <CheckCircle2 size={22} className="text-white" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {hasCritical 
                    ? '⚠️ Alerta de Desabasto Crítico en Materiales de Empaque' 
                    : hasLow 
                      ? 'Atención: Materiales en Punto de Reorden' 
                      : 'Stock de Insumos en Niveles Óptimos'}
                </h2>
                {hasCritical && (
                  <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs animate-pulse">
                    Acción Inmediata Requerida
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                {hasCritical 
                  ? `Se detectaron ${criticalItems.length} materiales básicos de empaque por debajo del nivel crítico configurado.`
                  : hasLow 
                    ? `Hay ${lowItems.length} materiales que han alcanzado su umbral de stock mínimo para reordenar.`
                    : 'Todos los insumos de empaque y campo cuentan con inventario suficiente para las órdenes de producción.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={onOpenThresholdConfig}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Ajustar valores de stock mínimo y crítico"
            >
              <Sliders size={14} className="text-slate-500" />
              <span>Configurar Umbrales</span>
            </button>
            <button
              type="button"
              onClick={onOpenPurchaseOrder}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-transform hover:scale-102 cursor-pointer ${
                hasCritical 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <ShoppingCart size={14} />
              <span>Generar Pedido de Reabastecimiento</span>
            </button>
          </div>
        </div>

        {/* Status Counters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Critical Counter Card */}
          <div 
            onClick={onFilterCritical}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'critical'
                ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-500/20'
                : 'bg-white/80 border-rose-200 hover:bg-white'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                🔴 Nivel Crítico (Agotamiento)
              </span>
              <span className="text-xl font-black font-mono text-rose-700">
                {criticalItems.length}
              </span>
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {criticalBoxes.length > 0 && `${criticalBoxes.length} cajas `}
              {criticalLabels.length > 0 && `${criticalLabels.length} tipos de etiquetas `}
              {criticalItems.length === 0 && 'Ningún material en riesgo crítico'}
            </p>
          </div>

          {/* Low Stock Counter Card */}
          <div className="p-3 rounded-xl border bg-white/80 border-amber-200">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                🟡 Stock Bajo (Punto de Reorden)
              </span>
              <span className="text-xl font-black font-mono text-amber-700">
                {lowItems.length}
              </span>
            </div>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">
              Programar compras preventivas
            </p>
          </div>

          {/* Optimal Stock Counter Card */}
          <div className="p-3 rounded-xl border bg-white/80 border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                🟢 Stock Óptimo
              </span>
              <span className="text-xl font-black font-mono text-emerald-700">
                {optimalItems.length}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Cobertura garantizada para empaque
            </p>
          </div>
        </div>

        {/* Critical Materials Highlight Badges (when critical exists) */}
        {hasCritical && (
          <div className="pt-2 border-t border-rose-200/60">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
                Insumos prioritarios para surtir hoy:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalItems.map((item) => {
                const deficit = Math.max(0, item.min_stock - item.quantity);
                const isBox = item.category?.toLowerCase().includes('caja') || item.item_name.toLowerCase().includes('caja');
                const isLabel = item.category?.toLowerCase().includes('etiqueta') || item.item_name.toLowerCase().includes('etiqueta');

                return (
                  <div 
                    key={item.id}
                    className="bg-white border border-rose-300 rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xs"
                  >
                    <div className="p-1 rounded-lg bg-rose-100 text-rose-700">
                      {isBox ? <Package size={14} /> : isLabel ? <Tag size={14} /> : <AlertOctagon size={14} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800">{item.item_name}</span>
                        <span className="text-[10px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded font-mono">
                          {item.quantity.toLocaleString('es-MX')} {item.unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Umbral Crítico: <span className="font-bold text-rose-700 font-mono">{item.critical_stock ?? (item.min_stock * 0.4)}</span> • 
                        Faltan: <span className="font-bold text-rose-700 font-mono">+{deficit.toLocaleString('es-MX')}</span> para mínimo
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
