import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scale, 
  Package, 
  ShoppingBag, 
  RefreshCw, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  User, 
  DollarSign, 
  Boxes, 
  Eye, 
  X, 
  Play, 
  Pause, 
  ChevronRight, 
  Sparkles, 
  Tag, 
  Layers, 
  Maximize2,
  FileText,
  CreditCard,
  Building2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export interface OperationFeedItem {
  id: string;
  entityId: number;
  type: 'weight_entry' | 'stock_movement' | 'pos_transaction';
  categoryLabel: string;
  folio: string;
  ticketFolio?: string | null;
  title: string;
  subtitle: string;
  timestamp: string;
  date?: string;
  badge: {
    label: string;
    variant: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
  };
  metrics: {
    primaryValue: string;
    primaryLabel: string;
    secondaryValue?: string;
    secondaryLabel?: string;
  };
  details: {
    grossWeight?: number;
    tareWeight?: number;
    netWeight?: number;
    pricePerKg?: number;
    scaleFee?: number;
    producer?: string;
    driver?: string;
    plates?: string;
    operator?: string;
    variety?: string;
    itemName?: string;
    movementType?: string;
    qty?: number;
    prevQty?: number;
    newQty?: number;
    reason?: string;
    delta?: string;
    customer?: string;
    itemsCount?: number;
    subtotal?: number;
    tax?: number;
    total?: number;
    paymentMethod?: string;
  };
}

interface OperationsResponse {
  operations: OperationFeedItem[];
  totalCount: number;
  summary: {
    totalOperations: number;
    weightEntriesCount: number;
    totalWeightKg: number;
    stockMovementsCount: number;
    totalStockQtyMoved: number;
    posTransactionsCount: number;
    totalPosRevenue: number;
    lastUpdated: string;
  };
}

interface RecentOperationsFeedProps {
  onRefreshParent?: () => void;
}

export function RecentOperationsFeed({ onRefreshParent }: RecentOperationsFeedProps) {
  const [operations, setOperations] = useState<OperationFeedItem[]>([]);
  const [summary, setSummary] = useState<OperationsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'weight' | 'stock' | 'pos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [selectedOperation, setSelectedOperation] = useState<OperationFeedItem | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [newEntriesCount, setNewEntriesCount] = useState<number>(0);
  const previousIdsRef = useRef<Set<string>>(new Set());

  const fetchOperations = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const url = new URL('/api/operations/recent', window.location.origin);
      if (selectedCategory !== 'all') url.searchParams.set('category', selectedCategory);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());
      url.searchParams.set('limit', '35');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Error al consultar operaciones recientes');
      const data: OperationsResponse = await res.json();

      // Check if new items arrived
      if (previousIdsRef.current.size > 0 && data.operations.length > 0) {
        const newlyAdded = data.operations.filter(op => !previousIdsRef.current.has(op.id));
        if (newlyAdded.length > 0) {
          setNewEntriesCount(prev => prev + newlyAdded.length);
        }
      }

      previousIdsRef.current = new Set(data.operations.map(op => op.id));
      setOperations(data.operations || []);
      setSummary(data.summary || null);
      setLastFetchTime(new Date());
    } catch (err) {
      console.error('Error fetching recent operations:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load and filter change
  useEffect(() => {
    fetchOperations();
  }, [selectedCategory]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOperations();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Live Auto-Refresh Interval (Every 12 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOperations(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedCategory, searchQuery]);

  const handleManualRefresh = () => {
    setNewEntriesCount(0);
    fetchOperations(false);
    if (onRefreshParent) onRefreshParent();
  };

  // Helper for relative time formatting
  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHour / 24);

      if (diffSec < 45) return 'Justo ahora';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHour < 24) return `Hace ${diffHour} h`;
      if (diffDays === 1) return 'Ayer';
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Badge Color Variant Helper
  const getBadgeClasses = (variant: string) => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700';
      case 'blue':
        return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700';
      case 'amber':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700';
      case 'purple':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  // Icon Helper per Operation Type
  const getTypeIcon = (type: OperationFeedItem['type']) => {
    switch (type) {
      case 'weight_entry':
        return <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'stock_movement':
        return <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'pos_transaction':
        return <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* ========================================================================= */}
      {/* 1. COMPONENT HEADER & REAL-TIME CONTROLS                                  */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'}`}></span>
                {autoRefresh ? 'Feed en Vivo (12s)' : 'Auto-refresco Pausado'}
              </span>
              {newEntriesCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  <Sparkles size={11} />
                  +{newEntriesCount} nuevas operaciones
                </span>
              )}
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                • Última sinc: {lastFetchTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Registro de Operaciones Recientes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Flujo unificado de pesajes de báscula camionera, movimientos de almacén e insumos, y ventas comerciales POS
            </p>
          </div>

          {/* Quick Action Controls (Auto-Refresh, Refresh, View Toggle) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
              title={autoRefresh ? 'Pausar actualización automática' : 'Reanudar actualización automática'}
            >
              {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
              <span className="hidden sm:inline">{autoRefresh ? 'Pausar' : 'Reanudar'}</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Actualizar registro ahora"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-emerald-600' : ''} />
              <span>{isRefreshing ? 'Consultando...' : 'Actualizar'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Vista de lista compacta"
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Vista de tarjetas expandidas"
              >
                Tarjetas
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills & Live Search Input */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Layers size={13} />
              <span>Todos los Registros</span>
              {summary && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-slate-900/30">
                  {summary.totalOperations}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedCategory('weight')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'weight'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Scale size={13} />
              <span>⚖️ Báscula / Pesajes</span>
              {summary && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-slate-900/30">
                  {summary.weightEntriesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedCategory('stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'stock'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Package size={13} />
              <span>📦 Movimientos de Stock</span>
              {summary && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-slate-900/30">
                  {summary.stockMovementsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedCategory('pos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'pos'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <ShoppingBag size={13} />
              <span>💳 Ventas POS</span>
              {summary && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-slate-900/30">
                  {summary.posTransactionsCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px] md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por folio, productor, cliente..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REAL-TIME SUMMARY STATS KPI STRIP                                      */}
      {/* ========================================================================= */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3.5 sm:p-4">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Scale size={12} className="text-emerald-600" />
              Kilos Pesados en Báscula
            </span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {summary.totalWeightKg.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-400">kg</span>
            </p>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              {(summary.totalWeightKg / 1000).toFixed(1)} Toneladas Netas
            </span>
          </div>

          <div className="p-3.5 sm:p-4">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Package size={12} className="text-blue-600" />
              Insumos Movilizados
            </span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {summary.totalStockQtyMoved.toLocaleString()} <span className="text-xs font-sans font-bold text-slate-400">pzas</span>
            </p>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
              {summary.stockMovementsCount} registros de almacén
            </span>
          </div>

          <div className="p-3.5 sm:p-4">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <ShoppingBag size={12} className="text-purple-600" />
              Ventas Mostrador POS
            </span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              ${summary.totalPosRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">
              {summary.posTransactionsCount} tickets cobrados
            </span>
          </div>

          <div className="p-3.5 sm:p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Estado de Terminales
            </span>
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              3 Módulos Sincronizados
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Báscula + Almacén + POS
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FEED CONTENT (LIST OR CARDS VIEW)                                      */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 min-h-[300px]">
        {loading && operations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-emerald-600" />
            <p className="text-xs font-bold">Cargando bitácora de operaciones en tiempo real...</p>
          </div>
        ) : operations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Search size={22} />
            </div>
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">No se encontraron operaciones</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery ? `No hay resultados para la búsqueda "${searchQuery}".` : 'No hay registros recientes para la categoría seleccionada.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* ========================================================================= */
          /* COMPACT LIST VIEW                                                         */
          /* ========================================================================= */
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            <AnimatePresence initial={false}>
              {operations.map((op, index) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                  onClick={() => setSelectedOperation(op)}
                  className="py-3 px-2 sm:px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Icon, Category, Title, Subtitle */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${
                      op.type === 'weight_entry'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600'
                        : op.type === 'stock_movement'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600'
                        : 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-600'
                    }`}>
                      {getTypeIcon(op.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {op.folio}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full border ${getBadgeClasses(op.badge.variant)}`}>
                          {op.badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                          <Clock size={10} />
                          {formatRelativeTime(op.timestamp)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {op.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {op.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Metrics & Details Trigger */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {op.metrics.primaryLabel}
                      </span>
                      <span className={`font-mono font-black text-sm sm:text-base ${
                        op.type === 'weight_entry'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : op.type === 'stock_movement'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-purple-700 dark:text-purple-400'
                      }`}>
                        {op.metrics.primaryValue}
                      </span>
                      {op.metrics.secondaryValue && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                          {op.metrics.secondaryValue}
                        </span>
                      )}
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">
                      <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* ========================================================================= */
          /* EXPANDED CARDS GRID VIEW                                                  */
          /* ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence initial={false}>
              {operations.map((op, index) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                  onClick={() => setSelectedOperation(op)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative shadow-2xs hover:shadow-xs"
                >
                  {/* Top: Header & Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1.5 rounded-lg border ${
                          op.type === 'weight_entry'
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-600'
                            : op.type === 'stock_movement'
                            ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600'
                            : 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-600'
                        }`}>
                          {getTypeIcon(op.type)}
                        </div>
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          {op.folio}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getBadgeClasses(op.badge.variant)}`}>
                        {op.badge.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {op.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {op.subtitle}
                    </p>
                  </div>

                  {/* Bottom: Metrics & Timestamp */}
                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/70 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        {op.metrics.primaryLabel}
                      </span>
                      <span className={`font-mono font-black text-sm ${
                        op.type === 'weight_entry'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : op.type === 'stock_movement'
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-purple-700 dark:text-purple-400'
                      }`}>
                        {op.metrics.primaryValue}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        {formatRelativeTime(op.timestamp)}
                      </span>
                      {op.metrics.secondaryValue && (
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                          {op.metrics.secondaryValue}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER & NAVIGATION LINKS TO FULL MODULES                             */}
      {/* ========================================================================= */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 dark:text-slate-400 font-medium">
          Mostrando <strong className="text-slate-900 dark:text-white font-mono">{operations.length}</strong> operaciones ordenadas cronológicamente
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/recepcion"
            className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Ir a Báscula</span>
            <ArrowRight size={12} />
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            to="/insumos"
            className="font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Ir a Insumos</span>
            <ArrowRight size={12} />
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            to="/ventas"
            className="font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>Ir a Punto de Venta</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE OPERATION DETAIL MODAL                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedOperation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${
                    selectedOperation.type === 'weight_entry'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                      : selectedOperation.type === 'stock_movement'
                      ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                      : 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300'
                  }`}>
                    {getTypeIcon(selectedOperation.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {selectedOperation.folio}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full border ${getBadgeClasses(selectedOperation.badge.variant)}`}>
                        {selectedOperation.badge.label}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedOperation.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {selectedOperation.categoryLabel}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOperation(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Specific Breakdown per Operation Type */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {/* Weight Entry Details */}
                {selectedOperation.type === 'weight_entry' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Peso Bruto</span>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {(selectedOperation.details.grossWeight || 0).toLocaleString()} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Peso Tara</span>
                        <span className="font-mono font-black text-sm text-slate-500">
                          -{(selectedOperation.details.tareWeight || 0).toLocaleString()} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 block">Peso Neto</span>
                        <span className="font-mono font-black text-base text-emerald-700 dark:text-emerald-400">
                          {(selectedOperation.details.netWeight || 0).toLocaleString()} kg
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Productor:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedOperation.details.producer}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Variedad:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedOperation.details.variety}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Transportista & Placas:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {selectedOperation.details.driver} ({selectedOperation.details.plates})
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Precio Pactado / kg:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ${(selectedOperation.details.pricePerKg || 0).toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Tarifa de Báscula:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ${(selectedOperation.details.scaleFee || 50).toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="flex justify-between py-1 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                        <span>Total Liquidación:</span>
                        <span className="font-mono">{selectedOperation.metrics.secondaryValue}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock Movement Details */}
                {selectedOperation.type === 'stock_movement' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Stock Anterior</span>
                        <span className="font-mono font-black text-sm text-slate-600 dark:text-slate-400">
                          {(selectedOperation.details.prevQty || 0).toLocaleString()} pzas
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-600 block">Movimiento</span>
                        <span className="font-mono font-black text-sm text-blue-700 dark:text-blue-400">
                          {selectedOperation.details.delta}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Nuevo Stock</span>
                        <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                          {(selectedOperation.details.newQty || 0).toLocaleString()} pzas
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Material / Insumo:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedOperation.details.itemName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Tipo de Movimiento:</span>
                        <span className="font-bold text-blue-700 dark:text-blue-400">{selectedOperation.details.movementType}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Operador / Responsable:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedOperation.details.operator}</span>
                      </div>
                      <div className="py-1">
                        <span className="text-slate-500 block mb-0.5">Motivo / Justificación:</span>
                        <p className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {selectedOperation.details.reason || 'Sin observaciones adicionales'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* POS Transaction Details */}
                {selectedOperation.type === 'pos_transaction' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Transacción</span>
                        <span className="font-mono font-black text-base text-purple-700 dark:text-purple-400">
                          ${(selectedOperation.details.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Forma de Pago</span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                          <CreditCard size={13} className="text-purple-600" />
                          {selectedOperation.details.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Cliente:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedOperation.details.customer}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Partidas / Cajas:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedOperation.details.itemsCount} productos</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          ${(selectedOperation.details.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Impuestos (IVA):</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          ${(selectedOperation.details.tax || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 text-purple-700 dark:text-purple-400 font-black text-sm">
                        <span>Total Cobrado:</span>
                        <span className="font-mono">
                          ${(selectedOperation.details.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Timestamp Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Fecha: {new Date(selectedOperation.timestamp).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(selectedOperation.timestamp).toLocaleTimeString('es-MX')}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                {selectedOperation.type === 'weight_entry' && (
                  <Link
                    to="/recepcion"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>Ver en Módulo de Recepción</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
                {selectedOperation.type === 'stock_movement' && (
                  <Link
                    to="/insumos"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>Ver en Módulo de Insumos</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
                {selectedOperation.type === 'pos_transaction' && (
                  <Link
                    to="/ventas"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>Ver en Punto de Venta</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
