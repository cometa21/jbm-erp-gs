import React, { useState, useEffect, useMemo } from 'react';
import { POSSale, POSUserRole, POSCartItem } from '../../types';
import { 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  RefreshCw, 
  Download, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  User, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft, 
  Ban, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  X, 
  Sparkles, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Package,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { POSThermalTicket } from './POSThermalTicket';
import { getCloudPOSSales } from '../../lib/cloudService';

interface POSTabHistorialProps {
  currentRole: POSUserRole;
  onNavigateToPOS?: () => void;
}

export const POSTabHistorial: React.FC<POSTabHistorialProps> = ({ 
  currentRole,
  onNavigateToPOS 
}) => {
  const [sales, setSales] = useState<POSSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoy' | 'ayer' | 'semana' | 'mes'>('todos');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('todos');

  // Modals & Selected States
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<POSSale | null>(null);
  const [saleForThermalTicket, setSaleForThermalTicket] = useState<POSSale | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<POSSale | null>(null);
  const [cancelReason, setCancelReason] = useState('Error en captura de artículos o cambio de método de pago');
  const [cancelling, setCancelling] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, cloudSales] = await Promise.allSettled([
        fetch('/api/pos/sales').then(r => r.ok ? r.json() : []),
        getCloudPOSSales()
      ]);
      const serverSales: POSSale[] = (res.status === 'fulfilled' && Array.isArray(res.value)) ? res.value : [];
      const firestoreSales: POSSale[] = (cloudSales.status === 'fulfilled' && Array.isArray(cloudSales.value)) ? cloudSales.value : [];

      const salesMap = new Map<string, POSSale>();
      for (const s of serverSales) salesMap.set(s.folio || `ID-${s.id}`, s);
      for (const s of firestoreSales) salesMap.set(s.folio || `ID-${s.id}`, s);
      const merged = Array.from(salesMap.values());
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSales(merged);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Filter logic
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return sales.filter(s => {
      // 1. Text Search (Folio, Customer Name, Phone, RFC, Operator, Items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const folioMatch = s.folio?.toLowerCase().includes(q);
        const nameMatch = s.customer_name?.toLowerCase().includes(q);
        const rfcMatch = s.customer_rfc?.toLowerCase().includes(q);
        const phoneMatch = s.customer_phone?.toLowerCase().includes(q);
        const opMatch = s.operator?.toLowerCase().includes(q);
        const itemsMatch = s.items?.some(it => 
          it.name.toLowerCase().includes(q) || 
          (it.calibre && it.calibre.toLowerCase().includes(q)) ||
          (it.lot_code && it.lot_code.toLowerCase().includes(q))
        );
        if (!folioMatch && !nameMatch && !rfcMatch && !phoneMatch && !opMatch && !itemsMatch) {
          return false;
        }
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'todos' && s.payment_method !== paymentFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'todos' && s.status !== statusFilter) {
        return false;
      }

      // 4. Customer Type Filter
      if (customerTypeFilter !== 'todos' && s.customer_type !== customerTypeFilter) {
        return false;
      }

      // 5. Date Filter
      if (dateFilter !== 'todos') {
        const saleDate = s.date ? new Date(s.date) : new Date();
        const saleDateStr = saleDate.toISOString().slice(0, 10);

        if (dateFilter === 'hoy' && saleDateStr !== todayStr) return false;
        if (dateFilter === 'ayer' && saleDateStr !== yesterdayStr) return false;
        if (dateFilter === 'semana' && saleDate < sevenDaysAgo) return false;
        if (dateFilter === 'mes' && saleDate < thirtyDaysAgo) return false;
      }

      return true;
    });
  }, [sales, searchQuery, dateFilter, paymentFilter, statusFilter, customerTypeFilter]);

  // Aggregate Metrics for Header
  const metrics = useMemo(() => {
    const activeSales = filteredSales.filter(s => s.status !== 'cancelada');
    const totalAmount = activeSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const count = activeSales.length;
    const avgTicket = count > 0 ? totalAmount / count : 0;

    let totalBoxes = 0;
    let totalKg = 0;
    let cashSales = 0;
    let digitalSales = 0;

    activeSales.forEach(s => {
      if (s.payment_method === 'Efectivo') cashSales += (s.total || 0);
      else digitalSales += (s.total || 0);

      (s.items || []).forEach(it => {
        if (it.item_type === 'caja') {
          totalBoxes += (it.qty || 0);
          totalKg += (it.kg_total || (it.qty * 18.14));
        } else {
          totalKg += (it.qty || 0);
        }
      });
    });

    return {
      totalAmount,
      count,
      avgTicket,
      totalBoxes,
      totalKg,
      cashSales,
      digitalSales,
      cancelledCount: filteredSales.filter(s => s.status === 'cancelada').length
    };
  }, [filteredSales]);

  // Handle Cancellation
  const handleCancelSale = async () => {
    if (!saleToCancel) return;
    try {
      setCancelling(true);
      const res = await fetch(`/api/pos/sales/${saleToCancel.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'No se pudo cancelar la venta.');
      }

      const updated = await res.json();
      setSales(prev => prev.map(s => s.id === updated.id ? updated : s));
      showNotification(`Venta ${saleToCancel.folio} cancelada exitosamente y stock restituido.`);
      setSaleToCancel(null);
      if (selectedSaleForDetail?.id === saleToCancel.id) {
        setSelectedSaleForDetail(updated);
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      showNotification('No hay transacciones para exportar con los filtros actuales.', 'error');
      return;
    }

    const headers = [
      'Folio',
      'Fecha',
      'Hora',
      'Cliente',
      'Tipo Cliente',
      'RFC',
      'Teléfono',
      'Artículos (Desglose)',
      'Total Cajas',
      'Total Kg',
      'Subtotal',
      'Descuento',
      'Total Pagado (MXN)',
      'Método de Pago',
      'Referencia / Folio',
      'Operador',
      'Estado',
      'Factura Solicitada',
      'Notas'
    ];

    const rows = filteredSales.map(s => {
      const saleDate = s.date ? new Date(s.date) : new Date();
      const datePart = saleDate.toLocaleDateString('es-MX');
      const timePart = saleDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      let boxes = 0;
      let kg = 0;
      const itemsSummary = (s.items || []).map(it => {
        if (it.item_type === 'caja') {
          boxes += it.qty;
          kg += (it.kg_total || it.qty * 18.14);
          return `${it.name} (${it.calibre || 'S/C'}) x ${it.qty} cjs ($${it.subtotal || it.qty * it.unit_price})`;
        } else {
          kg += it.qty;
          return `${it.name} (${it.calibre || 'S/C'}) x ${it.qty} kg ($${it.subtotal || it.qty * it.unit_price})`;
        }
      }).join('; ');

      return [
        `"${s.folio || ''}"`,
        `"${datePart}"`,
        `"${timePart}"`,
        `"${(s.customer_name || 'Venta Mostrador').replace(/"/g, '""')}"`,
        `"${s.customer_type || 'mostrador'}"`,
        `"${s.customer_rfc || ''}"`,
        `"${s.customer_phone || ''}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        boxes,
        kg.toFixed(2),
        (s.subtotal || s.total).toFixed(2),
        (s.discount_amount || 0).toFixed(2),
        (s.total || 0).toFixed(2),
        `"${s.payment_method || 'Efectivo'}"`,
        `"${s.payment_reference || ''}"`,
        `"${(s.operator || 'Ventas CDMX').replace(/"/g, '""')}"`,
        `"${s.status || 'completada'}"`,
        s.invoice_requested ? 'SI' : 'NO',
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `JBM_Historial_Ventas_POS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Reporte contable de ventas descargado en CSV (UTF-8).');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto">
      
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-950 text-emerald-200 border-emerald-700' 
            : 'bg-rose-950 text-rose-200 border-rose-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className="text-rose-400" />}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* 1. TOP HEADER & KPI SUMMARY BAR */}
      <div className="bg-white border-b border-slate-200 p-4 sm:p-6 space-y-4 shrink-0 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Auditoría & Despachos CDMX
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {sales.length} transacciones registradas
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2.5">
              <Receipt className="text-emerald-700 w-6 h-6" />
              Historial y Registro de Ventas POS
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta de tickets emitidos, detalle de calibres despachados, reimpresión térmica de 80mm y conciliación contable.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-xs transition-all cursor-pointer"
              title="Exportar registros filtrados a CSV para Excel / CONTPAQi"
            >
              <FileSpreadsheet size={15} className="text-emerald-700" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={fetchSales}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
              title="Refrescar datos del servidor"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>

            {onNavigateToPOS && (
              <button
                onClick={onNavigateToPOS}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <ShoppingBag size={15} />
                <span>Nueva Venta (Caja)</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* KPI 1 */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3.5 rounded-2xl border border-emerald-100/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Ventas Netas</span>
              <DollarSign size={16} className="text-emerald-700" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              ${metrics.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
              {metrics.count} tickets válidos • {metrics.cancelledCount} cancelados
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/20 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Volumen Despachado</span>
              <Package size={16} className="text-slate-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              {metrics.totalBoxes} <span className="text-xs font-bold text-slate-500 font-sans">cjs</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Equivalente a {metrics.totalKg.toLocaleString('es-MX', { maximumFractionDigits: 1 })} kg netos
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/30 p-3.5 rounded-2xl border border-blue-100/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Ticket Promedio</span>
              <TrendingUp size={16} className="text-blue-700" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              ${metrics.avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-blue-700 font-medium mt-0.5">
              Promedio por cliente / transacción
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/30 p-3.5 rounded-2xl border border-amber-200/60 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Efectivo vs Bancos</span>
              <Banknote size={16} className="text-amber-800" />
            </div>
            <div className="text-sm font-black text-slate-900 font-mono mt-1 flex items-center justify-between">
              <span className="text-emerald-700">${metrics.cashSales.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
              <span className="text-slate-400 font-sans text-xs">/</span>
              <span className="text-blue-700">${metrics.digitalSales.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex justify-between">
              <span>Efectivo ({metrics.totalAmount > 0 ? Math.round((metrics.cashSales / metrics.totalAmount) * 100) : 0}%)</span>
              <span>Bancos ({metrics.totalAmount > 0 ? Math.round((metrics.digitalSales / metrics.totalAmount) * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL TOOLBAR */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por folio (ej. TKT-0001), cliente, RFC, operador, calibre o lote..."
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-emerald-600 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <Calendar size={13} className="text-slate-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="todos">Cualquier Fecha</option>
                  <option value="hoy">Hoy</option>
                  <option value="ayer">Ayer</option>
                  <option value="semana">Últimos 7 Días</option>
                  <option value="mes">Este Mes (30d)</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <CreditCard size={13} className="text-slate-500" />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="todos">Todos los Métodos</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia SPEI</option>
                  <option value="Credito">Crédito Comercial</option>
                  <option value="Mixto">Pago Mixto</option>
                </select>
              </div>

              {/* Customer Type Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <User size={13} className="text-slate-500" />
                <select
                  value={customerTypeFilter}
                  onChange={(e) => setCustomerTypeFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="todos">Todos los Clientes</option>
                  <option value="mostrador">Venta Mostrador</option>
                  <option value="taqueria">Taquería</option>
                  <option value="restaurante">Restaurante / Bar</option>
                  <option value="mayorista">Mayorista / Bodeguero</option>
                  <option value="fruteria">Frutería / Tianguis</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="completada">Completadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>

              {(searchQuery || dateFilter !== 'todos' || paymentFilter !== 'todos' || statusFilter !== 'todos' || customerTypeFilter !== 'todos') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('todos');
                    setPaymentFilter('todos');
                    setStatusFilter('todos');
                    setCustomerTypeFilter('todos');
                  }}
                  className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Mostrando <strong>{filteredSales.length}</strong> de <strong>{sales.length}</strong> ventas registradas</span>
            <span className="font-mono">Central de Abasto CDMX • Bodega I-42</span>
          </div>
        </div>

        {/* 3. SALES DATA TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold text-slate-600">Cargando transacciones de venta...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">{error}</p>
              <button
                onClick={fetchSales}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Reintentar
              </button>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h3 className="text-base font-bold text-slate-800">No se encontraron ventas</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No hay registros que coincidan con los filtros seleccionados o aún no se han registrado transacciones en esta terminal.
              </p>
              {onNavigateToPOS && (
                <button
                  onClick={onNavigateToPOS}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm mt-2 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span>Realizar Primera Venta</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4">Folio & Fecha</th>
                    <th className="py-3 px-4">Cliente & Tipo</th>
                    <th className="py-3 px-4">Desglose de Fruta</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4">Cajero</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Total (MXN)</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const isCancelled = sale.status === 'cancelada';
                    const items = sale.items || [];
                    const totalBoxes = items.filter(i => i.item_type === 'caja').reduce((sum, i) => sum + i.qty, 0);
                    const totalKg = items.reduce((sum, i) => sum + (i.kg_total || (i.item_type === 'caja' ? i.qty * 18.14 : i.qty)), 0);

                    const formattedDate = sale.date 
                      ? new Date(sale.date).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'Hoy';

                    const formattedTime = sale.date 
                      ? new Date(sale.date).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '--:--';

                    return (
                      <tr 
                        key={sale.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCancelled ? 'bg-rose-50/30 opacity-70' : ''
                        }`}
                      >
                        {/* 1. Folio & Fecha */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{sale.folio}</span>
                            {sale.invoice_requested === 1 && (
                              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded" title="CFDI 4.0 Solicitado">
                                CFDI
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-slate-400" />
                            <span>{formattedDate} • {formattedTime}</span>
                          </div>
                        </td>

                        {/* 2. Cliente */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 max-w-[180px] truncate" title={sale.customer_name}>
                            {sale.customer_name || 'Venta Mostrador'}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="capitalize px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9.5px] font-semibold">
                              {sale.customer_type || 'mostrador'}
                            </span>
                            {sale.customer_rfc && (
                              <span className="font-mono text-slate-400 truncate max-w-[90px]" title={sale.customer_rfc}>
                                {sale.customer_rfc}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Desglose de Fruta */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 max-w-[220px]">
                            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>{items.length} {items.length === 1 ? 'partida' : 'partidas'}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono font-bold text-emerald-800">
                                {totalBoxes > 0 ? `${totalBoxes} cjs` : ''}
                                {totalBoxes > 0 && totalKg > 0 ? ' • ' : ''}
                                {totalKg.toFixed(1)} kg
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate" title={items.map(i => `${i.name} (${i.calibre || 'S/C'}) x ${i.qty}`).join(', ')}>
                              {items.map(i => `${i.calibre ? `Cal ${i.calibre}` : i.name} (${i.qty})`).join(', ')}
                            </div>
                          </div>
                        </td>

                        {/* 4. Método de Pago */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {sale.payment_method === 'Efectivo' && <Banknote size={14} className="text-emerald-600" />}
                            {sale.payment_method === 'Tarjeta' && <CreditCard size={14} className="text-blue-600" />}
                            {sale.payment_method === 'Transferencia' && <ArrowRightLeft size={14} className="text-purple-600" />}
                            {sale.payment_method === 'Credito' && <Receipt size={14} className="text-amber-600" />}
                            <span className="font-bold text-slate-800 text-xs">
                              {sale.payment_method || 'Efectivo'}
                            </span>
                          </div>
                          {sale.payment_reference && (
                            <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]" title={sale.payment_reference}>
                              Ref: {sale.payment_reference}
                            </div>
                          )}
                        </td>

                        {/* 5. Cajero */}
                        <td className="py-3 px-4">
                          <div className="text-xs font-medium text-slate-700">
                            {sale.operator || 'Ventas CDMX'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Bodega I-42
                          </div>
                        </td>

                        {/* 6. Estado */}
                        <td className="py-3 px-4 text-center">
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                              <Ban size={10} /> Cancelada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 size={10} /> Completada
                            </span>
                          )}
                        </td>

                        {/* 7. Total */}
                        <td className="py-3 px-4 text-right">
                          <div className={`font-mono font-black text-sm ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            ${(sale.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                          {sale.discount_amount > 0 && !isCancelled && (
                            <div className="text-[9.5px] text-rose-600 font-semibold font-mono">
                              Desc: -${sale.discount_amount.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* 8. Acciones */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Reimprimir Ticket 80mm */}
                            <button
                              type="button"
                              onClick={() => setSaleForThermalTicket(sale)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                              title="Reimprimir ticket térmico de 80mm (.thermal-receipt)"
                            >
                              <Printer size={13} className="text-emerald-400" />
                              <span className="hidden sm:inline">Ticket 80mm</span>
                            </button>

                            {/* Ver Detalle Completo */}
                            <button
                              type="button"
                              onClick={() => setSelectedSaleForDetail(sale)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                              title="Ver desglose completo de la transacción"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Cancelar (solo si está activa y el usuario es admin o ventas) */}
                            {!isCancelled && (currentRole === 'admin' || currentRole === 'ventas') && (
                              <button
                                type="button"
                                onClick={() => setSaleToCancel(sale)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-medium transition-all cursor-pointer"
                                title="Cancelar venta y restituir inventario"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DETALLE COMPLETO DE LA VENTA (TRANSACTION DRAWER / MODAL) */}
      {/* ========================================================================= */}
      {selectedSaleForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 space-y-5 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center shadow-xs">
                  <Receipt size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900 font-mono">
                      {selectedSaleForDetail.folio}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedSaleForDetail.status === 'cancelada' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {selectedSaleForDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Transacción POS • {new Date(selectedSaleForDetail.date).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSaleForDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              
              {/* Customer & Dispatcher Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cliente:</span>
                  <p className="font-black text-slate-900 text-sm">{selectedSaleForDetail.customer_name || 'Venta Mostrador'}</p>
                  <p className="text-[11px] text-slate-500 font-medium capitalize">
                    Tipo: {selectedSaleForDetail.customer_type || 'Mostrador'} 
                    {selectedSaleForDetail.customer_phone ? ` • Tel: ${selectedSaleForDetail.customer_phone}` : ''}
                  </p>
                  {selectedSaleForDetail.customer_rfc && (
                    <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                      RFC: <strong>{selectedSaleForDetail.customer_rfc}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operación:</span>
                  <p className="font-bold text-slate-900">Cajero: {selectedSaleForDetail.operator || 'Ventas CDMX'}</p>
                  <p className="text-[11px] text-slate-500">Bodega I-42 • Central de Abasto CDMX</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Factura Fiscal: <strong>{selectedSaleForDetail.invoice_requested === 1 ? 'Sí requerida (CFDI 4.0)' : 'No requerida'}</strong>
                  </p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package size={14} className="text-emerald-700" />
                  Partidas Despachadas ({selectedSaleForDetail.items?.length || 0})
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Producto / Calibre</th>
                        <th className="py-2 px-3 text-center">Cantidad</th>
                        <th className="py-2 px-3 text-right">P. Unitario</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedSaleForDetail.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{it.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Cal: {it.calibre || 'S/C'} • Lote: {it.lot_code || 'CDMX'}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                            {it.qty} {it.item_type === 'caja' ? 'cajas' : 'kg'}
                            {it.kg_total ? ` (${it.kg_total.toFixed(1)} kg)` : ''}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            ${it.unit_price.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                            ${(it.subtotal || it.qty * it.unit_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1.5 font-mono">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span>${(selectedSaleForDetail.subtotal || selectedSaleForDetail.total).toFixed(2)}</span>
                </div>
                {selectedSaleForDetail.discount_amount > 0 && (
                  <div className="flex justify-between text-xs text-rose-400">
                    <span>Descuento Aplicado:</span>
                    <span>- ${selectedSaleForDetail.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-400">
                  <span>IVA (0% Tasa Agrícola Art. 2-A LIVA):</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-slate-700 pt-1.5 flex justify-between text-base font-black text-amber-300">
                  <span>TOTAL COBRADO:</span>
                  <span>${(selectedSaleForDetail.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                </div>

                {/* Payment Detail */}
                <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-300 flex justify-between">
                  <span>Método de Pago: <strong>{selectedSaleForDetail.payment_method}</strong></span>
                  {selectedSaleForDetail.payment_method === 'Efectivo' && (
                    <span>Recibido: ${selectedSaleForDetail.cash_received?.toFixed(2)} | Cambio: ${selectedSaleForDetail.cash_change?.toFixed(2)}</span>
                  )}
                  {selectedSaleForDetail.payment_reference && (
                    <span>Ref: {selectedSaleForDetail.payment_reference}</span>
                  )}
                </div>
              </div>

              {/* Transaction Notes */}
              {selectedSaleForDetail.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">Observaciones de la venta:</span>
                  {selectedSaleForDetail.notes}
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <div>
                {selectedSaleForDetail.status !== 'cancelada' && (currentRole === 'admin' || currentRole === 'ventas') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSaleToCancel(selectedSaleForDetail);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Ban size={14} />
                    <span>Cancelar Venta</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSaleForDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSaleForThermalTicket(selectedSaleForDetail);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Reimprimir Ticket 80mm</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CANCELLATION CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">¿Cancelar Transacción {saleToCancel.folio}?</h3>
                <p className="text-xs text-slate-500">Esta acción restituirá el stock físico de fruta al inventario de bodega.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Cliente:</span>
                <span className="font-bold text-slate-900">{saleToCancel.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monto a anular:</span>
                <span className="font-bold font-mono text-rose-600">${saleToCancel.total?.toFixed(2)} MXN</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Motivo de Cancelación:</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-rose-500"
                placeholder="Indique la causa (error de cajero, devolución, etc.)..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setSaleToCancel(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Regresar
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelSale}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                {cancelling ? <RefreshCw size={14} className="animate-spin" /> : <Ban size={14} />}
                <span>Confirmar Cancelación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: 80MM THERMAL RECEIPT REPRINT VIEWER (.thermal-receipt) */}
      {/* ========================================================================= */}
      {saleForThermalTicket && (
        <POSThermalTicket
          sale={saleForThermalTicket}
          onClose={() => setSaleForThermalTicket(null)}
          onPrint={() => window.print()}
          showToolbar={true}
        />
      )}

    </div>
  );
};
