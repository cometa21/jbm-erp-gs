import React, { useState, useEffect, useMemo } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  RefreshCw, 
  ShieldAlert, 
  SlidersHorizontal, 
  Filter, 
  TrendingDown, 
  PackageCheck,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

interface InventoryItemData {
  id: string;
  rawId: number;
  name: string;
  shortName: string;
  category: string;
  currentStock: number;
  minStock: number;
  criticalStock: number;
  unit: string;
  costUnit: number;
  totalValuation: number;
  healthPercent: number;
  status: 'optimal' | 'low' | 'critical';
  deficit: number;
  supplier: string;
  sku: string;
  color: string;
}

interface InventoryLevelsResponse {
  items: InventoryItemData[];
  priorityItems: InventoryItemData[];
  categoriesBreakdown: Array<{
    category: string;
    totalStock: number;
    totalValue: number;
    itemsCount: number;
    lowCount: number;
    criticalCount: number;
    color: string;
    percentageOfValue: number;
  }>;
  healthSummary: {
    totalItems: number;
    totalValuation: number;
    optimalCount: number;
    lowCount: number;
    criticalCount: number;
    healthScore: number;
    alertsCount: number;
  };
}

interface InventoryLevelsChartProps {
  onRefreshParent?: () => void;
}

export const InventoryLevelsChart: React.FC<InventoryLevelsChartProps> = ({ onRefreshParent }) => {
  const [data, setData] = useState<InventoryLevelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Modes
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'alerts_only' | 'critical_only'>('all');
  const [viewMode, setViewMode] = useState<'stock_levels' | 'health_percentage' | 'valuation'>('stock_levels');

  const fetchInventoryData = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/analytics/inventory-levels');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching inventory levels analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleRefresh = () => {
    fetchInventoryData();
    if (onRefreshParent) onRefreshParent();
  };

  // Filter items based on Category and Status
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStatusFilter === 'alerts_only' && item.status === 'optimal') {
        return false;
      }
      if (selectedStatusFilter === 'critical_only' && item.status !== 'critical') {
        return false;
      }
      return true;
    });
  }, [data, selectedCategory, selectedStatusFilter]);

  const categories = useMemo(() => {
    if (!data?.categoriesBreakdown) return [];
    return data.categoriesBreakdown;
  }, [data]);

  const health = data?.healthSummary;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
      {/* Header & Main Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
              <Boxes size={13} className="text-blue-700" />
              Almacén de Insumos & Empaques JBM
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              • Monitoreo de Existencias & Umbrales Mínimos
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Niveles de Inventario & Salud de Stock
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Comparativo en tiempo real de existencia actual contra niveles de seguridad (Mínimo / Crítico)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedStatusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({data?.items?.length || 0})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('alerts_only')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'alerts_only'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100/60'
              }`}
            >
              <AlertTriangle size={12} />
              Alertas ({health?.alertsCount || 0})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('critical_only')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'critical_only'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              <ShieldAlert size={12} />
              Críticos ({health?.criticalCount || 0})
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
            title="Actualizar datos de inventario"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
            <span>{isRefreshing ? "Actualizando..." : "Actualizar"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip for Inventory Health */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Índice de Abasto Global
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-lg sm:text-xl font-black font-mono ${
              (health?.healthScore || 100) >= 80 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {health?.healthScore || 0}%
            </span>
            <span className="text-[10px] font-bold text-slate-400">Salud Stock</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            {health?.optimalCount || 0} de {health?.totalItems || 0} materiales óptimos
          </div>
        </div>

        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Materiales en Alerta
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-amber-700 font-mono">
              {health?.lowCount || 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400">bajo mínimo</span>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">
            Requieren orden de compra próxima
          </div>
        </div>

        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Materiales Críticos
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">
              {health?.criticalCount || 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400">urgentes</span>
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">
            Riesgo de paro en línea de empaque
          </div>
        </div>

        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Valoración Total en Almacén
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              ${health ? health.totalValuation.toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '0'}
            </span>
            <span className="text-[10px] font-bold text-slate-500">MXN</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            Insumos, cajas y fruta en piso
          </div>
        </div>
      </div>

      {/* Category Pills & View Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas las Categorías
          </button>
          {categories.map(c => (
            <button
              key={c.category}
              onClick={() => setSelectedCategory(c.category)}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedCategory === c.category
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span>{c.category}</span>
              {(c.lowCount + c.criticalCount) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                  {c.lowCount + c.criticalCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="bg-white p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('stock_levels')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'stock_levels'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock vs Mínimo
          </button>
          <button
            onClick={() => setViewMode('health_percentage')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'health_percentage'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            % de Cobertura
          </button>
          <button
            onClick={() => setViewMode('valuation')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'valuation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Valoración ($)
          </button>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="h-[360px] sm:h-[400px] w-full pt-1">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="animate-spin text-blue-600" size={28} />
            <span className="text-xs font-semibold">Cargando gráfico interactivo de inventarios...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <PackageCheck size={32} className="text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No se encontraron artículos con los filtros aplicados</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedStatusFilter('all'); }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'stock_levels' ? (
              <BarChart
                data={filteredItems}
                margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="shortName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dx={-5}
                />
                <Tooltip content={<CustomInventoryTooltip viewMode={viewMode} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                <Bar 
                  dataKey="currentStock" 
                  name="Stock Actual en Almacén" 
                  radius={[4, 4, 0, 0]}
                >
                  {filteredItems.map((entry, index) => (
                    <Cell 
                      key={`inv-cell-${index}`} 
                      fill={entry.status === 'critical' ? '#ef4444' : entry.status === 'low' ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>

                <Bar 
                  dataKey="minStock" 
                  name="Stock Mínimo Requerido" 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]} 
                />

                <Bar 
                  dataKey="criticalStock" 
                  name="Umbral Crítico de Paro" 
                  fill="#fca5a5" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            ) : viewMode === 'health_percentage' ? (
              <BarChart
                data={filteredItems}
                margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="shortName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => `${val}%`}
                  dx={-5}
                />
                <Tooltip content={<CustomInventoryTooltip viewMode={viewMode} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                {/* 100% Target Safety Line */}
                <ReferenceLine 
                  y={100} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                  label={{ value: '100% Stock de Seguridad', fill: '#047857', fontSize: 10, position: 'insideTopRight' }} 
                />

                {/* 40% Critical Risk Line */}
                <ReferenceLine 
                  y={40} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  label={{ value: '40% Riesgo Crítico', fill: '#b91c1c', fontSize: 10, position: 'insideBottomRight' }} 
                />

                <Bar 
                  dataKey="healthPercent" 
                  name="% Cobertura vs Stock Mínimo" 
                  radius={[4, 4, 0, 0]}
                >
                  {filteredItems.map((entry, index) => (
                    <Cell 
                      key={`health-cell-${index}`} 
                      fill={entry.healthPercent <= 40 ? '#ef4444' : entry.healthPercent < 100 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              /* Valuation Bar Chart */
              <BarChart
                data={filteredItems}
                margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="shortName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
                  dx={-5}
                />
                <Tooltip content={<CustomInventoryTooltip viewMode={viewMode} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                <Bar 
                  dataKey="totalValuation" 
                  name="Valor Total en Inventario ($ MXN)" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                >
                  {filteredItems.map((entry, index) => (
                    <Cell 
                      key={`val-cell-${index}`} 
                      fill="#3b82f6" 
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Breakdown Progress Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        {categories.map(cat => (
          <div key={cat.category} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-800 flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.category}
              </span>
              <span className="font-mono text-slate-900">${cat.totalValue.toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
              <span>{cat.itemsCount} SKUs ({cat.totalStock.toLocaleString()} unidades)</span>
              <span>{cat.percentageOfValue}% capital</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${cat.percentageOfValue}%`, backgroundColor: cat.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Tooltip Component for Inventory Levels Chart
function CustomInventoryTooltip({ active, payload, label, viewMode }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const isCritical = item.status === 'critical';
    const isLow = item.status === 'low';

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1.5 min-w-[240px] max-w-[300px]">
        <div className="font-black text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center gap-2">
          <span className="truncate">{item.name}</span>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${
            isCritical ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
            isLow ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
            'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isCritical ? 'Crítico' : isLow ? 'Bajo Stock' : 'Óptimo'}
          </span>
        </div>

        <div className="space-y-1 font-mono pt-1 text-slate-300">
          <div className="flex justify-between">
            <span className="font-sans text-slate-400">Stock Actual:</span>
            <span className={`font-bold ${isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
              {item.currentStock.toLocaleString()} {item.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-slate-400">Stock Mínimo:</span>
            <span className="font-bold text-slate-300">{item.minStock.toLocaleString()} {item.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-slate-400">Umbral Crítico:</span>
            <span className="font-bold text-rose-300">{item.criticalStock.toLocaleString()} {item.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-slate-400">Cobertura:</span>
            <span className="font-bold text-blue-400">{item.healthPercent}%</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-800/80">
            <span className="font-sans text-slate-400">Costo Unitario:</span>
            <span className="font-bold text-slate-200">${item.costUnit.toFixed(2)} MXN</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-slate-400">Valoración Total:</span>
            <span className="font-bold text-amber-400">${item.totalValuation.toLocaleString('es-MX')} MXN</span>
          </div>
          {item.deficit > 0 && (
            <div className="flex justify-between text-rose-300 text-[11px] pt-0.5">
              <span className="font-sans">Déficit Mínimo:</span>
              <span className="font-bold">Faltan {item.deficit.toLocaleString()} {item.unit}</span>
            </div>
          )}
          {item.supplier && (
            <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-800">
              Proveedor: {item.supplier}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
