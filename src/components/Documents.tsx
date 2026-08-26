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
  FileSpreadsheet,
  FilePlus,
  RefreshCw,
  Eye,
  CreditCard,
  Barcode,
  QrCode,
  MapPin,
  Thermometer,
  Package
} from 'lucide-react';
import { Logo } from './Logo';
import { Batch, Producer, Settlement, Shipment } from '../types';
import { 
  generateScaleHistoryPdf, 
  generateInvoicePdf, 
  generateDispatchGuidePdf, 
  generateSettlementPdf,
  InvoiceData,
  DispatchGuideData
} from '../utils/pdfExport';

type DocumentType = 'factura' | 'guia_despacho' | 'historial_bascula' | 'liquidacion' | 'carta_porte' | 'calidad';

// Preset sample invoices
const SAMPLE_INVOICES: Record<string, InvoiceData> = {
  'FACT-2026-0842': {
    folio: 'FACT-2026-0842',
    uuid: '84B29F01-E512-4AA8-9F33-7221D604B901',
    date: '2026-08-24',
    dueDate: '2026-09-08',
    currency: 'USD',
    exchangeRate: 19.85,
    paymentMethod: 'PPD (Pago en parcialidades o diferido)',
    paymentForm: '03 - Transferencia electrónica de fondos',
    cfdiUse: 'G01 - Adquisición de mercancías',
    customer: {
      name: 'Texas Fresh Citrus Imports LLC',
      rfc: 'XEXX010101000',
      taxRegime: '601 - General de Ley Personas Morales',
      address: '1044 International Blvd, Suite 400, McAllen, TX 78501, USA',
      email: 'accounting@texasfreshcitrus.com',
      phone: '+1 (956) 555-0192'
    },
    items: [
      {
        satCode: '50101518',
        description: 'Limón Persa Calidad Exportación #1 (Caja JBM 40 lbs / 18.14 kg) - Calibre 175',
        quantity: 1080,
        unit: 'H87 - Pieza / Caja',
        unitPrice: 24.50,
        amount: 26460.00,
        taxRate: 0
      },
      {
        satCode: '50101518',
        description: 'Limón Persa Calidad Exportación #1 (Caja JBM 40 lbs / 18.14 kg) - Calibre 200',
        quantity: 720,
        unit: 'H87 - Pieza / Caja',
        unitPrice: 22.00,
        amount: 15840.00,
        taxRate: 0
      }
    ],
    subtotal: 42300.00,
    discountTotal: 0,
    taxTotal: 0,
    total: 42300.00,
    totalInWords: 'SON: CUARENTA Y DOS MIL TRESCIENTOS DÓLARES AMERICANOS 00/100 USD',
    notes: 'Incoterm: CIP Pharr Bridge / McAllen Warehouse. Inspección USDA-APHIS aprobada. Cadena de frío +3.8°C.'
  },
  'FACT-2026-0843': {
    folio: 'FACT-2026-0843',
    uuid: '92F81A02-4411-41C2-88B1-9921D604B902',
    date: '2026-08-24',
    dueDate: '2026-08-31',
    currency: 'MXN',
    paymentMethod: 'PUE (Pago en una sola exhibición)',
    paymentForm: '03 - Transferencia electrónica de fondos',
    cfdiUse: 'G01 - Adquisición de mercancías',
    customer: {
      name: 'Comercializadora de Frutas y Legumbres del Centro S.A. de C.V.',
      rfc: 'CFL120409KL8',
      taxRegime: '601 - General de Ley Personas Morales',
      address: 'Central de Abasto Iztapalapa, Bodega I-42, Ciudad de México, C.P. 09040',
      email: 'compras@frutasdelcentro.com.mx',
      phone: '+52 (55) 5694-8820'
    },
    items: [
      {
        satCode: '50101518',
        description: 'Limón Persa Seleccionado Verde (Caja Plástica / Cartón 15 kg)',
        quantity: 800,
        unit: 'H87 - Pieza / Caja',
        unitPrice: 420.00,
        amount: 336000.00,
        taxRate: 0
      },
      {
        satCode: '50101518',
        description: 'Naranja Valencia para Jugo (Bulto Malla 20 kg)',
        quantity: 400,
        unit: 'XPK - Bulto',
        unitPrice: 180.00,
        amount: 72000.00,
        taxRate: 0
      }
    ],
    subtotal: 408000.00,
    discountTotal: 0,
    taxTotal: 0,
    total: 408000.00,
    totalInWords: 'SON: CUATROCIENTOS OCHO MIL PESOS MEXICANOS 00/100 M.N.',
    notes: 'Entrega en anden Central de Abasto CDMX. Flete refrigerado incluido.'
  }
};

// Preset sample dispatch guides
const SAMPLE_DISPATCH_GUIDES: Record<string, DispatchGuideData> = {
  'GUIA-2026-084': {
    folio: 'GUIA-2026-084',
    cfdiCartaPorte: 'CP30-JBM-884920',
    departureDate: '2026-08-24',
    departureTime: '14:30 hrs',
    eta: '25/08/2026 06:00 hrs',
    regime: 'Exportación Definitiva A1 (EE.UU.)',
    destinationName: 'Texas Fresh Citrus Imports LLC',
    destinationAddress: '1044 International Blvd, Suite 400, McAllen, TX 78501, USA',
    destinationRfc: 'XEXX010101000',
    originFacility: 'Planta Pedernales JBM Cítricos',
    originAddress: 'Carr. Federal Martínez - Misantla Km 4.5, Martínez de la Torre, Ver.',
    carrierName: 'Transportes Refrigerados del Golfo S.A. de C.V.',
    carrierRfc: 'TRG940812KM9',
    driverName: 'Roberto Morales Vega',
    driverLicense: 'LIC-FED-849201-B',
    truckPlates: '98-AK-2L (Kenworth T680)',
    trailerPlates: 'CA-552 (Utility Reefer)',
    sealNumber: 'MX-SAT-884920',
    thermographId: 'TEMP-LOG-99201',
    tempSetpoint: '+3.8°C',
    tempObserved: '+3.7°C',
    senasicaCertificate: 'SENASICA-MEX-VER-CIT-2026-88492',
    fdaRegistration: 'FDA-18492049102',
    dispatcherName: 'CARLOS BARRAGÁN M.',
    items: [
      {
        palletNumber: 'PLT-2026-084-01',
        variety: 'Limón Persa Exportación',
        calibre: 'Cal. 175',
        packaging: 'Caja JBM Export 40 lbs (18.14 kg)',
        boxesCount: 90,
        weightNetKg: 1632.6,
        weightGrossKg: 1720.0,
        temperature: '+3.8°C'
      },
      {
        palletNumber: 'PLT-2026-084-02',
        variety: 'Limón Persa Exportación',
        calibre: 'Cal. 175',
        packaging: 'Caja JBM Export 40 lbs (18.14 kg)',
        boxesCount: 90,
        weightNetKg: 1632.6,
        weightGrossKg: 1720.0,
        temperature: '+3.8°C'
      },
      {
        palletNumber: 'PLT-2026-084-03',
        variety: 'Limón Persa Exportación',
        calibre: 'Cal. 200',
        packaging: 'Caja JBM Export 40 lbs (18.14 kg)',
        boxesCount: 90,
        weightNetKg: 1632.6,
        weightGrossKg: 1720.0,
        temperature: '+3.8°C'
      },
      {
        palletNumber: 'PLT-2026-084-04',
        variety: 'Limón Persa Exportación',
        calibre: 'Cal. 230',
        packaging: 'Caja JBM Export 40 lbs (18.14 kg)',
        boxesCount: 90,
        weightNetKg: 1632.6,
        weightGrossKg: 1720.0,
        temperature: '+3.8°C'
      }
    ]
  },
  'GUIA-2026-085': {
    folio: 'GUIA-2026-085',
    cfdiCartaPorte: 'CP30-JBM-884921',
    departureDate: '2026-08-24',
    departureTime: '16:00 hrs',
    eta: '24/08/2026 23:30 hrs',
    regime: 'Nacional Mercado Interno',
    destinationName: 'Central de Abasto CDMX (Bodega I-42)',
    destinationAddress: 'Pasillo 4 Bodega I-42, Iztapalapa, CDMX',
    destinationRfc: 'CFL120409KL8',
    originFacility: 'Planta Pedernales JBM Cítricos',
    originAddress: 'Carr. Federal Martínez - Misantla Km 4.5, Martínez de la Torre, Ver.',
    carrierName: 'Fletes Barragán Express',
    carrierRfc: 'FBA990412H81',
    driverName: 'Héctor Salgado Ríos',
    driverLicense: 'LIC-FED-910412-A',
    truckPlates: '44-TY-8P (Freightliner Cascadia)',
    trailerPlates: 'REM-104 (Caja Seca / Termo)',
    sealNumber: 'MX-SAT-884921',
    thermographId: 'TEMP-LOG-99202',
    tempSetpoint: '+4.1°C',
    tempObserved: '+4.0°C',
    senasicaCertificate: 'SENASICA-MEX-VER-CIT-2026-88493',
    dispatcherName: 'CARLOS BARRAGÁN M.',
    items: [
      {
        palletNumber: 'PLT-2026-085-01',
        variety: 'Limón Persa Nacional',
        calibre: 'Cal. 200',
        packaging: 'Caja Plástica Verde 15 kg',
        boxesCount: 100,
        weightNetKg: 1500.0,
        weightGrossKg: 1580.0,
        temperature: '+4.1°C'
      },
      {
        palletNumber: 'PLT-2026-085-02',
        variety: 'Naranja Valencia',
        calibre: 'Calibre Estándar',
        packaging: 'Bulto Malla 20 kg',
        boxesCount: 80,
        weightNetKg: 1600.0,
        weightGrossKg: 1640.0,
        temperature: '+4.1°C'
      }
    ]
  }
};

export function Documents() {
  const [docType, setDocType] = React.useState<DocumentType>('factura');
  const [isExporting, setIsExporting] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  // Invoices state
  const [selectedInvoiceFolio, setSelectedInvoiceFolio] = React.useState<string>('FACT-2026-0842');
  const [currentInvoice, setCurrentInvoice] = React.useState<InvoiceData>(SAMPLE_INVOICES['FACT-2026-0842']);

  // Dispatch Guides state
  const [selectedGuideFolio, setSelectedGuideFolio] = React.useState<string>('GUIA-2026-084');
  const [currentGuide, setCurrentGuide] = React.useState<DispatchGuideData>(SAMPLE_DISPATCH_GUIDES['GUIA-2026-084']);

  // Settlements and batches data
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [producers, setProducers] = React.useState<Producer[]>([]);
  const [settlements, setSettlements] = React.useState<Settlement[]>([]);
  const [selectedProducerFilter, setSelectedProducerFilter] = React.useState<string>('TODOS');
  const [selectedSettlementId, setSelectedSettlementId] = React.useState<string>('');

  // Load backend data
  React.useEffect(() => {
    fetch('/api/batches')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBatches(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading batches:', err));

    fetch('/api/producers')
      .then(res => res.ok ? res.json() : [])
      .then(data => setProducers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading producers:', err));

    fetch('/api/settlements')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setSettlements(arr);
        if (arr.length > 0) {
          setSelectedSettlementId(String(arr[0].id));
        }
      })
      .catch(err => console.error('Error loading settlements:', err));
  }, []);

  // Update invoice selection
  const handleSelectInvoice = (folio: string) => {
    setSelectedInvoiceFolio(folio);
    if (SAMPLE_INVOICES[folio]) {
      setCurrentInvoice(SAMPLE_INVOICES[folio]);
    }
  };

  // Update dispatch guide selection
  const handleSelectGuide = (folio: string) => {
    setSelectedGuideFolio(folio);
    if (SAMPLE_DISPATCH_GUIDES[folio]) {
      setCurrentGuide(SAMPLE_DISPATCH_GUIDES[folio]);
    }
  };

  // Filtered batches for report
  const filteredBatches = React.useMemo(() => {
    if (selectedProducerFilter === 'TODOS') return batches;
    return batches.filter(b => b.producer_name?.toLowerCase().includes(selectedProducerFilter.toLowerCase()));
  }, [batches, selectedProducerFilter]);

  // Aggregate stats for scale history
  const totalNetKg = filteredBatches.reduce((sum, b) => sum + (b.weight_net || 0), 0);
  const totalGrossKg = filteredBatches.reduce((sum, b) => sum + (b.weight_gross || 0), 0);
  const totalTareKg = filteredBatches.reduce((sum, b) => sum + (b.weight_tare || 0), 0);
  const totalSubtotalFruta = filteredBatches.reduce((sum, b) => sum + (b.subtotal || 0), 0);
  const totalScaleFees = filteredBatches.reduce((sum, b) => sum + (b.scale_fee || 0), 0);
  const totalScaleFeesDeducted = filteredBatches.reduce((sum, b) => sum + (b.scale_fee_payment === 'descuento' ? (b.scale_fee || 0) : 0), 0);
  const totalScaleFeesCash = filteredBatches.reduce((sum, b) => sum + (b.scale_fee_payment === 'efectivo' ? (b.scale_fee || 0) : 0), 0);
  const totalExtraCharges = filteredBatches.reduce((sum, b) => sum + (b.extra_charge_total || ((b.weight_net || 0) * (b.extra_charge_per_kg ?? 0.40))), 0);
  const totalLiquidated = filteredBatches.reduce((sum, b) => sum + (b.total || 0), 0);

  // Find active settlement
  const activeSettlement = settlements.find(s => String(s.id) === selectedSettlementId) || (settlements.length > 0 ? settlements[0] : {
    id: 1,
    folio: 'LIQ-00042',
    producer_id: 1,
    producer_name: 'Don Pedro Ramírez Méndez',
    date: '2026-08-24',
    batches_count: 2,
    total_kg: 22000,
    subtotal: 407000,
    scale_fees: 100,
    deductions: 8800,
    total_paid: 398100,
    status: 'pagado' as const,
    payment_method: 'Transferencia' as const
  });

  const activeProducer = producers.find(p => p.id === activeSettlement.producer_id) || producers[0];

  // MAIN EXPORT PDF HANDLER BASED ON CURRENT DOC TYPE
  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      if (docType === 'factura') {
        generateInvoicePdf(currentInvoice);
        setFeedbackMessage(`✅ Factura oficial ${currentInvoice.folio} descargada exitosamente en PDF.`);
      } else if (docType === 'guia_despacho' || docType === 'carta_porte') {
        generateDispatchGuidePdf(currentGuide);
        setFeedbackMessage(`✅ Guía de Despacho oficial ${currentGuide.folio} descargada en PDF.`);
      } else if (docType === 'historial_bascula') {
        generateScaleHistoryPdf(filteredBatches, {
          producerName: selectedProducerFilter === 'TODOS' ? 'Todos los Productores' : selectedProducerFilter
        });
        setFeedbackMessage(`✅ Historial de Báscula (${filteredBatches.length} pesajes) descargado en PDF.`);
      } else if (docType === 'liquidacion') {
        generateSettlementPdf(activeSettlement, activeProducer);
        setFeedbackMessage(`✅ Boleta de Liquidación ${activeSettlement.folio} descargada en PDF.`);
      }
    } catch (e: any) {
      console.error('Error generating PDF:', e);
      setFeedbackMessage(`❌ Error generando el PDF: ${e.message}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const printDocument = () => {
    window.print();
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
                Centro de Documentos y Reportes Oficiales
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                Membrete Oficial JBM
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Generación y descarga directa en PDF de Facturas Comerciales CFDI, Guías de Despacho, Boletas e Historiales
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-900/20 hover:scale-[1.02] transition-all cursor-pointer ring-2 ring-emerald-600/30"
          >
            <Download size={17} className="text-amber-400" />
            <span>
              {isExporting ? 'Generando PDF...' : 
               docType === 'factura' ? 'Descargar Factura PDF' :
               docType === 'guia_despacho' ? 'Descargar Guía Despacho PDF' :
               docType === 'historial_bascula' ? 'Descargar Historial Báscula PDF' :
               docType === 'liquidacion' ? 'Descargar Liquidación PDF' : 'Descargar PDF Oficial'}
            </span>
          </button>

          <button
            onClick={printDocument}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </header>

      {/* Export Notification Toast */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs animate-fadeIn no-print">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Document Selector Navigation (Hidden on Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        {[
          { id: 'factura', label: 'Factura Oficial CFDI / Proforma', icon: FileText, badge: 'PDF' },
          { id: 'guia_despacho', label: 'Guía de Despacho & Remisión', icon: Truck, badge: 'PDF' },
          { id: 'historial_bascula', label: 'Historial Báscula & Cargos', icon: Scale, badge: 'PDF' },
          { id: 'liquidacion', label: 'Boleta de Liquidación', icon: Receipt, badge: 'PDF' },
          { id: 'carta_porte', label: 'Carta Porte 3.0 SAT', icon: FileCheck },
          { id: 'calidad', label: 'Certificado Fitosanitario', icon: ShieldCheck },
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
              {item.badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                  docType === item.id ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-bold mt-2 leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* CONTEXTUAL TOOLBAR / PRESET SELECTOR FOR THE ACTIVE DOCUMENT TYPE         */}
      {/* ========================================================================= */}
      
      {/* 1. FACTURA TOOLBAR */}
      {docType === 'factura' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <FileText size={15} className="text-emerald-700" />
              <span>Seleccionar Factura / Cliente:</span>
            </div>
            <select
              value={selectedInvoiceFolio}
              onChange={(e) => handleSelectInvoice(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="FACT-2026-0842">FACT-2026-0842 • Texas Fresh Citrus LLC ($42,300.00 USD)</option>
              <option value="FACT-2026-0843">FACT-2026-0843 • Comercializadora Frutas CDMX ($408,000.00 MXN)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Moneda: <strong className="text-slate-900">{currentInvoice.currency}</strong> • Total: <strong className="text-emerald-700 font-mono">${currentInvoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
            </span>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download size={14} className="text-amber-400" />
              <span>Descargar Factura PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. GUÍA DE DESPACHO TOOLBAR */}
      {docType === 'guia_despacho' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Truck size={15} className="text-emerald-700" />
              <span>Seleccionar Embarque / Guía:</span>
            </div>
            <select
              value={selectedGuideFolio}
              onChange={(e) => handleSelectGuide(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="GUIA-2026-084">GUIA-2026-084 • Texas Fresh Citrus (Exportación McAllen TX)</option>
              <option value="GUIA-2026-085">GUIA-2026-085 • Central de Abasto CDMX (Nacional)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Transporte: <strong className="text-slate-900">{currentGuide.truckPlates}</strong> • Temp: <strong className="text-emerald-700">{currentGuide.tempSetpoint}</strong>
            </span>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download size={14} className="text-amber-400" />
              <span>Descargar Guía Despacho PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. HISTORIAL BÁSCULA TOOLBAR */}
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

      {/* 4. LIQUIDACIÓN TOOLBAR */}
      {docType === 'liquidacion' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Receipt size={15} className="text-emerald-700" />
              <span>Seleccionar Liquidación:</span>
            </div>
            <select
              value={selectedSettlementId}
              onChange={(e) => setSelectedSettlementId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {settlements.map(s => (
                <option key={s.id} value={String(s.id)}>
                  {s.folio} • {s.producer_name} (${s.total_paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download size={14} className="text-amber-400" />
              <span>Descargar Liquidación PDF</span>
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
                {docType === 'factura' ? 'FACTURA FISCAL CFDI 4.0 / INVOICE' :
                 docType === 'guia_despacho' ? 'GUÍA DE DESPACHO & REMISIÓN' :
                 docType === 'historial_bascula' ? 'HISTORIAL DE BÁSCULA Y CARGOS OPERATIVOS' :
                 docType === 'liquidacion' ? 'LIQUIDACIÓN DE FRUTA' :
                 docType === 'carta_porte' ? 'CARTA PORTE 3.0 SAT' :
                 docType === 'calidad' ? 'CERTIFICADO FITOSANITARIO' : 'ESTADO DE CUENTA PRODUCTOR'}
              </div>
              <div className="text-xl font-mono font-black text-slate-900 mt-1">
                {docType === 'factura' ? currentInvoice.folio :
                 docType === 'guia_despacho' ? currentGuide.folio :
                 docType === 'historial_bascula' ? `REP-BAS-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-01` :
                 docType === 'liquidacion' ? activeSettlement.folio : 'DOC-2026-001'}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">
                Fecha de Emisión: {docType === 'factura' ? currentInvoice.date :
                                   docType === 'guia_despacho' ? currentGuide.departureDate :
                                   new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* DOCUMENT BODY VARIATIONS BASED ON docType                             */}
        {/* ===================================================================== */}
        <div className="p-8 space-y-6">

          {/* 1. FACTURA OFICIAL CFDI 4.0 / PROFORMA VIEW */}
          {docType === 'factura' && (
            <div className="space-y-6">
              {/* Customer and Fiscal Conditions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                    Datos del Receptor / Cliente
                  </span>
                  <p className="font-bold text-sm text-slate-900">{currentInvoice.customer.name}</p>
                  <p className="text-slate-600 font-mono">RFC / Tax ID: <strong className="text-slate-800">{currentInvoice.customer.rfc}</strong></p>
                  <p className="text-slate-500">Domicilio: {currentInvoice.customer.address}</p>
                  <p className="text-slate-500">Uso CFDI: {currentInvoice.cfdiUse}</p>
                </div>

                {/* Conditions Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                    Condiciones Comerciales y Fiscales
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Moneda:</span>
                    <span className="font-bold font-mono">{currentInvoice.currency} {currentInvoice.exchangeRate ? `(T.C. $${currentInvoice.exchangeRate.toFixed(2)} MXN)` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Método de Pago:</span>
                    <span className="font-medium">{currentInvoice.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Forma de Pago:</span>
                    <span className="font-medium">{currentInvoice.paymentForm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha Vencimiento:</span>
                    <span className="font-bold font-mono">{currentInvoice.dueDate || currentInvoice.date}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                  Conceptos y Productos Cítricos Amparados
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/80 border-b border-slate-200 font-black text-slate-600 uppercase">
                      <tr>
                        <th className="p-3 text-center">Clave SAT</th>
                        <th className="p-3 text-center">Cant.</th>
                        <th className="p-3 text-center">Unidad</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3 text-right">P. Unitario</th>
                        <th className="p-3 text-center">IVA</th>
                        <th className="p-3 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {currentInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-400">{item.satCode}</td>
                          <td className="p-3 text-center font-bold">{item.quantity.toLocaleString()}</td>
                          <td className="p-3 text-center text-slate-500 font-sans">{item.unit}</td>
                          <td className="p-3 font-sans font-bold text-slate-900">{item.description}</td>
                          <td className="p-3 text-right">${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-center text-emerald-700 font-bold">{item.taxRate === 0 || !item.taxRate ? '0% Exento' : `${item.taxRate}%`}</td>
                          <td className="p-3 text-right font-black text-emerald-800">
                            ${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals and Bank Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                {/* Bank / SPEI Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <p className="font-bold text-slate-800 uppercase tracking-wider">Cuentas Bancarias Oficiales para Pago:</p>
                  <p className="text-slate-600 font-mono">• Banco: BBVA México S.A. | Beneficiario: JBM CÍTRICOS S.A. DE C.V.</p>
                  <p className="text-slate-600 font-mono">• CLABE Interbancaria (MXN): 012 840 001928401928</p>
                  <p className="text-slate-600 font-mono">• Wire Transfer USD / Swift: BBVAMXMMXXX | Acc: 048-92019482</p>
                  <p className="text-emerald-900 font-bold font-mono pt-1 text-[11px]">
                    {currentInvoice.totalInWords}
                  </p>
                </div>

                {/* Totals Breakdown */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600 font-sans">
                    <span>Subtotal:</span>
                    <span className="font-bold">${currentInvoice.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {currentInvoice.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-sans">
                    <span>IVA Trasladado (0% Tasa Agrícola):</span>
                    <span className="font-bold">${currentInvoice.taxTotal.toFixed(2)} {currentInvoice.currency}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-2 text-slate-900">
                    <span className="font-sans">TOTAL A PAGAR:</span>
                    <span className="text-emerald-700">${currentInvoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {currentInvoice.currency}</span>
                  </div>
                </div>
              </div>

              {/* Digital Fiscal SAT Bar */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <QrCode size={36} className="text-amber-400 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-black text-amber-400 block text-[11px] uppercase">Timbrado Digital CFDI v4.0 Aprobado</span>
                    <p className="font-mono text-[10px] text-slate-300">UUID SAT: {currentInvoice.uuid}</p>
                    <p className="text-[10px] text-slate-400">No. Certificado SAT: 00001000000504465028 • PAC: SAT970701NN3</p>
                  </div>
                </div>

                <button
                  onClick={handleExportPdf}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download size={14} />
                  <span>Descargar Factura PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. GUÍA DE DESPACHO & REMISIÓN VIEW */}
          {docType === 'guia_despacho' && (
            <div className="space-y-6">
              {/* Origin and Destination Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                    Origen / Planta Empacadora
                  </span>
                  <p className="font-bold text-sm text-slate-900">{currentGuide.originFacility}</p>
                  <p className="text-slate-600">{currentGuide.originAddress}</p>
                  <p className="text-slate-500">Salida: {currentGuide.departureDate} {currentGuide.departureTime}</p>
                  <p className="text-emerald-700 font-bold">Cert. SENASICA: {currentGuide.senasicaCertificate}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                    Destino / Almacén Receptor
                  </span>
                  <p className="font-bold text-sm text-slate-900">{currentGuide.destinationName}</p>
                  <p className="text-slate-600">{currentGuide.destinationAddress}</p>
                  <p className="text-slate-500">ETA Estimado: {currentGuide.eta}</p>
                  <p className="text-slate-700 font-bold">Régimen: {currentGuide.regime}</p>
                </div>
              </div>

              {/* Transport, Driver and Cold Chain (3 boxes) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Transportista</span>
                  <p className="font-bold text-slate-900">{currentGuide.carrierName}</p>
                  <p className="text-slate-600">Chofer: {currentGuide.driverName}</p>
                  <p className="text-slate-400 font-mono text-[10px]">{currentGuide.driverLicense}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Unidad & Seguridad</span>
                  <p className="font-bold text-slate-900">Placas: {currentGuide.truckPlates}</p>
                  <p className="text-slate-600">Remolque: {currentGuide.trailerPlates}</p>
                  <p className="text-amber-800 font-mono text-[10px] font-bold">Sello SAT: {currentGuide.sealNumber}</p>
                </div>

                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-xs space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase block">Cadena de Frío</span>
                  <p className="font-bold text-emerald-950">Set Point: {currentGuide.tempSetpoint}</p>
                  <p className="text-emerald-700">Temp. Carga: {currentGuide.tempObserved}</p>
                  <p className="text-emerald-600 font-mono text-[10px]">Datalogger: {currentGuide.thermographId}</p>
                </div>
              </div>

              {/* Cargo Table */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                  Detalle de Pallets y Cajas Embarcadas
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/80 border-b border-slate-200 font-black text-slate-600 uppercase">
                      <tr>
                        <th className="p-3 text-center">Pallet ID</th>
                        <th className="p-3">Variedad</th>
                        <th className="p-3 text-center">Calibre</th>
                        <th className="p-3">Presentación / Empaque</th>
                        <th className="p-3 text-center">Cajas</th>
                        <th className="p-3 text-right">Peso Neto</th>
                        <th className="p-3 text-right">Peso Bruto</th>
                        <th className="p-3 text-center">Temp.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {currentGuide.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 text-center font-bold text-emerald-800">{item.palletNumber}</td>
                          <td className="p-3 font-sans font-bold text-slate-900">{item.variety}</td>
                          <td className="p-3 text-center font-bold">{item.calibre}</td>
                          <td className="p-3 font-sans text-slate-600">{item.packaging}</td>
                          <td className="p-3 text-center font-black">{item.boxesCount}</td>
                          <td className="p-3 text-right font-black text-emerald-700">{item.weightNetKg.toLocaleString('es-MX')} kg</td>
                          <td className="p-3 text-right text-slate-600">{item.weightGrossKg.toLocaleString('es-MX')} kg</td>
                          <td className="p-3 text-center text-emerald-800 font-bold">{item.temperature}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100/80 font-black border-t-2 border-slate-900">
                      <tr>
                        <td colSpan={4} className="p-3 uppercase font-sans">TOTALES DEL EMBARQUE</td>
                        <td className="p-3 text-center font-mono">
                          {currentGuide.items.reduce((s, i) => s + i.boxesCount, 0).toLocaleString()} Cajas
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-900">
                          {currentGuide.items.reduce((s, i) => s + i.weightNetKg, 0).toLocaleString('es-MX')} kg
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900">
                          {currentGuide.items.reduce((s, i) => s + i.weightGrossKg, 0).toLocaleString('es-MX')} kg
                        </td>
                        <td className="p-3 text-center font-mono text-emerald-800">{currentGuide.tempSetpoint}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. HISTORIAL DE RECIBOS DE BÁSCULA Y CARGOS OPERATIVOS */}
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
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. BOLETA DE LIQUIDACIÓN A PRODUCTOR */}
          {docType === 'liquidacion' && (
            <div className="space-y-6">
              {/* Producer Information Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Productor</span>
                  <span className="text-sm font-black text-slate-900">{activeSettlement.producer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">R.F.C. / Registro</span>
                  <span className="text-sm font-mono font-bold text-slate-700">{activeProducer?.rfc || 'RAMP720815KJ8'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Huerto / Región</span>
                  <span className="text-sm font-bold text-slate-700">{activeProducer?.location || 'Pedernales Lote 4'}</span>
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="space-y-2 text-xs text-slate-500">
                  <p className="font-bold text-slate-700">Condiciones de Pago Oficial JBM:</p>
                  <p>• Pago mediante Transferencia Electrónica Interbancaria (SPEI).</p>
                  <p>• Retenciones e impuestos aplicados conforme a la legislación fiscal vigente.</p>
                  <p>• Fruta inspeccionada y aprobada por el área de control de calidad JBM.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Kilos Netos:</span>
                    <span className="font-bold">{activeSettlement.total_kg.toLocaleString('es-MX')} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Subtotal Fruta:</span>
                    <span className="font-bold">${activeSettlement.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span className="font-sans">(-) Retenciones y Maniobra ($0.40/kg):</span>
                    <span className="font-bold">-${(activeSettlement.deductions || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-2 text-slate-900 font-mono">
                    <span className="font-sans">TOTAL NETO A PAGAR:</span>
                    <span className="text-emerald-700">${activeSettlement.total_paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })} M.X.N.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. CARTA PORTE 3.0 SAT */}
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

          {/* 6. CERTIFICADO FITOSANITARIO */}
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
                  {docType === 'factura' ? currentInvoice.customer.name :
                   docType === 'guia_despacho' ? currentGuide.driverName :
                   docType === 'historial_bascula' && selectedProducerFilter !== 'TODOS' ? selectedProducerFilter : (activeSettlement.producer_name || 'PRODUCTOR')}
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-medium">
                  {docType === 'factura' ? 'Firma y Sello de Aceptación' :
                   docType === 'guia_despacho' ? 'Operador Transportista / Conforme' : 'Firma de Conformidad / Productor'}
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
