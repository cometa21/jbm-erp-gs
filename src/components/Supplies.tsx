import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  ShoppingCart, 
  Tag, 
  Layers, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  Filter, 
  Building2, 
  History, 
  FileText, 
  Edit3, 
  Trash2,
  BarChart2,
  Sparkles,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { InventoryItem, InventoryLog } from '../types';
import { SuppliesAlertsBanner } from './SuppliesAlertsBanner';
import { SuppliesThresholdModal } from './SuppliesThresholdModal';
import { SuppliesMovementModal } from './SuppliesMovementModal';
import { SuppliesPurchaseOrderModal } from './SuppliesPurchaseOrderModal';
import { SuppliesItemModal } from './SuppliesItemModal';

export function Supplies() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeAlertFilter, setActiveAlertFilter] = useState<'all' | 'critical' | 'low' | 'optimal'>('all');

  // Modals state
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'Entrada' | 'Salida' | 'Ajuste'>('Entrada');

  // Fetch items & logs
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [invRes, logsRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/logs')
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setItems(invData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (activeCategory !== 'todos' && item.category !== activeCategory) {
        return false;
      }

      // Alert level filter
      const critLevel = item.critical_stock ?? Math.round(item.min_stock * 0.4);
      const isCritical = item.quantity <= critLevel;
      const isLow = !isCritical && item.quantity <= item.min_stock;
      const isOptimal = item.quantity > item.min_stock;

      if (activeAlertFilter === 'critical' && !isCritical) return false;
      if (activeAlertFilter === 'low' && !isLow) return false;
      if (activeAlertFilter === 'optimal' && !isOptimal) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.item_name.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchSupp = item.supplier?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchSku && !matchSupp) return false;
      }

      return true;
    });
  }, [items, activeCategory, activeAlertFilter, searchQuery]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ['todos', ...Array.from(set)];
  }, [items]);

  // Quick Action Handlers
  const handleOpenMovement = (item: InventoryItem, type: 'Entrada' | 'Salida' | 'Ajuste') => {
    setMovementItem(item);
    setMovementType(type);
    setIsMovementModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleAddNewItem = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!window.confirm(`¿Estás seguro de eliminar el insumo "${item.item_name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Error deleting item:', e);
    }
  };

  // Counts for tabs
  const criticalCount = items.filter(i => i.quantity <= (i.critical_stock ?? (i.min_stock * 0.4))).length;
  const lowCount = items.filter(i => (
    i.quantity > (i.critical_stock ?? (i.min_stock * 0.4)) && 
    i.quantity <= i.min_stock
  )).length;
  const optimalCount = items.filter(i => i.quantity > i.min_stock).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Inventario de Insumos y Empaque
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Control Poscosecha
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Monitoreo en tiempo real de cajas, etiquetas, tarimas, flejes y suministros críticos para empaque
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setIsThresholdModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Sliders size={15} className="text-slate-500" />
            <span>Configurar Umbrales</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart size={15} className="text-amber-700" />
            <span>Requisición / Compras</span>
          </button>

          <button 
            type="button"
            onClick={handleAddNewItem}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-transform hover:scale-102 cursor-pointer"
          >
            <Plus size={16} />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </header>

      {/* 1. CENTRAL VISUAL ALERTS BANNER */}
      <SuppliesAlertsBanner
        items={items}
        onOpenThresholdConfig={() => setIsThresholdModalOpen(true)}
        onOpenPurchaseOrder={() => setIsPurchaseModalOpen(true)}
        onFilterCritical={() => setActiveAlertFilter('critical')}
        activeFilter={activeAlertFilter}
      />

      {/* 2. FILTERS, SEARCH & STATUS TABS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Alert Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveAlertFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeAlertFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveAlertFilter('critical')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeAlertFilter === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/20'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-ping" />
              🔴 Nivel Crítico ({criticalCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveAlertFilter('low')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeAlertFilter === 'low'
                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/20'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              🟡 Stock Bajo ({lowCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveAlertFilter('optimal')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeAlertFilter === 'optimal'
                  ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-700/20'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              🟢 Óptimo ({optimalCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar caja, etiqueta, SKU..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Category Horizontal Filter Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 shrink-0">
            Categoría:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'todos' ? 'Todas las Categorías' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MATERIAL CARDS GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Package size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron materiales</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Prueba ajustando los filtros de categoría o alerta para ver otros insumos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const critLevel = item.critical_stock ?? Math.round(item.min_stock * 0.4);
            const isCritical = item.quantity <= critLevel;
            const isLow = !isCritical && item.quantity <= item.min_stock;
            const isOptimal = item.quantity > item.min_stock;

            const isBox = item.category?.toLowerCase().includes('caja') || item.item_name.toLowerCase().includes('caja');
            const isLabel = item.category?.toLowerCase().includes('etiqueta') || item.item_name.toLowerCase().includes('etiqueta');
            const isPallet = item.category?.toLowerCase().includes('tarima') || item.item_name.toLowerCase().includes('pallet');

            const deficit = Math.max(0, item.min_stock - item.quantity);
            const maxCap = Math.max(item.quantity, item.min_stock * 1.5, 100);
            const currentPercent = Math.min(100, Math.round((item.quantity / maxCap) * 100));
            const minPercent = Math.min(100, Math.round((item.min_stock / maxCap) * 100));
            const critPercent = Math.min(100, Math.round((critLevel / maxCap) * 100));

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isCritical
                    ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/15 shadow-sm'
                    : isLow
                      ? 'border-amber-300 ring-2 ring-amber-500/15 bg-amber-50/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Visual Top Status Beacon / Pill */}
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isCritical
                        ? 'bg-rose-100 text-rose-700'
                        : isLow
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isBox ? <Package size={22} /> : isLabel ? <Tag size={22} /> : isPallet ? <Layers size={22} /> : <Package size={22} />}
                    </div>

                    {/* Alert Badge */}
                    <div className="flex items-center gap-1.5">
                      {isCritical ? (
                        <div className="flex items-center gap-1 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs animate-pulse">
                          <ShieldAlert size={12} />
                          <span>Desabasto Crítico</span>
                        </div>
                      ) : isLow ? (
                        <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs">
                          <AlertTriangle size={12} />
                          <span>Stock Bajo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 size={11} />
                          <span>Óptimo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title and Category */}
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {item.category} • {item.sku || 'SKU-00' + item.id}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-snug mt-0.5">
                      {item.item_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 truncate" title={item.supplier}>
                      Proveedor: {item.supplier || 'Cartonera del Golfo S.A.'}
                    </p>
                  </div>

                  {/* Stock Quantity Banner */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Stock Disponible
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                            isCritical ? 'text-rose-700' : isLow ? 'text-amber-700' : 'text-slate-900'
                          }`}>
                            {item.quantity.toLocaleString('es-MX')}
                          </span>
                          <span className="text-xs font-black text-slate-500 uppercase">{item.unit}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Umbrales</span>
                        <span className="text-xs font-bold text-slate-700 block">
                          Mín: <strong className="text-amber-700">{item.min_stock}</strong>
                        </span>
                        <span className="text-[11px] font-bold text-rose-700 block">
                          Crítico: <strong>{critLevel}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Threshold Visual Progress Bar */}
                    <div className="mt-2.5 space-y-1">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                        {/* Critical Marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10" 
                          style={{ left: `${critPercent}%` }} 
                          title={`Umbral Crítico: ${critLevel}`}
                        />
                        {/* Min Stock Marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" 
                          style={{ left: `${minPercent}%` }} 
                          title={`Umbral Mínimo: ${item.min_stock}`}
                        />
                        {/* Actual Bar */}
                        <div 
                          className={`h-full transition-all rounded-full ${
                            isCritical 
                              ? 'bg-rose-600' 
                              : isLow 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-600'
                          }`}
                          style={{ width: `${currentPercent}%` }}
                        />
                      </div>
                      
                      {/* Deficit Alert Warning text */}
                      {deficit > 0 && (
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="font-black text-rose-700">
                            🚨 Faltan {deficit.toLocaleString('es-MX')} {item.unit} para nivel mínimo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Quick Adjust */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenMovement(item, 'Salida')}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Registrar salida / consumo en empaque"
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMovement(item, 'Entrada')}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="Registrar entrada / recepción de pedido"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditItem(item)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar insumo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. RECENT MOVEMENTS LOG */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Bitácora de Movimientos de Almacén
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Registro histórico de entradas, consumos de empaque y ajustes de inventario
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Material</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3 text-right">Cantidad</th>
                <th className="py-3 px-3 text-right">Stock Anterior → Nuevo</th>
                <th className="py-3 px-4">Motivo / Concepto</th>
                <th className="py-3 px-3">Responsable</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Fecha / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No hay registros de movimientos recientes
                  </td>
                </tr>
              ) : (
                logs.slice(0, 15).map((log) => {
                  const isEntrada = log.type === 'Entrada';
                  const isSalida = log.type === 'Salida';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {log.item_name}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                          isEntrada 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isSalida 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isEntrada ? <ArrowDownRight size={11} /> : isSalida ? <ArrowUpRight size={11} /> : <RefreshCw size={10} />}
                          {log.type}
                        </span>
                      </td>
                      <td className={`py-3.5 px-3 text-right font-mono font-black text-sm ${
                        isEntrada ? 'text-emerald-700' : isSalida ? 'text-rose-700' : 'text-amber-700'
                      }`}>
                        {isEntrada ? '+' : isSalida ? '-' : ''}{log.qty.toLocaleString('es-MX')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500 text-xs">
                        {log.prev_qty !== undefined ? `${log.prev_qty} → ${log.new_qty}` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">
                        {log.reason || 'Movimiento estándar'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-bold text-xs">
                        {log.user || 'Almacén'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {log.date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Thresholds Configuration Modal */}
      <SuppliesThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        items={items}
        onSaveSuccess={fetchData}
      />

      {/* 2. Purchase Order / Requisition Modal */}
      <SuppliesPurchaseOrderModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        items={items}
      />

      {/* 3. Add / Edit Supply Item Modal */}
      <SuppliesItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={itemToEdit}
        onSuccess={fetchData}
      />

      {/* 4. Movement (In/Out/Adjust) Modal */}
      <SuppliesMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        item={movementItem}
        defaultType={movementType}
        onSuccess={fetchData}
      />
    </div>
  );
}
