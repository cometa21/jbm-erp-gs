import React from 'react';
import { 
  ClipboardList, 
  Truck, 
  MapPin, 
  Thermometer, 
  FileCheck, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Printer,
  Table,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Scale,
  DollarSign
} from 'lucide-react';
import { Logo } from './Logo';
import { exportShipmentsReport, type ShipmentData } from '../utils/financialExport';
import { generateDispatchGuidePdf, type DispatchGuideData } from '../utils/pdfExport';

const INITIAL_SHIPMENTS: ShipmentData[] = [
  {
    id: 'EMB-2026-084',
    cfdiCartaPorte: 'CP30-JBM-884920',
    dest: 'McAllen, TX, USA (Texas Fresh Citrus LLC)',
    carrier: 'Transportes Refrigerados del Golfo S.A. de C.V.',
    driver: 'Roberto Morales (Lic. 849201)',
    plates: '98-AK-2L / CA-552',
    sealNumber: 'MX-SAT-884920',
    boxes: '1,800 cajas (33.3 Ton)',
    boxesCount: 1800,
    weightTon: 33.3,
    status: 'En Tránsito (Aduana Reynosa)',
    temp: '3.8°C',
    eta: '25/08/2026 06:00 hrs',
    departureDate: '2026-08-24',
    freightCost: 38500.00
  },
  {
    id: 'EMB-2026-085',
    cfdiCartaPorte: 'CP30-JBM-884921',
    dest: 'Central de Abasto CDMX (Bodega I-42)',
    carrier: 'Fletes Barragán Express',
    driver: 'Héctor Salgado (Lic. 910412)',
    plates: '44-TY-8P / REM-104',
    sealNumber: 'MX-SAT-884921',
    boxes: '1,200 cajas (22.2 Ton)',
    boxesCount: 1200,
    weightTon: 22.2,
    status: 'En Carga en Empacadora',
    temp: '4.1°C',
    eta: '24/08/2026 23:30 hrs',
    departureDate: '2026-08-24',
    freightCost: 16800.00
  },
  {
    id: 'EMB-2026-086',
    cfdiCartaPorte: 'CP30-JBM-884922',
    dest: 'Puerto de Veracruz (Contenedor Maersk Rotterdam)',
    carrier: 'Líneas Especializadas de Carga S.A.',
    driver: 'Armando Cuéllar (Lic. 551029)',
    plates: '12-BV-9M / MAERSK-77',
    sealNumber: 'MX-SAT-884922',
    boxes: '1,080 cajas (19.4 Ton)',
    boxesCount: 1080,
    weightTon: 19.4,
    status: 'Inspección Fitosanitaria Aprobada',
    temp: '3.5°C',
    eta: '25/08/2026 12:00 hrs',
    departureDate: '2026-08-24',
    freightCost: 14200.00
  },
  {
    id: 'EMB-2026-087',
    cfdiCartaPorte: 'CP30-JBM-884923',
    dest: 'Guadalajara, Jal. (Mercado de Abastos)',
    carrier: 'Transportes Citrícolas de Occidente',
    driver: 'Fausto Mendoza (Lic. 774819)',
    plates: '76-UJ-4N / REM-881',
    sealNumber: 'MX-SAT-884923',
    boxes: '1,500 cajas (27.0 Ton)',
    boxesCount: 1500,
    weightTon: 27.0,
    status: 'En Tránsito (Autopista Puebla-CDMX)',
    temp: '4.0°C',
    eta: '25/08/2026 18:00 hrs',
    departureDate: '2026-08-24',
    freightCost: 24500.00
  },
  {
    id: 'EMB-2026-088',
    cfdiCartaPorte: 'CP30-JBM-884924',
    dest: 'Monterrey, N.L. (Supermercados del Norte)',
    carrier: 'Fletes Barragán Express',
    driver: 'Gonzalo Peñaloza (Lic. 630112)',
    plates: '81-KL-3T / REM-409',
    sealNumber: 'MX-SAT-884924',
    boxes: '1,400 cajas (25.9 Ton)',
    boxesCount: 1400,
    weightTon: 25.9,
    status: 'Entregado en Destino',
    temp: '3.9°C',
    eta: '24/08/2026 14:00 hrs',
    departureDate: '2026-08-23',
    freightCost: 29000.00
  }
];

export function Logistics() {
  const [shipments, setShipments] = React.useState<ShipmentData[]>(INITIAL_SHIPMENTS);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('todos');
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
  const [exportFeedback, setExportFeedback] = React.useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = React.useState<ShipmentData | null>(null);
  const [showNewShipmentModal, setShowNewShipmentModal] = React.useState(false);

  // New Shipment Form
  const [newForm, setNewForm] = React.useState({
    id: `EMB-2026-0${shipments.length + 84}`,
    dest: '',
    carrier: 'Transportes Refrigerados del Golfo S.A. de C.V.',
    driver: '',
    plates: '',
    sealNumber: '',
    boxesCount: 1200,
    weightTon: 22.2,
    temp: '3.8°C',
    eta: 'Mañana 08:00 hrs',
    freightCost: 18000.00
  });

  // Filtered shipments
  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cfdiCartaPorte && s.cfdiCartaPorte.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'todos' ||
      (statusFilter === 'transito' && s.status.toLowerCase().includes('tránsito')) ||
      (statusFilter === 'carga' && s.status.toLowerCase().includes('carga')) ||
      (statusFilter === 'fitosanitario' && s.status.toLowerCase().includes('fitosanitaria')) ||
      (statusFilter === 'entregado' && s.status.toLowerCase().includes('entregado'));

    return matchesSearch && matchesStatus;
  });

  // Derived Totals
  const totalBoxes = shipments.reduce((sum, s) => sum + (s.boxesCount || 0), 0);
  const totalTonnage = shipments.reduce((sum, s) => sum + (s.weightTon || 0), 0);
  const totalFreight = shipments.reduce((sum, s) => sum + (s.freightCost || 0), 0);
  const activeInTransit = shipments.filter(s => s.status.toLowerCase().includes('tránsito') || s.status.toLowerCase().includes('carga')).length;

  // Handle Export Actions
  const handleExport = (format: 'csv' | 'excel') => {
    exportShipmentsReport(
      filteredShipments,
      format,
      statusFilter === 'todos' ? 'Todos los registros' : `Filtro: ${statusFilter}`
    );
    setExportFeedback(`Reporte de Embarques (${filteredShipments.length} despachos) exportado en formato ${format.toUpperCase()} para integración contable/ERP.`);
    setTimeout(() => setExportFeedback(null), 5500);
  };

  const handleDownloadDispatchPdf = (shipment: ShipmentData) => {
    try {
      const isExport = shipment.dest.toLowerCase().includes('usa') || shipment.dest.toLowerCase().includes('tx') || shipment.dest.toLowerCase().includes('veracruz');
      const guideData: DispatchGuideData = {
        folio: `GUIA-${shipment.id.replace('EMB-', '')}`,
        cfdiCartaPorte: shipment.cfdiCartaPorte || `CP30-JBM-${Math.floor(100000 + Math.random() * 900000)}`,
        departureDate: shipment.departureDate || new Date().toISOString().slice(0, 10),
        departureTime: '14:30 hrs',
        eta: shipment.eta || 'Próximo arribo',
        regime: isExport ? 'Exportación Definitiva Clave A1 (EE.UU.)' : 'Nacional Mercado Interno',
        destinationName: shipment.dest,
        destinationAddress: shipment.dest,
        carrierName: shipment.carrier,
        driverName: shipment.driver,
        driverLicense: 'LIC-FED-849201-B',
        truckPlates: shipment.plates,
        trailerPlates: 'CA-552 Refrigerada',
        sealNumber: shipment.sealNumber || 'MX-SAT-884920',
        thermographId: 'TEMP-LOG-99201',
        tempSetpoint: shipment.temp,
        tempObserved: shipment.temp,
        senasicaCertificate: 'SENASICA-MEX-VER-CIT-2026-88492',
        dispatcherName: 'CARLOS BARRAGÁN M.',
        items: [
          {
            palletNumber: `PLT-${shipment.id}-01`,
            variety: 'Limón Persa Calidad Exportación #1',
            calibre: 'Calibre 175 / 200',
            packaging: isExport ? 'Caja JBM Export 40 lbs (18.14 kg)' : 'Caja Plástica 15 kg',
            boxesCount: Math.round((shipment.boxesCount || 1200) * 0.6),
            weightNetKg: Number(((shipment.weightTon || 22) * 1000 * 0.6).toFixed(1)),
            weightGrossKg: Number(((shipment.weightTon || 22) * 1000 * 0.6 * 1.05).toFixed(1)),
            temperature: shipment.temp
          },
          {
            palletNumber: `PLT-${shipment.id}-02`,
            variety: 'Limón Persa Seleccionado',
            calibre: 'Calibre 230',
            packaging: isExport ? 'Caja JBM Export 40 lbs (18.14 kg)' : 'Bulto Malla 20 kg',
            boxesCount: Math.round((shipment.boxesCount || 1200) * 0.4),
            weightNetKg: Number(((shipment.weightTon || 22) * 1000 * 0.4).toFixed(1)),
            weightGrossKg: Number(((shipment.weightTon || 22) * 1000 * 0.4 * 1.05).toFixed(1)),
            temperature: shipment.temp
          }
        ]
      };

      generateDispatchGuidePdf(guideData);
      setExportFeedback(`✅ Guía de Despacho oficial para embarque ${shipment.id} descargada en PDF.`);
      setTimeout(() => setExportFeedback(null), 5000);
    } catch (e: any) {
      console.error('Error generating guide PDF:', e);
      setExportFeedback(`❌ Error al generar Guía PDF: ${e.message}`);
    }
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const newShipment: ShipmentData = {
      id: newForm.id,
      cfdiCartaPorte: `CP30-JBM-${Math.floor(100000 + Math.random() * 900000)}`,
      dest: newForm.dest,
      carrier: newForm.carrier,
      driver: newForm.driver || 'Operador Asignado',
      plates: newForm.plates || '99-XX-1A / REM-001',
      sealNumber: newForm.sealNumber || `MX-SAT-${Math.floor(100000 + Math.random() * 900000)}`,
      boxes: `${newForm.boxesCount.toLocaleString()} cajas (${newForm.weightTon} Ton)`,
      boxesCount: newForm.boxesCount,
      weightTon: newForm.weightTon,
      status: 'En Carga en Empacadora',
      temp: newForm.temp,
      eta: newForm.eta,
      departureDate: new Date().toISOString().slice(0, 10),
      freightCost: newForm.freightCost
    };

    setShipments([newShipment, ...shipments]);
    setShowNewShipmentModal(false);
    setExportFeedback(`✅ Embarque ${newShipment.id} registrado con Carta Porte digital.`);
    setTimeout(() => setExportFeedback(null), 5000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-6 no-print">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center p-2 shadow-xs">
            <Truck size={28} className="text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Logística, Embarques & Carta Porte
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                CFDI 3.0 & Exportación
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Trazabilidad en ruta, cadena de frío controlada, fletes e integración contable
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Quick Export to CSV for Accounting/ERP */}
          <button
            onClick={() => handleExport('csv')}
            className="bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            title="Exportar vista actual de embarques a archivo CSV para integración contable (CONTPAQi, ERPs, SAP)"
          >
            <Table size={16} className="text-emerald-300 group-hover:scale-110 transition-transform" />
            <span>Exportar Vista a CSV</span>
          </button>

          {/* Quick Export to Excel */}
          <button
            onClick={() => handleExport('excel')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Descargar libro de embarques en formato Excel"
          >
            <FileSpreadsheet size={16} className="text-emerald-700" />
            <span>Excel</span>
          </button>

          {/* New Shipment Button */}
          <button
            onClick={() => setShowNewShipmentModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-900/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nuevo Embarque</span>
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
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">En Tránsito & Carga</p>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Truck size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {activeInTransit} <span className="text-xs font-bold text-slate-500">unidades activas</span>
          </p>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <ShieldCheck size={14} /> Cadena de frío activa
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Cajas Despachadas</p>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ClipboardList size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalBoxes.toLocaleString()} <span className="text-xs font-bold text-slate-500">cajas</span>
          </p>
          <span className="text-xs font-bold text-blue-700 flex items-center gap-1 mt-1">
            {totalTonnage.toFixed(1)} Toneladas de fruta
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Costo Fletes Acumulado</p>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2 font-mono">
            ${totalFreight.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs font-bold text-amber-700 flex items-center gap-1 mt-1">
            {shipments.length} fletes contratados
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Cumplimiento Fitosanitario</p>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <FileCheck size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            100% <span className="text-xs font-bold text-slate-500">Certificado</span>
          </p>
          <span className="text-xs font-bold text-purple-700 flex items-center gap-1 mt-1">
            SENASICA & USDA Aprobados
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Truck size={20} className="text-emerald-700" />
              Tablero de Despacho & Carta Porte Digital
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Mostrando {filteredShipments.length} de {shipments.length} despachos logísticos
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar embarque, chofer o destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl text-xs py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="transito">En Tránsito</option>
              <option value="carga">En Carga</option>
              <option value="fitosanitario">Fitosanitario Aprobado</option>
              <option value="entregado">Entregados</option>
            </select>

            {/* Direct CSV Button */}
            <button
              onClick={() => handleExport('csv')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Exportar registros filtrados a CSV para contabilidad / CONTPAQi"
            >
              <Table size={14} className="text-emerald-700" />
              <span>CSV Contable</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Folio Emb.</th>
                <th className="p-4">Carta Porte SAT</th>
                <th className="p-4">Destino / Cliente</th>
                <th className="p-4">Línea & Chofer</th>
                <th className="p-4 text-center">Cajas / Peso</th>
                <th className="p-4 text-center">Cadena Frío</th>
                <th className="p-4 text-center">ETA Destino</th>
                <th className="p-4 text-right">Costo Flete</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Póliza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-sans">
                    No se encontraron embarques con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="p-4 font-black text-emerald-800">{item.id}</td>
                    <td className="p-4 text-slate-600 text-[11px]">{item.cfdiCartaPorte || 'CP-30-PENDIENTE'}</td>
                    <td className="p-4 font-sans font-bold text-slate-900 max-w-[220px] truncate" title={item.dest}>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>{item.dest}</span>
                      </div>
                    </td>
                    <td className="p-4 font-sans text-slate-600">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">{item.carrier}</div>
                      <div className="text-[10px] text-slate-400">Op: {item.driver}</div>
                    </td>
                    <td className="p-4 text-center font-sans">
                      <span className="font-bold text-slate-800">{item.boxesCount?.toLocaleString()} cjs</span>
                      <span className="text-[10px] text-slate-400 block">{item.weightTon} Ton</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-[11px]">
                        <Thermometer size={12} />
                        {item.temp}
                      </span>
                    </td>
                    <td className="p-4 text-center font-sans text-slate-700 text-[11px]">
                      {item.eta}
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">
                      ${(item.freightCost || 18000).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center font-sans">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDownloadDispatchPdf(item)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer border border-emerald-200 shadow-2xs"
                          title="Descargar Guía de Despacho Oficial en PDF"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => setSelectedShipment(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Ver detalle de Carta Porte"
                        >
                          Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Embarque {selectedShipment.id}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedShipment.cfdiCartaPorte}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedShipment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Destino:</span>
                <span className="font-bold text-slate-900 text-right">{selectedShipment.dest}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Línea Transportista:</span>
                <span className="font-bold text-slate-800">{selectedShipment.carrier}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Operador:</span>
                <span className="font-mono text-slate-800">{selectedShipment.driver}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Placas / Remolque:</span>
                <span className="font-mono text-slate-800">{selectedShipment.plates}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Candado / Sello Fiscal:</span>
                <span className="font-mono font-bold text-emerald-800">{selectedShipment.sealNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Carga / Volumen:</span>
                <span className="font-bold text-slate-900">{selectedShipment.boxes}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Cadena de Frío:</span>
                <span className="font-bold text-emerald-700 font-mono">{selectedShipment.temp}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Costo de Flete:</span>
                <span className="font-black text-slate-900 font-mono">${(selectedShipment.freightCost || 18000).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Estado de Ruta:</span>
                <span className="font-bold text-emerald-800">{selectedShipment.status}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => handleDownloadDispatchPdf(selectedShipment)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download size={14} className="text-amber-400" />
                <span>Descargar Guía PDF Membretada</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Shipment Modal */}
      {showNewShipmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-emerald-700" />
                Registrar Nuevo Despacho / Carta Porte
              </h3>
              <button onClick={() => setShowNewShipmentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Destino / Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: McAllen, TX (Fresh Citrus LLC) o Central de Abasto..."
                  value={newForm.dest}
                  onChange={(e) => setNewForm({ ...newForm, dest: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Línea Transportista</label>
                  <input
                    type="text"
                    value={newForm.carrier}
                    onChange={(e) => setNewForm({ ...newForm, carrier: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Operador</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez (Lic. 12345)"
                    value={newForm.driver}
                    onChange={(e) => setNewForm({ ...newForm, driver: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cajas de Fruta</label>
                  <input
                    type="number"
                    value={newForm.boxesCount}
                    onChange={(e) => setNewForm({ ...newForm, boxesCount: parseInt(e.target.value) || 0, weightTon: Number(((parseInt(e.target.value) || 0) * 0.0185).toFixed(1)) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Toneladas Est.</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newForm.weightTon}
                    onChange={(e) => setNewForm({ ...newForm, weightTon: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temp. Termo (°C)</label>
                  <input
                    type="text"
                    value={newForm.temp}
                    onChange={(e) => setNewForm({ ...newForm, temp: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo de Flete ($)</label>
                  <input
                    type="number"
                    value={newForm.freightCost}
                    onChange={(e) => setNewForm({ ...newForm, freightCost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewShipmentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black cursor-pointer shadow-md"
                >
                  Registrar Embarque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
