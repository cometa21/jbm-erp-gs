import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Package,
  Factory,
  Scale,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Printer,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Download,
  Warehouse,
  Snowflake,
  Truck,
  Activity,
  ShieldCheck,
  Layers,
  RefreshCw,
  X,
  Tag,
  QrCode,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  User,
  MapPin,
  ChevronRight,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Batch, ProductionRecord, ProductionPresentation, DiscardReportRow } from '../types';
import { Logo } from './Logo';
import { ProductionBatchYieldTracker } from './ProductionBatchYieldTracker';

// --- SISTEMA DE CALIBRES CITRÍCOLAS ESTANDARIZADOS POR COLOR ---
export const CALIBRES_POR_COLOR = {
  verde: [
    { value: "V-4", label: "V-4 (Chico)", desc: "Exportación Cal. 230/250", orden: 1 },
    { value: "V-5", label: "V-5 (Mediano)", desc: "Exportación Cal. 200", orden: 2 },
    { value: "V-X", label: "V-X (Grande)", desc: "Exportación Cal. 175", orden: 3 },
    { value: "V-XX", label: "V-XX (Extra Gde)", desc: "Exportación Cal. 150", orden: 4 },
    { value: "V-XXX", label: "V-XXX (Jumbo)", desc: "Exportación Cal. 110", orden: 5 },
    { value: "V-EXT", label: "V-EXT (Especial)", desc: "Super Selecto", orden: 6 },
  ],
  alimonado: [
    { value: "AL-4", label: "AL-4", desc: "Nacional 2da Cal. 230", orden: 7 },
    { value: "AL-5", label: "AL-5", desc: "Nacional 2da Cal. 200", orden: 8 },
    { value: "AL-X", label: "AL-X", desc: "Nacional 2da Cal. 175", orden: 9 },
    { value: "AL-XX", label: "AL-XX", desc: "Nacional 2da Cal. 150", orden: 10 },
    { value: "AL-XXX", label: "AL-XXX", desc: "Nacional 2da Cal. 110", orden: 11 },
    { value: "AL-EXT", label: "AL-EXT", desc: "Nacional Especial", orden: 12 },
  ],
  amarillo: [
    { value: "AM-X", label: "AM-X (Mediano)", desc: "Molino / Extracción", orden: 13 },
    { value: "AM-XX", label: "AM-XX (Grande)", desc: "Tolva Industrial", orden: 14 },
    { value: "AM-XXX", label: "AM-XXX (Jumbo)", desc: "Jugo Concentrado", orden: 15 },
    { value: "AM-EXT", label: "AM-EXT (Sobremaduro)", desc: "Proceso Líquido", orden: 16 },
  ],
};

const PRESENTACIONES_DEFAULT: ProductionPresentation[] = [
  { id: 'caja_18kg', name: 'Caja JBM Export 18.14 kg (40 lbs)', weight_kg: 18.14, box_type: 'Cartón Corrugado Exportación' },
  { id: 'caja_20kg', name: 'Caja JBM Premium 20 kg', weight_kg: 20.0, box_type: 'Cartón Corrugado Reforzado' },
  { id: 'caja_15kg', name: 'Caja Estándar 15 kg', weight_kg: 15.0, box_type: 'Cartón Corrugado Nacional' },
  { id: 'arpilla_25kg', name: 'Arpilla Malla 25 kg', weight_kg: 25.0, box_type: 'Arpilla Malla Polietileno' },
];

function getColorFromCalibre(cal: string): 'verde' | 'alimonado' | 'amarillo' | '' {
  if (cal.startsWith('V-')) return 'verde';
  if (cal.startsWith('AL-')) return 'alimonado';
  if (cal.startsWith('AM-')) return 'amarillo';
  return '';
}

function getCalibreBadgeClass(cal: string): string {
  if (cal.startsWith('V-')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (cal.startsWith('AL-')) return 'bg-lime-100 text-lime-800 border-lime-300';
  if (cal.startsWith('AM-')) return 'bg-amber-100 text-amber-900 border-amber-300';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getColorGroupLabel(cal: string): { label: string; emoji: string } {
  if (cal.startsWith('V-')) return { label: 'Verde (Exportación / 1ra)', emoji: '🟢' };
  if (cal.startsWith('AL-')) return { label: 'Alimonado (Mercado Nacional / 2da)', emoji: '🟡' };
  if (cal.startsWith('AM-')) return { label: 'Amarillo (Industria / Molino)', emoji: '🟠' };
  return { label: '', emoji: '' };
}

export function Production() {
  // Data states
  const [batches, setBatches] = useState<Batch[]>([]);
  const [productionRuns, setProductionRuns] = useState<ProductionRecord[]>([]);
  const [discards, setDiscards] = useState<DiscardReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<{
    efficiency: number;
    merma: number;
    produccion_hoy: number;
    processedByBatch: Record<number, number>;
    caliberDistribution: Record<string, number>;
  }>({
    efficiency: 94.5,
    merma: 3.5,
    produccion_hoy: 0,
    processedByBatch: {},
    caliberDistribution: {}
  });

  // Form states
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedCalibre, setSelectedCalibre] = useState<string>('');
  const selectedColor = useMemo(() => getColorFromCalibre(selectedCalibre), [selectedCalibre]);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>('caja_18kg');
  const [boxesCount, setBoxesCount] = useState<string>('');
  const [pesoIndustria, setPesoIndustria] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('piso_empaque');
  const [operator, setOperator] = useState<string>('Carlos Barragán');
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  // Modals & Printable Label state
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [discardForm, setDiscardForm] = useState({
    batch_id: '',
    type: 'Mancha de Trips / Ácaro (Daño Superficial)',
    kg: '',
    impact_percent: '2.5',
    trend: 'Estable' as 'Alza' | 'Baja' | 'Estable',
    notes: ''
  });

  const [printableLabel, setPrintableLabel] = useState<{
    batchFolio: string;
    producer: string;
    orchard: string;
    calibre: string;
    color: string;
    presentation: string;
    boxes: number;
    weightKg: number;
    destination: string;
    date: string;
    operator: string;
  } | null>(null);

  // Fetch all production data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesRes, prodRes, kpiRes, discardsRes] = await Promise.all([
        fetch('/api/batches').then(r => r.ok ? r.json() : []),
        fetch('/api/production').then(r => r.ok ? r.json() : []),
        fetch('/api/production/kpis').then(r => r.ok ? r.json() : null),
        fetch('/api/production/discards').then(r => r.ok ? r.json() : [])
      ]);

      const loadedBatches = Array.isArray(batchesRes) ? batchesRes : [];
      setBatches(loadedBatches);
      setProductionRuns(Array.isArray(prodRes) ? prodRes : []);
      setDiscards(Array.isArray(discardsRes) ? discardsRes : []);

      if (kpiRes) {
        setKpis({
          efficiency: kpiRes.efficiency || 94.5,
          merma: kpiRes.merma || 3.5,
          produccion_hoy: kpiRes.produccion_hoy || 0,
          processedByBatch: kpiRes.processedByBatch || {},
          caliberDistribution: kpiRes.caliberDistribution || {}
        });
      }

      // Auto-select first available batch if not set
      if (!selectedBatchId && loadedBatches.length > 0) {
        const active = loadedBatches.find(b => {
          const processed = (kpiRes?.processedByBatch?.[b.id]) || 0;
          return (b.weight_net - processed) > 0;
        });
        if (active) setSelectedBatchId(String(active.id));
      }
    } catch (err) {
      console.error('Error loading production data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived batch calculations
  const selectedBatch = useMemo(() => {
    return batches.find(b => String(b.id) === String(selectedBatchId));
  }, [batches, selectedBatchId]);

  const kilosProcesados = useMemo(() => {
    if (!selectedBatch) return 0;
    return kpis.processedByBatch[selectedBatch.id] || 0;
  }, [selectedBatch, kpis.processedByBatch]);

  const kilosDisponibles = useMemo(() => {
    if (!selectedBatch) return 0;
    return Math.max(0, (selectedBatch.weight_net || 0) - kilosProcesados);
  }, [selectedBatch, kilosProcesados]);

  const porcentajeUtilizado = useMemo(() => {
    if (!selectedBatch || !selectedBatch.weight_net || selectedBatch.weight_net <= 0) return 0;
    return Math.min(100, (kilosProcesados / selectedBatch.weight_net) * 100);
  }, [selectedBatch, kilosProcesados]);

  // Destination & Quality Logic
  const destinoInfo = useMemo(() => {
    if (selectedColor === 'amarillo') {
      return {
        destino: 'molino',
        calidad: 'industria',
        mensaje: '🏭 Fruta dirigida a Molino / Extracción de Jugo Industrial',
        tipo: 'warning' as const
      };
    }
    if (selectedColor === 'alimonado') {
      return {
        destino: selectedDestination,
        calidad: 'segunda',
        mensaje: '🟡 Fruta Calidad Segunda (Mercado Nacional)',
        tipo: 'info' as const
      };
    }
    if (selectedColor === 'verde') {
      return {
        destino: selectedDestination,
        calidad: 'primera',
        mensaje: '🟢 Fruta Calidad Primera (Exportación & Super Selecto)',
        tipo: 'success' as const
      };
    }
    return null;
  }, [selectedColor, selectedDestination]);

  const esIndustria = destinoInfo?.destino === 'molino';

  const selectedPresentation = useMemo(() => {
    return PRESENTACIONES_DEFAULT.find(p => p.id === selectedPresentationId) || PRESENTACIONES_DEFAULT[0];
  }, [selectedPresentationId]);

  // Total kg requested for this run
  const kilosSolicitados = useMemo(() => {
    if (esIndustria) {
      return parseFloat(pesoIndustria) || 0;
    }
    if (selectedPresentation && boxesCount) {
      return Number((selectedPresentation.weight_kg * (parseInt(boxesCount, 10) || 0)).toFixed(2));
    }
    return 0;
  }, [esIndustria, pesoIndustria, selectedPresentation, boxesCount]);

  const sobrepasaKilos = kilosSolicitados > (kilosDisponibles + 5);
  const diferenciaExceso = Math.max(0, kilosSolicitados - kilosDisponibles);

  // Filter batches for selection dropdown
  const filteredBatches = useMemo(() => {
    const term = batchSearch.trim().toLowerCase();
    return batches.filter(b => {
      const matchTerm = !term ||
        (b.folio || '').toLowerCase().includes(term) ||
        (b.producer_name || '').toLowerCase().includes(term) ||
        (b.orchard || '').toLowerCase().includes(term);
      return matchTerm;
    });
  }, [batches, batchSearch]);

  // Chart data for calibers
  const chartData = useMemo(() => {
    const defaultCalibers = ['V-4', 'V-5', 'V-X', 'V-XX', 'V-XXX', 'AL-X', 'AL-XX', 'AM-X'];
    return defaultCalibers.map(cal => ({
      calibre: cal,
      cajas: kpis.caliberDistribution[cal] || (cal === 'V-X' ? 140 : cal === 'V-XX' ? 220 : cal === 'V-XXX' ? 95 : 30),
      color: cal.startsWith('V-') ? '#10b981' : cal.startsWith('AL-') ? '#84cc16' : '#f59e0b'
    }));
  }, [kpis.caliberDistribution]);

  // Destination option cards
  const destinationOptions = [
    {
      value: 'piso_empaque',
      label: 'Piso de Empaque',
      desc: 'Paletizado & Consolidación Inmediata',
      icon: Warehouse,
      accent: 'border-amber-400 bg-amber-50 text-amber-900 ring-amber-400'
    },
    {
      value: 'camara_fria',
      label: 'Cámara Fría',
      desc: 'Refrigeración 4°C a 6°C con Humedad 90%',
      icon: Snowflake,
      accent: 'border-sky-400 bg-sky-50 text-sky-900 ring-sky-400'
    },
    {
      value: 'transporte_directo',
      label: 'Directo a CDMX',
      desc: 'Embarque Rápido Central de Abastos',
      icon: Truck,
      accent: 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-emerald-400'
    },
  ];

  // Handle Production Register
  const handleRegisterProduction = async () => {
    if (!selectedBatch || !selectedCalibre || kilosSolicitados <= 0) return;
    if (sobrepasaKilos) {
      setFeedback({
        type: 'error',
        title: 'Kilos Insuficientes en Boleta',
        message: `El lote solo tiene ${kilosDisponibles.toFixed(2)} kg disponibles. Solicitaste ${kilosSolicitados.toFixed(2)} kg.`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        batch_id: selectedBatch.id,
        calibre: selectedCalibre,
        color: selectedColor,
        quality: destinoInfo?.calidad || 'primera',
        presentation_id: esIndustria ? null : selectedPresentation.id,
        presentation_name: esIndustria ? 'Granel / Molino' : selectedPresentation.name,
        boxes_count: esIndustria ? 0 : parseInt(boxesCount, 10) || 0,
        weight_total_kg: kilosSolicitados,
        destination: esIndustria ? 'molino' : selectedDestination,
        operator: operator,
        notes: `Clasificación ${selectedCalibre} (${selectedColor})`
      };

      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al registrar producción');
      }

      const responseData = await res.json();
      const numCajas = esIndustria ? 0 : parseInt(boxesCount, 10);

      // Prepare print label
      setPrintableLabel({
        batchFolio: selectedBatch.folio || `REC-${selectedBatch.id}`,
        producer: selectedBatch.producer_name,
        orchard: selectedBatch.orchard,
        calibre: selectedCalibre,
        color: selectedColor.toUpperCase(),
        presentation: esIndustria ? 'Granel Molino' : selectedPresentation.name,
        boxes: numCajas,
        weightKg: kilosSolicitados,
        destination: esIndustria ? 'MOLINO / INDUSTRIA' : selectedDestination.toUpperCase().replace('_', ' '),
        date: new Date().toLocaleString('es-MX'),
        operator: operator
      });

      // Deduction feedback
      const deductionsText = responseData.deducciones?.length > 0
        ? `Insumos descontados: ${responseData.deducciones.map((d: any) => `${d.insumoNombre} (-${d.cantidadDescontada})`).join(', ')}`
        : '';

      setFeedback({
        type: 'success',
        title: 'Producción Registrada Exitosamente',
        message: `Lote: ${selectedBatch.folio} • ${kilosSolicitados.toFixed(2)} kg procesados en ${selectedCalibre}. ${deductionsText}`
      });

      // Reset fields
      setBoxesCount('');
      setPesoIndustria('');
      setSelectedCalibre('');

      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Error de Registro',
        message: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Discard Register
  const handleRegisterDiscard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discardForm.type || !discardForm.kg) return;

    try {
      const res = await fetch('/api/production/discards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: discardForm.batch_id ? parseInt(discardForm.batch_id, 10) : (selectedBatch?.id || null),
          type: discardForm.type,
          kg: parseFloat(discardForm.kg),
          impact_percent: parseFloat(discardForm.impact_percent) || 2.0,
          trend: discardForm.trend,
          notes: discardForm.notes
        })
      });

      if (!res.ok) throw new Error('Error guardando descarte');

      setShowDiscardModal(false);
      setDiscardForm({
        batch_id: '',
        type: 'Mancha de Trips / Ácaro (Daño Superficial)',
        kg: '',
        impact_percent: '2.5',
        trend: 'Estable',
        notes: ''
      });

      setFeedback({
        type: 'success',
        title: 'Descarte Auditado',
        message: 'Incidencia de calidad guardada en bitácora de empaque.'
      });

      await loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Export Quality CSV
  const handleExportCSV = () => {
    if (discards.length === 0) {
      alert('No hay registros de descarte para exportar.');
      return;
    }

    const headers = 'ID,Boleta_Origen,Productor,Defecto_Calidad,Kilos_Descarte,Impacto_Porcentaje,Tendencia,Fecha\n';
    const rows = discards.map(d => 
      `"${d.id}","${d.batch_folio || 'General'}","${d.producer_name || 'Acopio'}","${d.type}",${d.kg},${d.impact_percent}%,"${d.trend}","${d.date}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JBM_REPORTE_CALIDAD_DESCARTE_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Discard summary metrics
  const totalDescarteKg = discards.reduce((acc, d) => acc + (d.kg || 0), 0);
  const impactoPromedio = discards.length > 0 
    ? discards.reduce((acc, d) => acc + (d.impact_percent || 0), 0) / discards.length 
    : 0;
  const focoPrincipal = discards[0]?.type || 'Sin incidencias críticas';

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center p-2 shadow-xs text-emerald-800">
            <Factory size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Clasificación, Calibres & Empaque
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Línea Activa JBM
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Control de calidad de Limón Mexicano, balance de kilos de entrada vs. empacados y ruteo a cámaras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiscardModal(true)}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <AlertTriangle size={15} className="text-amber-700" />
            <span>Auditar Descarte</span>
          </button>

          <button
            onClick={loadData}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Refrescar datos"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs transition-all ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' :
          feedback.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-950' :
          'bg-blue-50 border-blue-300 text-blue-950'
        }`}>
          <div className="flex items-start gap-3">
            {feedback.type === 'success' && <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />}
            {feedback.type === 'error' && <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />}
            {feedback.type === 'info' && <Info size={22} className="text-blue-600 shrink-0 mt-0.5" />}
            <div>
              <p className="font-black text-sm">{feedback.title}</p>
              <p className="text-xs opacity-90 font-medium mt-0.5">{feedback.message}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Status & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600 space-y-2">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <span>Lotes Disponibles</span>
            <Package size={16} className="text-emerald-700" />
          </div>
          <p className="text-3xl font-black text-slate-900">{batches.length}</p>
          <p className="text-xs text-emerald-800 font-bold flex items-center gap-1">
            <TrendingUp size={14} /> Recepción Continua en Báscula
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs border-l-4 border-l-lime-500 space-y-2">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <span>Rendimiento Global</span>
            <Activity size={16} className="text-lime-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.efficiency}%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-lime-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, kpis.efficiency)}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500 space-y-2">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <span>Merma / Descarte</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-700">{kpis.merma}%</p>
          <p className="text-xs text-slate-400 font-semibold">Tolerancia máxima FDA: 5.0%</p>
        </div>

        <div className="bg-emerald-950 text-white p-5 rounded-3xl shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest text-emerald-300 font-black">Procesado Hoy</span>
            <Factory size={18} className="text-lime-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{(kpis.produccion_hoy / 1000).toFixed(1)} <span className="text-lg font-bold text-emerald-300">Tn</span></p>
            <p className="text-[11px] text-emerald-200 font-medium">Línea de Encerado Carnauba Activa</p>
          </div>
        </div>
      </div>

      {/* Visualización de Rendimiento & Avance de Lotes Activos con Recharts */}
      <ProductionBatchYieldTracker
        batches={batches}
        productionRuns={productionRuns}
        discards={discards}
        selectedBatchId={selectedBatchId}
        onSelectBatch={(batchId) => setSelectedBatchId(batchId)}
      />

      {/* Main Grid: Left = Classification Form (8 cols), Right = Caliber Chart & Status (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- FORMULARIO DE CLASIFICACIÓN DE PRODUCCIÓN (8/12) --- */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Form Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Registro de Empaque & Calibres JBM</h3>
                  <p className="text-xs text-slate-500 font-medium">Clasificación por color, tamaño y descuento de insumos</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                Operador: {operator}
              </span>
            </div>

            <div className="p-6 space-y-6">
              
              {/* 1. SELECCIÓN DE LOTE EN LÍNEA */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  1. Lote de Recepción en Mesa de Selección
                </label>
                <div className="relative">
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-300 rounded-2xl px-4 text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Lote de Limón Recibido --</option>
                    {filteredBatches.map((b) => {
                      const processed = kpis.processedByBatch[b.id] || 0;
                      const avail = Math.max(0, b.weight_net - processed);
                      return (
                        <option key={b.id} value={b.id}>
                          {b.folio || `REC-${b.id}`} • {b.producer_name} ({b.orchard}) — {avail.toFixed(0)} kg disponibles / {b.weight_net} kg total
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* 2. PANEL DE BALANCE DE KILOS DEL LOTE SELECCIONADO */}
              {selectedBatch && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale size={18} className="text-emerald-700" />
                      <h4 className="font-black text-slate-800 text-sm">Control de Balance de Fruta: {selectedBatch.folio}</h4>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      Origen: {selectedBatch.orchard} ({selectedBatch.producer_name})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Peso Neto Báscula</span>
                      <span className="text-base font-black text-slate-900">{selectedBatch.weight_net.toLocaleString()} kg</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ya Procesado</span>
                      <span className="text-base font-black text-blue-700">{kilosProcesados.toLocaleString()} kg</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Disponible en Tolva</span>
                      <span className={`text-base font-black ${kilosDisponibles < 500 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {kilosDisponibles.toLocaleString()} kg
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Avance Lote</span>
                      <span className="text-base font-black text-slate-800">{porcentajeUtilizado.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Procesando lote: {kilosProcesados.toFixed(0)} kg</span>
                      <span>Total: {selectedBatch.weight_net.toFixed(0)} kg</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${porcentajeUtilizado}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Warning if over quota */}
                  {sobrepasaKilos && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-3 text-rose-900">
                      <AlertCircle size={20} className="text-rose-600 shrink-0" />
                      <div className="text-xs">
                        <p className="font-black">¡Advertencia! La cantidad solicitada sobrepasa el peso disponible</p>
                        <p>Solicitas: <strong>{kilosSolicitados.toFixed(2)} kg</strong> | Disponible: <strong>{kilosDisponibles.toFixed(2)} kg</strong> | Exceso: <strong>{diferenciaExceso.toFixed(2)} kg</strong></p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. MATRIZ DE CALIBRES POR COLOR */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                    2. Seleccionar Calibre & Grado de Color
                  </label>
                  {selectedCalibre && (
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getCalibreBadgeClass(selectedCalibre)}`}>
                      {getColorGroupLabel(selectedCalibre).emoji} {selectedCalibre} — {getColorGroupLabel(selectedCalibre).label}
                    </span>
                  )}
                </div>

                {/* GRUPO VERDE (1RA / EXPORTACIÓN) */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                    <span>🟢</span>
                    <span>LIMÓN VERDE (1ra Calidad / Exportación USDA & EU)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {CALIBRES_POR_COLOR.verde.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedCalibre(c.value)}
                        className={`p-2.5 rounded-xl border-2 font-bold text-center transition-all cursor-pointer ${
                          selectedCalibre === c.value
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-md scale-105 ring-2 ring-emerald-500 ring-offset-1'
                            : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100/70'
                        }`}
                      >
                        <span className="block text-sm font-black">{c.value}</span>
                        <span className="block text-[10px] opacity-80 mt-0.5">{c.label.split(' ')[1] || ''}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* GRUPO ALIMONADO (2DA / NACIONAL) */}
                <div className="p-3.5 bg-lime-50/60 rounded-2xl border border-lime-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-lime-900">
                    <span>🟡</span>
                    <span>ALIMONADO (2da Calidad / Mercado Nacional & Central de Abastos)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {CALIBRES_POR_COLOR.alimonado.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedCalibre(c.value)}
                        className={`p-2.5 rounded-xl border-2 font-bold text-center transition-all cursor-pointer ${
                          selectedCalibre === c.value
                            ? 'bg-lime-600 text-white border-lime-700 shadow-md scale-105 ring-2 ring-lime-400 ring-offset-1'
                            : 'bg-white text-lime-900 border-lime-300 hover:bg-lime-100/70'
                        }`}
                      >
                        <span className="block text-sm font-black">{c.value}</span>
                        <span className="block text-[10px] opacity-80 mt-0.5">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* GRUPO AMARILLO (MOLINO / JUGOS) */}
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                    <span>🟠</span>
                    <span>AMARILLO (Destino Molino / Industria / Aceite & Jugo)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CALIBRES_POR_COLOR.amarillo.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedCalibre(c.value)}
                        className={`p-2.5 rounded-xl border-2 font-bold text-center transition-all cursor-pointer ${
                          selectedCalibre === c.value
                            ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-105 ring-2 ring-amber-400 ring-offset-1'
                            : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/70'
                        }`}
                      >
                        <span className="block text-sm font-black">{c.value}</span>
                        <span className="block text-[10px] opacity-80 mt-0.5">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. SELECTOR DE DESTINO & PRESENTACIÓN */}
              {selectedCalibre && !esIndustria && (
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                    3. Destino de Almacenamiento de Cajas
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {destinationOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSel = selectedDestination === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedDestination(opt.value)}
                          className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                            isSel ? opt.accent + ' shadow-md scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon size={24} className={isSel ? 'text-current' : 'text-slate-400'} />
                            {isSel && <CheckCircle2 size={18} className="text-emerald-700" />}
                          </div>
                          <div>
                            <span className="block text-sm font-black text-slate-900">{opt.label}</span>
                            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">{opt.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. CANTIDAD DE CAJAS O PESADA DIRECTA DE MOLINO */}
              {selectedCalibre && (
                <div>
                  {!esIndustria ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                          Presentación de Envase
                        </label>
                        <select
                          value={selectedPresentationId}
                          onChange={(e) => setSelectedPresentationId(e.target.value)}
                          className="w-full h-14 bg-slate-50 border border-slate-300 rounded-2xl px-4 text-base font-bold text-slate-900 focus:bg-white"
                        >
                          {PRESENTACIONES_DEFAULT.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.weight_kg} kg)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                          Número de Cajas Empacadas
                        </label>
                        <input
                          type="number"
                          value={boxesCount}
                          onChange={(e) => setBoxesCount(e.target.value)}
                          placeholder="Ej. 150"
                          min="1"
                          className="w-full h-14 bg-slate-50 border border-slate-300 rounded-2xl px-4 text-2xl font-mono font-black text-slate-900 focus:bg-white text-center"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-300 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                        <Scale size={20} className="text-amber-700" />
                        <span>Pesaje Báscula de Piso (Granel hacia Tolva Industrial)</span>
                      </div>
                      <input
                        type="number"
                        value={pesoIndustria}
                        onChange={(e) => setPesoIndustria(e.target.value)}
                        placeholder="Ej. 850.00 kg"
                        min="0.1"
                        step="0.1"
                        className="w-full h-16 bg-white border-2 border-amber-400 rounded-2xl px-4 text-3xl font-mono font-black text-amber-950 text-center shadow-inner"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 6. RESUMEN DE KILOS & BOTONES DE ACCIÓN */}
              {selectedCalibre && kilosSolicitados > 0 && (
                <div className="p-4 bg-slate-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-500 uppercase">Resumen de Clasificación:</span>
                    <p className="text-base font-black text-slate-900">
                      {kilosSolicitados.toLocaleString()} kg • Calibre {selectedCalibre} ({destinoInfo?.calidad.toUpperCase()})
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      Restante en lote: {(kilosDisponibles - kilosSolicitados).toFixed(2)} kg
                    </p>
                  </div>

                  <button
                    onClick={handleRegisterProduction}
                    disabled={isSubmitting || sobrepasaKilos || kilosSolicitados <= 0}
                    className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package size={20} />
                    <span>Registrar {esIndustria ? 'Pesada Molino' : 'Cajas Empacadas'}</span>
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* HISTORIAL RECIENTE DE CLASIFICACIÓN */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Activity size={18} className="text-emerald-700" />
                Últimos Registros de Clasificación en Planta
              </h3>
              <span className="text-xs text-slate-400 font-bold">{productionRuns.length} movimientos</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Hora / Fecha</th>
                    <th className="p-3">Boleta</th>
                    <th className="p-3">Calibre</th>
                    <th className="p-3">Cajas</th>
                    <th className="p-3">Kilos Totales</th>
                    <th className="p-3">Destino</th>
                    <th className="p-3 text-right">Etiqueta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productionRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                        No hay registros de producción hoy. Inicie una clasificación arriba.
                      </td>
                    </tr>
                  ) : (
                    productionRuns.slice(0, 15).map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(run.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {run.batch_folio || `REC-${run.batch_id}`}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-black text-[11px] border ${getCalibreBadgeClass(run.calibre)}`}>
                            {run.calibre}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {run.boxes_count > 0 ? `${run.boxes_count} cjs` : 'Granel'}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          {run.weight_total_kg.toLocaleString()} kg
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            run.destination === 'camara_fria' ? 'bg-sky-100 text-sky-800' :
                            run.destination === 'transporte_directo' ? 'bg-emerald-100 text-emerald-800' :
                            run.destination === 'molino' ? 'bg-amber-100 text-amber-900' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {run.destination.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setPrintableLabel({
                                batchFolio: run.batch_folio || `REC-${run.batch_id}`,
                                producer: run.producer_name || 'JBM Acopio',
                                orchard: run.orchard || 'Huerto',
                                calibre: run.calibre,
                                color: run.color.toUpperCase(),
                                presentation: run.presentation_name || 'Caja Estándar',
                                boxes: run.boxes_count,
                                weightKg: run.weight_total_kg,
                                destination: run.destination.toUpperCase().replace('_', ' '),
                                date: run.date,
                                operator: run.operator
                              });
                            }}
                            className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Reimprimir Etiqueta Térmica"
                          >
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* --- COLUMNA DERECHA: GRÁFICO DE CALIBRES & ESTADÍSTICAS (4/12) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Caliber Distribution Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-700" />
              Distribución de Calibres
            </h3>
            <p className="text-xs text-slate-500 font-medium">Volumen empacado en cajas por tamaño y color</p>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="calibre" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="cajas" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* JBM Export Standard Card */}
          <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Logo variant="mono" className="scale-75 invert filter" />
              <div>
                <h4 className="font-black text-sm text-white">Especificación JBM Export</h4>
                <p className="text-[11px] text-amber-400 font-bold">Protocolo USDA & Unión Europea</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Color Mínimo:</span>
                <span className="font-bold text-emerald-400">Verde Intenso (Escala 1 a 2)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Peso Caja Export:</span>
                <span className="font-bold text-white">18.14 kg (40 lbs exactas)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Tratamiento:</span>
                <span className="font-bold text-white">Cera Carnauba Grado Alimento</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Estiba Tarima:</span>
                <span className="font-bold text-white">54 Cajas / Tarima HT</span>
              </div>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-xs">
              <span className="text-emerald-400 font-black block uppercase text-[10px]">Cadena de Frío:</span>
              <span className="text-slate-300">Cámara 1 a 5°C • Humedad Relativa 90%</span>
            </div>
          </div>

        </div>

      </div>

      {/* --- REPORTE ACUMULADO DE CALIDAD Y DESCARTE --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
        <div className="p-6 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck size={22} className="text-emerald-700" />
              Reporte de Calidad y Defectos de Selección
            </h3>
            <p className="text-xs text-slate-500 font-medium">Auditoría de descarte y control de merma en mesa de empaque</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} className="text-emerald-700" />
              <span>Descargar CSV</span>
            </button>

            <button
              onClick={() => setShowDiscardModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Nuevo Registro Descarte</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards for Quality */}
        <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Descarte Acumulado</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalDescarteKg.toLocaleString()} kg</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Impacto Promedio en Rendimiento</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{impactoPromedio.toFixed(1)}%</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Foco de Atención Principal</span>
            <span className="text-sm font-black text-slate-800 mt-1 block truncate">{focoPrincipal}</span>
          </div>
        </div>

        {/* Discards Table */}
        <div className="px-6 pb-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Defecto de Calidad</th>
                  <th className="p-3.5">Boleta / Origen</th>
                  <th className="p-3.5">Kilos Separados</th>
                  <th className="p-3.5">Impacto (%)</th>
                  <th className="p-3.5">Tendencia</th>
                  <th className="p-3.5">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No hay registros de descarte cargados.
                    </td>
                  </tr>
                ) : (
                  discards.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{row.type}</td>
                      <td className="p-3.5 text-slate-600">{row.batch_folio || 'Lote Acopio'}</td>
                      <td className="p-3.5 font-mono font-bold text-amber-700">{row.kg} kg</td>
                      <td className="p-3.5 font-bold">
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px]">
                          {row.impact_percent}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          row.trend === 'Alza' ? 'bg-rose-100 text-rose-800' :
                          row.trend === 'Baja' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {row.trend}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">{row.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRO DE DESCARTE DE CALIDAD                                   */}
      {/* ========================================================================= */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Auditoría de Descarte</h3>
                  <p className="text-xs text-slate-500">Registro de defectos en mesa de selección</p>
                </div>
              </div>
              <button onClick={() => setShowDiscardModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterDiscard} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Lote Asociado</label>
                <select
                  value={discardForm.batch_id}
                  onChange={(e) => setDiscardForm({ ...discardForm, batch_id: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 font-semibold"
                >
                  <option value="">Lote General de Acopio</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.folio} • {b.producer_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Tipo de Defecto / Causa</label>
                <select
                  value={discardForm.type}
                  onChange={(e) => setDiscardForm({ ...discardForm, type: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 font-semibold"
                >
                  <option value="Mancha de Trips / Ácaro (Daño Superficial)">Mancha de Trips / Ácaro (Daño Superficial)</option>
                  <option value="Partidura de Uña / Golpe de Cosecha">Partidura de Uña / Golpe de Cosecha</option>
                  <option value="Roña / Mancha Grasosa (Clasif. B)">Roña / Mancha Grasosa (Clasif. B)</option>
                  <option value="Fruta Sobremadura / Amarilla no Industrial">Fruta Sobremadura / Amarilla no Industrial</option>
                  <option value="Herida Abierta / Podredumbre">Herida Abierta / Podredumbre</option>
                  <option value="Deformidad / Calibre Menor a 250">Deformidad / Calibre Menor a 250</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Kilos Separados</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={discardForm.kg}
                    onChange={(e) => setDiscardForm({ ...discardForm, kg: e.target.value })}
                    placeholder="Ej. 180"
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 uppercase">Impacto Est. (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={discardForm.impact_percent}
                    onChange={(e) => setDiscardForm({ ...discardForm, impact_percent: e.target.value })}
                    placeholder="Ej. 2.5"
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Tendencia de Calidad</label>
                <select
                  value={discardForm.trend}
                  onChange={(e) => setDiscardForm({ ...discardForm, trend: e.target.value as any })}
                  className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 font-semibold"
                >
                  <option value="Estable">Estable (Dentro de Norma)</option>
                  <option value="Alza">Alza (Revisar Cuadrilla de Corte)</option>
                  <option value="Baja">Baja (Excelente Calidad)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 uppercase">Observaciones</label>
                <textarea
                  value={discardForm.notes}
                  onChange={(e) => setDiscardForm({ ...discardForm, notes: e.target.value })}
                  placeholder="Detalles sobre el huerto o manejo en campo..."
                  className="w-full h-20 bg-slate-50 border border-slate-300 rounded-xl p-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md"
                >
                  Guardar en Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ETIQUETA TÉRMICA DE CAJA / TARIMA DE PRODUCCIÓN                     */}
      {/* ========================================================================= */}
      {printableLabel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Tag size={18} className="text-emerald-700" />
                Etiqueta Térmica Oficial JBM
              </h3>
              <button onClick={() => setPrintableLabel(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {/* Thermal Label Graphic representation */}
            <div className="border-2 border-dashed border-slate-400 p-5 rounded-2xl bg-white space-y-4 font-mono text-slate-900 shadow-xs">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                <div>
                  <h4 className="font-black text-lg tracking-tight">JBM CÍTRICOS BARRAGÁN</h4>
                  <p className="text-[10px] text-slate-600 font-sans font-bold">EMPACADORA CERTIFICADA • MARTÍNEZ DE LA TORRE, VER.</p>
                </div>
                <QrCode size={38} className="text-slate-900" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Lote Origen:</span>
                  <span className="font-black text-sm">{printableLabel.batchFolio}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Calibre / Color:</span>
                  <span className="font-black text-sm bg-slate-100 px-1.5 py-0.5 rounded">{printableLabel.calibre} ({printableLabel.color})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-slate-500 block uppercase">Productor / Huerto:</span>
                  <span className="font-bold text-xs truncate block">{printableLabel.producer} • {printableLabel.orchard}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Presentación:</span>
                  <span className="font-bold text-xs">{printableLabel.presentation}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Volumen / Peso:</span>
                  <span className="font-black text-sm">{printableLabel.boxes > 0 ? `${printableLabel.boxes} Cajas` : `${printableLabel.weightKg} kg`}</span>
                </div>
                <div className="col-span-2 border-t border-slate-300 pt-1">
                  <span className="text-[9px] text-slate-500 block uppercase">Destino Asignado:</span>
                  <span className="font-black text-emerald-800 text-xs">{printableLabel.destination}</span>
                </div>
              </div>

              {/* Barcode simulation */}
              <div className="border-t-2 border-slate-900 pt-2 text-center">
                <div className="h-9 w-full bg-[repeating-linear-gradient(90deg,#000_0px,#000_2px,#fff_2px,#fff_4px,#000_4px,#000_7px,#fff_7px,#fff_9px)] rounded"></div>
                <span className="text-[10px] tracking-widest font-black block mt-1">*{printableLabel.batchFolio}-{printableLabel.calibre}*</span>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setPrintableLabel(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 rounded-xl font-black bg-emerald-700 hover:bg-emerald-800 text-white text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                <span>Imprimir Térmica (Zebra)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
