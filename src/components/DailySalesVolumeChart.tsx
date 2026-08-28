import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Scale, 
  Boxes, 
  CreditCard, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  Tag, 
  Layers, 
  CheckCircle2, 
  SlidersHorizontal 
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface DailySaleDataPoint {
  date: string;
  label: string;
  weekday: string;
  totalAmount: number;
  totalKg: number;
  totalTons: number;
  totalBoxes: number;
  transactionsCount: number;
  avgTicket: number;
  discountsGiven: number;
  cashAmount: number;
  transferAmount: number;
  cardAmount: number;
  creditAmount: number;
  movingAverageAmount?: number;
  movingAverageKg?: number;
  targetKg?: number;
  targetAmount?: number;
}

interface SalesVolumeResponse {
  dailySales: DailySaleDataPoint[];
  summary: {
    periodDays: number;
    totalSalesAmount: number;
    totalKgSold: number;
    totalTonsSold: number;
    totalBoxesSold: number;
    totalTransactions: number;
    avgTicket: number;
    avgKgPerDay: number;
    avgRevenuePerDay: number;
    totalDiscounts: number;
    bestDay: {
      date: string;
      label: string;
      amount: number;
      kg: number;
      boxes: number;
    };
  };
  paymentMethodDistribution: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
    color: string;
  }>;
  productBreakdown: Array<{
    name: string;
    category: string;
    kg: number;
    percentage: number;
    color: string;
  }>;
}

interface DailySalesVolumeChartProps {
  onRefreshParent?: () => void;
}

export const DailySalesVolumeChart: React.FC<DailySalesVolumeChartProps> = ({ onRefreshParent }) => {
  const [data, setData] = useState<SalesVolumeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(30);
  
  // View mode: 'volume_kg' | 'volume_boxes' | 'revenue' | 'payment_methods' | 'tickets'
  const [viewMode, setViewMode] = useState<'volume_kg' | 'volume_boxes' | 'revenue' | 'payment_methods'>('volume_kg');
  const [unitVolumeMode, setUnitVolumeMode] = useState<'kg' | 'tons'>('kg');
  const [showTargetLine, setShowTargetLine] = useState(true);

  const fetchSalesData = async (days: number) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/analytics/sales-volume?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching sales volume data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesData(selectedDays);
  }, [selectedDays]);

  const handleRefresh = () => {
    fetchSalesData(selectedDays);
    if (onRefreshParent) onRefreshParent();
  };

  const summary = data?.summary;
  const dailySales = data?.dailySales || [];
  const paymentMethods = data?.paymentMethodDistribution || [];
  const productBreakdown = data?.productBreakdown || [];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
              <ShoppingBag size={13} className="text-emerald-700" />
              Punto de Venta & Despacho Comercial
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              • Dinámico con Recharts
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Volumen Diario de Ventas & Desplazamiento
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitoreo en tiempo real de kilos vendidos, cajas comercializadas e ingresos por día
          </p>
        </div>

        {/* Action Toggles & Time Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Days Filter */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            {[
              { label: '7 Días', value: 7 },
              { label: '14 Días', value: 14 },
              { label: '30 Días', value: 30 }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedDays === opt.value
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
            title="Actualizar datos de ventas"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
            <span>{isRefreshing ? "Actualizando..." : "Actualizar"}</span>
          </button>
        </div>
      </div>

      {/* View Mode Tabs Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-2 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setViewMode('volume_kg')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'volume_kg'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Scale size={14} />
            <span>Kilos Vendidos ({unitVolumeMode === 'kg' ? 'kg' : 'Tons'})</span>
          </button>

          <button
            onClick={() => setViewMode('volume_boxes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'volume_boxes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Boxes size={14} />
            <span>Cajas Despachadas</span>
          </button>

          <button
            onClick={() => setViewMode('revenue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'revenue'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DollarSign size={14} />
            <span>Ingresos Diarios ($ MXN)</span>
          </button>

          <button
            onClick={() => setViewMode('payment_methods')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'payment_methods'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard size={14} />
            <span>Métodos de Pago</span>
          </button>
        </div>

        {/* Volume Unit Switcher (only for kg view) */}
        {viewMode === 'volume_kg' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Unidad:</span>
            <div className="bg-white p-0.5 rounded-lg flex items-center border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setUnitVolumeMode('kg')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  unitVolumeMode === 'kg'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => setUnitVolumeMode('tons')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  unitVolumeMode === 'tons'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tons
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Strip for Sales Volume */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Volumen Total ({selectedDays}D)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {summary ? summary.totalKgSold.toLocaleString('es-MX') : '0'}
            </span>
            <span className="text-[10px] font-bold text-slate-500">kg</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
            ≈ {summary?.totalTonsSold || 0} Toneladas ({summary?.totalBoxesSold.toLocaleString()} cajas)
          </div>
        </div>

        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Ingresos Totales
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-amber-700 font-mono">
              ${summary ? summary.totalSalesAmount.toLocaleString('es-MX') : '0'}
            </span>
            <span className="text-[10px] font-bold text-slate-500">MXN</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            Prom. ${summary?.avgRevenuePerDay.toLocaleString()}/día
          </div>
        </div>

        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Promedio Diario Acopio
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {summary ? summary.avgKgPerDay.toLocaleString('es-MX') : '0'}
            </span>
            <span className="text-[10px] font-bold text-slate-500">kg/día</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            {summary?.totalTransactions.toLocaleString()} transacciones ({selectedDays}D)
          </div>
        </div>

        <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
            Día con Mayor Venta
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
              {summary ? summary.bestDay.kg.toLocaleString('es-MX') : '0'}
            </span>
            <span className="text-[10px] font-bold text-slate-500">kg</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1 truncate">
            {summary?.bestDay.label} (${summary?.bestDay.amount.toLocaleString()} MXN)
          </div>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="h-[340px] sm:h-[380px] w-full pt-1">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="animate-spin text-emerald-600" size={28} />
            <span className="text-xs font-semibold">Cargando gráfico interactivo de ventas...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'volume_kg' ? (
              <ComposedChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="salesKgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={selectedDays === 30 ? 2 : 0}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => unitVolumeMode === 'kg' ? `${(val / 1000).toFixed(0)}k kg` : `${val} T`}
                  dx={-5}
                />
                <Tooltip content={<CustomSalesVolumeTooltip viewMode={viewMode} unitVolumeMode={unitVolumeMode} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                <ReferenceLine 
                  y={unitVolumeMode === 'kg' ? 5000 : 5.0} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Meta Comercial Diaria (5,000 kg)', fill: '#b45309', fontSize: 10, position: 'insideTopRight' }} 
                />

                <Area 
                  type="monotone" 
                  name={unitVolumeMode === 'kg' ? 'Kilos Vendidos Diarios (kg)' : 'Toneladas Vendidas (Tons)'}
                  dataKey={unitVolumeMode === 'kg' ? 'totalKg' : 'totalTons'} 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fill="url(#salesKgGradient)" 
                />

                <Line 
                  type="monotone" 
                  name="Media Móvil 7 Días (kg)" 
                  dataKey={unitVolumeMode === 'kg' ? 'movingAverageKg' : (d => Number(((d.movingAverageKg || 0)/1000).toFixed(2)))} 
                  stroke="#047857" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="3 3"
                />
              </ComposedChart>
            ) : viewMode === 'volume_boxes' ? (
              <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={selectedDays === 30 ? 2 : 0}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => `${val} cjs`}
                  dx={-5}
                />
                <Tooltip content={<CustomSalesVolumeTooltip viewMode={viewMode} unitVolumeMode={unitVolumeMode} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                <Bar 
                  name="Cajas Despachadas Diarias" 
                  dataKey="totalBoxes" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedDays === 7 ? 32 : selectedDays === 14 ? 20 : 12}
                >
                  {dailySales.map((entry, index) => (
                    <Cell 
                      key={`box-cell-${index}`} 
                      fill={entry.totalBoxes > 350 ? '#1d4ed8' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : viewMode === 'revenue' ? (
              <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={selectedDays === 30 ? 2 : 0}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
                  dx={-5}
                />
                <Tooltip content={<CustomSalesVolumeTooltip viewMode={viewMode} unitVolumeMode={unitVolumeMode} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                <Area 
                  type="monotone" 
                  name="Ingreso Neto Diario ($ MXN)" 
                  dataKey="totalAmount" 
                  stroke="#d97706" 
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)" 
                />

                <Line 
                  type="monotone" 
                  name="Media Móvil ($ MXN)" 
                  dataKey="movingAverageAmount" 
                  stroke="#92400e" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="3 3"
                />
              </AreaChart>
            ) : (
              /* Stacked Bar Chart for Payment Methods */
              <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={selectedDays === 30 ? 2 : 0}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
                  dx={-5}
                />
                <Tooltip content={<CustomSalesVolumeTooltip viewMode={viewMode} unitVolumeMode={unitVolumeMode} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />

                <Bar dataKey="cashAmount" name="Efectivo" stackId="a" fill="#10b981" />
                <Bar dataKey="transferAmount" name="Transferencia" stackId="a" fill="#3b82f6" />
                <Bar dataKey="cardAmount" name="Tarjeta" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="creditAmount" name="Crédito" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Distribution Badges & Presentations Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        {/* Payment Methods Breakdown */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <CreditCard size={14} className="text-purple-600" />
              Distribución por Método de Cobro
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Periodo Seleccionado</span>
          </div>
          <div className="space-y-2 pt-1">
            {paymentMethods.map(pm => (
              <div key={pm.method} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pm.color }} />
                    {pm.method} ({pm.count} ops)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ${pm.amount.toLocaleString('es-MX')} ({pm.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pm.percentage}%`, backgroundColor: pm.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Presentations Breakdown */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Boxes size={14} className="text-emerald-600" />
              Desplazamiento por Presentación
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Participación de Kilos</span>
          </div>
          <div className="space-y-2 pt-1">
            {productBreakdown.map(prod => (
              <div key={prod.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 flex items-center gap-1.5 font-medium truncate max-w-[200px]" title={prod.name}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: prod.color }} />
                    {prod.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {prod.kg.toLocaleString()} kg ({prod.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${prod.percentage}%`, backgroundColor: prod.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip Component for Sales Volume Chart
function CustomSalesVolumeTooltip({ active, payload, label, viewMode, unitVolumeMode }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1.5 min-w-[220px]">
        <div className="font-black text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center">
          <span>{data.label} ({data.weekday})</span>
          <span className="text-[10px] text-emerald-400 uppercase font-mono">
            {data.transactionsCount} transacciones
          </span>
        </div>
        <div className="space-y-1 font-mono pt-1">
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Volumen Vendido:</span>
            <span className="font-bold text-emerald-400">
              {data.totalKg.toLocaleString()} kg ({data.totalTons} T)
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Cajas Despachadas:</span>
            <span className="font-bold text-blue-400">{data.totalBoxes} cajas</span>
          </div>
          <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/80">
            <span className="font-sans text-slate-400">Ingreso Diario:</span>
            <span className="font-bold text-amber-400">
              ${data.totalAmount.toLocaleString('es-MX')} MXN
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Ticket Promedio:</span>
            <span className="font-bold text-slate-200">${data.avgTicket.toLocaleString()}</span>
          </div>
          {data.discountsGiven > 0 && (
            <div className="flex justify-between text-rose-300 text-[11px]">
              <span className="font-sans">Descuentos Aplicados:</span>
              <span className="font-bold">-${data.discountsGiven.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
