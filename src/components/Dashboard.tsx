import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  Thermometer, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Info,
  Calendar,
  DollarSign,
  Scale,
  Truck,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Boxes,
  Percent,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import type { DashboardStats } from '../types';

interface DailyDataPoint {
  date: string;
  label: string;
  weekday: string;
  kilos: number;
  tons: number;
  accumulatedKg: number;
  accumulatedTons: number;
  amount: number;
  trucks: number;
  variety: string;
  movingAverage?: number;
}

interface CostItem {
  id: string;
  concept: string;
  costPerKg: number;
  percentage: number;
  category: string;
  color: string;
  description: string;
  isOperational: boolean;
}

interface AnalyticsSummary {
  period: string;
  variety: string;
  totalVolumeKg: number;
  totalVolumeTons: number;
  dailyAverageKg: number;
  peakDay: {
    date: string;
    label: string;
    kilos: number;
    tons: number;
  };
  totalOperationalCostPerKg: number;
  totalFruitCostPerKg: number;
  totalFullCostPerKg: number;
  standardCapacityKgDay: number;
  receptionExtraChargePerKg: number;
  scaleFeeDefault: number;
}

interface AnalyticsResponse {
  dailyData: DailyDataPoint[];
  costDistribution: CostItem[];
  summary: AnalyticsSummary;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chart View Controls
  const [volumeViewMode, setVolumeViewMode] = useState<'daily' | 'accumulated' | 'trucks'>('daily');
  const [unitMode, setUnitMode] = useState<'kg' | 'tons'>('kg');
  const [costFilterMode, setCostFilterMode] = useState<'operational_only' | 'full_cost'>('operational_only');
  const [activeCostIndex, setActiveCostIndex] = useState<number | null>(null);
  const [simulationKg, setSimulationKg] = useState<number>(14000); // 1 Camión Torton típico (14,000 kg)

  const fetchAllData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, analyticsRes] = await Promise.all([
        fetch('/api/dashboard/stats').then(r => r.ok ? r.json() : null),
        fetch('/api/analytics/reception-30days').then(r => r.ok ? r.json() : null)
      ]);

      if (statsRes) setStats(statsRes);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered cost data according to costFilterMode
  const displayedCosts = useMemo(() => {
    if (!analytics?.costDistribution) return [];
    if (costFilterMode === 'operational_only') {
      const operational = analytics.costDistribution.filter(c => c.isOperational);
      const totalOp = operational.reduce((sum, c) => sum + c.costPerKg, 0);
      return operational.map(c => ({
        ...c,
        percentage: Number(((c.costPerKg / totalOp) * 100).toFixed(1))
      }));
    }
    return analytics.costDistribution;
  }, [analytics, costFilterMode]);

  // Aggregated Cost by Department / Stage
  const departmentCosts = useMemo(() => {
    if (!displayedCosts) return [];
    const grouped: Record<string, { category: string; costPerKg: number; color: string }> = {};
    displayedCosts.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = { category: item.category, costPerKg: 0, color: item.color };
      }
      grouped[item.category].costPerKg += item.costPerKg;
    });
    return Object.values(grouped).map(g => ({
      ...g,
      costPerKg: Number(g.costPerKg.toFixed(2))
    }));
  }, [displayedCosts]);

  // Total calculated cost per kg for current active view
  const currentTotalCostPerKg = useMemo(() => {
    return displayedCosts.reduce((sum, item) => sum + item.costPerKg, 0);
  }, [displayedCosts]);

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <RefreshCw className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm font-semibold">Cargando panel de control e indicadores de acopio...</p>
      </div>
    );
  }

  const summary = analytics?.summary;
  const dailyData = analytics?.dailyData || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Corporate Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Acopio Activo • 100% Limón Mexicano
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              • Báscula Camionera 80 Ton en Línea
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Panel de Control & Rendimiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Monitoreo en tiempo real de volumen recibido (últimos 30 días) y estructura de costos operativos por kilo
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
            <span>{isRefreshing ? "Actualizando..." : "Actualizar"}</span>
          </button>

          <div className="text-right pl-3 border-l border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período de Análisis</p>
            <p className="text-xs font-black text-slate-800 flex items-center gap-1 justify-end">
              <Calendar size={13} className="text-emerald-600" />
              Últimos 30 Días
            </p>
          </div>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Volumen Total 30 Días */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Scale size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ArrowUpRight size={12} />
              +14.2% vs mes ant.
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Volumen Recibido (30 Días)</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {summary ? (summary.totalVolumeKg).toLocaleString('es-MX') : '0'}
              </span>
              <span className="text-xs text-slate-400 font-black">kg netos</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>Equivalente:</span>
              <span className="font-bold text-emerald-700">{summary?.totalVolumeTons.toLocaleString()} Toneladas</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2: Costo Operativo por Kilo */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <DollarSign size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Maniobra $0.40/kg
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Costo Operativo Promedio</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                ${summary ? summary.totalOperationalCostPerKg.toFixed(2) : '3.55'}
              </span>
              <span className="text-xs text-slate-400 font-black">/ kg recibido</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>Costo Integral con Fruta:</span>
              <span className="font-bold text-slate-800">${summary?.totalFullCostPerKg.toFixed(2)}/kg</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Promedio Diario & Día Pico */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Pico: {summary?.peakDay.label}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Promedio Diario Acopio</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {summary ? (summary.dailyAverageKg).toLocaleString('es-MX') : '0'}
              </span>
              <span className="text-xs text-slate-400 font-black">kg / día</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>Récord 30 Días:</span>
              <span className="font-bold text-blue-700">{summary?.peakDay.kilos.toLocaleString()} kg</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 4: Cajas y Cámara Fría */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Boxes size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Cámara: {stats?.coldStorageStock || 142} pallets
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cajas Empacadas</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {stats?.boxesPacked.toLocaleString() || '8,940'}
              </span>
              <span className="text-xs text-slate-400 font-black">cajas 15kg</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
              <span>Eficiencia Empaque:</span>
              <span className="font-bold text-emerald-600">98.5% Calidad</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 1: CHART OF 30-DAY CITRUS RECEPTION VOLUME */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                <BarChart3 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Volumen Total de Cítricos Recibidos (Últimos 30 Días)
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Recepción diaria y acumulada en báscula camionera • Variedad exclusiva: <strong className="text-emerald-700">Limón Mexicano</strong>
                </p>
              </div>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setVolumeViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  volumeViewMode === 'daily' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Diario ({unitMode === 'kg' ? 'kg' : 'Tons'})
              </button>
              <button
                onClick={() => setVolumeViewMode('accumulated')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  volumeViewMode === 'accumulated' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Acumulado 30D
              </button>
              <button
                onClick={() => setVolumeViewMode('trucks')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  volumeViewMode === 'trucks' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Boletas / Camiones
              </button>
            </div>

            {/* Unit toggle (kg vs tons) */}
            {volumeViewMode !== 'trucks' && (
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setUnitMode('kg')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    unitMode === 'kg' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  kg
                </button>
                <button
                  onClick={() => setUnitMode('tons')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    unitMode === 'tons' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tons
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recharts AreaChart & BarChart */}
        <div className="h-[340px] sm:h-[380px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {volumeViewMode === 'accumulated' ? (
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="accumulatedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={2}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => unitMode === 'kg' ? `${(val / 1000).toFixed(0)}k kg` : `${val} T`}
                  dx={-5}
                />
                <Tooltip 
                  content={<CustomVolumeTooltip unitMode={unitMode} viewMode={volumeViewMode} />}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Area 
                  type="monotone" 
                  name={unitMode === 'kg' ? 'Kilos Acumulados (kg)' : 'Toneladas Acumuladas (Tons)'}
                  dataKey={unitMode === 'kg' ? 'accumulatedKg' : 'accumulatedTons'} 
                  stroke="#059669" 
                  strokeWidth={3}
                  fill="url(#accumulatedGradient)"
                />
              </AreaChart>
            ) : volumeViewMode === 'trucks' ? (
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  interval={2}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dx={-5}
                />
                <Tooltip 
                  content={<CustomVolumeTooltip unitMode={unitMode} viewMode={volumeViewMode} />}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Bar 
                  name="Boletas de Báscula / Camiones por Día" 
                  dataKey="trucks" 
                  fill="#0ea5e9" 
                  radius={[6, 6, 0, 0]} 
                  barSize={18}
                />
              </BarChart>
            ) : (
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="citrusGradient" x1="0" y1="0" x2="0" y2="1">
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
                  interval={2}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => unitMode === 'kg' ? `${(val / 1000).toFixed(0)}k kg` : `${val} T`}
                  dx={-5}
                />
                <Tooltip 
                  content={<CustomVolumeTooltip unitMode={unitMode} viewMode={volumeViewMode} />}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                
                {/* Meta de capacidad operativa diaria (12,000 kg) */}
                <ReferenceLine 
                  y={unitMode === 'kg' ? 12000 : 12.0} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Capacidad Meta Diaria (12 Ton)', fill: '#b45309', fontSize: 10, position: 'insideTopRight' }} 
                />

                <Area 
                  type="monotone" 
                  name={unitMode === 'kg' ? 'Kilos Recibidos Diarios (kg)' : 'Toneladas Recibidas (Tons)'}
                  dataKey={unitMode === 'kg' ? 'kilos' : 'tons'} 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fill="url(#citrusGradient)" 
                />

                <Line 
                  type="monotone" 
                  name="Promedio Móvil 7 Días" 
                  dataKey={unitMode === 'kg' ? 'movingAverage' : (d => Number(((d.movingAverage || 0)/1000).toFixed(2)))} 
                  stroke="#047857" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="3 3"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 30-Day Volume Quick Metrics Pill Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Acumulado 30D</span>
            <p className="text-sm sm:text-base font-black text-slate-900 font-mono">
              {summary?.totalVolumeKg.toLocaleString()} kg
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Día con Mayor Entrada</span>
            <p className="text-sm sm:text-base font-black text-emerald-700 font-mono">
              {summary?.peakDay.kilos.toLocaleString()} kg <span className="text-[10px] text-slate-500 font-sans">({summary?.peakDay.label})</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Promedio Diario</span>
            <p className="text-sm sm:text-base font-black text-slate-900 font-mono">
              {summary?.dailyAverageKg.toLocaleString()} kg / día
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Variedad Registrada</span>
            <p className="text-sm sm:text-base font-black text-emerald-800 flex items-center gap-1">
              🍋 Limón Mexicano
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: DISTRIBUTION OF OPERATIONAL COSTS PER KILO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Donut & Stacked Department Chart */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black">
                <PieChartIcon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Distribución de Costos Operativos por Kilo
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Desglose de los costos de báscula, maniobra ($0.40/kg), empaque y logística
                </p>
              </div>
            </div>

            {/* Cost Filter: Operational Only vs Full Cost */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setCostFilterMode('operational_only')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  costFilterMode === 'operational_only' 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Solo Costos Operativos (${summary?.totalOperationalCostPerKg.toFixed(2)}/kg)
              </button>
              <button
                onClick={() => setCostFilterMode('full_cost')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  costFilterMode === 'full_cost' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Costo Integral (${summary?.totalFullCostPerKg.toFixed(2)}/kg)
              </button>
            </div>
          </div>

          {/* Donut Chart & Center Metric */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-7 h-[260px] sm:h-[290px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayedCosts}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="costPerKg"
                    nameKey="concept"
                    onMouseEnter={(_, index) => setActiveCostIndex(index)}
                    onMouseLeave={() => setActiveCostIndex(null)}
                  >
                    {displayedCosts.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="#ffffff"
                        strokeWidth={activeCostIndex === index ? 3 : 1}
                        style={{
                          filter: activeCostIndex === index ? 'brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomCostTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {costFilterMode === 'operational_only' ? 'Total Operativo' : 'Costo Integral'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  ${currentTotalCostPerKg.toFixed(2)}
                </span>
                <span className="text-[11px] font-bold text-slate-500">por kilo</span>
              </div>
            </div>

            {/* Department Summary Bars */}
            <div className="md:col-span-5 space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 flex items-center justify-between">
                <span>Por Etapa de Proceso</span>
                <span>$/kg</span>
              </div>
              {departmentCosts.map(dept => {
                const pct = currentTotalCostPerKg > 0 
                  ? ((dept.costPerKg / currentTotalCostPerKg) * 100).toFixed(1) 
                  : '0';
                return (
                  <div key={dept.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                        {dept.category}
                      </span>
                      <span className="font-mono font-bold text-slate-900">${dept.costPerKg.toFixed(2)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%`, backgroundColor: dept.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Cost Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-black uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">Concepto Operativo</th>
                  <th className="px-3 py-2.5">Etapa</th>
                  <th className="px-3 py-2.5 text-right">Costo / Kg</th>
                  <th className="px-3.5 py-2.5 text-right">% Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCosts.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.id === 'maniobra' ? 'bg-amber-50/60 font-bold' : ''
                    }`}
                  >
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <div className="font-bold text-slate-900">{item.concept}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-600">{item.category}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">
                      ${item.costPerKg.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-600">
                      {item.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Volume Cost Simulator & Operational Impact */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Simulator Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                    Simulador de Costos en Lote
                  </h3>
                  <p className="text-[11px] text-slate-400">Calcula el impacto según los kilos procesados</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                En Vivo
              </span>
            </div>

            {/* Quick volume selector buttons */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Volumen a Simular (Kilos Netos de Limón Mexicano):
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Camioneta (4,000 kg)', val: 4000 },
                  { label: 'Torton (14,000 kg)', val: 14000 },
                  { label: 'Trailer (28,000 kg)', val: 28000 }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setSimulationKg(opt.val)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                      simulationKg === opt.val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={simulationKg}
                  onChange={e => setSimulationKg(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-black text-lg outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-500">kg netos</span>
              </div>
            </div>

            {/* Simulated breakdown */}
            <div className="space-y-2 text-xs font-mono pt-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-sans text-slate-400">Fruta Productor ($18.50/kg):</span>
                <span className="font-bold text-slate-100">${(simulationKg * 18.50).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-amber-400">
                <span className="font-sans">Maniobra & Descarga ($0.40/kg):</span>
                <span className="font-bold">+${(simulationKg * 0.40).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-cyan-400">
                <span className="font-sans">Lavado & Encerado ($0.60/kg):</span>
                <span className="font-bold">+${(simulationKg * 0.60).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-blue-400">
                <span className="font-sans">Selección & Empaque ($0.90/kg):</span>
                <span className="font-bold">+${(simulationKg * 0.90).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-indigo-400">
                <span className="font-sans">Cadena de Frío ($0.35/kg):</span>
                <span className="font-bold">+${(simulationKg * 0.35).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-pink-400">
                <span className="font-sans">Flete Refrigerado ($0.80/kg):</span>
                <span className="font-bold">+${(simulationKg * 0.80).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-purple-400">
                <span className="font-sans">Insumos & Tarimas ($0.45/kg):</span>
                <span className="font-bold">+${(simulationKg * 0.45).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Total simulated operational cost */}
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-amber-300 font-bold">
                <span className="font-sans uppercase text-[11px]">Total Costos Operativos:</span>
                <span className="text-sm">${(simulationKg * (summary?.totalOperationalCostPerKg || 3.55)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Total full investment */}
              <div className="border-t-2 border-slate-700 pt-2.5 flex justify-between items-center text-white">
                <div>
                  <span className="font-sans uppercase text-[11px] font-black text-amber-400 block">
                    INVERSIÓN TOTAL LOTE:
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">Fruta + Todos los Procesos</span>
                </div>
                <span className="text-xl font-black text-amber-400">
                  ${(simulationKg * (summary?.totalFullCostPerKg || 22.05)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Policy & Fixed Rates Card */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              Parámetros Oficiales de Recepción JBM
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-slate-700">
                  <strong className="text-emerald-950">Cargo Operativo Fijo:</strong> Se aplican <strong>$0.40 MXN</strong> por kilo neto recibido para cubrir cuadrilla y maniobras de tolva.
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <Scale size={16} className="text-slate-600 shrink-0 mt-0.5" />
                <div className="text-slate-700">
                  <strong className="text-slate-900">Tarifa de Báscula:</strong> $50.00 MXN fijos por boleta (retención directa en liquidación o pago en efectivo).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Tooltip for 30-day Citrus Volume Chart
function CustomVolumeTooltip({ active, payload, label, unitMode, viewMode }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1.5 min-w-[200px]">
        <div className="font-black text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center">
          <span>{data.label} ({data.weekday})</span>
          <span className="text-[10px] text-emerald-400 uppercase font-mono">🍋 Limón Mexicano</span>
        </div>
        <div className="space-y-1 font-mono pt-1">
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Volumen Diario:</span>
            <span className="font-bold text-emerald-400">{data.kilos.toLocaleString()} kg ({data.tons} T)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Acumulado 30D:</span>
            <span className="font-bold text-slate-100">{data.accumulatedKg.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Boletas / Camiones:</span>
            <span className="font-bold text-blue-400">{data.trucks} entradas</span>
          </div>
          <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/80">
            <span className="font-sans text-slate-400">Total Liquidado:</span>
            <span className="font-bold text-amber-400">${data.amount.toLocaleString('es-MX')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Cost Distribution Chart
function CustomCostTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1.5 max-w-[250px]">
        <div className="font-black text-slate-200 border-b border-slate-800 pb-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span>{item.concept}</span>
        </div>
        <div className="space-y-1 font-mono pt-1">
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Costo por Kilo:</span>
            <span className="font-bold text-amber-400">${item.costPerKg.toFixed(2)} MXN</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Participación:</span>
            <span className="font-bold text-slate-100">{item.percentage}%</span>
          </div>
          <div className="text-[11px] font-sans text-slate-400 pt-1 border-t border-slate-800">
            {item.description}
          </div>
        </div>
      </div>
    );
  }
  return null;
}
