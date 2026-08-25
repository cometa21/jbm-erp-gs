import React from 'react';
import { 
  Plus, 
  Search, 
  Scale, 
  Printer, 
  History, 
  Eye, 
  FileText, 
  CheckCircle2, 
  X, 
  UserPlus, 
  ArrowUpRight, 
  DollarSign, 
  TrendingUp, 
  Truck,
  Sparkles,
  RotateCcw,
  Calculator,
  BadgePercent,
  Wifi,
  WifiOff,
  CloudOff,
  CloudUpload,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Check,
  Radio
} from 'lucide-react';
import type { Producer, Batch } from '../types';
import { ThermalTicket, type TicketData } from './ThermalTicket';
import { Logo } from './Logo';
import { calculateReceptionTotals } from '../utils/receptionCalculations';
import { saveCloudBatch } from '../lib/cloudService';
import {
  getOfflineBatches,
  saveOfflineBatch,
  offlineBatchToBatch,
  syncAllOfflineBatches,
  removeOfflineBatch,
  type OfflineBatchPayload
} from '../utils/offlineReceptionStorage';

export function Reception() {
  const [producers, setProducers] = React.useState<Producer[]>([]);
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterOrigin, setFilterOrigin] = React.useState<string>('todos');

  // Offline & Sync State
  const [isOnline, setIsOnline] = React.useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [simulatedOffline, setSimulatedOffline] = React.useState<boolean>(false);
  const [offlineBatches, setOfflineBatches] = React.useState<OfflineBatchPayload[]>([]);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = React.useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

  // New Batch Modal State
  const [showForm, setShowForm] = React.useState(false);
  const [showNewProducerModal, setShowNewProducerModal] = React.useState(false);

  // Selected Ticket for Modal View / Print
  const [selectedTicket, setSelectedTicket] = React.useState<Batch | null>(null);

  // Form State
  const [formData, setFormData] = React.useState({
    scale_ticket_folio: '',
    producer_id: '',
    origin: 'Cosecha propia',
    orchard: 'Pedernales',
    variety: 'Limón Mexicano',
    weight_gross: '14500',
    weight_tare: '4200',
    price_per_kg: '18.50',
    scale_fee: '50.00',
    scale_fee_payment: 'descuento' as 'descuento' | 'efectivo',
    extra_charge_per_kg: '0.40',
    extra_charge_concept: 'Servicios operativos y maniobra',
    operator: 'Carlos Barragán',
    notes: ''
  });

  // Quick Producer Creation State
  const [newProducer, setNewProducer] = React.useState({
    name: '',
    rfc: '',
    phone: '',
    location: '',
    default_orchard: ''
  });

  // Load Data
  const fetchData = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/producers').then(res => res.ok ? res.json() : []),
      fetch('/api/batches').then(res => res.ok ? res.json() : [])
    ])
      .then(([prods, bat]) => {
        setProducers(Array.isArray(prods) ? prods : []);
        setBatches(Array.isArray(bat) ? bat : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  const refreshOfflineQueue = React.useCallback(() => {
    const queue = getOfflineBatches();
    setOfflineBatches(queue);
  }, []);

  // Manual or Triggered Synchronization
  const handleSyncBatches = React.useCallback(async (notifyIfEmpty = false) => {
    const queue = getOfflineBatches();
    if (queue.length === 0) {
      if (notifyIfEmpty) {
        setSyncFeedback({
          type: 'info',
          message: 'No hay boletas pendientes de sincronización. Todos los datos están al día.'
        });
        setTimeout(() => setSyncFeedback(null), 4000);
      }
      return;
    }

    if (!isOnline && !simulatedOffline) {
      setSyncFeedback({
        type: 'warning',
        message: 'No se puede sincronizar sin conexión a internet. Verifique su red.'
      });
      setTimeout(() => setSyncFeedback(null), 4000);
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncAllOfflineBatches();
      refreshOfflineQueue();
      fetchData();

      if (result.successCount > 0) {
        setSyncFeedback({
          type: 'success',
          message: `✅ Se sincronizaron exitosamente ${result.successCount} boleta(s) al servidor central.`
        });
      } else if (result.failCount > 0) {
        setSyncFeedback({
          type: 'warning',
          message: `⚠️ Ocurrió un problema al sincronizar ${result.failCount} boleta(s). Permanecen guardadas en memoria local.`
        });
      }
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      console.error('Error in batch sync:', err);
      setSyncFeedback({
        type: 'warning',
        message: 'Error al sincronizar boletas con el servidor. Se reintentará automáticamente.'
      });
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, simulatedOffline, fetchData, refreshOfflineQueue]);

  // Initial setup & network event listeners for auto-sync
  React.useEffect(() => {
    fetchData();
    refreshOfflineQueue();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncFeedback({
        type: 'info',
        message: 'Conexión a red restablecida. Iniciando sincronización automática...'
      });
      handleSyncBatches(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncFeedback({
        type: 'warning',
        message: 'Conexión a red perdida. El sistema guardará los recibos localmente sin interrumpir las pesadas.'
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData, refreshOfflineQueue, handleSyncBatches]);

  // When simulated offline is toggled off, trigger sync
  const toggleSimulatedOffline = () => {
    setSimulatedOffline(prev => {
      const next = !prev;
      if (!next && isOnline) {
        setTimeout(() => handleSyncBatches(false), 300);
      }
      return next;
    });
  };

  // Derived Calculations using Auxiliary Function for Live Form
  const grossNum = parseFloat(formData.weight_gross) || 0;
  const tareNum = parseFloat(formData.weight_tare) || 0;
  const priceNum = parseFloat(formData.price_per_kg) || 0;
  const scaleFeeNum = parseFloat(formData.scale_fee) || 0;
  const extraKgRate = parseFloat(formData.extra_charge_per_kg) || 0;

  // Execute Auxiliary Calculation Function
  const calculation = calculateReceptionTotals({
    weightGross: grossNum,
    weightTare: tareNum,
    pricePerKg: priceNum,
    scaleFee: scaleFeeNum,
    scaleFeePayment: formData.scale_fee_payment,
    extraChargePerKg: extraKgRate,
  });

  const {
    weightNet: netNum,
    subtotalFruta: subtotalNum,
    scaleFeeDeduction: scaleDeductionNum,
    scaleFeePaidCash,
    extraChargeTotal: extraChargeTotalNum,
    totalDeductions,
    totalLiquidated: totalNum,
    effectivePricePerKg
  } = calculation;

  const selectedProducer = producers.find(p => p.id === parseInt(formData.producer_id));
  const effectiveIsOffline = !isOnline || simulatedOffline;

  // Live Ticket Data Object for Preview
  const liveTicketData: TicketData = {
    folio: effectiveIsOffline ? '#TEMPORAL-OFFLINE' : '#PENDIENTE',
    scale_ticket_folio: formData.scale_ticket_folio || undefined,
    date: new Date().toISOString(),
    producer_name: selectedProducer ? selectedProducer.name : (formData.producer_id === '' ? 'SIN ASIGNAR' : 'Don Pedro Ramírez'),
    origin: formData.origin,
    orchard: formData.orchard,
    variety: 'Limón Mexicano',
    weight_gross: grossNum,
    weight_tare: tareNum,
    weight_net: netNum,
    price_per_kg: priceNum,
    subtotal: subtotalNum,
    scale_fee: scaleFeeNum,
    scale_fee_payment: formData.scale_fee_payment,
    extra_charge_per_kg: extraKgRate,
    extra_charge_total: extraChargeTotalNum,
    extra_charge_concept: formData.extra_charge_concept,
    total: totalNum,
    operator: formData.operator,
    notes: formData.notes,
    isOffline: effectiveIsOffline
  };

  // Handle Producer Select change (autofill default orchard if exists)
  const handleProducerChange = (prodId: string) => {
    const p = producers.find(item => item.id === parseInt(prodId));
    setFormData(prev => ({
      ...prev,
      producer_id: prodId,
      orchard: p?.default_orchard || prev.orchard
    }));
  };

  // Save new Batch (with offline resilience and auto-sync)
  const handleSubmit = async (e: React.FormEvent, shouldPrintImmediate = false) => {
    e.preventDefault();

    const payloadData = {
      scale_ticket_folio: formData.scale_ticket_folio || undefined,
      producer_id: formData.producer_id ? parseInt(formData.producer_id) : null,
      producer_name: selectedProducer ? selectedProducer.name : (formData.producer_id === '' ? 'SIN ASIGNAR' : 'Productor Local'),
      origin: formData.origin,
      orchard: formData.orchard,
      variety: 'Limón Mexicano',
      weight_gross: grossNum,
      weight_tare: tareNum,
      weight_net: netNum,
      price_per_kg: priceNum,
      subtotal: subtotalNum,
      scale_fee: scaleFeeNum,
      scale_fee_payment: formData.scale_fee_payment,
      extra_charge_per_kg: extraKgRate,
      extra_charge_total: extraChargeTotalNum,
      extra_charge_concept: formData.extra_charge_concept,
      total: totalNum,
      operator: formData.operator,
      notes: formData.notes
    };

    // If offline (or in simulated mode), save directly to offline local storage
    if (effectiveIsOffline) {
      const savedOffline = saveOfflineBatch(payloadData);
      refreshOfflineQueue();
      const localBatch = offlineBatchToBatch(savedOffline);
      setShowForm(false);
      setSyncFeedback({
        type: 'warning',
        message: `⚠️ Recibo guardado temporalmente en este equipo (${savedOffline.tempId}). Se sincronizará automáticamente al recuperar acceso a red.`
      });
      setTimeout(() => setSyncFeedback(null), 8000);

      if (shouldPrintImmediate) {
        setSelectedTicket(localBatch);
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        setSelectedTicket(localBatch);
      }
      return;
    }

    // Attempt standard network request, fallback automatically if connection drops
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scale_ticket_folio: formData.scale_ticket_folio,
          producer_id: formData.producer_id ? parseInt(formData.producer_id) : null,
          origin: formData.origin,
          orchard: formData.orchard,
          variety: 'Limón Mexicano',
          weight_gross: grossNum,
          weight_tare: tareNum,
          price_per_kg: priceNum,
          scale_fee: scaleFeeNum,
          scale_fee_payment: formData.scale_fee_payment,
          extra_charge_per_kg: extraKgRate,
          extra_charge_concept: formData.extra_charge_concept,
          operator: formData.operator,
          notes: formData.notes
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const newBatch: Batch = await res.json();
      
      // Also mirror to Cloud Firestore in the background for cloud backup
      try {
        saveCloudBatch(newBatch).catch(err => console.warn('Background cloud Firestore mirror error:', err));
      } catch (err) {
        // non-blocking
      }

      setShowForm(false);
      fetchData();
      if (shouldPrintImmediate) {
        setSelectedTicket(newBatch);
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        setSelectedTicket(newBatch);
      }
    } catch (err: any) {
      console.warn('Fallo de conexión al enviar boleta. Guardando en almacenamiento local:', err);
      const savedOffline = saveOfflineBatch(payloadData);
      refreshOfflineQueue();
      const localBatch = offlineBatchToBatch(savedOffline);
      setShowForm(false);
      setSyncFeedback({
        type: 'warning',
        message: `⚠️ No se pudo contactar al servidor central (${err.message || 'Fallo de red'}). El recibo se guardó de forma segura en memoria local y se sincronizará automáticamente.`
      });
      setTimeout(() => setSyncFeedback(null), 8000);

      if (shouldPrintImmediate) {
        setSelectedTicket(localBatch);
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        setSelectedTicket(localBatch);
      }
    }
  };

  // Quick Create Producer
  const handleCreateProducer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProducer.name.trim()) return;

    fetch('/api/producers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProducer)
    })
      .then(res => res.json())
      .then((created: Producer) => {
        setProducers(prev => [...prev, created]);
        setFormData(prev => ({ ...prev, producer_id: created.id.toString(), orchard: created.default_orchard || prev.orchard }));
        setShowNewProducerModal(false);
        setNewProducer({ name: '', rfc: '', phone: '', location: '', default_orchard: '' });
      })
      .catch(err => alert('Error creando productor: ' + err.message));
  };

  // Combine offline batches with server batches for table view
  const combinedBatches = React.useMemo(() => {
    const offlineConverted = offlineBatches.map(item => ({
      ...offlineBatchToBatch(item),
      isOfflinePending: true,
      rawOfflineId: item.tempId
    }));
    return [...offlineConverted, ...batches];
  }, [offlineBatches, batches]);

  // Filter batches
  const filteredBatches = combinedBatches.filter(batch => {
    const matchesSearch = 
      (batch.folio && batch.folio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (batch.producer_name && batch.producer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (batch.orchard && batch.orchard.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesOrigin = 
      filterOrigin === 'todos' ? true :
      filterOrigin === 'cosecha' ? batch.origin.toLowerCase().includes('propia') :
      batch.origin.toLowerCase().includes('compra') || batch.origin.toLowerCase().includes('terceros');

    return matchesSearch && matchesOrigin;
  });

  // Calculate totals for stats
  const totalKgToday = combinedBatches.reduce((sum, b) => sum + (b.weight_net || 0), 0);
  const totalMoneyToday = combinedBatches.reduce((sum, b) => sum + (b.total || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center p-2 shadow-xs">
            <Logo variant="mono" className="scale-90" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Recepción y Báscula
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                JBM Cítricos
              </span>
              
              {/* Online / Offline status badge */}
              {effectiveIsOffline ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  <WifiOff size={13} className="text-amber-700" />
                  Modo Sin Conexión ({simulatedOffline ? 'Simulado' : 'Offline'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Wifi size={13} className="text-emerald-700" />
                  Báscula En Línea
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Control de entradas, pesaje certificado, resiliencia offline y emisión de tickets térmicos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Offline simulator toggle button for testing */}
          <button
            onClick={toggleSimulatedOffline}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              simulatedOffline 
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Simular desconexión a internet para validar el guardado offline y sincronización automática"
          >
            {simulatedOffline ? <WifiOff size={14} /> : <Radio size={14} />}
            <span>{simulatedOffline ? 'Restablecer Conexión' : 'Probar Sin Conexión'}</span>
          </button>

          {/* Sync Button (if pending offline items exist) */}
          {offlineBatches.length > 0 && (
            <button
              onClick={() => handleSyncBatches(true)}
              disabled={isSyncing || effectiveIsOffline}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Forzar sincronización inmediata de boletas guardadas localmente"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>Sincronizar ({offlineBatches.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              setFormData({
                scale_ticket_folio: '',
                producer_id: producers[0]?.id.toString() || '',
                origin: 'Cosecha propia',
                orchard: 'Pedernales',
                variety: 'Limón Mexicano',
                weight_gross: '14500',
                weight_tare: '4200',
                price_per_kg: '18.50',
                scale_fee: '50.00',
                scale_fee_payment: 'descuento',
                extra_charge_per_kg: '0.40',
                extra_charge_concept: 'Servicios operativos y maniobra',
                operator: 'Carlos Barragán',
                notes: ''
              });
              setShowForm(true);
            }}
            className="flex-1 md:flex-none bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 hover:scale-[1.02] transition-all cursor-pointer text-sm"
          >
            <Plus size={18} />
            <span>Nueva Entrada / Boleta</span>
          </button>
        </div>
      </header>

      {/* Sync / Offline Banner Feedback */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all shadow-xs ${
          syncFeedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : syncFeedback.type === 'warning'
            ? 'bg-amber-50 text-amber-950 border-amber-300'
            : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
            {syncFeedback.type === 'warning' && <AlertTriangle size={18} className="text-amber-600 shrink-0" />}
            {syncFeedback.type === 'info' && <RefreshCw size={18} className="text-blue-600 shrink-0" />}
            <span>{syncFeedback.message}</span>
          </div>
          <button 
            onClick={() => setSyncFeedback(null)} 
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Offline Queue Notice Banner */}
      {offlineBatches.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HardDrive size={20} />
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                <span>{offlineBatches.length} Recibo(s) Guardado(s) Temporalmente en Memoria Local</span>
              </h4>
              <p className="text-xs text-amber-800 font-medium">
                {effectiveIsOffline 
                  ? 'Se guardaron localmente sin conexión. Se sincronizarán automáticamente al restablecer el acceso a red.'
                  : 'Red disponible. La sincronización automática está lista para transferir los datos al servidor.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleSyncBatches(true)}
              disabled={isSyncing || effectiveIsOffline}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <CloudUpload size={15} className={isSyncing ? "animate-bounce" : ""} />
              <span>{isSyncing ? 'Sincronizando...' : 'Subir Recibos al Servidor'}</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kilos Recibidos</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalKgToday.toLocaleString()} <span className="text-sm font-medium text-slate-500">kg</span></p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <Scale size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Boletas Emitidas</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{batches.length} <span className="text-sm font-medium text-slate-500">tickets</span></p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
            <Printer size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Importe Total Fruta</p>
            <p className="text-2xl font-black text-slate-900 mt-1">${totalMoneyToday.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuota Báscula</p>
            <p className="text-2xl font-black text-slate-900 mt-1">${(batches.length * 50).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
            <Truck size={24} />
          </div>
        </div>
      </div>

      {/* Main Batches Table & Filter Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Historial de Boletas de Recepción</h3>
              <p className="text-xs text-slate-400 font-medium">Registro de pesadas en báscula con folio certificado</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Origin Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterOrigin('todos')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterOrigin === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterOrigin('cosecha')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterOrigin === 'cosecha' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Cosecha Propia
              </button>
              <button
                onClick={() => setFilterOrigin('compra')}
                className={`px-3 py-1.5 rounded-lg transition-all ${filterOrigin === 'compra' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Compra Terceros
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar productor, folio, huerto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Folio</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Productor</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Origen / Huerto</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Peso Bruto</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Tara</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Peso Neto</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Precio / Total</th>
                <th className="px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Cargando boletas de recepción...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-600">No se encontraron boletas de recepción</p>
                    <p className="text-xs mt-1">Realiza una nueva entrada con el botón "Nueva Entrada / Boleta"</p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map(batch => {
                  const isOfflineItem = (batch as any).isOfflinePending || (batch.folio && (batch.folio.includes('TEMPORAL') || batch.folio.includes('OFF-')));
                  return (
                  <tr 
                    key={batch.id} 
                    className={`transition-colors group ${
                      isOfflineItem 
                        ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-4 border-l-amber-500' 
                        : 'hover:bg-emerald-50/30'
                    }`}
                  >
                    {/* Folio */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-emerald-800">
                          {batch.folio || `#REC-${String(batch.id).padStart(5, '0')}`}
                        </span>
                        {isOfflineItem && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded text-[9px] font-black uppercase tracking-wider">
                            <CloudOff size={10} />
                            <span>OFFLINE</span>
                          </span>
                        )}
                      </div>
                      {batch.scale_ticket_folio ? (
                        <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded text-[10px] font-mono font-bold">
                          <span>Báscula:</span>
                          <span>{batch.scale_ticket_folio}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-mono">Báscula #1</div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                      {new Date(batch.date).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Producer */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{batch.producer_name}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">{batch.variety || 'Limón Mexicano'}</div>
                    </td>

                    {/* Origin / Orchard */}
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-slate-700">{batch.orchard || 'Pedernales'}</div>
                      <span className="inline-block text-[10px] px-1.5 py-0.2 font-bold rounded bg-slate-100 text-slate-600">
                        {batch.origin || 'Cosecha propia'}
                      </span>
                    </td>

                    {/* Gross */}
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-600">
                      {(batch.weight_gross || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                    </td>

                    {/* Tare */}
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-rose-500">
                      - {(batch.weight_tare || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                    </td>

                    {/* Net Weight */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-mono text-xs font-black text-slate-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                        {(batch.weight_net || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                      </span>
                    </td>

                    {/* Total Money */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="font-mono text-xs font-black text-emerald-700">
                        ${(batch.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ${(batch.price_per_kg || 18.5).toFixed(2)}/kg
                      </div>
                    </td>

                    {/* Actions / View Ticket Button & Sync */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => setSelectedTicket(batch)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs group cursor-pointer"
                          title="Ver e Imprimir Ticket Térmico JBM"
                        >
                          <Printer size={14} className="group-hover:scale-110 transition-transform" />
                          <span>Ticket</span>
                        </button>
                        {isOfflineItem && !effectiveIsOffline && (
                          <button
                            onClick={() => handleSyncBatches(true)}
                            className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Sincronizar esta boleta pendiente ahora"
                          >
                            <CloudUpload size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NUEVA ENTRADA DE FRUTA CON VISTA PREVIA EN VIVO DEL TICKET TÉRMICO */}
      {/* ========================================================================= */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm">
                  <Scale size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Nueva Boleta de Recepción & Pesaje
                  </h3>
                  <p className="text-xs text-slate-300">
                    Emisión de ticket oficial con folio para JBM Cítricos Barragán
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Screen (Left: Form | Right: Live Thermal Ticket Preview) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50">
              {/* LEFT COLUMN: ENTRY FORM (7 cols) */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
                {/* Offline Warning Notice if currently disconnected */}
                {effectiveIsOffline && (
                  <div className="p-3.5 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-amber-950 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <CloudOff size={18} className="text-amber-700 shrink-0" />
                      <div className="text-xs">
                        <span className="font-black block text-amber-950">Modo Sin Conexión Activo</span>
                        <span className="text-amber-900 font-medium">
                          La boleta se guardará en almacenamiento local seguro y se sincronizará automáticamente al detectar conexión.
                        </span>
                      </div>
                    </div>
                    <span className="bg-amber-200 text-amber-950 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shrink-0">
                      Resiliencia Offline
                    </span>
                  </div>
                )}

                {/* Producer Selection & Scale Ticket Folio Row */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Producer */}
                    <div className="sm:col-span-7">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          Productor / Proveedor
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewProducerModal(true)}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus size={14} />
                          + Nuevo
                        </button>
                      </div>
                      <select
                        value={formData.producer_id}
                        onChange={e => handleProducerChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="">-- Seleccionar productor registrado --</option>
                        {producers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.location || 'Local'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Scale Ticket Folio */}
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        No. Folio Ticket Báscula
                      </label>
                      <input
                        type="text"
                        value={formData.scale_ticket_folio}
                        onChange={e => setFormData({ ...formData, scale_ticket_folio: e.target.value })}
                        placeholder="Ej. BAS-10492 / TKT-890"
                        className="w-full bg-slate-50 border border-amber-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">Ticket del pesaje del camión</span>
                    </div>
                  </div>
                </div>

                {/* Origin, Orchard & Single Variety (Limón Mexicano) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Origen de la Fruta
                    </label>
                    <select
                      value={formData.origin}
                      onChange={e => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Cosecha propia">Cosecha propia</option>
                      <option value="Compra libre en campo">Compra libre en campo</option>
                      <option value="Huerto en aparcería">Huerto en aparcería</option>
                      <option value="Contrato de temporada">Contrato de temporada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Huerto / Predio
                    </label>
                    <input
                      type="text"
                      value={formData.orchard}
                      onChange={e => setFormData({ ...formData, orchard: e.target.value })}
                      placeholder="Ej. Pedernales"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                        🍋
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          Variedad de Recepción: <span className="text-emerald-700">Limón Mexicano</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium">
                          (Citrus aurantifolia con semilla) · Variedad exclusiva de acopio
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-md">
                      Exclusivo
                    </span>
                  </div>
                </div>

                {/* Weights Section (Bruto, Tara, Neto) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale size={16} className="text-emerald-700" />
                      Pesaje de Báscula (KG)
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Báscula Camionera #1</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Bruto (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.weight_gross}
                        onChange={e => setFormData({ ...formData, weight_gross: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Tara (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.weight_tare}
                        onChange={e => setFormData({ ...formData, weight_tare: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-mono font-black text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex flex-col justify-center">
                      <label className="block text-[11px] font-black text-emerald-800 uppercase mb-0.5">
                        Neto (kg)
                      </label>
                      <div className="text-lg font-mono font-black text-emerald-900">
                        {netNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing, Scale Fee (Deduction or Cash), and Extra Charges per kg */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  {/* Price and Subtotal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Precio por Kilo ($/KG)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        required
                        value={formData.price_per_kg}
                        onChange={e => setFormData({ ...formData, price_per_kg: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Subtotal Fruta ({netNum.toLocaleString()} kg)</span>
                      <span className="text-base font-mono font-black text-slate-900">
                        ${subtotalNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Cuota de Báscula (Deducción vs Efectivo) */}
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Cuota de Báscula (Cobro al Productor)
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-slate-700">$</span>
                        <input
                          type="number"
                          step="5.00"
                          value={formData.scale_fee}
                          onChange={e => setFormData({ ...formData, scale_fee: e.target.value })}
                          className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, scale_fee_payment: 'descuento' })}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          formData.scale_fee_payment === 'descuento'
                            ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          formData.scale_fee_payment === 'descuento' ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                        }`}>
                          {formData.scale_fee_payment === 'descuento' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">Descontar de liquidación</div>
                          <div className="text-[10px] text-rose-700 font-medium">
                            Resta -${scaleFeeNum.toFixed(2)} al total a pagar
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, scale_fee_payment: 'efectivo' })}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          formData.scale_fee_payment === 'efectivo'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          formData.scale_fee_payment === 'efectivo' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}>
                          {formData.scale_fee_payment === 'efectivo' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">Pagado en efectivo</div>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Productor pagó en mano ($0 deducido)
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Cargos Adicionales por Kilo Recibido (Servicios Operativos / Maniobra) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Cargos Adicionales por Kilo Recibido
                      </label>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Habitual: $0.40/kg
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Tarifa por Kg ($/kg)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={formData.extra_charge_per_kg}
                          onChange={e => setFormData({ ...formData, extra_charge_per_kg: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-8">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Concepto del Cargo
                        </label>
                        <input
                          type="text"
                          value={formData.extra_charge_concept}
                          onChange={e => setFormData({ ...formData, extra_charge_concept: e.target.value })}
                          placeholder="Ej. Servicios operativos y maniobra"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    {extraKgRate > 0 && (
                      <div className="text-[11px] font-mono text-rose-700 bg-rose-50/70 px-3 py-1.5 rounded-lg border border-rose-200/60 flex justify-between items-center">
                        <span>Deducción operativa ({netNum.toLocaleString()} kg × ${extraKgRate.toFixed(2)}):</span>
                        <span className="font-bold">- ${extraChargeTotalNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  {/* Resumen Total y Desglose Matemático en Tiempo Real */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Calculator size={14} />
                        </div>
                        <span className="text-[11px] font-black text-slate-200 uppercase tracking-wider">
                          Resumen en Tiempo Real de Liquidación
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        Cálculo Automático
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      {/* Subtotal Fruta */}
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-sans text-[11px] flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">(+)</span> Fruta ({netNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg × ${priceNum.toFixed(2)}):
                        </span>
                        <span className="font-bold text-slate-100">
                          ${subtotalNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Tarifa de Báscula */}
                      {formData.scale_fee_payment === 'descuento' ? (
                        <div className="flex justify-between items-center text-rose-400">
                          <span className="font-sans text-[11px] flex items-center gap-1.5">
                            <span className="font-bold">(-)</span> Tarifa de Báscula (Deducción):
                          </span>
                          <span className="font-bold">
                            -${scaleFeeNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-emerald-400">
                          <span className="font-sans text-[11px] flex items-center gap-1.5">
                            <span className="font-bold">(✓)</span> Tarifa de Báscula:
                          </span>
                          <span className="text-[11px]">
                            $0.00 (Efectivo en mano)
                          </span>
                        </div>
                      )}

                      {/* Cargo Operativo */}
                      {extraChargeTotalNum > 0 && (
                        <div className="flex justify-between items-center text-rose-400">
                          <span className="font-sans text-[11px] flex items-center gap-1.5">
                            <span className="font-bold">(-)</span> Cargo Operativo (${extraKgRate.toFixed(2)}/kg × {netNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg):
                          </span>
                          <span className="font-bold">
                            -${extraChargeTotalNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Total Deducciones */}
                      {totalDeductions > 0 && (
                        <div className="flex justify-between items-center text-slate-400 text-[10px] pt-1 border-t border-slate-800/60">
                          <span className="font-sans">Total Deducciones Aplicadas:</span>
                          <span className="text-rose-400 font-bold">-${totalDeductions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {/* Precio Efectivo Real por Kg */}
                      {netNum > 0 && (
                        <div className="flex justify-between items-center text-slate-300 text-[11px] pt-1">
                          <span className="font-sans text-slate-400 flex items-center gap-1">
                            <BadgePercent size={12} className="text-amber-400" />
                            Precio Neto Efectivo Real:
                          </span>
                          <span className="font-bold text-amber-300">
                            ${effectivePricePerKg.toFixed(2)} / kg
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total a Liquidar */}
                    <div className="border-t-2 border-slate-700/80 pt-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-black uppercase text-amber-400 block tracking-wide">
                          TOTAL NETO A LIQUIDAR:
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          Monto final a pagar al productor
                        </span>
                      </div>
                      <span className="text-2xl font-mono font-black text-amber-400">
                        ${totalNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operator & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Operador de Báscula
                    </label>
                    <input
                      type="text"
                      value={formData.operator}
                      onChange={e => setFormData({ ...formData, operator: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Observaciones / Lote
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ej. Fruta verde corte matutino"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Printer size={18} className="text-amber-400" />
                    <span>Guardar e Imprimir Directo</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>Guardar Boleta</span>
                  </button>
                </div>
              </form>

              {/* RIGHT COLUMN: LIVE THERMAL TICKET PREVIEW (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-start border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Vista Previa Exacta del Ticket
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
                    Formato 80mm
                  </span>
                </div>

                <div className="w-full flex justify-center py-2">
                  <ThermalTicket
                    data={liveTicketData}
                    isLivePreview={true}
                    showActions={false}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER / IMPRIMIR TICKET EXISTENTE                                     */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div id="print-modal-container" className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white no-print">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  Ticket #{selectedTicket.folio || selectedTicket.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 bg-slate-100 flex flex-col items-center justify-center overflow-y-auto max-h-[80vh]">
              <ThermalTicket
                data={{
                  folio: selectedTicket.folio || `#REC-${String(selectedTicket.id).padStart(5, '0')}`,
                  date: selectedTicket.date,
                  producer_name: selectedTicket.producer_name,
                  origin: selectedTicket.origin,
                  orchard: selectedTicket.orchard,
                  variety: selectedTicket.variety,
                  quality: selectedTicket.quality,
                  weight_gross: selectedTicket.weight_gross,
                  weight_tare: selectedTicket.weight_tare,
                  weight_net: selectedTicket.weight_net,
                  price_per_kg: selectedTicket.price_per_kg,
                  subtotal: selectedTicket.subtotal,
                  scale_fee: selectedTicket.scale_fee,
                  total: selectedTicket.total,
                  operator: selectedTicket.operator,
                  notes: selectedTicket.notes
                }}
                showActions={true}
                onPrint={() => window.print()}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVO PRODUCTOR RÁPIDO                                    */}
      {/* ========================================================================= */}
      {showNewProducerModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-600" />
                Registrar Productor Nuevo
              </h4>
              <button onClick={() => setShowNewProducerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProducer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Don Antonio Pérez Solís"
                  value={newProducer.name}
                  onChange={e => setNewProducer({ ...newProducer, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RFC (Opcional)</label>
                  <input
                    type="text"
                    placeholder="PESA700101XYZ"
                    value={newProducer.rfc}
                    onChange={e => setNewProducer({ ...newProducer, rfc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="232-123-4567"
                    value={newProducer.phone}
                    onChange={e => setNewProducer({ ...newProducer, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación / Municipio</label>
                <input
                  type="text"
                  placeholder="Pedernales, Atzalan, Misantla, etc."
                  value={newProducer.location}
                  onChange={e => setNewProducer({ ...newProducer, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Huerto Predeterminado</label>
                <input
                  type="text"
                  placeholder="Ej. Huerto La Loma Lote 2"
                  value={newProducer.default_orchard}
                  onChange={e => setNewProducer({ ...newProducer, default_orchard: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProducerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                >
                  Guardar Productor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
