import React from 'react';
import { 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  User, 
  Plus, 
  FileText,
  Calendar,
  FileSpreadsheet,
  Table,
  Filter,
  Search,
  Check,
  ChevronDown,
  X,
  Building2,
  Scale,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { Settlement, Producer, Batch } from '../types';
import { Logo } from './Logo';
import {
  exportSettlementsReport,
  exportProducerLedgerReport,
  exportOperationsCostReport,
  exportSingleSettlementVoucher,
  exportToCSV,
  exportToExcelXML
} from '../utils/financialExport';

export function Finances() {
  const [settlements, setSettlements] = React.useState<Settlement[]>([]);
  const [producers, setProducers] = React.useState<Producer[]>([]);
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [companySettings, setCompanySettings] = React.useState<any>(null);
  
  // UI States
  const [activeTab, setActiveTab] = React.useState<'settlements' | 'producers' | 'operations'>('settlements');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedProducerId, setSelectedProducerId] = React.useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('todos');
  const [dateFilter, setDateFilter] = React.useState<string>('todos');
  
  // Modals
  const [selectedSettlement, setSelectedSettlement] = React.useState<Settlement | null>(null);
  const [showNewSettlementModal, setShowNewSettlementModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [exportFeedback, setExportFeedback] = React.useState<string | null>(null);

  // New Settlement Form State
  const [newSettlementForm, setNewSettlementForm] = React.useState({
    producer_id: '',
    batches_count: 1,
    total_kg: '',
    price_per_kg: '18.50',
    scale_fees: '50.00',
    extra_charge_per_kg: '0.40',
    payment_method: 'Transferencia' as 'Transferencia' | 'Cheque' | 'Efectivo',
    notes: ''
  });

  // Load Data
  const fetchData = React.useCallback(() => {
    fetch('/api/settlements')
      .then(res => res.ok ? res.json() : [])
      .then(data => setSettlements(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading settlements:', err));

    fetch('/api/producers')
      .then(res => res.ok ? res.json() : [])
      .then(data => setProducers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading producers:', err));

    fetch('/api/batches')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBatches(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading batches:', err));

    fetch('/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setCompanySettings(data); })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Calculations
  const totalPaid = settlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);
  const totalKg = settlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
  const totalSubtotal = settlements.reduce((sum, s) => sum + (s.subtotal || 0), 0);
  const totalDeductions = settlements.reduce((sum, s) => sum + (s.deductions || 0), 0);
  const totalScaleFees = settlements.reduce((sum, s) => sum + (s.scale_fees || 0), 0);

  // Filtered settlements
  const filteredSettlements = settlements.filter(s => {
    const matchesSearch = 
      (s.folio && s.folio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.producer_name && s.producer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProducer = selectedProducerId === 'todos' || String(s.producer_id) === selectedProducerId;
    const matchesStatus = selectedStatus === 'todos' || s.status === selectedStatus;

    let matchesDate = true;
    if (dateFilter === 'hoy' && s.date) {
      matchesDate = s.date.slice(0, 10) === new Date().toISOString().slice(0, 10);
    } else if (dateFilter === 'semana' && s.date) {
      const itemDate = new Date(s.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = itemDate >= weekAgo;
    }

    return matchesSearch && matchesProducer && matchesStatus && matchesDate;
  });

  // Handle Export Actions with Visual Feedback
  const handleExport = (type: 'settlements' | 'producers' | 'operations', format: 'csv' | 'excel') => {
    if (type === 'settlements') {
      exportSettlementsReport(filteredSettlements, format, `${selectedProducerId === 'todos' ? 'Todos los productores' : 'Productor filtrado'}`);
      setExportFeedback(`Reporte de Liquidaciones exportado exitosamente en formato ${format.toUpperCase()}.`);
    } else if (type === 'producers') {
      exportProducerLedgerReport(producers, settlements, format);
      setExportFeedback(`Auxiliar Contable de Productores exportado exitosamente en formato ${format.toUpperCase()}.`);
    } else if (type === 'operations') {
      exportOperationsCostReport(batches, format);
      setExportFeedback(`Reporte de Costos Operativos y Maniobra exportado exitosamente en formato ${format.toUpperCase()}.`);
    }
    setTimeout(() => setExportFeedback(null), 5000);
    setShowExportModal(false);
  };

  // Submit New Settlement
  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(newSettlementForm.total_kg) || 0;
    const pKg = parseFloat(newSettlementForm.price_per_kg) || 18.50;
    const subtotal = Number((kg * pKg).toFixed(2));
    const extraKg = parseFloat(newSettlementForm.extra_charge_per_kg) || 0.40;
    const deductions = Number((kg * extraKg).toFixed(2));
    const scaleFees = parseFloat(newSettlementForm.scale_fees) || 50.00;
    const totalPaid = Number(Math.max(0, subtotal - deductions - scaleFees).toFixed(2));

    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producer_id: newSettlementForm.producer_id ? parseInt(newSettlementForm.producer_id) : null,
          batches_count: newSettlementForm.batches_count || 1,
          total_kg: kg,
          subtotal,
          scale_fees: scaleFees,
          deductions,
          total_paid: totalPaid,
          payment_method: newSettlementForm.payment_method
        })
      });

      if (!res.ok) throw new Error('Error al registrar liquidación');

      setShowNewSettlementModal(false);
      fetchData();
      setExportFeedback('✅ Liquidación generada y registrada con éxito.');
      setTimeout(() => setExportFeedback(null), 5000);

      // Reset form
      setNewSettlementForm({
        producer_id: '',
        batches_count: 1,
        total_kg: '',
        price_per_kg: '18.50',
        scale_fees: '50.00',
        extra_charge_per_kg: '0.40',
        payment_method: 'Transferencia',
        notes: ''
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-6 no-print">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center p-2 shadow-xs shrink-0">
            <Wallet size={28} className="text-emerald-700" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Liquidaciones y Finanzas
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                Productores JBM
              </span>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Módulo Contable & Fiscal
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Corte de cuentas, liquidación a productores, pólizas contables y exportación a Excel / CSV
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Quick Export to Excel */}
          <button
            onClick={() => handleExport('settlements', 'excel')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Descargar reporte actual en formato Excel (.XLS)"
          >
            <FileSpreadsheet size={16} className="text-emerald-700" />
            <span>Exportar Excel</span>
          </button>

          {/* Quick Export to CSV */}
          <button
            onClick={() => handleExport('settlements', 'csv')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Descargar datos en formato CSV estándar compatible con CONTPAQi / SAT"
          >
            <Table size={16} className="text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          {/* Advanced Export Center Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Download size={16} />
            <span>Centro de Reportes</span>
          </button>

          {/* New Settlement Button */}
          <button
            onClick={() => setShowNewSettlementModal(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-900/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nueva Liquidación</span>
          </button>
        </div>
      </header>

      {/* Export Notification Toast */}
      {exportFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <button onClick={() => setExportFeedback(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Liquidado</p>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight size={14} /> {settlements.length} cortes emitidos
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Volumen Liquidado</p>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Scale size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalKg.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg netos</span>
          </p>
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1">
            Precio prom: ${totalKg > 0 ? (totalSubtotal / totalKg).toFixed(2) : '18.50'}/kg
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Deducciones & Maniobra</p>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Receipt size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2 font-mono">
            ${(totalDeductions + totalScaleFees).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs font-bold text-amber-700 flex items-center gap-1 mt-1">
            $0.40/kg retención + Báscula
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Productores Activos</p>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <User size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {producers.length} <span className="text-xs font-bold text-slate-500">cuentas</span>
          </p>
          <span className="text-xs font-bold text-purple-700 flex items-center gap-1 mt-1">
            Veracruz / Región Citrícola
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settlements'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt size={15} />
          <span>Liquidaciones a Productores ({settlements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('producers')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'producers'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User size={15} />
          <span>Auxiliar de Cuentas por Productor ({producers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'operations'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={15} />
          <span>Auditoría de Maniobra & Báscula ({batches.length})</span>
        </button>
      </div>

      {/* TAB 1: LIQUIDACIONES EMITIDAS */}
      {activeTab === 'settlements' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Receipt size={20} className="text-emerald-700" />
                Historial de Liquidaciones Emitidas
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mostrando {filteredSettlements.length} de {settlements.length} registros contables
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar folio o productor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Producer Filter */}
              <select
                value={selectedProducerId}
                onChange={(e) => setSelectedProducerId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl text-xs py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="todos">Todos los productores</option>
                {producers.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl text-xs py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="todos">Todas las fechas</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Últimos 7 días</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-black text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Folio Liq.</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Productor</th>
                  <th className="p-4 text-center">Boletas</th>
                  <th className="p-4 text-right">Kilos Netos</th>
                  <th className="p-4 text-right">Subtotal Fruta</th>
                  <th className="p-4 text-right">Deducciones</th>
                  <th className="p-4 text-right">Total Pagado</th>
                  <th className="p-4 text-center">Método</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Póliza / Exportar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-sans">
                      No se encontraron liquidaciones con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredSettlements.map((s) => (
                    <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="p-4 font-black text-emerald-800">{s.folio}</td>
                      <td className="p-4 font-sans text-slate-500">
                        {s.date ? s.date.slice(0, 10) : '2026-08-24'}
                      </td>
                      <td className="p-4 font-sans font-bold text-slate-900">
                        {s.producer_name}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {s.batches_count || 1}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        {s.total_kg?.toLocaleString()} kg
                      </td>
                      <td className="p-4 text-right text-slate-700">
                        ${s.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-rose-600">
                        -${((s.deductions || 0) + (s.scale_fees || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-black text-emerald-700 text-sm">
                        ${s.total_paid?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center font-sans">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                          {s.payment_method || 'SPEI'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-sans">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-black text-[10px] uppercase">
                          {s.status || 'Pagado'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSettlement(s)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Ver Póliza Contable de Liquidación"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => exportSingleSettlementVoucher(s, producers.find(p => p.id === s.producer_id), 'excel')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Descargar Póliza en Excel (.xls)"
                          >
                            <FileSpreadsheet size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          {filteredSettlements.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 font-bold gap-3">
              <div className="flex items-center gap-2">
                <span>Total Filtrado: {filteredSettlements.length} liquidaciones</span>
                <span className="text-slate-300">•</span>
                <span>Volumen: {filteredSettlements.reduce((sum, s) => sum + (s.total_kg || 0), 0).toLocaleString()} kg</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Total Fruta: ${filteredSettlements.reduce((sum, s) => sum + (s.subtotal || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                <span className="text-emerald-700 font-black text-sm">
                  Total Pagado: ${filteredSettlements.reduce((sum, s) => sum + (s.total_paid || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUXILIAR DE PRODUCTORES */}
      {activeTab === 'producers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <User size={20} className="text-emerald-700" />
                Auxiliar Contable y Saldos de Productores
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Estado de cuenta por proveedor de fruta, volumen acumulado y saldos por liquidar
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('producers', 'excel')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Exportar Auxiliar (Excel)</span>
              </button>
              <button
                onClick={() => handleExport('producers', 'csv')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Table size={15} />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-black text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Nombre del Productor</th>
                  <th className="p-4">RFC</th>
                  <th className="p-4">Ubicación / Huerto</th>
                  <th className="p-4 text-center">Liquidaciones</th>
                  <th className="p-4 text-right">Kilos Entregados</th>
                  <th className="p-4 text-right">Total Liquidado</th>
                  <th className="p-4 text-right">Saldo Actual</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {producers.map((p) => {
                  const pSettlements = settlements.filter(s => s.producer_id === p.id);
                  const pKg = pSettlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
                  const pPaid = pSettlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black text-slate-400">#{p.id}</td>
                      <td className="p-4 font-sans font-bold text-slate-900">{p.name}</td>
                      <td className="p-4 text-slate-600">{p.rfc || 'RAMP720815KJ8'}</td>
                      <td className="p-4 font-sans text-slate-500">{p.location || p.default_orchard || 'Pedernales, Ver.'}</td>
                      <td className="p-4 text-center font-sans">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {pSettlements.length}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        {pKg > 0 ? `${pKg.toLocaleString()} kg` : '0 kg'}
                      </td>
                      <td className="p-4 text-right font-black text-emerald-700">
                        ${pPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-bold">
                        <span className={(p.balance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          ${(p.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 text-center font-sans">
                        <button
                          onClick={() => {
                            setSelectedProducerId(String(p.id));
                            setActiveTab('settlements');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Ver Cortes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORÍA DE MANIOBRA Y BÁSCULA ($0.40/kg) */}
      {activeTab === 'operations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Layers size={20} className="text-emerald-700" />
                Auditoría de Retenciones de Maniobra ($0.40/kg) y Pesaje Báscula
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Desglose para conciliación de caja operativa y servicios de descarga
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('operations', 'excel')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Exportar Auditoría (Excel)</span>
              </button>
              <button
                onClick={() => handleExport('operations', 'csv')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Table size={15} />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-black text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Folio Entrada</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Productor</th>
                  <th className="p-4 text-right">Kilos Netos</th>
                  <th className="p-4 text-right">Tarifa Maniobra</th>
                  <th className="p-4 text-right">Total Maniobra</th>
                  <th className="p-4 text-right">Cuota Báscula</th>
                  <th className="p-4 text-center">Pago Báscula</th>
                  <th className="p-4 text-right">Total Retenido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {batches.map((b) => {
                  const extraTotal = b.extra_charge_total || ((b.weight_net || 0) * (b.extra_charge_per_kg || 0.40));
                  const scaleDeduction = b.scale_fee_payment === 'descuento' ? (b.scale_fee || 50) : 0;
                  const totalRetained = scaleDeduction + extraTotal;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black text-emerald-800">{b.folio || `#REC-${b.id}`}</td>
                      <td className="p-4 font-sans text-slate-500">{b.date?.slice(0, 10) || '2026-08-24'}</td>
                      <td className="p-4 font-sans font-bold text-slate-900">{b.producer_name}</td>
                      <td className="p-4 text-right font-bold">{b.weight_net?.toLocaleString()} kg</td>
                      <td className="p-4 text-right text-slate-500">${(b.extra_charge_per_kg || 0.40).toFixed(2)}/kg</td>
                      <td className="p-4 text-right font-bold text-amber-700">${extraTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-slate-700">${(b.scale_fee || 50).toFixed(2)}</td>
                      <td className="p-4 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          b.scale_fee_payment === 'efectivo' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {b.scale_fee_payment === 'efectivo' ? 'Efectivo' : 'Descuento'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-rose-700">${totalRetained.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADVANCED EXPORT CENTER MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Centro de Exportación Contable</h3>
                  <p className="text-xs text-slate-500 font-medium">Exportar reportes a Excel (.XLS) y CSV con codificación UTF-8</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Report Selection Grid */}
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Seleccionar Reporte Financiero:</p>

              {/* Option 1: Liquidaciones */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Receipt size={16} className="text-emerald-700" />
                    Reporte de Liquidaciones Emitidas
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detalle de folios, kilos netos, precio pactado, deducciones y neto pagado.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExport('settlements', 'excel')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('settlements', 'csv')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Table size={13} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Auxiliar Productores */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <User size={16} className="text-purple-700" />
                    Auxiliar Contable de Productores
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estado de cuenta por proveedor, RFC, volumen acumulado y saldo actual.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExport('producers', 'excel')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('producers', 'csv')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Table size={13} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Costos Operativos & Maniobra */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Layers size={16} className="text-amber-700" />
                    Auditoría de Maniobra ($0.40/kg) y Báscula
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registro de cuotas operativas retenidas para conciliación con tesorería.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExport('operations', 'excel')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('operations', 'csv')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Table size={13} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Format Notes */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500">
              💡 <strong>Compatibilidad Contable:</strong> Los archivos CSV generados incluyen codificación UTF-8 con BOM para apertura nativa en Microsoft Excel, LibreOffice Calc y sistemas CONTPAQi / Aspel sin errores de caracteres.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PÓLIZA CONTABLE DE LIQUIDACIÓN INDIVIDUAL */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <Logo variant="mono" className="scale-75" />
                <div>
                  <h3 className="font-black text-lg text-slate-900">Póliza Contable de Liquidación</h3>
                  <p className="text-xs font-mono font-bold text-emerald-700">Folio: {selectedSettlement.folio}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSettlement(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Fecha:</span>
                <span className="font-bold text-slate-800">{selectedSettlement.date?.slice(0, 10) || '2026-08-24'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Productor:</span>
                <span className="font-bold text-slate-800 truncate block">{selectedSettlement.producer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Kilos Netos:</span>
                <span className="font-bold text-slate-800 font-mono">{selectedSettlement.total_kg?.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Método de Pago:</span>
                <span className="font-bold text-emerald-700">{selectedSettlement.payment_method}</span>
              </div>
            </div>

            {/* Accounting Breakdown Table (Debe / Haber) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="p-3 bg-slate-900 text-white font-black flex justify-between items-center">
                <span>Asiento Contable / Póliza de Egresos</span>
                <span className="text-[10px] text-slate-400 font-mono">SAT / NIF C-4</span>
              </div>
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-100 text-slate-500 font-black text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Cuenta / Concepto</th>
                    <th className="p-3 text-right">Debe (Cargo)</th>
                    <th className="p-3 text-right">Haber (Abono)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3">
                      <div className="font-sans font-bold text-slate-900">501-01-001 Compra de Limón Mexicano</div>
                      <div className="text-[10px] text-slate-500 font-sans">Materia prima recibida en báscula</div>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      ${selectedSettlement.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-slate-400">$0.00</td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <div className="font-sans font-bold text-slate-900">205-02-004 Retención Báscula Camionera</div>
                      <div className="text-[10px] text-slate-500 font-sans">Cuota pesaje certificado</div>
                    </td>
                    <td className="p-3 text-right text-slate-400">$0.00</td>
                    <td className="p-3 text-right text-slate-700">
                      ${(selectedSettlement.scale_fees || 50).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <div className="font-sans font-bold text-slate-900">205-02-005 Retención Maniobra y Tolva</div>
                      <div className="text-[10px] text-slate-500 font-sans">Cargo operativo $0.40/kg</div>
                    </td>
                    <td className="p-3 text-right text-slate-400">$0.00</td>
                    <td className="p-3 text-right text-slate-700">
                      ${(selectedSettlement.deductions || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/50 font-bold">
                    <td className="p-3">
                      <div className="font-sans font-black text-emerald-900">102-01-001 Bancos / Tesorería (Dispersión)</div>
                      <div className="text-[10px] text-emerald-700 font-sans">Transferencia bancaria SPEI liquidada</div>
                    </td>
                    <td className="p-3 text-right text-slate-400">$0.00</td>
                    <td className="p-3 text-right font-black text-emerald-700 text-sm">
                      ${selectedSettlement.total_paid?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                    <td className="p-3 text-right uppercase text-slate-700">Sumas Iguales:</td>
                    <td className="p-3 text-right text-slate-900">
                      ${selectedSettlement.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-emerald-800">
                      ${((selectedSettlement.scale_fees || 50) + (selectedSettlement.deductions || 0) + (selectedSettlement.total_paid || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir Póliza</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportSingleSettlementVoucher(selectedSettlement, producers.find(p => p.id === selectedSettlement.producer_id), 'excel')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet size={15} />
                  <span>Descargar Excel</span>
                </button>
                <button
                  onClick={() => exportSingleSettlementVoucher(selectedSettlement, producers.find(p => p.id === selectedSettlement.producer_id), 'csv')}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Table size={15} />
                  <span>Descargar CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA LIQUIDACIÓN */}
      {showNewSettlementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Nueva Liquidación a Productor</h3>
                  <p className="text-xs text-slate-500 font-medium">Calcular y emitir corte de cuentas de fruta</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewSettlementModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSettlement} className="space-y-4 text-xs">
              {/* Producer Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Productor *</label>
                <select
                  required
                  value={newSettlementForm.producer_id}
                  onChange={(e) => setNewSettlementForm({ ...newSettlementForm, producer_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccione productor...</option>
                  {producers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.rfc || 'S/R'}</option>
                  ))}
                </select>
              </div>

              {/* Weight & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kilos Netos (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej. 15000"
                    value={newSettlementForm.total_kg}
                    onChange={(e) => setNewSettlementForm({ ...newSettlementForm, total_kg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio por Kilo ($/kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newSettlementForm.price_per_kg}
                    onChange={(e) => setNewSettlementForm({ ...newSettlementForm, price_per_kg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Deductions: Maniobra & Báscula */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarifa Maniobra ($/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSettlementForm.extra_charge_per_kg}
                    onChange={(e) => setNewSettlementForm({ ...newSettlementForm, extra_charge_per_kg: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cuota Báscula Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSettlementForm.scale_fees}
                    onChange={(e) => setNewSettlementForm({ ...newSettlementForm, scale_fees: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Método de Dispersión / Pago *</label>
                <select
                  value={newSettlementForm.payment_method}
                  onChange={(e) => setNewSettlementForm({ ...newSettlementForm, payment_method: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Transferencia">Transferencia Electrónica (SPEI)</option>
                  <option value="Cheque">Cheque Nominativo</option>
                  <option value="Efectivo">Efectivo en Caja</option>
                </select>
              </div>

              {/* Live Calculation Preview */}
              {parseFloat(newSettlementForm.total_kg) > 0 && (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Fruta:</span>
                    <span>${((parseFloat(newSettlementForm.total_kg) || 0) * (parseFloat(newSettlementForm.price_per_kg) || 18.50)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Deducción Maniobra ($0.40/kg):</span>
                    <span>-${((parseFloat(newSettlementForm.total_kg) || 0) * (parseFloat(newSettlementForm.extra_charge_per_kg) || 0.40)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Cuota de Báscula:</span>
                    <span>-${(parseFloat(newSettlementForm.scale_fees) || 50).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-black text-sm pt-1 border-t border-emerald-200">
                    <span>Total a Liquidar:</span>
                    <span>
                      ${Math.max(0, 
                        ((parseFloat(newSettlementForm.total_kg) || 0) * (parseFloat(newSettlementForm.price_per_kg) || 18.50)) -
                        ((parseFloat(newSettlementForm.total_kg) || 0) * (parseFloat(newSettlementForm.extra_charge_per_kg) || 0.40)) -
                        (parseFloat(newSettlementForm.scale_fees) || 50)
                      ).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewSettlementModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md shadow-emerald-900/20 cursor-pointer"
                >
                  Guardar y Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
