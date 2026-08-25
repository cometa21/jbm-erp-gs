import React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  Building2,
  Receipt,
  FileCheck,
  User,
  Scale,
  Filter,
  DollarSign,
  Layers,
  ArrowDownCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Logo } from './Logo';
import { Batch, Producer } from '../types';
import { generateScaleHistoryPdf } from '../utils/pdfExport';

type DocumentType = 'historial_bascula' | 'liquidacion' | 'remision' | 'carta_porte' | 'calidad' | 'estado_cuenta';

export function Documents() {
  const [docType, setDocType] = React.useState<DocumentType>('historial_bascula');
  const [producerName, setProducerName] = React.useState('Don Pedro Ramírez Méndez');
  const [folioDoc, setFolioDoc] = React.useState('LIQ-00042');
  const [destination, setDestination] = React.useState('McAllen, Texas, USA');
  const [carrier, setCarrier] = React.useState('Transportes Refrigerados del Golfo S.A. de C.V.');
  const [driver, setDriver] = React.useState('Roberto Morales Vega (Lic. Federal 849201)');
  const [vehicle, setVehicle] = React.useState('Kenworth T680 Placas: 48-AJ-9K (Thermo King -1.5°C)');

  // Data for Scale Receipts History
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [producers, setProducers] = React.useState<Producer[]>([]);
  const [selectedProducerFilter, setSelectedProducerFilter] = React.useState<string>('TODOS');
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    // Load batches and producers from API
    fetch('/api/batches')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBatches(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading batches:', err));

    fetch('/api/producers')
      .then(res => res.ok ? res.json() : [])
      .then(data => setProducers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading producers:', err));
  }, []);

  const printDocument = () => {
    window.print();
  };

  // Filtered batches for report
  const filteredBatches = React.useMemo(() => {
    if (selectedProducerFilter === 'TODOS') return batches;
    return batches.filter(b => b.producer_name?.toLowerCase().includes(selectedProducerFilter.toLowerCase()));
  }, [batches, selectedProducerFilter]);

  // Aggregate stats
  const totalNetKg = filteredBatches.reduce((sum, b) => sum + (b.weight_net || 0), 0);
  const totalGrossKg = filteredBatches.reduce((sum, b) => sum + (b.weight_gross || 0), 0);
  const totalTareKg = filteredBatches.reduce((sum, b) => sum + (b.weight_tare || 0), 0);
  const totalSubtotalFruta = filteredBatches.reduce((sum, b) => sum + (b.subtotal || 0), 0);
  const totalScaleFees = filteredBatches.reduce((sum, b) => sum + (b.scale_fee || 0), 0);
  const totalScaleFeesDeducted = filteredBatches.reduce((sum, b) => sum + (b.scale_fee_payment === 'descuento' ? (b.scale_fee || 0) : 0), 0);
  const totalScaleFeesCash = filteredBatches.reduce((sum, b) => sum + (b.scale_fee_payment === 'efectivo' ? (b.scale_fee || 0) : 0), 0);
  const totalExtraCharges = filteredBatches.reduce((sum, b) => sum + (b.extra_charge_total || ((b.weight_net || 0) * (b.extra_charge_per_kg ?? 0.40))), 0);
  const totalLiquidated = filteredBatches.reduce((sum, b) => sum + (b.total || 0), 0);

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      generateScaleHistoryPdf(filteredBatches, {
        producerName: selectedProducerFilter === 'TODOS' ? 'Todos los Productores' : selectedProducerFilter
      });
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 no-print">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center p-2 shadow-xs">
            <Logo variant="mono" className="scale-90" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Centro de Documentos Oficiales
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                JBM Branding
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Exportación de historial de báscula, boletas de liquidación, remisiones y certificados con membrete y logo oficial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {docType === 'historial_bascula' ? (
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer ring-2 ring-emerald-600/30"
            >
              <Download size={16} className="text-amber-400" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF Estructurado'}</span>
            </button>
          ) : null}

          <button
            onClick={printDocument}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>Imprimir Documento</span>
          </button>
        </div>
      </header>

      {/* Document Selector Navigation (Hidden on Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 no-print">
        {[
          { id: 'historial_bascula', label: 'Historial Báscula & Cargos', icon: Scale, highlight: true },
          { id: 'liquidacion', label: 'Boleta de Liquidación', icon: Receipt },
          { id: 'remision', label: 'Remisión de Embarque', icon: Truck },
          { id: 'carta_porte', label: 'Carta Porte 3.0', icon: FileCheck },
          { id: 'calidad', label: 'Certificado de Calidad', icon: ShieldCheck },
          { id: 'estado_cuenta', label: 'Estado de Cuenta', icon: FileText },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setDocType(item.id as DocumentType)}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              docType === item.id 
                ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-600/30' 
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <item.icon size={20} className={docType === item.id ? 'text-amber-400' : 'text-slate-400'} />
              {item.highlight && docType !== item.id && (
                <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">PDF</span>
              )}
            </div>
            <span className="text-xs font-bold mt-2 leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Filter Bar for Historial de Báscula (Hidden on Print) */}
      {docType === 'historial_bascula' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Filter size={15} className="text-emerald-700" />
              <span>Filtrar por Productor:</span>
            </div>
            <select
              value={selectedProducerFilter}
              onChange={(e) => setSelectedProducerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="TODOS">-- Todos los Productores ({batches.length} boletas) --</option>
              {producers.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-slate-900">{filteredBatches.length}</strong> pesajes
            </span>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download size={14} className="text-amber-400" />
              <span>Exportar PDF Membretado JBM</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THE PRINTABLE OFFICIAL MEMBRETE / DOCUMENT VIEW CONTAINER                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden printable-document">
        {/* OFFICIAL LETTERHEAD / MEMBRETE */}
        <div className="p-8 border-b-2 border-slate-900 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Full JBM Brand Logo */}
            <div className="flex items-center gap-5">
              <div className="w-32 sm:w-40 flex-shrink-0">
                <Logo variant="full" size="md" />
              </div>
              <div className="hidden sm:block border-l-2 border-emerald-700/30 pl-4 space-y-0.5">
                <h2 className="text-sm font-black text-emerald-950 tracking-tight">
                  JBM CÍTRICOS S.A. DE C.V.
                </h2>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                  EMPACADORA & EXPORTADORA DE CÍTRICOS PREMIUM • LIMONES BARRAGÁN
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  R.F.C.: JBM980412H82 • Reg. SENASICA / FDA Certificado • Báscula Camionera Certificada
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Carretera Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Ver.
                </p>
              </div>
            </div>

            {/* Document Meta Tag */}
            <div className="text-center sm:text-right border sm:border-0 border-slate-200 p-3 sm:p-0 rounded-2xl bg-white sm:bg-transparent">
              <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest mb-1">
                {docType === 'historial_bascula' ? 'HISTORIAL DE BÁSCULA Y CARGOS OPERATIVOS' :
                 docType === 'liquidacion' ? 'LIQUIDACIÓN DE FRUTA' :
                 docType === 'remision' ? 'REMISIÓN DE EMBARQUE' :
                 docType === 'carta_porte' ? 'CARTA PORTE 3.0 SAT' :
                 docType === 'calidad' ? 'CERTIFICADO FITOSANITARIO' : 'ESTADO DE CUENTA PRODUCTOR'}
              </div>
              <div className="text-xl font-mono font-black text-slate-900 mt-1">
                {docType === 'historial_bascula' ? `REP-BAS-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-01` : `FOLIO: ${folioDoc}`}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">
                Fecha de Emisión: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* DOCUMENT BODY VARIATIONS BASED ON docType                             */}
        {/* ===================================================================== */}
        <div className="p-8 space-y-6">
          {/* 0. HISTORIAL DE RECIBOS DE BÁSCULA Y CARGOS OPERATIVOS */}
          {docType === 'historial_bascula' && (
            <div className="space-y-6">
              {/* Financial KPI Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Kilos Netos</span>
                  <span className="text-lg font-mono font-black text-emerald-950">
                    {totalNetKg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">{filteredBatches.length} pesajes</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subtotal Fruta</span>
                  <span className="text-lg font-mono font-black text-slate-900">
                    ${totalSubtotalFruta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Valor bruto fruta</span>
                </div>

                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Cuotas Báscula</span>
                  <span className="text-lg font-mono font-black text-amber-950">
                    ${totalScaleFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    Desc: ${totalScaleFeesDeducted.toFixed(0)} | Efec: ${totalScaleFeesCash.toFixed(0)}
                  </span>
                </div>

                <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Cargos Operativos</span>
                  <span className="text-lg font-mono font-black text-rose-950">
                    ${totalExtraCharges.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-rose-700 block mt-0.5">Tarifa $0.40/kg recibido</span>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-900 text-white p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Liquidado</span>
                  <span className="text-lg font-mono font-black text-amber-400">
                    ${totalLiquidated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">Total neto pagado</span>
                </div>
              </div>

              {/* Batches Table */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>Detalle de Boletas de Báscula y Retenciones Operativas</span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {selectedProducerFilter === 'TODOS' ? 'Todos los Productores' : selectedProducerFilter}
                    </span>
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 border-b border-slate-200 font-black text-slate-700 uppercase">
                      <tr>
                        <th className="p-3">Folio / Báscula</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Productor / Huerto</th>
                        <th className="p-3 text-right">Bruto (kg)</th>
                        <th className="p-3 text-right">Tara (kg)</th>
                        <th className="p-3 text-right">Neto (kg)</th>
                        <th className="p-3 text-right">Precio</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 text-right">Cuota Báscula</th>
                        <th className="p-3 text-right">Cargo Op. ($0.40/kg)</th>
                        <th className="p-3 text-right font-black">Total Liquidado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {filteredBatches.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-slate-400 font-sans">
                            No se encontraron registros de báscula para los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredBatches.map((b) => {
                          const extraKg = b.extra_charge_per_kg ?? 0.40;
                          const extraTotal = b.extra_charge_total ?? ((b.weight_net || 0) * extraKg);
                          return (
                            <tr key={b.id} className="hover:bg-slate-50">
                              <td className="p-3">
                                <div className="font-bold text-emerald-800">{b.folio || `#REC-${String(b.id).padStart(5, '0')}`}</div>
                                {b.scale_ticket_folio && (
                                  <div className="text-[10px] text-amber-800 font-sans font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200/60 inline-block mt-0.5">
                                    Tkt: {b.scale_ticket_folio}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-slate-500 font-sans">
                                {b.date ? new Date(b.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                              </td>
                              <td className="p-3 font-sans">
                                <div className="font-bold text-slate-900">{b.producer_name || 'SIN ASIGNAR'}</div>
                                <div className="text-[10px] text-slate-400">{b.orchard || 'Pedernales'} ({b.variety || 'Persa'})</div>
                              </td>
                              <td className="p-3 text-right text-slate-600">{(b.weight_gross || 0).toLocaleString('es-MX')}</td>
                              <td className="p-3 text-right text-rose-500">-{(b.weight_tare || 0).toLocaleString('es-MX')}</td>
                              <td className="p-3 text-right font-black text-emerald-950">{(b.weight_net || 0).toLocaleString('es-MX')}</td>
                              <td className="p-3 text-right">${(b.price_per_kg || 18.50).toFixed(2)}</td>
                              <td className="p-3 text-right font-bold text-slate-800">
                                ${(b.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right">
                                <div className="font-bold">${(b.scale_fee || 50).toFixed(2)}</div>
                                <div className={`text-[9px] font-sans ${b.scale_fee_payment === 'efectivo' ? 'text-emerald-700 font-bold' : 'text-rose-600'}`}>
                                  {b.scale_fee_payment === 'efectivo' ? '(Efectivo)' : '(Descuento)'}
                                </div>
                              </td>
                              <td className="p-3 text-right font-bold text-rose-700">
                                -${extraTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700 text-xs">
                                ${(b.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {filteredBatches.length > 0 && (
                      <tfoot className="bg-slate-100/80 border-t-2 border-slate-900 font-mono text-xs font-black">
                        <tr>
                          <td colSpan={3} className="p-3 font-sans uppercase">TOTALES ({filteredBatches.length} BOLETAS)</td>
                          <td className="p-3 text-right">{totalGrossKg.toLocaleString('es-MX')} kg</td>
                          <td className="p-3 text-right text-rose-600">-{totalTareKg.toLocaleString('es-MX')} kg</td>
                          <td className="p-3 text-right text-emerald-900">{totalNetKg.toLocaleString('es-MX')} kg</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">${totalSubtotalFruta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right">${totalScaleFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right text-rose-700">-${totalExtraCharges.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right text-emerald-900 text-sm font-black">
                            ${totalLiquidated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Financial Calculation & Deductions Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="space-y-2 text-xs text-slate-500">
                  <p className="font-bold text-slate-800 uppercase tracking-wider">Políticas de Pesaje y Deducciones Oficiales JBM:</p>
                  <p>• La báscula camionera cuenta con calibración y certificación oficial de 80 Toneladas.</p>
                  <p>• El cargo por servicios operativos ($0.40/kg) cubre maniobra, descarga, selección preliminar y logística interna.</p>
                  <p>• Las cuotas de báscula marcadas como descuento son restadas directamente del cheque o transferencia de liquidación.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Kilos Netos:</span>
                    <span className="font-bold">{totalNetKg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">(+) Subtotal Fruta Recibida:</span>
                    <span className="font-bold">${totalSubtotalFruta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span className="font-sans">(-) Cuotas de Báscula Descontadas:</span>
                    <span className="font-bold">-${totalScaleFeesDeducted.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span className="font-sans">(-) Cargos Operativos y Maniobra ($0.40/kg):</span>
                    <span className="font-bold">-${totalExtraCharges.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-2 text-slate-900 font-mono">
                    <span className="font-sans">GRAN TOTAL LIQUIDADO A PRODUCTORES:</span>
                    <span className="text-emerald-700">${totalLiquidated.toLocaleString('es-MX', { minimumFractionDigits: 2 })} M.X.N.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. BOLETA DE LIQUIDACIÓN A PRODUCTOR */}
          {docType === 'liquidacion' && (
            <div className="space-y-6">
              {/* Producer Information Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Productor</span>
                  <span className="text-sm font-black text-slate-900">{producerName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">R.F.C. / Registro</span>
                  <span className="text-sm font-mono font-bold text-slate-700">RAMP720815KJ8</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Huerto / Región</span>
                  <span className="text-sm font-bold text-slate-700">Pedernales Lote 4 (Martínez de la Torre)</span>
                </div>
              </div>

              {/* Batches Table Included in this Settlement */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                  Detalle de Boletas de Báscula Incluidas
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 border-b border-slate-200 font-black text-slate-600 uppercase">
                      <tr>
                        <th className="p-3">Boleta Báscula</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Variedad / Calidad</th>
                        <th className="p-3 text-right">Peso Bruto</th>
                        <th className="p-3 text-right">Tara</th>
                        <th className="p-3 text-right">Peso Neto</th>
                        <th className="p-3 text-right">Precio/Kg</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="p-3 font-bold text-emerald-800">#REC-00108</td>
                        <td className="p-3 text-slate-500 font-sans">24/08/2026</td>
                        <td className="p-3 font-sans font-bold">Limón Persa (1ra)</td>
                        <td className="p-3 text-right">14,500.00 kg</td>
                        <td className="p-3 text-right text-rose-500">- 4,200.00 kg</td>
                        <td className="p-3 text-right font-black text-slate-900">10,300.00 kg</td>
                        <td className="p-3 text-right">$18.50</td>
                        <td className="p-3 text-right font-black">$190,550.00</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-800">#REC-00104</td>
                        <td className="p-3 text-slate-500 font-sans">22/08/2026</td>
                        <td className="p-3 font-sans font-bold">Limón Persa (1ra)</td>
                        <td className="p-3 text-right">16,200.00 kg</td>
                        <td className="p-3 text-right text-rose-500">- 4,500.00 kg</td>
                        <td className="p-3 text-right font-black text-slate-900">11,700.00 kg</td>
                        <td className="p-3 text-right">$18.50</td>
                        <td className="p-3 text-right font-black">$216,450.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="space-y-2 text-xs text-slate-500">
                  <p className="font-bold text-slate-700">Condiciones de Pago:</p>
                  <p>• Pago mediante Transferencia Electrónica Interbancaria (SPEI).</p>
                  <p>• Retenciones e impuestos aplicados conforme a la legislación fiscal vigente.</p>
                  <p>• Fruta inspeccionada y aprobada por el área de control de calidad JBM.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Kilos Netos:</span>
                    <span className="font-bold">22,000.00 kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Subtotal Fruta:</span>
                    <span className="font-bold">$407,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Servicio de Báscula (2 pesajes):</span>
                    <span className="font-bold">$100.00</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span className="font-sans">Anticipos / Descuentos de Insumos:</span>
                    <span className="font-bold">- $15,000.00</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-2 text-slate-900 font-mono">
                    <span className="font-sans">TOTAL NETO A PAGAR:</span>
                    <span className="text-emerald-700">$392,100.00 M.X.N.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. REMISIÓN DE EMBARQUE & EXPORTACIÓN */}
          {docType === 'remision' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cliente / Destinatario</span>
                  <span className="text-sm font-black text-slate-900">Texas Fresh Citrus Imports LLC</span>
                  <span className="text-slate-500 block">1044 International Blvd, McAllen TX</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Transporte & Chofer</span>
                  <span className="font-bold text-slate-900 block">{carrier}</span>
                  <span className="text-slate-600 block">{driver}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Unidad & Termógrafo</span>
                  <span className="font-bold text-slate-900 block">{vehicle}</span>
                  <span className="text-emerald-700 font-mono font-bold block">Set Point: +4.0°C</span>
                </div>
              </div>

              {/* Cargo Details */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-black text-slate-700">
                    <tr>
                      <th className="p-3 font-sans">Pallets</th>
                      <th className="p-3 font-sans">Descripción del Producto</th>
                      <th className="p-3 font-sans">Calibres</th>
                      <th className="p-3 font-sans">Cajas</th>
                      <th className="p-3 font-sans text-right">Peso Neto (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold">12 Pallets</td>
                      <td className="p-3 font-sans font-bold">Limón Persa Calidad Exportación (JBM Box 40 lbs)</td>
                      <td className="p-3">Cal. 175 (60%) / Cal. 200 (40%)</td>
                      <td className="p-3">1,080 cajas</td>
                      <td className="p-3 text-right font-black">19,440.00 kg</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">8 Pallets</td>
                      <td className="p-3 font-sans font-bold">Limón Persa Calidad Exportación (JBM Box 40 lbs)</td>
                      <td className="p-3">Cal. 230 (100%)</td>
                      <td className="p-3">720 cajas</td>
                      <td className="p-3 text-right font-black">12,960.00 kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CARTA PORTE 3.0 SAT */}
          {docType === 'carta_porte' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block text-sm">Complemento Carta Porte 3.0 Integrado</span>
                <span className="text-emerald-700">UUID SAT: 84b29f01-e512-4aa8-9f33-7221d604b901 • Clave Producto SAT: 50101518 (Limones frescos)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-black text-slate-800 block text-xs uppercase">Origen (Ubicación 01)</span>
                  <p>Empacadora JBM Cítricos Pedernales, Martínez de la Torre, Ver. C.P. 93600</p>
                  <p className="font-mono text-slate-500">Salida: 24/08/2026 14:00 hrs</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-black text-slate-800 block text-xs uppercase">Destino (Ubicación 02)</span>
                  <p>Aduana Reynosa - Pharr Bridge / McAllen TX Warehouse</p>
                  <p className="font-mono text-slate-500">Llegada Estimada: 25/08/2026 06:00 hrs</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. CERTIFICADO FITOSANITARIO DE CALIDAD */}
          {docType === 'calidad' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-4 font-mono">
                <div>
                  <span className="font-sans text-slate-400 block text-[10px] uppercase">Grados Brix Promedio</span>
                  <span className="text-base font-black text-emerald-700">8.9° Brix</span>
                </div>
                <div>
                  <span className="font-sans text-slate-400 block text-[10px] uppercase">Porcentaje de Jugo</span>
                  <span className="text-base font-black text-emerald-700">46.5% Mínimo</span>
                </div>
                <div>
                  <span className="font-sans text-slate-400 block text-[10px] uppercase">Coloración de Cáscara</span>
                  <span className="text-base font-black text-emerald-700">Verde Intenso (#1 Export)</span>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed font-sans">
                Se certifica que el lote amparado bajo este documento ha sido sometido a procesos de lavado, desinfección, encerado con cera vegetal grado alimenticio y selección manual por tamaño y calidad, libre de plagas cuarentenarias y daños mecánicos.
              </p>
            </div>
          )}

          {/* 5. ESTADO DE CUENTA PRODUCTOR */}
          {docType === 'estado_cuenta' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Saldo a Favor del Productor</span>
                  <span className="text-2xl font-mono font-black text-emerald-700">$124,500.00 M.X.N.</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Último Pago Emitido</span>
                  <span className="font-mono font-bold text-slate-800">18/08/2026 (Transf. #84920)</span>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* OFFICIAL SIGNATURES & STAMPS (Present on all printed documents)        */}
          {/* ===================================================================== */}
          <div className="pt-10 border-t-2 border-slate-900">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="border-b border-slate-800 pb-12 mb-1.5"></div>
                <span className="text-[10px] font-black uppercase text-slate-800 block">
                  CARLOS BARRAGÁN M.
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-medium">
                  Gerencia de Operaciones • JBM
                </span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-18 h-18 rounded-full border-2 border-dashed border-emerald-700/60 flex flex-col items-center justify-center p-1 text-[8px] font-black text-emerald-800 uppercase tracking-tighter shadow-inner">
                  <span>JBM CÍTRICOS</span>
                  <span className="text-[7px] text-amber-700">CERTIFICADO</span>
                  <span>BARRAGÁN</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Sello Digital JBM</span>
              </div>

              <div>
                <div className="border-b border-slate-800 pb-12 mb-1.5"></div>
                <span className="text-[10px] font-black uppercase text-slate-800 block">
                  {docType === 'historial_bascula' && selectedProducerFilter !== 'TODOS' ? selectedProducerFilter : (producerName || 'PRODUCTOR')}
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-medium">
                  Firma de Conformidad / Productor
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase pt-4">
            DOCUMENTO OFICIAL GENERADO POR EL SISTEMA ERP JBM CÍTRICOS PREMIUM • WWW.JBMCITRICOS.COM
          </div>
        </div>
      </div>
    </div>
  );
}
