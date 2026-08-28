import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine,
  ComposedChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  Layers, 
  Award, 
  Clock, 
  Users, 
  CreditCard, 
  Download, 
  ArrowUpRight, 
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { POSAnalyticsData, POSUserRole, POSTopProductItem, POSDailySalesPoint } from '../../types';

interface POSTabAnalisisProps {
  currentRole: POSUserRole;
}

type DailyMetricView = 'volume_boxes' | 'revenue' | 'dual_axis' | 'volume_kg';
type ProductMetricView = 'boxes' | 'revenue' | 'kg';

// Palette for products
const PRODUCT_COLORS = [
  '#059669', // Emerald 600
  '#0d9488', // Teal 600
  '#0284c7', // Sky 600
  '#16a34a', // Green 600
  '#d97706', // Amber 600
  '#ca8a04', // Yellow 600
  '#64748b'  // Slate 500
];

export const POSTabAnalisis: React.FC<POSTabAnalisisProps> = ({ currentRole }) => {
  const [data, setData] = useState<POSAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<number>(14);
  const [dailyView, setDailyView] = useState<DailyMetricView>('dual_axis');
  const [productView, setProductView] = useState<ProductMetricView>('boxes');
  const [activeProductHover, setActiveProductHover] = useState<string | null>(null);
  const [showHourly, setShowHourly] = useState<boolean>(false);

  const fetchAnalytics = async (days: number = selectedDays) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pos/analytics?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching POS analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedDays);
  }, [selectedDays]);

  // Export Analytics Summary to CSV
  const handleExportCSV = () => {
    if (!data) return;

    const rows: string[][] = [
      ['ANÁLISIS DE VENTAS POS - BODEGA CDMX'],
      ['Periodo:', `Últimos ${selectedDays} días`],
      ['Fecha de Reporte:', new Date().toLocaleString('es-MX')],
      [''],
      ['--- VOLUMEN DIARIO DE VENTAS ---'],
      ['Fecha', 'Día', 'Cajas Vendidas', 'Kilogramos', 'Ingreso Total ($)', 'Tickets', 'Ticket Promedio ($)', 'Efectivo ($)', 'Bancos / SPEI ($)'],
      ...data.dailySales.map(d => [
        d.date,
        d.dayOfWeek,
        d.totalBoxes.toString(),
        d.totalKg.toString(),
        d.totalRevenue.toFixed(2),
        d.ticketCount.toString(),
        d.avgTicketValue.toFixed(2),
        d.cashRevenue.toFixed(2),
        d.bankRevenue.toFixed(2)
      ]),
      [''],
      ['--- PRODUCTOS MÁS VENDIDOS ---'],
      ['Ranking', 'Producto', 'Calibre', 'Tipo', 'Cajas Vendidas', 'Kilogramos', 'Ingresos ($)', 'No. Pedidos', 'Precio Promedio ($)', '% Volumen', '% Ingresos'],
      ...data.topProducts.map((p, idx) => [
        (idx + 1).toString(),
        p.name,
        p.calibre,
        p.itemType,
        p.boxesSold.toString(),
        p.kgSold.toFixed(2),
        p.revenue.toFixed(2),
        p.orderCount.toString(),
        p.avgPrice.toFixed(2),
        `${p.volumePercent}%`,
        `${p.revenuePercent}%`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Analisis_Ventas_POS_CDMX_${selectedDays}d_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip for Daily Sales
  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pointData: POSDailySalesPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[220px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-emerald-400">{pointData.dayOfWeek} {pointData.label}</span>
            <span className="text-[10px] text-slate-400 font-mono">{pointData.date}</span>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Package className="w-3.5 h-3.5 text-emerald-400" /> Cajas Físicas:
              </span>
              <span className="font-bold text-white font-mono">{pointData.totalBoxes} cjs</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Layers className="w-3.5 h-3.5 text-teal-400" /> Kilos Equivalentes:
              </span>
              <span className="font-bold text-teal-300 font-mono">{pointData.totalKg.toLocaleString('es-MX')} kg</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Ingreso Total:
              </span>
              <span className="font-bold text-emerald-400 font-mono">${pointData.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Tickets emitidos:</span>
              <span className="font-mono text-slate-200">{pointData.ticketCount} transacciones</span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Ticket promedio:</span>
              <span className="font-mono text-slate-200 font-semibold">${pointData.avgTicketValue.toLocaleString('es-MX')}</span>
            </div>

            <div className="pt-1.5 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
              <span>Efectivo: ${pointData.cashRevenue.toLocaleString('es-MX')}</span>
              <span>Bancos: ${pointData.bankRevenue.toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Top Products
  const CustomProductTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const prod: POSTopProductItem = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[240px] space-y-2">
          <div className="border-b border-slate-700 pb-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Calibre {prod.calibre}</span>
            <h4 className="font-bold text-white text-xs leading-tight mt-0.5">{prod.name}</h4>
          </div>

          <div className="space-y-1 text-slate-300">
            {prod.boxesSold > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Cajas vendidas:</span>
                <span className="font-bold text-white font-mono">{prod.boxesSold} cajas</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Kilogramos despachados:</span>
              <span className="font-bold text-teal-300 font-mono">{prod.kgSold.toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Ingresos generados:</span>
              <span className="font-bold text-emerald-400 font-mono">${prod.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">Precio promedio:</span>
              <span className="font-mono text-slate-200">${prod.avgPrice.toFixed(2)} / {prod.itemType === 'caja' ? 'caja' : 'kg'}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Participación en volumen:</span>
              <span className="font-mono text-emerald-300 font-bold">{prod.volumePercent}% del total</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Participación en ingresos:</span>
              <span className="font-mono text-amber-300 font-bold">{prod.revenuePercent}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading && !data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-medium">Cargando métricas de ventas y análisis de volumen...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 m-4">
        <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800">No se pudieron obtener los datos de análisis</h3>
        <button
          onClick={() => fetchAnalytics()}
          className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      {/* HEADER & TIME WINDOW CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> Analítica Visual POS
            </span>
            <span className="text-xs text-slate-500">• Bodega Central de Abasto CDMX</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Análisis de Volumen & Productos Más Vendidos</h1>
          <p className="text-xs text-slate-500">
            Monitoreo en tiempo real del ritmo de desplazamiento diario, calibres con mayor demanda y rendimiento comercial de mostrador.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
          {/* Time range buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedDays(7)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDays === 7 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setSelectedDays(14)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDays === 14 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Días
            </button>
            <button
              onClick={() => setSelectedDays(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDays === 30 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
          </div>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Exportar reporte analítico a CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchAnalytics(selectedDays)}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Volumen Despachado</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {data.summary.totalBoxes.toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-500">cajas</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{data.summary.totalKg.toLocaleString('es-MX')} kg netos</span>
            <span className="font-semibold text-emerald-700">~{data.summary.avgBoxesPerDay} cjs/día</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-6 -mt-6 pointer-events-none opacity-60"></div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Ventas Totales</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${data.summary.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{data.summary.totalTickets} transacciones</span>
            <span className="font-semibold text-slate-700">Prom. ${data.summary.avgTicket}/tkt</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-full -mr-6 -mt-6 pointer-events-none opacity-60"></div>
        </div>

        {/* Top Product Performer */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Producto Líder</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate" title={data.summary.topProduct.name}>
            {data.summary.topProduct.name}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{data.summary.topProduct.boxes} cajas colocadas</span>
            <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
              {data.summary.topProduct.share}% volumen
            </span>
          </div>
        </div>

        {/* Peak Day */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Día Pico de Demanda</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {data.summary.peakDay.boxes} <span className="text-xs font-normal text-slate-500">cajas</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="font-semibold text-slate-700">{data.summary.peakDay.label}</span>
            <span className="font-mono text-emerald-700">${data.summary.peakDay.revenue.toLocaleString('es-MX')}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: DAILY SALES VOLUME BAR CHART (RECHARTS) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Volumen Diario de Ventas ({selectedDays} días)
            </h2>
            <p className="text-xs text-slate-500">
              Comportamiento del flujo de ventas día por día, comparando volumen físico (cajas) e ingresos generados.
            </p>
          </div>

          {/* Metric View Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setDailyView('dual_axis')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                dailyView === 'dual_axis' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cajas & Ingresos ($)
            </button>
            <button
              onClick={() => setDailyView('volume_boxes')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                dailyView === 'volume_boxes' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solo Cajas (40 lb)
            </button>
            <button
              onClick={() => setDailyView('volume_kg')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                dailyView === 'volume_kg' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kilogramos (kg)
            </button>
            <button
              onClick={() => setDailyView('revenue')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                dailyView === 'revenue' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ingreso ($ MXN)
            </button>
          </div>
        </div>

        {/* RECHARTS CONTAINER */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {dailyView === 'dual_axis' ? (
              <ComposedChart data={data.dailySales} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 11, fill: '#059669' }}
                  tickLine={false}
                  axisLine={{ stroke: '#059669' }}
                  tickFormatter={(val) => `${val} cjs`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#d97706' }}
                  tickLine={false}
                  axisLine={{ stroke: '#d97706' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} 
                />
                <ReferenceLine 
                  yAxisId="left" 
                  y={data.summary.avgBoxesPerDay} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  label={{ value: `Promedio: ${data.summary.avgBoxesPerDay} cjs`, fill: '#059669', fontSize: 10, position: 'insideTopLeft' }} 
                />
                <Bar 
                  yAxisId="left"
                  dataKey="totalBoxes" 
                  name="Volumen (Cajas)" 
                  fill="#059669" 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedDays > 14 ? 14 : 24}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="totalRevenue" 
                  name="Ingreso Total ($ MXN)" 
                  stroke="#d97706" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#d97706', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            ) : dailyView === 'volume_boxes' ? (
              <BarChart data={data.dailySales} margin={{ top: 15, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val} cjs`}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                <ReferenceLine 
                  y={data.summary.avgBoxesPerDay} 
                  stroke="#059669" 
                  strokeDasharray="4 4" 
                  label={{ value: `Promedio: ${data.summary.avgBoxesPerDay} cjs/día`, fill: '#059669', fontSize: 11 }} 
                />
                <Bar 
                  dataKey="totalBoxes" 
                  name="Cajas Vendidas (40 lb)" 
                  fill="#059669" 
                  radius={[6, 6, 0, 0]}
                  barSize={selectedDays > 14 ? 14 : 26}
                >
                  {data.dailySales.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.totalBoxes >= data.summary.peakDay.boxes ? '#047857' : '#059669'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : dailyView === 'volume_kg' ? (
              <BarChart data={data.dailySales} margin={{ top: 15, right: 15, left: -5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val} kg`}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                <Bar 
                  dataKey="totalKg" 
                  name="Kilogramos Netos (kg)" 
                  fill="#0d9488" 
                  radius={[6, 6, 0, 0]}
                  barSize={selectedDays > 14 ? 14 : 26}
                />
              </BarChart>
            ) : (
              <BarChart data={data.dailySales} margin={{ top: 15, right: 15, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                <ReferenceLine 
                  y={data.summary.avgRevenuePerDay} 
                  stroke="#d97706" 
                  strokeDasharray="4 4" 
                  label={{ value: `Promedio: $${data.summary.avgRevenuePerDay.toLocaleString()} MXN`, fill: '#d97706', fontSize: 11 }} 
                />
                <Bar 
                  dataKey="cashRevenue" 
                  name="Efectivo Caja" 
                  stackId="a" 
                  fill="#059669" 
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="bankRevenue" 
                  name="Bancos / SPEI" 
                  stackId="a" 
                  fill="#0284c7" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Trend Footer Notes */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span> Pico semanal: Lunes, Jueves y Sábados
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-600"></span> Mayor cobro bancario en clientes taqueros/mayoristas
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {data.dailySales.length} días analizados en Bodega CDMX
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: TOP-SELLING PRODUCTS BAR CHART (RECHARTS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 8 cols: Top Products Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Productos & Calibres Más Vendidos
              </h2>
              <p className="text-xs text-slate-500">
                Ranking de presentaciones por cajas despachadas, ingresos brutos y rotación en bodega.
              </p>
            </div>

            {/* Product Metric View */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setProductView('boxes')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  productView === 'boxes' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Cajas
              </button>
              <button
                onClick={() => setProductView('revenue')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  productView === 'revenue' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Ingresos ($)
              </button>
              <button
                onClick={() => setProductView('kg')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  productView === 'kg' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Kilos
              </button>
            </div>
          </div>

          {/* TOP PRODUCTS HORIZONTAL / VERTICAL BAR CHART */}
          <div className="h-80 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.topProducts}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length) {
                    setActiveProductHover(state.activePayload[0].payload.name);
                  }
                }}
                onMouseLeave={() => setActiveProductHover(null)}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => productView === 'revenue' ? `$${(val / 1000).toFixed(0)}k` : `${val}`}
                />
                <YAxis 
                  dataKey="calibre" 
                  type="category"
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  width={60}
                />
                <Tooltip content={<CustomProductTooltip />} />
                <Bar 
                  dataKey={productView === 'boxes' ? 'boxesSold' : productView === 'revenue' ? 'revenue' : 'kgSold'}
                  name={productView === 'boxes' ? 'Cajas Vendidas' : productView === 'revenue' ? 'Ingresos ($)' : 'Kilos Vendidos'}
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                >
                  {data.topProducts.map((entry, index) => (
                    <Cell 
                      key={`prod-cell-${index}`}
                      fill={entry.color || PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
                      opacity={activeProductHover ? (activeProductHover === entry.name ? 1 : 0.4) : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranking Cards / Calibres */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            {data.topProducts.slice(0, 4).map((p, idx) => (
              <div 
                key={p.id}
                onMouseEnter={() => setActiveProductHover(p.name)}
                onMouseLeave={() => setActiveProductHover(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeProductHover === p.name 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs' 
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    {p.calibre}
                  </span>
                  <span className="text-emerald-700 font-mono">${p.avgPrice.toFixed(0)}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1 font-mono">
                  {p.boxesSold > 0 ? `${p.boxesSold} cjs` : `${p.kgSold} kg`}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  ${p.revenue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT 4 cols: Customer Breakdown & Peak Hours */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Segment Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Demanda por Tipo de Cliente
            </h3>

            <div className="space-y-3 text-xs pt-1">
              {data.customerTypes.map((c) => (
                <div key={c.type} className="space-y-1">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {c.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ${c.revenue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{c.boxes} cajas ({c.kg.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg)</span>
                    <span className="font-semibold text-emerald-700">{c.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Split */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-sky-600" />
              Mix de Medios de Pago
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.paymentMethods.map(pm => (
                <div key={pm.method} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">{pm.label}</div>
                  <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                    ${pm.revenue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {pm.count} cobros ({pm.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: HOURLY SALES HEATMAP & COMPREHENSIVE TABLE */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Horario Pico de Operación en Central de Abasto (4:00 AM - 2:00 PM)
            </h3>
            <p className="text-xs text-slate-500">
              Distribución horaria promedio de cajas y transacciones en andén durante el turno comercial matutino.
            </p>
          </div>

          <button
            onClick={() => setShowHourly(!showHourly)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1"
          >
            {showHourly ? 'Ocultar gráfico horario' : 'Ver gráfico horario'}
          </button>
        </div>

        {showHourly && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlySales} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val} cjs`}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value} cajas despachadas`, 'Volumen']}
                  labelFormatter={(lbl) => `Hora: ${lbl}`}
                />
                <Bar 
                  dataKey="boxes" 
                  name="Cajas Despachadas" 
                  fill="#d97706" 
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                >
                  {data.hourlySales.map((entry, index) => (
                    <Cell 
                      key={`hour-cell-${index}`}
                      fill={entry.boxes >= 120 ? '#b45309' : entry.boxes >= 70 ? '#d97706' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed Product Ranking Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="px-4 py-3">Ranking & Calibre</th>
                <th className="px-4 py-3">Presentación</th>
                <th className="px-4 py-3 text-right">Cajas Vendidas</th>
                <th className="px-4 py-3 text-right">Kilos Netos</th>
                <th className="px-4 py-3 text-right">Precio Promedio</th>
                <th className="px-4 py-3 text-right">Ingresos ($ MXN)</th>
                <th className="px-4 py-3 text-right">% Volumen</th>
                <th className="px-4 py-3 text-right">% Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.topProducts.map((prod, index) => (
                <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-800' :
                      index === 1 ? 'bg-slate-200 text-slate-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {prod.calibre}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {prod.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {prod.boxesSold > 0 ? `${prod.boxesSold} cjs` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-teal-700">
                    {prod.kgSold.toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    ${prod.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    ${prod.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-purple-700">
                    {prod.volumePercent}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-amber-700">
                    {prod.revenuePercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
