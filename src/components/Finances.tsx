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
  ArrowRight,
  Trash2,
  TrendingUp,
  BarChart3,
  PieChart,
  FileCheck,
  Eye,
  Share2,
  CreditCard,
  ShoppingBag,
  Boxes,
  FileDown
} from 'lucide-react';
import type { 
  Settlement, 
  Producer, 
  Batch, 
  SalesReportData, 
  MonthlyBalanceData, 
  POSSale, 
  POSLocalExpense, 
  POSAnalyticsData 
} from '../types';
import { ConfirmationModal, type SummaryItem, type ConfirmationVariant } from './ConfirmationModal';
import { Logo } from './Logo';
import {
  exportSettlementsReport,
  exportProducerLedgerReport,
  exportOperationsCostReport,
  exportSingleSettlementVoucher,
  exportToCSV,
  exportToExcelXML
} from '../utils/financialExport';
import { 
  generateSettlementPdf,
  generateProducerAccountStatementPdf,
  generateGlobalFinancialStatementPdf,
  generateSettlementInvoicePdf,
  generateSalesReportPdf,
  generateMonthlyBalancePdf
} from '../utils/pdfExport';

export function Finances() {
  const [settlements, setSettlements] = React.useState<Settlement[]>([]);
  const [producers, setProducers] = React.useState<Producer[]>([]);
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [companySettings, setCompanySettings] = React.useState<any>(null);

  // POS Sales & Financial Data
  const [posAnalytics, setPosAnalytics] = React.useState<POSAnalyticsData | null>(null);
  const [posSales, setPosSales] = React.useState<POSSale[]>([]);
  const [posExpenses, setPosExpenses] = React.useState<POSLocalExpense[]>([]);
  const [isLoadingPos, setIsLoadingPos] = React.useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = React.useState<'settlements' | 'producers' | 'operations' | 'sales-report' | 'monthly-balance'>('settlements');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedProducerId, setSelectedProducerId] = React.useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('todos');
  const [dateFilter, setDateFilter] = React.useState<string>('todos');

  // Sales Report Filter
  const [salesPeriod, setSalesPeriod] = React.useState<'7d' | '30d' | 'this_month' | 'last_month'>('30d');
  const [salesPaymentMethod, setSalesPaymentMethod] = React.useState<string>('todos');
  const [salesCustomerType, setSalesCustomerType] = React.useState<string>('todos');

  // Monthly Balance Selected Period
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  
  // Modals
  const [selectedSettlement, setSelectedSettlement] = React.useState<Settlement | null>(null);
  const [showNewSettlementModal, setShowNewSettlementModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [exportFeedback, setExportFeedback] = React.useState<string | null>(null);

  // Print Preview Modal (Utilizing .printable-document defined in index.css)
  const [printModal, setPrintModal] = React.useState<{
    isOpen: boolean;
    title: string;
    docType: 'sales-report' | 'monthly-balance';
    salesData?: SalesReportData;
    balanceData?: MonthlyBalanceData;
  }>({
    isOpen: false,
    title: '',
    docType: 'sales-report'
  });

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

  // Reusable Confirmation Modal State
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    description?: React.ReactNode;
    variant?: ConfirmationVariant;
    icon?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    summaryItems?: SummaryItem[];
    confirmInputRequired?: string;
    onConfirm: () => Promise<void> | void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
    variant: 'warning'
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

    // Load POS Analytics & Sales
    setIsLoadingPos(true);
    Promise.all([
      fetch('/api/pos/analytics?days=30').then(r => r.ok ? r.json() : null),
      fetch('/api/pos/sales').then(r => r.ok ? r.json() : []),
      fetch('/api/pos/expenses').then(r => r.ok ? r.json() : [])
    ]).then(([analyticsData, salesData, expensesData]) => {
      if (analyticsData) setPosAnalytics(analyticsData);
      if (Array.isArray(salesData)) setPosSales(salesData);
      if (Array.isArray(expensesData)) setPosExpenses(expensesData);
    }).catch(err => {
      console.error('Error loading POS finance data:', err);
    }).finally(() => {
      setIsLoadingPos(false);
    });
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Calculations for Settlements
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
  const handleExport = (type: 'settlements' | 'producers' | 'operations' | 'sales-report' | 'monthly-balance', format: 'csv' | 'excel') => {
    if (type === 'settlements') {
      exportSettlementsReport(filteredSettlements, format, `${selectedProducerId === 'todos' ? 'Todos los productores' : 'Productor filtrado'}`);
      setExportFeedback(`Reporte de Liquidaciones (${filteredSettlements.length} registros) exportado en formato ${format.toUpperCase()} compatible con CONTPAQi/ERP.`);
    } else if (type === 'producers') {
      exportProducerLedgerReport(producers, settlements, format);
      setExportFeedback(`Auxiliar Contable de Productores (${producers.length} cuentas) exportado en formato ${format.toUpperCase()} para software contable.`);
    } else if (type === 'operations') {
      exportOperationsCostReport(batches, format);
      setExportFeedback(`Auditoría de Maniobra y Báscula (${batches.length} entradas) exportada en formato ${format.toUpperCase()} para conciliación.`);
    }
    setTimeout(() => setExportFeedback(null), 5500);
    setShowExportModal(false);
  };

  // Helper to compile SalesReportData
  const getSalesReportData = React.useCallback((): SalesReportData => {
    let periodLabel = 'Últimos 30 Días';
    let daysSlice = 30;
    if (salesPeriod === '7d') {
      periodLabel = 'Últimos 7 Días';
      daysSlice = 7;
    } else if (salesPeriod === 'this_month') {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      periodLabel = `Mes de ${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
    } else if (salesPeriod === 'last_month') {
      periodLabel = 'Mes Anterior';
    }

    const dailySalesRaw = posAnalytics?.dailySales || [];
    const slicedDaily = dailySalesRaw.slice(-daysSlice);

    const totalRevenue = slicedDaily.reduce((acc, d) => acc + (d.totalRevenue || 0), 0) || 452800;
    const totalKgSold = slicedDaily.reduce((acc, d) => acc + (d.totalKg || 0), 0) || 16420;
    const totalBoxesSold = slicedDaily.reduce((acc, d) => acc + (d.totalBoxes || 0), 0) || 820;
    const totalTickets = slicedDaily.reduce((acc, d) => acc + (d.ticketCount || 0), 0) || 184;
    const avgTicketValue = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 2460;
    const totalDiscounts = Math.round(totalRevenue * 0.024);

    const dailySales = slicedDaily.map(d => ({
      date: d.date,
      label: d.label,
      totalKg: d.totalKg,
      totalBoxes: d.totalBoxes,
      revenue: d.totalRevenue,
      ticketCount: d.ticketCount,
      avgTicket: d.avgTicketValue,
      discountsGiven: Math.round(d.totalRevenue * 0.02),
      cashAmount: d.cashRevenue,
      transferAmount: d.bankRevenue,
      cardAmount: Math.round(d.bankRevenue * 0.4),
      creditAmount: d.creditRevenue
    }));

    const topProducts = posAnalytics?.topProducts || [
      { name: 'Caja JBM Export 18.14 kg (Calibre V-XX)', calibre: 'V-XX', itemType: 'caja', boxesSold: 284, kgSold: 5151.76, revenue: 146828.00, volumePercent: 34.6 },
      { name: 'Caja JBM Export 18.14 kg (Calibre V-X)', calibre: 'V-X', itemType: 'caja', boxesSold: 196, kgSold: 3555.44, revenue: 96040.00, volumePercent: 23.9 },
      { name: 'Caja Nacional 20 kg (Calibre AL-XX)', calibre: 'AL-XX', itemType: 'caja', boxesSold: 165, kgSold: 3300.00, revenue: 79200.00, volumePercent: 20.1 },
      { name: 'Limón Persa Selección V-XX (Granel / Kg)', calibre: 'V-XX', itemType: 'granel', boxesSold: 0, kgSold: 980.00, revenue: 31360.00, volumePercent: 12.0 },
      { name: 'Caja Telescópica 4.5 kg Gourmet (V-XXX)', calibre: 'V-XXX', itemType: 'caja', boxesSold: 88, kgSold: 396.00, revenue: 15048.00, volumePercent: 9.4 }
    ];

    const paymentMethods = [
      { method: 'Efectivo en Caja', amount: Math.round(totalRevenue * 0.62), count: Math.round(totalTickets * 0.65), percentage: 62.0 },
      { method: 'Transferencia SPEI', amount: Math.round(totalRevenue * 0.28), count: Math.round(totalTickets * 0.22), percentage: 28.0 },
      { method: 'Tarjeta Débito/Crédito', amount: Math.round(totalRevenue * 0.07), count: Math.round(totalTickets * 0.09), percentage: 7.0 },
      { method: 'Crédito Mayorista', amount: Math.round(totalRevenue * 0.03), count: Math.round(totalTickets * 0.04), percentage: 3.0 }
    ];

    const customerTypes = [
      { type: 'taqueria', label: 'Taquerías & Cadenas', revenue: Math.round(totalRevenue * 0.38), boxes: Math.round(totalBoxesSold * 0.40), kg: Math.round(totalKgSold * 0.39), count: 68, percentage: 38.0 },
      { type: 'mayorista', label: 'Mayoristas CEDA / Centrales', revenue: Math.round(totalRevenue * 0.32), boxes: Math.round(totalBoxesSold * 0.35), kg: Math.round(totalKgSold * 0.34), count: 24, percentage: 32.0 },
      { type: 'restaurante', label: 'Restaurantes & Hotelería', revenue: Math.round(totalRevenue * 0.16), boxes: Math.round(totalBoxesSold * 0.14), kg: Math.round(totalKgSold * 0.15), count: 36, percentage: 16.0 },
      { type: 'fruteria', label: 'Fruterías & Verdulerías', revenue: Math.round(totalRevenue * 0.09), boxes: Math.round(totalBoxesSold * 0.08), kg: Math.round(totalKgSold * 0.08), count: 32, percentage: 9.0 },
      { type: 'mostrador', label: 'Venta de Mostrador Menudeo', revenue: Math.round(totalRevenue * 0.05), boxes: Math.round(totalBoxesSold * 0.03), kg: Math.round(totalKgSold * 0.04), count: 24, percentage: 5.0 }
    ];

    return {
      period: salesPeriod,
      periodLabel,
      generatedDate: new Date().toISOString(),
      generatedBy: companySettings?.manager || 'Carlos Barragán',
      totalRevenue,
      totalKgSold,
      totalBoxesSold,
      totalTickets,
      avgTicketValue,
      totalDiscounts,
      dailySales,
      salesList: posSales.slice(0, 25),
      topProducts,
      paymentMethods,
      customerTypes
    };
  }, [salesPeriod, posAnalytics, posSales, companySettings]);

  // Helper to compile MonthlyBalanceData
  const getMonthlyBalanceData = React.useCallback((m: number, y: number): MonthlyBalanceData => {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[m - 1] || 'Agosto';
    const periodLabel = `${monthName} ${y}`;
    const folio = `BAL-${y}-${String(m).padStart(2, '0')}`;

    // Filter settlements for this month if matching, else compute based on active records
    const settlementsInMonth = settlements.filter(s => {
      if (!s.date) return true;
      const d = new Date(s.date);
      return d.getFullYear() === y && (d.getMonth() + 1) === m;
    });
    const effectiveSettlements = settlementsInMonth.length > 0 ? settlementsInMonth : settlements;

    const totalFruitKgPurchased = effectiveSettlements.reduce((sum, s) => sum + (s.total_kg || 0), 0) || 114300;
    const fruitAcquisitionCost = effectiveSettlements.reduce((sum, s) => sum + (s.total_paid || 0), 0) || 2050900;
    const avgFruitCostPerKg = totalFruitKgPurchased > 0 ? Number((fruitAcquisitionCost / totalFruitKgPurchased).toFixed(2)) : 17.94;

    // Citrus sales & operational income
    const citrusSalesRevenue = Math.round(fruitAcquisitionCost * 1.38); // Standard packhouse gross markup
    const scaleServicesRevenue = (batches.length || 18) * 50.00; // $50 per scale ticket
    const subproductsRevenue = Math.round(totalFruitKgPurchased * 0.05 * 8.50); // 5% industrial fruit @ $8.50/kg
    const totalIncome = citrusSalesRevenue + scaleServicesRevenue + subproductsRevenue;

    const totalGrossProfit = totalIncome - fruitAcquisitionCost;
    const grossMarginPercent = totalIncome > 0 ? Number(((totalGrossProfit / totalIncome) * 100).toFixed(1)) : 27.5;

    // Operating expenses calculation
    const maneuverAndTolvaExpenses = Math.round(totalFruitKgPurchased * 0.40); // $0.40 / kg maniobra
    const localAndFreightExpenses = 48500.00;
    const payrollAndStaffExpenses = 85000.00;
    const suppliesAndPackagingExpenses = 62400.00; // Boxes, HT pallets, straps
    const maintenanceAndUtilitiesExpenses = 34200.00; // Cold room electricity & plant maintenance
    const otherExpenses = 12500.00;

    const totalOperatingExpenses = 
      maneuverAndTolvaExpenses + 
      localAndFreightExpenses + 
      payrollAndStaffExpenses + 
      suppliesAndPackagingExpenses + 
      maintenanceAndUtilitiesExpenses + 
      otherExpenses;

    const netOperatingIncome = totalGrossProfit - totalOperatingExpenses;
    const netMarginPercent = totalIncome > 0 ? Number(((netOperatingIncome / totalIncome) * 100).toFixed(1)) : 14.8;

    // Working Capital & Balance Reconciliation
    const producersPayablesBalance = effectiveSettlements
      .filter(s => s.status === 'pendiente' || s.status === 'programado')
      .reduce((sum, s) => sum + (s.total_paid || 0), 0) || 42800.00;

    const cashInHandAndBank = 684500.00;
    const inventoryValuation = 312000.00;

    return {
      monthName,
      year: y,
      periodLabel,
      folio,
      generatedDate: new Date().toISOString(),
      generatedBy: companySettings?.manager || 'Carlos Barragán',
      citrusSalesRevenue,
      scaleServicesRevenue,
      subproductsRevenue,
      totalIncome,
      fruitAcquisitionCost,
      totalFruitKgPurchased,
      avgFruitCostPerKg,
      totalGrossProfit,
      grossMarginPercent,
      maneuverAndTolvaExpenses,
      localAndFreightExpenses,
      payrollAndStaffExpenses,
      suppliesAndPackagingExpenses,
      maintenanceAndUtilitiesExpenses,
      otherExpenses,
      totalOperatingExpenses,
      netOperatingIncome,
      netMarginPercent,
      producersPayablesBalance,
      cashInHandAndBank,
      inventoryValuation,
      settlementsBreakdown: effectiveSettlements,
      expensesBreakdown: posExpenses,
      batchesCount: batches.length || 18,
      producersCount: producers.length || 4
    };
  }, [settlements, batches, producers, posExpenses, companySettings]);

  // Handle PDF Generation with Visual Feedback
  const handleExportPdf = (
    type: 'producer-statement' | 'global-statement' | 'settlement-invoice' | 'settlement-voucher' | 'sales-report' | 'monthly-balance', 
    data?: any
  ) => {
    try {
      if (type === 'sales-report') {
        const reportData = data || getSalesReportData();
        generateSalesReportPdf(reportData);
        setExportFeedback(`📊 Reporte Ejecutivo de Ventas PDF (${reportData.periodLabel}) generado con membrete JBM.`);
      } else if (type === 'monthly-balance') {
        const balanceData = data || getMonthlyBalanceData(selectedMonth, selectedYear);
        generateMonthlyBalancePdf(balanceData);
        setExportFeedback(`⚖️ Balance General y Estado de Resultados Mensual PDF (${balanceData.periodLabel}) generado.`);
      } else if (type === 'producer-statement') {
        const prod = data || (selectedProducerId !== 'todos' ? producers.find(p => String(p.id) === selectedProducerId) : producers[0]);
        if (!prod) throw new Error('No se encontró el productor seleccionado');
        generateProducerAccountStatementPdf(prod, settlements, batches);
        setExportFeedback(`📄 Estado de Cuenta Oficial en PDF generado para ${prod.name} con membrete JBM.`);
      } else if (type === 'global-statement') {
        generateGlobalFinancialStatementPdf(settlements, producers, batches);
        setExportFeedback('📊 Estado Financiero Global y Balance de Liquidaciones generado en PDF oficial.');
      } else if (type === 'settlement-invoice') {
        const sett = data || filteredSettlements[0] || settlements[0];
        if (!sett) throw new Error('No hay liquidaciones registradas para facturar');
        const prod = producers.find(p => p.id === sett.producer_id);
        generateSettlementInvoicePdf(sett, prod, batches);
        setExportFeedback(`🧾 Factura CFDI / Comercial de Liquidación ${sett.folio} generada en PDF.`);
      } else if (type === 'settlement-voucher') {
        const sett = data || filteredSettlements[0] || settlements[0];
        if (!sett) throw new Error('No hay liquidaciones para generar boleta');
        const prod = producers.find(p => p.id === sett.producer_id);
        generateSettlementPdf(sett, prod, batches);
        setExportFeedback(`📄 Boleta Oficial de Liquidación ${sett.folio} generada en PDF.`);
      }
      setTimeout(() => setExportFeedback(null), 5500);
      setShowExportModal(false);
    } catch (err: any) {
      setExportFeedback(`Error al generar PDF: ${err.message}`);
      setTimeout(() => setExportFeedback(null), 6000);
    }
  };

  // Open Print Preview Modal with exact .printable-document CSS class from index.css
  const openPrintPreview = (docType: 'sales-report' | 'monthly-balance') => {
    if (docType === 'sales-report') {
      const salesData = getSalesReportData();
      setPrintModal({
        isOpen: true,
        title: `Reporte de Ventas — ${salesData.periodLabel}`,
        docType: 'sales-report',
        salesData
      });
    } else {
      const balanceData = getMonthlyBalanceData(selectedMonth, selectedYear);
      setPrintModal({
        isOpen: true,
        title: `Balance Mensual y Estado de Resultados — ${balanceData.periodLabel}`,
        docType: 'monthly-balance',
        balanceData
      });
    }
  };


  // Export current table view directly based on active tab
  const exportCurrentTableView = (format: 'csv' | 'excel' = 'csv') => {
    handleExport(activeTab, format);
  };

  // Prompt modal before creating a new settlement
  const promptCreateSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(newSettlementForm.total_kg) || 0;
    const pKg = parseFloat(newSettlementForm.price_per_kg) || 18.50;
    const subtotal = Number((kg * pKg).toFixed(2));
    const extraKg = parseFloat(newSettlementForm.extra_charge_per_kg) || 0.40;
    const deductions = Number((kg * extraKg).toFixed(2));
    const scaleFees = parseFloat(newSettlementForm.scale_fees) || 50.00;
    const totalPaid = Number(Math.max(0, subtotal - deductions - scaleFees).toFixed(2));

    const selectedProducer = producers.find(p => p.id === parseInt(newSettlementForm.producer_id));
    const producerName = selectedProducer ? selectedProducer.name : 'Productor Seleccionado';

    setConfirmModal({
      isOpen: true,
      title: '¿Autorizar y Aplicar Liquidación Financiera?',
      description: (
        <div className="space-y-2">
          <p>
            Se generará una póliza contable definitiva y se registrará el desembolso a favor del productor.
          </p>
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
            Verifique que los kilogramos y deducciones coincidan con las boletas de báscula liquidadas.
          </p>
        </div>
      ),
      variant: 'emerald',
      icon: <DollarSign size={24} className="text-emerald-700" />,
      confirmText: 'Autorizar y Registrar Póliza',
      cancelText: 'Volver al Formulario',
      summaryItems: [
        { label: 'Productor Beneficiario', value: producerName },
        { label: 'RFC', value: selectedProducer?.rfc || 'No especificado' },
        { label: 'Kilos Totales Fruta', value: `${kg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg` },
        { label: 'Precio Liquidado', value: `$${pKg.toFixed(2)} / kg` },
        { label: 'Subtotal Bruto', value: `$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { label: 'Deducciones (Maniobra)', value: `-$${deductions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { label: 'Cuota de Báscula', value: `-$${scaleFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        { 
          label: 'IMPORTE TOTAL A DISPERSAR', 
          value: `$${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
          highlighted: true,
          badge: newSettlementForm.payment_method.toUpperCase(),
          badgeColor: 'bg-emerald-100 text-emerald-950 font-bold'
        },
        { label: 'Método de Pago', value: newSettlementForm.payment_method }
      ],
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await executeCreateSettlement();
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  // Execute Settlement Creation
  const executeCreateSettlement = async () => {
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
      setExportFeedback('Error al registrar liquidación: ' + err.message);
      setTimeout(() => setExportFeedback(null), 6000);
    }
  };

  // Prompt delete settlement
  const handleDeleteSettlementPrompt = (settlement: Settlement) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar y Cancelar Liquidación Contable?',
      description: (
        <div className="space-y-2">
          <p>
            Esta acción eliminará el registro contable de liquidación permanentemente de los libros de la empresa.
          </p>
          <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-semibold">
            ⚠️ Asegúrese de que no se haya realizado la dispersión bancaria SPEI o que el cheque haya sido cancelado en tesorería.
          </p>
        </div>
      ),
      variant: 'danger',
      icon: <Trash2 size={24} className="text-rose-600" />,
      confirmText: 'Eliminar Liquidación',
      cancelText: 'Cancelar',
      summaryItems: [
        { label: 'Folio Liquidación', value: settlement.folio },
        { label: 'Productor', value: settlement.producer_name || 'Sin Asignar' },
        { label: 'Kilos Fruta', value: `${(settlement.total_kg || 0).toLocaleString()} kg` },
        { 
          label: 'Importe Liquidado', 
          value: `$${(settlement.total_paid || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
          highlighted: true 
        },
        { label: 'Fecha de Emisión', value: settlement.date ? new Date(settlement.date).toLocaleDateString('es-MX') : 'Hoy' }
      ],
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/settlements/${settlement.id}`, { method: 'DELETE' });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Error al eliminar');
          }
          fetchData();
          setExportFeedback(`🗑️ Liquidación ${settlement.folio} eliminada correctamente.`);
          setTimeout(() => setExportFeedback(null), 5000);
        } catch (err: any) {
          setExportFeedback(`Error eliminando liquidación: ${err.message}`);
          setTimeout(() => setExportFeedback(null), 6000);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  // Prompt delete producer
  const handleDeleteProducerPrompt = (producer: Producer) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar Productor del Directorio?',
      description: (
        <div className="space-y-2">
          <p>
            Se eliminará la ficha del productor <strong>{producer.name}</strong> del padrón general.
          </p>
          <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-semibold">
            Nota: Solo es posible eliminar productores que no cuenten con boletas de báscula o liquidaciones históricas asociadas.
          </p>
        </div>
      ),
      variant: 'danger',
      icon: <Trash2 size={24} className="text-rose-600" />,
      confirmText: 'Eliminar Productor',
      cancelText: 'Cancelar',
      summaryItems: [
        { label: 'Nombre Productor', value: producer.name },
        { label: 'RFC', value: producer.rfc || 'No especificado' },
        { label: 'Ubicación / Huerto', value: producer.location || producer.default_orchard || 'Pedernales, Ver.' },
        { label: 'Saldo Registrado', value: `$${(producer.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` }
      ],
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/producers/${producer.id}`, { method: 'DELETE' });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Error al eliminar');
          }
          fetchData();
          setExportFeedback(`🗑️ Productor ${producer.name} eliminado.`);
          setTimeout(() => setExportFeedback(null), 5000);
        } catch (err: any) {
          setExportFeedback(`No se pudo eliminar el productor: ${err.message}`);
          setTimeout(() => setExportFeedback(null), 6000);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
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
          {/* Official PDF Letterhead Hub */}
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-emerald-950 hover:bg-black text-amber-300 border border-amber-400/40 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            title="Generar Estados de Cuenta y Facturas con el Membrete Oficial Corporativo de JBM Cítricos"
          >
            <Download size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Exportar PDF Membretado</span>
          </button>

          {/* Quick Export to CSV (Accounting ERP) */}
          <button
            onClick={() => exportCurrentTableView('csv')}
            className="bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            title="Exportar la vista actual de la tabla a formato CSV estándar (Compatible con CONTPAQi, Aspel COI, SAP y ERPs contables)"
          >
            <Table size={16} className="text-emerald-300 group-hover:scale-110 transition-transform" />
            <span>Exportar Vista (CSV)</span>
          </button>

          {/* Quick Export to Excel */}
          <button
            onClick={() => exportCurrentTableView('excel')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Descargar reporte de la tabla actual en formato Microsoft Excel (.XLS)"
          >
            <FileSpreadsheet size={16} className="text-emerald-700" />
            <span>Excel</span>
          </button>

          {/* New Settlement Button */}
          <button
            onClick={() => setShowNewSettlementModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-900/20 hover:scale-[1.02] transition-all cursor-pointer"
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

        <button
          onClick={() => setActiveTab('sales-report')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sales-report'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={15} />
          <span>Reportes de Ventas (PDF)</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly-balance')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'monthly-balance'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale size={15} />
          <span>Balance Mensual & Resultados (PDF)</span>
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

              {/* Direct CSV Export for Current Filtered Settlements */}
              <button
                onClick={() => handleExport('settlements', 'csv')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Exportar la lista filtrada de liquidaciones a CSV (Compatible con CONTPAQi / Software Contable)"
              >
                <Table size={14} className="text-emerald-700" />
                <span>CSV Contable</span>
              </button>
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
                            onClick={() => {
                              const prod = producers.find(p => p.id === s.producer_id);
                              generateSettlementPdf(s, prod, batches);
                              setExportFeedback(`📄 Boleta Oficial de Liquidación ${s.folio} descargada en PDF.`);
                              setTimeout(() => setExportFeedback(null), 5000);
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Descargar Boleta de Liquidación en PDF (Membrete Oficial JBM)"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => {
                              const prod = producers.find(p => p.id === s.producer_id);
                              generateSettlementInvoicePdf(s, prod, batches);
                              setExportFeedback(`🧾 Factura CFDI / Fiscal de Liquidación ${s.folio} generada en PDF.`);
                              setTimeout(() => setExportFeedback(null), 5000);
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Generar Factura CFDI / Comercial en PDF"
                          >
                            <Receipt size={14} />
                          </button>
                          <button
                            onClick={() => exportSingleSettlementVoucher(s, producers.find(p => p.id === s.producer_id), 'excel')}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Descargar Póliza en Excel (.xls)"
                          >
                            <FileSpreadsheet size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSettlementPrompt(s)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer group"
                            title="Eliminar y Cancelar Liquidación"
                          >
                            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportPdf('global-statement')}
                className="bg-emerald-900 hover:bg-emerald-950 text-amber-300 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Descargar Estado Financiero Global y Balance de Cuentas en PDF con Membrete JBM"
              >
                <Download size={14} className="text-amber-400" />
                <span>Balance Global (PDF)</span>
              </button>
              <button
                onClick={() => handleExport('producers', 'csv')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Exportar auxiliar contable de productores a CSV para ERP / CONTPAQi"
              >
                <Table size={15} className="text-emerald-700" />
                <span>Exportar CSV Contable</span>
              </button>
              <button
                onClick={() => handleExport('producers', 'excel')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Descargar libro auxiliar en formato Excel"
              >
                <FileSpreadsheet size={15} className="text-slate-600" />
                <span>Excel</span>
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              generateProducerAccountStatementPdf(p, settlements, batches);
                              setExportFeedback(`📄 Estado de Cuenta Oficial en PDF generado para ${p.name}.`);
                              setTimeout(() => setExportFeedback(null), 5000);
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            title="Descargar Estado de Cuenta en PDF con Membrete JBM"
                          >
                            <Download size={13} />
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProducerId(String(p.id));
                              setActiveTab('settlements');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Ver Cortes
                          </button>
                          <button
                            onClick={() => handleDeleteProducerPrompt(p)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer group"
                            title="Eliminar Productor"
                          >
                            <Trash2 size={13} className="group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
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
                onClick={() => handleExport('operations', 'csv')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Exportar auditoría de maniobra y pesaje a CSV para conciliación contable"
              >
                <Table size={15} className="text-emerald-700" />
                <span>Exportar CSV Contable</span>
              </button>
              <button
                onClick={() => handleExport('operations', 'excel')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Descargar auditoría en formato Excel"
              >
                <FileSpreadsheet size={15} className="text-slate-600" />
                <span>Excel</span>
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

      {/* ========================================================================= */}
      {/* TAB 4: REPORTE EJECUTIVO DE VENTAS (PDF & ANALYTICS)                      */}
      {/* ========================================================================= */}
      {activeTab === 'sales-report' && (() => {
        const salesData = getSalesReportData();
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                    <BarChart3 size={20} />
                  </span>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Reporte Ejecutivo de Ventas & Desplazamiento</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Análisis integral de facturación POS, volumen en cajas/kg y distribución de clientes en {salesData.periodLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Period Selector */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setSalesPeriod('7d')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      salesPeriod === '7d' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    7 Días
                  </button>
                  <button
                    onClick={() => setSalesPeriod('30d')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      salesPeriod === '30d' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    30 Días
                  </button>
                  <button
                    onClick={() => setSalesPeriod('this_month')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      salesPeriod === 'this_month' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Este Mes
                  </button>
                  <button
                    onClick={() => setSalesPeriod('last_month')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      salesPeriod === 'last_month' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mes Ant.
                  </button>
                </div>

                {/* Print Preview Button */}
                <button
                  onClick={() => openPrintPreview('sales-report')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
                  title="Abrir Vista Previa con Estilos de Impresión index.css"
                >
                  <Eye size={15} className="text-slate-600" />
                  <span>Vista Previa Impresión</span>
                </button>

                {/* Direct PDF Export */}
                <button
                  onClick={() => handleExportPdf('sales-report', salesData)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={15} className="text-amber-400" />
                  <span>Descargar PDF Oficial</span>
                </button>
              </div>
            </div>

            {/* Sales KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Ingresos por Ventas</p>
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <DollarSign size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-900 mt-2 font-mono">
                  ${salesData.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                  <TrendingUp size={14} /> Facturación Bruta ({salesData.periodLabel})
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Volumen Desplazado</p>
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Scale size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  {salesData.totalKgSold.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg netos</span>
                </p>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1 mt-1">
                  <Boxes size={14} /> {salesData.totalBoxesSold.toLocaleString()} cajas empacadas
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Tickets & Ticket Promedio</p>
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                    <Receipt size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  ${salesData.avgTicketValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-purple-700 flex items-center gap-1 mt-1">
                  <CheckCircle2 size={14} /> {salesData.totalTickets} notas / facturas emitidas
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Descuentos & Ajustes</p>
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <ShoppingBag size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-amber-900 mt-2 font-mono">
                  ${salesData.totalDiscounts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1 mt-1">
                  2.4% promedio sobre volumen
                </span>
              </div>
            </div>

            {/* Breakdown Grid: Top Products, Payment Methods, Channels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Top Products */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Boxes size={16} className="text-emerald-700" />
                    Top Calibres & Presentaciones
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                    Por Facturación
                  </span>
                </div>

                <div className="space-y-3">
                  {salesData.topProducts.map((prod, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[200px]" title={prod.name}>
                          {prod.name}
                        </span>
                        <span className="font-mono font-black text-emerald-800">
                          ${prod.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{prod.boxesSold ? `${prod.boxesSold} cjs` : ''} • {prod.kgSold.toLocaleString()} kg</span>
                        <span className="font-bold text-slate-600">{prod.volumePercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full" 
                          style={{ width: `${Math.min(100, prod.volumePercent * 2.2)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Payment Methods */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <CreditCard size={16} className="text-blue-700" />
                    Métodos de Pago & Dispersión
                  </h4>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                    Caja / Bancos
                  </span>
                </div>

                <div className="space-y-3">
                  {salesData.paymentMethods.map((pm, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-800">{pm.method}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{pm.count} transacciones • {pm.percentage}%</p>
                      </div>
                      <p className="font-mono font-black text-xs text-slate-900">
                        ${pm.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Customer Channels */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <User size={16} className="text-purple-700" />
                    Canales de Distribución
                  </h4>
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full">
                    Clientes
                  </span>
                </div>

                <div className="space-y-3">
                  {salesData.customerTypes.map((ct, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-800">{ct.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{ct.boxes} cjs • {ct.kg.toLocaleString()} kg ({ct.percentage}%)</p>
                      </div>
                      <p className="font-mono font-black text-xs text-purple-900">
                        ${ct.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900">Histórico Diario de Ventas ({salesData.periodLabel})</h4>
                  <p className="text-xs text-slate-500 font-medium">Detalle cronológico de volumen, cortes en efectivo y transferencias SPEI</p>
                </div>
                <button
                  onClick={() => handleExportPdf('sales-report', salesData)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Imprimir / Exportar Tabla</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                    <tr>
                      <th className="p-4">Fecha / Periodo</th>
                      <th className="p-4 text-center">Tickets</th>
                      <th className="p-4 text-right">Volumen Kg</th>
                      <th className="p-4 text-right">Cajas</th>
                      <th className="p-4 text-right">Efectivo</th>
                      <th className="p-4 text-right">SPEI / Banco</th>
                      <th className="p-4 text-right">Total Facturado</th>
                      <th className="p-4 text-center">Ticket Prom.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {salesData.dailySales.length > 0 ? (
                      salesData.dailySales.map((day, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-sans font-bold text-slate-900">{day.label || day.date}</td>
                          <td className="p-4 text-center text-slate-600">{day.ticketCount}</td>
                          <td className="p-4 text-right font-bold text-slate-800">{day.totalKg.toLocaleString()} kg</td>
                          <td className="p-4 text-right text-slate-600">{day.totalBoxes} cjs</td>
                          <td className="p-4 text-right text-emerald-700">${(day.cashAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right text-blue-700">${(day.transferAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-right font-black text-slate-900">${day.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-center text-slate-500 font-sans text-[11px]">${day.avgTicket.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                          No hay registros de ventas para el periodo seleccionado
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {salesData.dailySales.length > 0 && (
                    <tfoot className="bg-slate-50 font-mono font-black text-xs border-t-2 border-slate-200">
                      <tr>
                        <td className="p-4 font-sans uppercase text-slate-700">Totales Periodo:</td>
                        <td className="p-4 text-center text-slate-900">{salesData.totalTickets}</td>
                        <td className="p-4 text-right text-slate-900">{salesData.totalKgSold.toLocaleString()} kg</td>
                        <td className="p-4 text-right text-slate-900">{salesData.totalBoxesSold.toLocaleString()} cjs</td>
                        <td className="p-4 text-right text-emerald-800">
                          ${(salesData.dailySales.reduce((acc, d) => acc + (d.cashAmount || 0), 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right text-blue-800">
                          ${(salesData.dailySales.reduce((acc, d) => acc + (d.transferAmount || 0), 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right text-emerald-900 text-sm">
                          ${salesData.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center text-slate-700 font-sans text-xs">
                          ${salesData.avgTicketValue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 5: BALANCE GENERAL & ESTADO DE RESULTADOS MENSUAL (PDF)               */}
      {/* ========================================================================= */}
      {activeTab === 'monthly-balance' && (() => {
        const balanceData = getMonthlyBalanceData(selectedMonth, selectedYear);
        const monthOptions = [
          { value: 1, label: 'Enero' },
          { value: 2, label: 'Febrero' },
          { value: 3, label: 'Marzo' },
          { value: 4, label: 'Abril' },
          { value: 5, label: 'Mayo' },
          { value: 6, label: 'Junio' },
          { value: 7, label: 'Julio' },
          { value: 8, label: 'Agosto' },
          { value: 9, label: 'Septiembre' },
          { value: 10, label: 'Octubre' },
          { value: 11, label: 'Noviembre' },
          { value: 12, label: 'Diciembre' }
        ];

        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Month/Year Selector */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-800">
                    <Scale size={20} />
                  </span>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Balance General & Estado de Resultados</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      P&L mensual, costos de fruta de liquidaciones, márgenes brutos y conciliación de saldos en {balanceData.periodLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Month Selector */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                >
                  {monthOptions.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                {/* Year Selector */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>

                {/* Print Preview Button */}
                <button
                  onClick={() => openPrintPreview('monthly-balance')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
                  title="Abrir Vista Previa con Estilos de Impresión index.css"
                >
                  <Eye size={15} className="text-slate-600" />
                  <span>Vista Previa Impresión</span>
                </button>

                {/* Direct PDF Export */}
                <button
                  onClick={() => handleExportPdf('monthly-balance', balanceData)}
                  className="bg-slate-900 hover:bg-black text-amber-300 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={15} className="text-amber-400" />
                  <span>Descargar Balance PDF</span>
                </button>
              </div>
            </div>

            {/* Financial Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Ingresos Operativos Totales</p>
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  ${balanceData.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                  Ventas Cítricos + Báscula + Subproductos
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Costo Materia Prima (Fruta)</p>
                  <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
                    <ArrowDownRight size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-rose-900 mt-2 font-mono">
                  ${balanceData.fruitAcquisitionCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1 mt-1">
                  {balanceData.totalFruitKgPurchased.toLocaleString()} kg @ ${balanceData.avgFruitCostPerKg.toFixed(2)}/kg
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Utilidad Bruta</p>
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <TrendingUp size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-blue-900 mt-2 font-mono">
                  ${balanceData.totalGrossProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1 mt-1">
                  Margen Bruto: {balanceData.grossMarginPercent}%
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Utilidad Neta Operativa</p>
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <DollarSign size={16} />
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-950 mt-2 font-mono">
                  ${balanceData.netOperatingIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                  Margen Neto: {balanceData.netMarginPercent}%
                </span>
              </div>
            </div>

            {/* Financial Statements Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Condensed P&L Statement */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-emerald-700" />
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Estado de Resultados Condensado (P&L)</h4>
                      <p className="text-[11px] text-slate-500">Periodo {balanceData.periodLabel}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {balanceData.folio}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Income Breakdown */}
                  <div className="p-3 bg-emerald-50/50 rounded-xl space-y-1.5 border border-emerald-100">
                    <p className="font-sans font-black text-emerald-950 text-xs uppercase tracking-wider">1. Ingresos Operativos</p>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Venta de Cítricos (Empacado & Exportación):</span>
                      <span className="font-bold">${balanceData.citrusSalesRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Servicios de Pesaje & Báscula:</span>
                      <span className="font-bold">${balanceData.scaleServicesRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Venta de Subproductos / Fruta Industrial:</span>
                      <span className="font-bold">${balanceData.subproductsRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-black text-emerald-900 pt-1 border-t border-emerald-200">
                      <span className="font-sans uppercase">Total Ingresos:</span>
                      <span>${balanceData.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Direct Cost */}
                  <div className="p-3 bg-rose-50/50 rounded-xl space-y-1.5 border border-rose-100">
                    <p className="font-sans font-black text-rose-950 text-xs uppercase tracking-wider">2. Costo Directo de Ventas</p>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Compra de Fruta a Productores ({balanceData.settlementsBreakdown.length} liquidaciones):</span>
                      <span className="font-bold text-rose-700">-${balanceData.fruitAcquisitionCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-black text-blue-900 pt-1 border-t border-rose-200">
                      <span className="font-sans uppercase">Utilidad Bruta Operativa ({balanceData.grossMarginPercent}%):</span>
                      <span>${balanceData.totalGrossProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div className="p-3 bg-amber-50/50 rounded-xl space-y-1.5 border border-amber-100">
                    <p className="font-sans font-black text-amber-950 text-xs uppercase tracking-wider">3. Gastos Operativos del Empaque</p>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Maniobra y Tolva ($0.40/kg retención):</span>
                      <span>-${balanceData.maneuverAndTolvaExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Nómina, Cuadrillas & Operadores:</span>
                      <span>-${balanceData.payrollAndStaffExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Empaques, Cajas & Tarimas HT:</span>
                      <span>-${balanceData.suppliesAndPackagingExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Fletes, Logística & Combustible:</span>
                      <span>-${balanceData.localAndFreightExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">Luz Cuarto Frío, Mantenimiento & Otros:</span>
                      <span>-${(balanceData.maintenanceAndUtilitiesExpenses + balanceData.otherExpenses).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-900 pt-1 border-t border-amber-200">
                      <span className="font-sans uppercase">Total Gastos de Operación:</span>
                      <span>-${balanceData.totalOperatingExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Net Profit Summary Line */}
                  <div className="p-3.5 bg-emerald-900 text-white rounded-xl flex justify-between items-center font-black text-sm">
                    <span className="font-sans uppercase">Utilidad Neta de Operación:</span>
                    <span className="text-amber-300 text-base">${balanceData.netOperatingIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </div>
                </div>
              </div>

              {/* Working Capital & Balance Reconciliation */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Building2 size={18} className="text-blue-700" />
                      Capital de Trabajo & Conciliación de Saldos
                    </h4>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                      Tesorería
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="font-sans text-[11px] text-slate-400 block">Disponibilidad en Bancos</span>
                      <span className="font-black text-emerald-800 text-sm block mt-1">
                        ${balanceData.cashInHandAndBank.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="font-sans text-[10px] text-slate-500">Caja Chica + BBVA Bancomer</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="font-sans text-[11px] text-slate-400 block">Valuación Inventario</span>
                      <span className="font-black text-blue-800 text-sm block mt-1">
                        ${balanceData.inventoryValuation.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="font-sans text-[10px] text-slate-500">Cuarto Frío & Producto Terminado</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="font-sans text-[11px] text-slate-400 block">Pasivo a Productores</span>
                      <span className="font-black text-amber-800 text-sm block mt-1">
                        ${balanceData.producersPayablesBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="font-sans text-[10px] text-slate-500">Cortes programados</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800">Cuentas por Productor en el Periodo ({producers.length} activos)</h5>
                    <div className="space-y-1.5">
                      {producers.map((prod) => {
                        const prodSettlements = settlements.filter(s => s.producer_id === prod.id);
                        const prodKg = prodSettlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
                        const prodPaid = prodSettlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);

                        return (
                          <div key={prod.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-xl border border-slate-100">
                            <div>
                              <span className="font-bold text-slate-900">{prod.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-2">({prodKg.toLocaleString()} kg entregados)</span>
                            </div>
                            <span className="font-mono font-bold text-slate-800">
                              ${prodPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quick PDF Action Banner */}
                <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl shadow-md flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-sm text-amber-300">Descargar Balance General Oficial en PDF</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Incluye membrete institucional, firmas de Dirección General y Contraloría Interna.
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportPdf('monthly-balance', balanceData)}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-all"
                  >
                    <Download size={15} />
                    <span>Generar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADVANCED EXPORT CENTER MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-amber-400 flex items-center justify-center shadow-xs">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Centro de Exportación & Documentos Oficiales</h3>
                  <p className="text-xs text-slate-500 font-medium">Generación de Estados de Cuenta, Facturas Fiscales en PDF con membrete JBM y Libros Contables</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* SECCIÓN 1: DOCUMENTOS EN PDF CON MEMBRETE JBM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Documentos Oficiales en PDF (Membrete Corporativo JBM)
                </p>
                <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  jsPDF • Formato Fiscal y Comercial
                </span>
              </div>

              {/* PDF 1: Estado de Cuenta por Productor */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 hover:border-emerald-500 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <User size={16} className="text-emerald-800" />
                      Estado de Cuenta por Productor (PDF con Membrete)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Reporte ejecutivo oficial con entregas de fruta, descuentos de maniobra ($0.40/kg), báscula, pagos y saldo.
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportPdf('producer-statement')}
                    className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 border border-emerald-700 px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                  >
                    <Download size={14} className="text-amber-400" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
                {producers.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60 text-xs">
                    <span className="text-slate-500 font-medium">Productor a emitir:</span>
                    <select
                      value={selectedProducerId}
                      onChange={(e) => setSelectedProducerId(e.target.value)}
                      className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-emerald-500"
                    >
                      <option value="todos">Todos (Primer productor activo)</option>
                      {producers.map(p => (
                        <option key={p.id} value={String(p.id)}>{p.name} ({p.rfc || 'Sin RFC'})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* PDF 2: Factura CFDI / Fiscal de Liquidación */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 hover:border-blue-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Receipt size={16} className="text-blue-800" />
                    Factura Fiscal / CFDI 4.0 de Liquidación (PDF)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Comprobante fiscal con código QR SAT, desglose de IVA exento por sector primario, retenciones y sello digital.
                  </p>
                </div>
                <button
                  onClick={() => handleExportPdf('settlement-invoice')}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <Download size={14} />
                  <span>Factura PDF</span>
                </button>
              </div>

              {/* PDF 3: Estado Financiero Global y Balance JBM */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/30 hover:border-emerald-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Scale size={16} className="text-purple-800" />
                    Estado Financiero Global y Balance de Productores (PDF)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Resumen corporativo con totales de fruta comprada, dispersión de fondos, cuotas de báscula y balance por productor.
                  </p>
                </div>
                <button
                  onClick={() => handleExportPdf('global-statement')}
                  className="bg-slate-900 hover:bg-black text-amber-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <Download size={14} className="text-amber-400" />
                  <span>Descargar PDF</span>
                </button>
              </div>

              {/* PDF 4: Reporte Ejecutivo de Ventas */}
              <div className="p-4 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 hover:border-emerald-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 size={16} className="text-emerald-800" />
                    Reporte Ejecutivo de Ventas & Desplazamiento (PDF)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Facturación de fruta por calibres, volumen en kg y cajas, dispersión por métodos de pago y canales de clientes.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      openPrintPreview('sales-report');
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Vista Previa de Impresión"
                  >
                    <Eye size={13} />
                    <span>Vista Previa</span>
                  </button>
                  <button
                    onClick={() => handleExportPdf('sales-report')}
                    className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download size={14} className="text-amber-400" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>

              {/* PDF 5: Balance General y Estado de Resultados Mensual */}
              <div className="p-4 rounded-2xl border border-purple-300 bg-gradient-to-r from-purple-50/90 to-indigo-50/60 hover:border-purple-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Scale size={16} className="text-purple-800" />
                    Balance General & Estado de Resultados Mensual (PDF)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Estado de pérdidas y ganancias (P&L), costo de adquisición de fruta, gastos operativos del empaque y utilidad neta.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      openPrintPreview('monthly-balance');
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Vista Previa de Impresión"
                  >
                    <Eye size={13} />
                    <span>Vista Previa</span>
                  </button>
                  <button
                    onClick={() => handleExportPdf('monthly-balance')}
                    className="bg-purple-900 hover:bg-purple-950 text-amber-300 px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download size={14} className="text-amber-400" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: ARCHIVOS CONTABLES PARA SOFTWARE ERP (Excel / CSV) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Exportaciones para Software Contable (CONTPAQi, Aspel, SAP, Excel)
              </p>

              {/* Option 1: Liquidaciones */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/20 transition-all flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <Receipt size={14} className="text-emerald-700" />
                    Libro de Liquidaciones Emitidas
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Folios, kilos netos, precio pactado, retenciones y total transferido.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExport('settlements', 'excel')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('settlements', 'csv')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Table size={13} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Auxiliar Productores */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/20 transition-all flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <User size={14} className="text-purple-700" />
                    Auxiliar Contable de Cuentas por Pagar
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Estado de saldos por RFC, kilos recibidos y corte a fecha.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExport('producers', 'excel')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('producers', 'csv')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Table size={13} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Costos Operativos */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/20 transition-all flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <Layers size={14} className="text-amber-700" />
                    Auditoría de Maniobra ($0.40/kg) y Báscula
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Conciliación de cobro de báscula en efectivo y descuentos de tolva.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExport('operations', 'excel')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('operations', 'csv')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Table size={13} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Format Notes */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500">
              💡 <strong>Membrete Corporativo Oficial:</strong> Todos los documentos PDF generados incluyen el logotipo oficial de JBM Cítricos Premium, datos fiscales, folio fiscal/interno, desglose pormenorizado y firmas de autorización.
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const prod = producers.find(p => p.id === selectedSettlement.producer_id);
                    generateSettlementPdf(selectedSettlement, prod, batches);
                    setExportFeedback(`📄 Boleta Oficial de Liquidación ${selectedSettlement.folio} descargada.`);
                    setTimeout(() => setExportFeedback(null), 5000);
                  }}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Descargar Boleta Oficial de Liquidación con Membrete JBM en PDF"
                >
                  <Download size={15} className="text-amber-400" />
                  <span>Boleta PDF Membretada</span>
                </button>
                <button
                  onClick={() => {
                    const prod = producers.find(p => p.id === selectedSettlement.producer_id);
                    generateSettlementInvoicePdf(selectedSettlement, prod, batches);
                    setExportFeedback(`🧾 Factura Fiscal de Liquidación ${selectedSettlement.folio} generada.`);
                    setTimeout(() => setExportFeedback(null), 5000);
                  }}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Descargar Factura Fiscal / CFDI en PDF"
                >
                  <Receipt size={15} />
                  <span>Factura Fiscal (PDF)</span>
                </button>
                <button
                  onClick={() => {
                    const prod = producers.find(p => p.id === selectedSettlement.producer_id);
                    if (prod) {
                      generateProducerAccountStatementPdf(prod, settlements, batches);
                      setExportFeedback(`📄 Estado de Cuenta Oficial generado para ${prod.name}.`);
                      setTimeout(() => setExportFeedback(null), 5000);
                    }
                  }}
                  className="bg-purple-800 hover:bg-purple-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Descargar Estado de Cuenta del Productor en PDF"
                >
                  <User size={15} />
                  <span>Edo. Cuenta (PDF)</span>
                </button>
                <button
                  onClick={() => exportSingleSettlementVoucher(selectedSettlement, producers.find(p => p.id === selectedSettlement.producer_id), 'excel')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer border border-slate-200"
                >
                  <FileSpreadsheet size={15} className="text-slate-600" />
                  <span>Excel</span>
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

            <form onSubmit={promptCreateSettlement} className="space-y-4 text-xs">
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

      {/* ========================================================================= */}
      {/* PRINT PREVIEW MODAL (USES .printable-document FROM index.css)             */}
      {/* ========================================================================= */}
      {printModal.isOpen && (
        <div id="print-modal-container" className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-100">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="no-print sticky top-0 bg-slate-900 text-white p-4 px-6 flex items-center justify-between z-20 border-b border-slate-800 shadow-sm rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{printModal.title}</h3>
                  <p className="text-[11px] text-slate-400">Vista previa oficial con estilos de impresión corporativos index.css</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    if (printModal.docType === 'sales-report' && printModal.salesData) {
                      generateSalesReportPdf(printModal.salesData);
                    } else if (printModal.docType === 'monthly-balance' && printModal.balanceData) {
                      generateMonthlyBalancePdf(printModal.balanceData);
                    }
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Descargar PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Imprimir</span>
                </button>

                <button
                  onClick={() => setPrintModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-4 sm:p-8 bg-slate-50 print:bg-white print:p-0 flex-1">
              <div className="printable-document bg-white text-slate-900 mx-auto max-w-3xl p-8 sm:p-10 shadow-sm border border-slate-200 print:border-none print:shadow-none font-sans text-xs">
                
                {/* Header Membretado */}
                <div className="border-b-2 border-emerald-900 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-950 text-amber-400 flex items-center justify-center font-black text-xl shadow-xs">
                        JBM
                      </div>
                      <div>
                        <h1 className="text-lg font-black text-emerald-950 tracking-tight leading-tight">
                          JBM CÍTRICOS PREMIUM S.A. DE C.V.
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                          EMPACADORA & EXPORTADORA DE CÍTRICOS • MARTÍNEZ DE LA TORRE, VER.
                        </p>
                        <p className="text-[10px] text-slate-400">
                          RFC: JCP-180422-8X1 • Libramiento San Manuel Km 2.5 • Tel: +52 (232) 324-8900
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right font-mono text-[11px] bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                      <p className="font-bold text-emerald-950 uppercase text-[10px]">
                        {printModal.docType === 'sales-report' ? 'REPORTE COMERCIAL' : 'BALANCE FINANCIERO'}
                      </p>
                      <p className="font-black text-slate-900 mt-0.5">
                        {printModal.docType === 'sales-report' ? 'REP-VTA-2026' : (printModal.balanceData?.folio || 'BAL-2026-08')}
                      </p>
                      <p className="text-slate-500 text-[9px] mt-0.5">
                        Emisión: {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CONTENIDO 1: REPORTE DE VENTAS */}
                {printModal.docType === 'sales-report' && printModal.salesData && (() => {
                  const sd = printModal.salesData;
                  return (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Informe Ejecutivo de Ventas & Desplazamiento
                          </h2>
                          <p className="text-[11px] text-slate-600 font-medium">Periodo Evaluado: <strong>{sd.periodLabel}</strong></p>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="text-slate-500">Generado por:</span>
                          <p className="font-bold text-slate-800">{sd.generatedBy}</p>
                        </div>
                      </div>

                      {/* KPI Table */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-emerald-900 block">Facturación Bruta</span>
                          <span className="text-base font-black text-emerald-950 font-mono block mt-1">
                            ${sd.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-blue-900 block">Kilos Desplazados</span>
                          <span className="text-base font-black text-blue-950 font-mono block mt-1">
                            {sd.totalKgSold.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-purple-900 block">Cajas Empacadas</span>
                          <span className="text-base font-black text-purple-950 font-mono block mt-1">
                            {sd.totalBoxesSold.toLocaleString()} cjs
                          </span>
                        </div>
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-amber-900 block">Ticket Promedio</span>
                          <span className="text-base font-black text-amber-950 font-mono block mt-1">
                            ${sd.avgTicketValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Top Calibres Table */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                          1. Desglose de Ventas por Calibre & Presentación
                        </h3>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 uppercase text-[9px] font-bold">
                            <tr>
                              <th className="p-2 border-b">Calibre / Presentación</th>
                              <th className="p-2 text-right border-b">Cajas</th>
                              <th className="p-2 text-right border-b">Kg Netos</th>
                              <th className="p-2 text-right border-b">Facturación MXN</th>
                              <th className="p-2 text-center border-b">% Vol</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {sd.topProducts.map((p, i) => (
                              <tr key={i}>
                                <td className="p-2 font-sans font-medium text-slate-800">{p.name}</td>
                                <td className="p-2 text-right text-slate-600">{p.boxesSold || '-'}</td>
                                <td className="p-2 text-right font-bold text-slate-900">{p.kgSold.toLocaleString()} kg</td>
                                <td className="p-2 text-right font-black text-emerald-900">${p.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className="p-2 text-center text-slate-600">{p.volumePercent}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Payment Methods and Channels */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                            2. Métodos de Pago & Ingreso
                          </h3>
                          <table className="w-full text-xs font-mono">
                            <tbody className="divide-y divide-slate-100">
                              {sd.paymentMethods.map((pm, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 font-sans font-medium text-slate-800">{pm.method}</td>
                                  <td className="py-1.5 text-slate-500 text-[10px]">{pm.count} ops</td>
                                  <td className="py-1.5 text-right font-bold text-slate-900">${pm.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-1.5 text-right text-slate-500 text-[10px]">{pm.percentage}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                            3. Canales de Distribución
                          </h3>
                          <table className="w-full text-xs font-mono">
                            <tbody className="divide-y divide-slate-100">
                              {sd.customerTypes.map((ct, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 font-sans font-medium text-slate-800">{ct.label}</td>
                                  <td className="py-1.5 text-right font-bold text-slate-900">${ct.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-1.5 text-right text-slate-500 text-[10px]">{ct.percentage}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Historical Daily Audit Table */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                          4. Auditoría de Operaciones Diarias
                        </h3>
                        <table className="w-full text-left text-xs border-collapse font-mono">
                          <thead className="bg-slate-100 text-slate-700 uppercase text-[9px] font-bold">
                            <tr>
                              <th className="p-2 border-b">Fecha</th>
                              <th className="p-2 text-center border-b">Tickets</th>
                              <th className="p-2 text-right border-b">Kg</th>
                              <th className="p-2 text-right border-b">Cajas</th>
                              <th className="p-2 text-right border-b">Efectivo</th>
                              <th className="p-2 text-right border-b">Bancos SPEI</th>
                              <th className="p-2 text-right border-b">Total MXN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {sd.dailySales.slice(-7).map((d, i) => (
                              <tr key={i}>
                                <td className="p-2 font-sans font-medium text-slate-800">{d.label || d.date}</td>
                                <td className="p-2 text-center text-slate-600">{d.ticketCount}</td>
                                <td className="p-2 text-right font-bold text-slate-800">{d.totalKg.toLocaleString()}</td>
                                <td className="p-2 text-right text-slate-600">{d.totalBoxes}</td>
                                <td className="p-2 text-right text-emerald-800">${(d.cashAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className="p-2 text-right text-blue-800">${(d.transferAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className="p-2 text-right font-black text-slate-900">${d.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* CONTENIDO 2: BALANCE GENERAL & P&L */}
                {printModal.docType === 'monthly-balance' && printModal.balanceData && (() => {
                  const bd = printModal.balanceData;
                  return (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Balance General y Estado de Resultados Mensual (P&L)
                          </h2>
                          <p className="text-[11px] text-slate-600 font-medium">Periodo Fiscal: <strong>{bd.periodLabel}</strong></p>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="text-slate-500">Folio de Control:</span>
                          <p className="font-bold font-mono text-emerald-800">{bd.folio}</p>
                        </div>
                      </div>

                      {/* KPI Summary Strip */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-emerald-900 block">Ingresos Brutos</span>
                          <span className="text-base font-black text-emerald-950 font-mono block mt-1">
                            ${bd.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-rose-900 block">Costo Fruta (Liquidaciones)</span>
                          <span className="text-base font-black text-rose-950 font-mono block mt-1">
                            ${bd.fruitAcquisitionCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-blue-900 block">Utilidad Bruta</span>
                          <span className="text-base font-black text-blue-950 font-mono block mt-1">
                            ${bd.totalGrossProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] font-bold text-blue-700">{bd.grossMarginPercent}% margen</span>
                        </div>
                        <div className="p-3 bg-emerald-900 text-white rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-amber-300 block">Utilidad Neta Operativa</span>
                          <span className="text-base font-black text-white font-mono block mt-1">
                            ${bd.netOperatingIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-200">{bd.netMarginPercent}% neto</span>
                        </div>
                      </div>

                      {/* P&L Statement Statement Table */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                          1. Estado de Resultados Detallado
                        </h3>
                        <table className="w-full text-xs font-mono border-collapse">
                          <tbody className="divide-y divide-slate-100">
                            {/* Section 1: Incomes */}
                            <tr className="bg-slate-50 font-sans font-bold text-slate-900">
                              <td colSpan={2} className="p-2">INGRESOS DE OPERACIÓN</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Ventas de Cítricos (Calibres Empacados & Granel)</td>
                              <td className="p-2 text-right font-bold text-slate-900">${bd.citrusSalesRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Servicios de Báscula y Pesaje de Camiones</td>
                              <td className="p-2 text-right font-bold text-slate-900">${bd.scaleServicesRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Venta de Subproductos & Fruta Industrial</td>
                              <td className="p-2 text-right font-bold text-slate-900">${bd.subproductsRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="bg-emerald-50/70 font-bold text-emerald-950 border-y border-emerald-200">
                              <td className="p-2 font-sans uppercase">Total Ingresos Operativos:</td>
                              <td className="p-2 text-right">${bd.totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>

                            {/* Section 2: Direct Costs */}
                            <tr className="bg-slate-50 font-sans font-bold text-slate-900">
                              <td colSpan={2} className="p-2">COSTO DE VENTAS (FRUTA)</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">
                                Adquisición de Fruta a Productores ({bd.totalFruitKgPurchased.toLocaleString()} kg @ ${bd.avgFruitCostPerKg.toFixed(2)}/kg)
                              </td>
                              <td className="p-2 text-right font-bold text-rose-700">-${bd.fruitAcquisitionCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="bg-blue-50/70 font-bold text-blue-950 border-y border-blue-200">
                              <td className="p-2 font-sans uppercase">Utilidad Bruta:</td>
                              <td className="p-2 text-right">${bd.totalGrossProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>

                            {/* Section 3: Operating Expenses */}
                            <tr className="bg-slate-50 font-sans font-bold text-slate-900">
                              <td colSpan={2} className="p-2">GASTOS DE OPERACIÓN DEL EMPAQUE</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Maniobra y Tolva ($0.40/kg retención)</td>
                              <td className="p-2 text-right text-slate-800">-${bd.maneuverAndTolvaExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Nómina, Cuadrillas de Corte & Operadores</td>
                              <td className="p-2 text-right text-slate-800">-${bd.payrollAndStaffExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Empaques, Cajas de Madera & Tarimas Tratadas</td>
                              <td className="p-2 text-right text-slate-800">-${bd.suppliesAndPackagingExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Fletes, Logística & Combustibles</td>
                              <td className="p-2 text-right text-slate-800">-${bd.localAndFreightExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-4 font-sans text-slate-700">Luz de Cuarto Frío, Mantenimiento & Otros</td>
                              <td className="p-2 text-right text-slate-800">-${(bd.maintenanceAndUtilitiesExpenses + bd.otherExpenses).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="bg-amber-50/70 font-bold text-amber-950 border-y border-amber-200">
                              <td className="p-2 font-sans uppercase">Total Gastos de Operación:</td>
                              <td className="p-2 text-right">-${bd.totalOperatingExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>

                            {/* Section 4: Net Profit */}
                            <tr className="bg-emerald-950 text-white font-black text-sm">
                              <td className="p-2.5 font-sans uppercase">UTILIDAD NETA DEL EJERCICIO:</td>
                              <td className="p-2.5 text-right text-amber-300">${bd.netOperatingIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Capital and Treasury Reconciliation */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                          2. Conciliación de Tesorería & Capital de Trabajo
                        </h3>
                        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="font-sans text-[10px] text-slate-500 uppercase block">Disponibilidad en Bancos</span>
                            <span className="font-black text-slate-900 block mt-1">${bd.cashInHandAndBank.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="font-sans text-[10px] text-slate-500 uppercase block">Valuación de Inventario</span>
                            <span className="font-black text-slate-900 block mt-1">${bd.inventoryValuation.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="font-sans text-[10px] text-slate-500 uppercase block">Pasivo a Productores</span>
                            <span className="font-black text-rose-700 block mt-1">${bd.producersPayablesBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Signatures & Certification Block */}
                <div className="pt-8 mt-6 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-8 text-center text-[10px]">
                    <div>
                      <div className="border-b border-slate-400 pb-8 mb-1"></div>
                      <p className="font-bold text-slate-800">Elaboró: Depto. Contable</p>
                      <p className="text-slate-400">JBM Cítricos Premium S.A. de C.V.</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 pb-8 mb-1"></div>
                      <p className="font-bold text-slate-800">Revisó: Contraloría Interna</p>
                      <p className="text-slate-400">Auditoría Financiera y Fiscal</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 pb-8 mb-1"></div>
                      <p className="font-bold text-slate-800">Autorizó: Dirección General</p>
                      <p className="text-slate-400">Lic. Carlos Barragán M.</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400">
                    <span>Documento emitido para fines de control administrativo interno y conciliación contable.</span>
                    <span>Página 1 de 1</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REUSABLE CONFIRMATION MODAL (FINALIZING SETTLEMENTS, DELETING RECORDS)   */}
      {/* ========================================================================= */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        icon={confirmModal.icon}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        summaryItems={confirmModal.summaryItems}
        confirmInputRequired={confirmModal.confirmInputRequired}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
