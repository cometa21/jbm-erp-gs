import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Batch, 
  Settlement, 
  Producer, 
  SalesReportData, 
  MonthlyBalanceData, 
  POSSale,
  MonthlyProductionReportData,
  MonthlySalesReportData
} from '../types';

export interface ReportFilterOptions {
  producerName?: string;
  startDate?: string;
  endDate?: string;
  variety?: string;
  notes?: string;
}

export interface InvoiceItem {
  satCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  taxRate?: number; // 0 for 0%
  amount: number;
}

export interface InvoiceData {
  folio: string;
  uuid?: string;
  date: string;
  dueDate?: string;
  currency: 'MXN' | 'USD';
  exchangeRate?: number;
  paymentMethod: 'PUE (Pago en una sola exhibición)' | 'PPD (Pago en parcialidades o diferido)';
  paymentForm: '03 - Transferencia electrónica de fondos' | '01 - Efectivo' | '02 - Cheque nominativo' | '99 - Por definir';
  cfdiUse: 'G01 - Adquisición de mercancías' | 'G03 - Gastos en general' | 'P01 - Por definir' | 'CP01 - Pagos';
  
  // Customer Data
  customer: {
    name: string;
    rfc: string;
    taxRegime?: string;
    address: string;
    email?: string;
    phone?: string;
  };

  // Line items
  items: InvoiceItem[];

  // Financials
  subtotal: number;
  discountTotal?: number;
  taxTotal: number;
  retentionTotal?: number;
  total: number;
  totalInWords?: string;

  // Notes
  notes?: string;
}

export interface DispatchGuideItem {
  palletNumber: string;
  variety: string;
  calibre: string;
  packaging: string;
  boxesCount: number;
  weightNetKg: number;
  weightGrossKg: number;
  temperature?: string;
}

export interface DispatchGuideData {
  folio: string;
  cfdiCartaPorte?: string;
  departureDate: string;
  departureTime?: string;
  eta: string;
  regime?: string;

  // Destination & Customer
  destinationName: string;
  destinationAddress: string;
  destinationRfc?: string;
  contactPerson?: string;

  // Origin
  originFacility?: string;
  originAddress?: string;

  // Transportation & Driver
  carrierName: string;
  carrierRfc?: string;
  driverName: string;
  driverLicense: string;
  truckPlates: string;
  trailerPlates?: string;
  vehicleModel?: string;

  // Security & Temperature
  sealNumber: string;
  thermographId: string;
  tempSetpoint: string;
  tempObserved?: string;

  // Items / Cargo
  items: DispatchGuideItem[];

  // Phytosanitary & Notes
  senasicaCertificate?: string;
  fdaRegistration?: string;
  notes?: string;
  dispatcherName?: string;
}

// ----------------------------------------------------------------------
// HELPER: DRAW OFFICIAL JBM CORPORATE HEADER
// ----------------------------------------------------------------------
function drawCorporateHeader(
  doc: jsPDF, 
  titleBadge: string, 
  folioStr: string, 
  dateStr: string, 
  pageWidth: number,
  margin: number = 14
) {
  // Top green banner accent line
  doc.setFillColor(6, 78, 59); // Deep Emerald #064e3b
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Amber/Gold sub-stripe
  doc.setFillColor(217, 119, 6); // Amber #d97706
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Vector Corporate Logo Emulation (High-Resolution Vector Graphics)
  const logoX = margin;
  const logoY = 10;

  // Leaf 1 (Gold/Green)
  doc.setFillColor(180, 140, 30);
  doc.ellipse(logoX + 7, logoY + 3, 2.5, 4.5, 'F');
  // Leaf 2
  doc.setFillColor(210, 165, 45);
  doc.ellipse(logoX + 11.5, logoY + 2.5, 2, 3.5, 'F');

  // Lime Dome Outer (Forest Green)
  doc.setFillColor(11, 107, 52);
  doc.ellipse(logoX + 9, logoY + 10, 8.5, 6, 'F');

  // Lime Dome Inner Pulp (Bright Lime)
  doc.setFillColor(74, 222, 128);
  doc.ellipse(logoX + 9, logoY + 10, 6.8, 4.8, 'F');

  // JBM Text in Logo
  doc.setTextColor(180, 130, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('JBM', logoX + 9, logoY + 19, { align: 'center' });

  // Company Name Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('JBM CÍTRICOS S.A. DE C.V.', logoX + 22, logoY + 5);

  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('EMPACADORA & EXPORTADORA DE CÍTRICOS • LIMONES BARRAGÁN', logoX + 22, logoY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('R.F.C.: JBM980412H82 • Reg. SENASICA: MEX-VER-CIT-2024 • FDA Reg: 18492049102', logoX + 22, logoY + 13.8);
  doc.text('Carr. Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Ver. C.P. 93600 • Tel: +52 (232) 324-8890', logoX + 22, logoY + 17.5);

  // Document Title & Metadata Box (Right Side)
  const metaBoxWidth = 72;
  const metaBoxX = pageWidth - margin - metaBoxWidth;
  const metaBoxY = 9;
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxWidth, 20, 1.5, 1.5, 'FD');

  doc.setFillColor(6, 78, 59); // Emerald 900 badge
  doc.roundedRect(metaBoxX + 1.5, metaBoxY + 1.5, metaBoxWidth - 3, 5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text(titleBadge, metaBoxX + (metaBoxWidth / 2), metaBoxY + 4.8, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(folioStr, metaBoxX + 3.5, metaBoxY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha Emisión: ${dateStr}`, metaBoxX + 3.5, metaBoxY + 14.5);
  doc.text('Régimen: 601 General de Ley Personas Morales', metaBoxX + 3.5, metaBoxY + 18);
}

// ----------------------------------------------------------------------
// HELPER: DRAW DIGITAL FISCAL QR & SAT STAMP
// ----------------------------------------------------------------------
function drawFiscalStamp(doc: jsPDF, x: number, y: number, width: number, height: number, uuidStr: string) {
  // Border container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'FD');

  // Draw simulated QR Matrix
  const qrSize = 18;
  const qrX = x + 3;
  const qrY = y + 3;

  doc.setFillColor(15, 23, 42);
  doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 1.5, qrY + 1.5, qrSize - 3, qrSize - 3, 'F');

  // QR Finder Patterns
  const drawFinder = (fx: number, fy: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(fx, fy, 4.5, 4.5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(fx + 0.8, fy + 0.8, 2.9, 2.9, 'F');
    doc.setFillColor(15, 23, 42);
    doc.rect(fx + 1.5, fy + 1.5, 1.5, 1.5, 'F');
  };
  drawFinder(qrX + 2, qrY + 2);
  drawFinder(qrX + qrSize - 6.5, qrY + 2);
  drawFinder(qrX + 2, qrY + qrSize - 6.5);

  // QR internal pixels
  doc.setFillColor(15, 23, 42);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if ((r + c * 3) % 2 === 0) {
        doc.rect(qrX + 8 + (c * 1.5), qrY + 8 + (r * 1.5), 1.1, 1.1, 'F');
      }
    }
  }

  // Stamp info
  const textX = qrX + qrSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text('TIMBRE FISCAL DIGITAL CFDI 4.0 (SAT)', textX, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Folio Fiscal (UUID): ${uuidStr}`, textX, y + 8);
  doc.text('No. de Serie del Certificado del SAT: 00001000000504465028', textX, y + 11.5);
  doc.text('No. de Serie del Certificado del Emisor: 00001000000508920194', textX, y + 15);
  
  // Cadena original snippet
  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Cadena Original: ||1.1|${uuidStr}|${new Date().toISOString()}|SAT970701NN3|jbm89a0f4492k10==||`, textX, y + 19);
}

// ----------------------------------------------------------------------
// HELPER: NUMBER TO SPANISH WORDS FOR INVOICE TOTAL
// ----------------------------------------------------------------------
function numberToSpanishCurrency(amount: number, currency: 'MXN' | 'USD' = 'MXN'): string {
  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const cents = Math.round((rounded - integerPart) * 100).toString().padStart(2, '0');
  
  // Simplified high-level currency formatting for Mexican commerce
  const currencyLabel = currency === 'USD' ? 'DÓLARES AMERICANOS' : 'PESOS MEXICANOS';
  const currencySuffix = currency === 'USD' ? 'USD' : 'M.N.';

  return `SON: ${integerPart.toLocaleString('es-MX')} ${currencyLabel} ${cents}/100 ${currencySuffix}`;
}

// ----------------------------------------------------------------------
// 1. GENERATE OFFICIAL INVOICE PDF (FACTURA CFDI 4.0 / COMERCIAL JBM)
// ----------------------------------------------------------------------
export function generateInvoicePdf(invoice: InvoiceData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const uuid = invoice.uuid || '84B29F01-E512-4AA8-9F33-7221D604B901';

  // 1. Corporate Header
  drawCorporateHeader(
    doc,
    'FACTURA CFDI 4.0 / INVOICE',
    `Folio: ${invoice.folio}`,
    invoice.date,
    pageWidth,
    margin
  );

  // 2. Customer & Fiscal Meta Grid
  const clientBoxY = 32;
  const colW = (pageWidth - (margin * 2) - 4) / 2;
  const boxH = 26;

  // Box A: Customer (Receptor)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, clientBoxY, colW, boxH, 1.5, 1.5, 'FD');

  doc.setFillColor(6, 78, 59); // Green left accent
  doc.rect(margin, clientBoxY, 1.5, boxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 78, 59);
  doc.text('DATOS DEL RECEPTOR / CLIENTE', margin + 4, clientBoxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customer.name, margin + 4, clientBoxY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`R.F.C. / Tax ID: ${invoice.customer.rfc || 'XEXX010101000'}`, margin + 4, clientBoxY + 13.5);
  doc.text(`Domicilio Fiscal: ${invoice.customer.address || 'McAllen, Texas, USA'}`, margin + 4, clientBoxY + 17.5);
  doc.text(`Régimen Fiscal: ${invoice.customer.taxRegime || '601 - General de Ley Personas Morales'}`, margin + 4, clientBoxY + 21.5);
  doc.text(`Uso CFDI: ${invoice.cfdiUse}`, margin + 4, clientBoxY + 25);

  // Box B: Payment & Fiscal Conditions
  const boxBX = margin + colW + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(boxBX, clientBoxY, colW, boxH, 1.5, 1.5, 'FD');

  doc.setFillColor(217, 119, 6); // Amber left accent
  doc.rect(boxBX, clientBoxY, 1.5, boxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text('CONDICIONES FISCALES Y DE PAGO', boxBX + 4, clientBoxY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Moneda: ${invoice.currency} ${invoice.exchangeRate ? `(T.C.: $${invoice.exchangeRate.toFixed(2)} MXN)` : ''}`, boxBX + 4, clientBoxY + 9);
  doc.text(`Método de Pago: ${invoice.paymentMethod}`, boxBX + 4, clientBoxY + 13.5);
  doc.text(`Forma de Pago: ${invoice.paymentForm}`, boxBX + 4, clientBoxY + 17.5);
  doc.text(`Fecha Vencimiento: ${invoice.dueDate || invoice.date}`, boxBX + 4, clientBoxY + 21.5);
  doc.text('Tipo de Comprobante: I - Ingreso • Exportación: 02 Definitiva', boxBX + 4, clientBoxY + 25);

  // 3. Line Items Table with autoTable
  const tableData = invoice.items.map(item => [
    item.satCode,
    item.quantity.toLocaleString(),
    item.unit,
    item.description,
    `$${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    item.discount ? `-$${item.discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '$0.00',
    item.taxRate === 0 || !item.taxRate ? '0% (Exento)' : `${item.taxRate}%`,
    `$${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: clientBoxY + boxH + 4,
    head: [[
      'Clave SAT',
      'Cant.',
      'Unidad',
      'Descripción del Producto Cítrico / Servicio',
      'P. Unitario',
      'Descuento',
      'IVA',
      'Importe'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [6, 78, 59], // Emerald 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'center', cellWidth: 16 },
      3: { cellWidth: 70 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 16, textColor: [100, 116, 139] },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'right', cellWidth: 22, fontStyle: 'bold', textColor: [6, 78, 59] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  const afterTableY = (doc as any).lastAutoTable.finalY + 4;

  // 4. Totals & Notes Section
  const totalsW = 75;
  const totalsX = pageWidth - margin - totalsW;
  const totalsH = 34;

  // Bank / Notes Box (Left)
  const notesW = pageWidth - (margin * 2) - totalsW - 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, afterTableY, notesW, totalsH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS BANCARIOS PARA PAGO (SPEI / WIRE TRANSFER):', margin + 3.5, afterTableY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('• Banco: BBVA México S.A. | Beneficiario: JBM CÍTRICOS S.A. DE C.V.', margin + 3.5, afterTableY + 8.5);
  doc.text('• CLABE Interbancaria (MXN): 012 840 001928401928', margin + 3.5, afterTableY + 12);
  doc.text('• Cuenta USD / Swift Wire: BBVAMXMMXXX | Account: 048-92019482', margin + 3.5, afterTableY + 15.5);
  doc.text('• Certificación Fitosanitaria SENASICA / APHIS-USDA libre de plagas.', margin + 3.5, afterTableY + 19);
  
  // Total in words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(6, 78, 59);
  const wordsStr = invoice.totalInWords || numberToSpanishCurrency(invoice.total, invoice.currency);
  doc.text(`IMPORTE CON LETRA: ${wordsStr}`, margin + 3.5, afterTableY + 23.5);

  if (invoice.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Notas: ${invoice.notes}`, margin + 3.5, afterTableY + 29.5);
  }

  // Totals Breakdown (Right)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsX, afterTableY, totalsW, totalsH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', totalsX + 4, afterTableY + 6);
  doc.text(`$${invoice.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${invoice.currency}`, totalsX + totalsW - 4, afterTableY + 6, { align: 'right' });

  if (invoice.discountTotal && invoice.discountTotal > 0) {
    doc.text('Descuentos:', totalsX + 4, afterTableY + 10.5);
    doc.text(`-$${invoice.discountTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${invoice.currency}`, totalsX + totalsW - 4, afterTableY + 10.5, { align: 'right' });
  }

  doc.text('IVA Trasladado (0% Tasa Agrícola):', totalsX + 4, afterTableY + 15);
  doc.text(`$${invoice.taxTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${invoice.currency}`, totalsX + totalsW - 4, afterTableY + 15, { align: 'right' });

  if (invoice.retentionTotal && invoice.retentionTotal > 0) {
    doc.text('Retenciones Aplicadas:', totalsX + 4, afterTableY + 19.5);
    doc.text(`-$${invoice.retentionTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${invoice.currency}`, totalsX + totalsW - 4, afterTableY + 19.5, { align: 'right' });
  }

  // Total Line
  doc.setFillColor(6, 78, 59); // Emerald box
  doc.roundedRect(totalsX + 2, afterTableY + totalsH - 10, totalsW - 4, 8, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL:', totalsX + 5, afterTableY + totalsH - 4.5);
  doc.text(`$${invoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${invoice.currency}`, totalsX + totalsW - 5, afterTableY + totalsH - 4.5, { align: 'right' });

  // 5. Digital Fiscal Stamp (CFDI SAT)
  const stampY = afterTableY + totalsH + 4;
  drawFiscalStamp(doc, margin, stampY, pageWidth - (margin * 2), 22, uuid);

  // 6. Signatures & Footer
  const sigY = stampY + 26;
  const sigW = (pageWidth - (margin * 2) - 10) / 2;

  // Signature JBM
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, sigY + 10, margin + sigW - 10, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('LIC. CARLOS BARRAGÁN M.', margin + (sigW / 2), sigY + 13.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Representante Legal • JBM Cítricos S.A. de C.V.', margin + (sigW / 2), sigY + 16.5, { align: 'center' });

  // Signature Client
  const sig2X = margin + sigW + 10;
  doc.line(sig2X + 10, sigY + 10, sig2X + sigW - 10, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customer.name, sig2X + (sigW / 2), sigY + 13.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Aceptación de Mercancía / Firma Receptor', sig2X + (sigW / 2), sigY + 16.5, { align: 'center' });

  // Bottom Security Line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('ESTE DOCUMENTO ES UNA REPRESENTACIÓN IMPRESA DE UN CFDI V4.0 • JBM CÍTRICOS BARRAGÁN S.A. DE C.V.', margin, pageHeight - 4);
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 4, { align: 'right' });

  // Download PDF
  const filename = `Factura_${invoice.folio}_${invoice.customer.rfc || 'JBM'}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 2. GENERATE OFFICIAL DISPATCH GUIDE PDF (GUÍA DE DESPACHO / REMISIÓN JBM)
// ----------------------------------------------------------------------
export function generateDispatchGuidePdf(guide: DispatchGuideData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Corporate Header
  drawCorporateHeader(
    doc,
    'GUÍA DE DESPACHO & REMISIÓN',
    `Guía: ${guide.folio}`,
    guide.departureDate,
    pageWidth,
    margin
  );

  // 2. Origin & Destination Boxes
  const locY = 32;
  const colW = (pageWidth - (margin * 2) - 4) / 2;
  const boxH = 22;

  // Box 1: Origin
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, locY, colW, boxH, 1.5, 1.5, 'FD');

  doc.setFillColor(6, 78, 59); // Green left bar
  doc.rect(margin, locY, 1.5, boxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 78, 59);
  doc.text('ORIGEN DE LA CARGA / PLANTA EMPACADORA', margin + 4, locY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(guide.originFacility || 'Planta Pedernales JBM Cítricos', margin + 4, locY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(guide.originAddress || 'Carr. Fed. Martínez - Misantla Km 4.5, Ver. C.P. 93600', margin + 4, locY + 12.5);
  doc.text(`Hora de Salida: ${guide.departureTime || '14:30 hrs'} • Régimen: ${guide.regime || 'Exportación A1'}`, margin + 4, locY + 16.5);
  doc.text(`Certificado Fitosanitario: ${guide.senasicaCertificate || 'SENASICA-MEX-VER-88492'}`, margin + 4, locY + 20);

  // Box 2: Destination
  const destX = margin + colW + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(destX, locY, colW, boxH, 1.5, 1.5, 'FD');

  doc.setFillColor(217, 119, 6); // Amber left bar
  doc.rect(destX, locY, 1.5, boxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text('DESTINO Y ALMACÉN RECEPTOR', destX + 4, locY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(guide.destinationName, destX + 4, locY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(guide.destinationAddress, destX + 4, locY + 12.5);
  doc.text(`R.F.C. / Tax ID: ${guide.destinationRfc || 'XEXX010101000'}`, destX + 4, locY + 16.5);
  doc.text(`ETA Estimado: ${guide.eta}`, destX + 4, locY + 20);

  // 3. Transport, Operator & Cold Chain (3 Columns)
  const transY = locY + boxH + 3;
  const col3W = (pageWidth - (margin * 2) - 6) / 3;
  const transH = 20;

  // Box T1: Carrier & Operator
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, transY, col3W, transH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text('TRANSPORTISTA & CHOFER', margin + 3.5, transY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Línea: ${guide.carrierName}`, margin + 3.5, transY + 8.5);
  doc.text(`Operador: ${guide.driverName}`, margin + 3.5, transY + 12.5);
  doc.text(`Licencia Fed.: ${guide.driverLicense}`, margin + 3.5, transY + 16.5);

  // Box T2: Vehicle & Security Seals
  const t2X = margin + col3W + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(t2X, transY, col3W, transH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text('UNIDAD & SELLOS DE SEGURIDAD', t2X + 3.5, transY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Placas Tracto: ${guide.truckPlates}`, t2X + 3.5, transY + 8.5);
  doc.text(`Remolque / Caja: ${guide.trailerPlates || 'CA-552 Refrigerada'}`, t2X + 3.5, transY + 12.5);
  doc.text(`Sello Fiscal SAT: ${guide.sealNumber}`, t2X + 3.5, transY + 16.5);

  // Box T3: Cold Chain & Thermograph
  const t3X = t2X + col3W + 3;
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(t3X, transY, col3W, transH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(6, 78, 59);
  doc.text('CADENA DE FRÍO & MONITOREO', t3X + 3.5, transY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70);
  doc.text(`Set Point Requerido: ${guide.tempSetpoint}`, t3X + 3.5, transY + 8.5);
  doc.text(`Temp. en Carga: ${guide.tempObserved || guide.tempSetpoint}`, t3X + 3.5, transY + 12.5);
  doc.text(`Datalogger ID: ${guide.thermographId}`, t3X + 3.5, transY + 16.5);

  // 4. Cargo Items Table
  const tableData = guide.items.map((item, idx) => [
    `#${idx + 1}`,
    item.palletNumber,
    item.variety,
    item.calibre,
    item.packaging,
    item.boxesCount.toLocaleString(),
    `${item.weightNetKg.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg`,
    `${item.weightGrossKg.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg`,
    item.temperature || guide.tempSetpoint
  ]);

  const totalBoxes = guide.items.reduce((s, i) => s + i.boxesCount, 0);
  const totalNetKg = guide.items.reduce((s, i) => s + i.weightNetKg, 0);
  const totalGrossKg = guide.items.reduce((s, i) => s + i.weightGrossKg, 0);

  autoTable(doc, {
    startY: transY + transH + 4,
    head: [[
      '#',
      'Pallet ID',
      'Variedad Fruta',
      'Calibre',
      'Presentación / Empaque',
      'Cajas',
      'Peso Neto',
      'Peso Bruto',
      'Temp.'
    ]],
    body: tableData,
    foot: [[
      'TOTALES',
      `${guide.items.length} Pallets`,
      '',
      '',
      '',
      `${totalBoxes.toLocaleString()} Cajas`,
      `${totalNetKg.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg\n(${(totalNetKg / 1000).toFixed(2)} Ton)`,
      `${totalGrossKg.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg`,
      guide.tempSetpoint
    ]],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [6, 78, 59], // Emerald 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.2
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { halign: 'center', cellWidth: 16 },
      4: { cellWidth: 40 },
      5: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      6: { halign: 'right', cellWidth: 20, fontStyle: 'bold', textColor: [6, 78, 59] },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 14 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  const afterTableY = (doc as any).lastAutoTable.finalY + 4;

  // 5. Phytosanitary & Legal Certifications Box
  const certH = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, afterTableY, pageWidth - (margin * 2), certH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICACIÓN FITOSANITARIA & DECLARACIÓN DE EMBARQUE:', margin + 3.5, afterTableY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text('• Se certifica que este embarque de cítricos frescos ha sido seleccionado, lavado, tratado con fungicidas autorizados y encerado.', margin + 3.5, afterTableY + 8.5);
  doc.text('• Cumple estrictamente con las normas oficiales mexicanas NOM-FITO y los requisitos de importación del USDA-APHIS / FDA.', margin + 3.5, afterTableY + 12);
  doc.text('• El transportista se compromete a mantener encendido el equipo Thermo King en todo momento sin romper la cadena de frío.', margin + 3.5, afterTableY + 15.5);
  doc.text(`• Complemento Carta Porte 3.0 SAT: ${guide.cfdiCartaPorte || 'CP30-JBM-884920'} • Clave SAT: 50101518 (Limones Frescos)`, margin + 3.5, afterTableY + 19);

  // 6. Tripartite Signatures (Despachador, Chofer, Receptor)
  const sigY = afterTableY + certH + 4;
  const sigW = (pageWidth - (margin * 2) - 8) / 3;

  // Sig 1: JBM Dispatcher
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, sigY, sigW, 20, 1.5, 1.5, 'FD');
  doc.line(margin + 5, sigY + 13, margin + sigW - 5, sigY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(guide.dispatcherName || 'CARLOS BARRAGÁN M.', margin + (sigW / 2), sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Despacho y Embarques • JBM Cítricos', margin + (sigW / 2), sigY + 18.5, { align: 'center' });

  // Sig 2: Transport Operator
  const sig2X = margin + sigW + 4;
  doc.roundedRect(sig2X, sigY, sigW, 20, 1.5, 1.5, 'FD');
  doc.line(sig2X + 5, sigY + 13, sig2X + sigW - 5, sigY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(guide.driverName, sig2X + (sigW / 2), sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Operador Transportista (Recibí Carga)', sig2X + (sigW / 2), sigY + 18.5, { align: 'center' });

  // Sig 3: Consignee / Receiver
  const sig3X = sig2X + sigW + 4;
  doc.roundedRect(sig3X, sigY, sigW, 20, 1.5, 1.5, 'FD');
  doc.line(sig3X + 5, sigY + 13, sig3X + sigW - 5, sigY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text('ALMACÉN DESTINO / CONFORME', sig3X + (sigW / 2), sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Sello y Firma de Recepción de Mercancía', sig3X + (sigW / 2), sigY + 18.5, { align: 'center' });

  // Bottom Security Line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('GUÍA DE DESPACHO OFICIAL • JBM CÍTRICOS S.A. DE C.V. • WWW.JBMCITRICOS.COM', margin, pageHeight - 4);
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 4, { align: 'right' });

  // Download PDF
  const filename = `Guia_Despacho_${guide.folio}_${guide.truckPlates.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 3. GENERATE SCALE RECEIPTS HISTORY PDF (LANDSCAPE A4)
// ----------------------------------------------------------------------
export function generateScaleHistoryPdf(batches: Batch[], filters?: ReportFilterOptions) {
  // Create landscape A4 document for rich financial & scale detail
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Filter batches if needed
  let filtered = [...batches];
  if (filters?.producerName && filters.producerName !== 'TODOS') {
    filtered = filtered.filter(b => b.producer_name?.toLowerCase().includes(filters.producerName!.toLowerCase()));
  }

  // Calculate totals
  const totalGross = filtered.reduce((sum, b) => sum + (b.weight_gross || 0), 0);
  const totalTare = filtered.reduce((sum, b) => sum + (b.weight_tare || 0), 0);
  const totalNet = filtered.reduce((sum, b) => sum + (b.weight_net || 0), 0);
  const totalSubtotal = filtered.reduce((sum, b) => sum + (b.subtotal || 0), 0);
  const totalScaleFees = filtered.reduce((sum, b) => sum + (b.scale_fee || 0), 0);
  const totalScaleFeesDeducted = filtered.reduce((sum, b) => sum + (b.scale_fee_payment === 'descuento' ? (b.scale_fee || 0) : 0), 0);
  const totalScaleFeesCash = filtered.reduce((sum, b) => sum + (b.scale_fee_payment === 'efectivo' ? (b.scale_fee || 0) : 0), 0);
  const totalExtraCharges = filtered.reduce((sum, b) => sum + (b.extra_charge_total || ((b.weight_net || 0) * (b.extra_charge_per_kg ?? 0.40))), 0);
  const totalLiquidated = filtered.reduce((sum, b) => sum + (b.total || 0), 0);

  // 1. Corporate Header
  doc.setFillColor(6, 78, 59); // Deep Emerald #064e3b
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFillColor(217, 119, 6); // Amber #d97706
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  const logoX = margin;
  const logoY = 12;

  // Vector Logo
  doc.setFillColor(180, 140, 30);
  doc.ellipse(logoX + 8, logoY + 4, 3, 5, 'F');
  doc.setFillColor(210, 165, 45);
  doc.ellipse(logoX + 13, logoY + 3, 2.5, 4, 'F');
  doc.setFillColor(11, 107, 52);
  doc.ellipse(logoX + 10, logoY + 12, 10, 7, 'F');
  doc.setFillColor(74, 222, 128);
  doc.ellipse(logoX + 10, logoY + 12, 8, 5.5, 'F');

  doc.setTextColor(180, 130, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('JBM', logoX + 10, logoY + 22, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(6, 78, 59);
  doc.text('JBM CÍTRICOS S.A. DE C.V.', logoX + 24, logoY + 6);

  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text('EMPACADORA & EXPORTADORA DE CÍTRICOS • LIMONES BARRAGÁN', logoX + 24, logoY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('R.F.C.: JBM980412H82 • Reg. SENASICA / FDA Certificado • Báscula Camionera Certificada 80 Ton', logoX + 24, logoY + 16);
  doc.text('Carretera Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Veracruz • C.P. 93600', logoX + 24, logoY + 20);

  // Document Title Box
  const metaBoxX = pageWidth - margin - 85;
  const metaBoxY = 10;
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(metaBoxX, metaBoxY, 85, 23, 2, 2, 'FD');

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(metaBoxX + 2, metaBoxY + 2, 81, 5.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('HISTORIAL DE RECIBOS Y CARGOS BÁSCULA', metaBoxX + 42.5, metaBoxY + 5.8, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const reportFolio = `REP-BAS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
  doc.text(`Folio Reporte: ${reportFolio}`, metaBoxX + 4, metaBoxY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  doc.text(`Fecha Emisión: ${nowStr}`, metaBoxX + 4, metaBoxY + 16);
  doc.text(`Filtro Productor: ${filters?.producerName || 'Todos los Registros'}`, metaBoxX + 4, metaBoxY + 20.5);

  // 2. Financial KPI Summary Cards
  const kpiY = 36;
  const kpiWidth = (pageWidth - (margin * 2) - 12) / 5;
  const kpiHeight = 15;

  const kpis = [
    {
      label: 'TOTAL KILOS NETOS',
      value: `${totalNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg`,
      sub: `${filtered.length} pesajes realizados`,
      color: [6, 78, 59]
    },
    {
      label: 'SUBTOTAL FRUTA',
      value: `$${totalSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: 'Valor bruto recibido',
      color: [30, 41, 59]
    },
    {
      label: 'CUOTAS DE BÁSCULA',
      value: `$${totalScaleFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: `Desc: $${totalScaleFeesDeducted.toFixed(0)} | Efec: $${totalScaleFeesCash.toFixed(0)}`,
      color: [180, 83, 9]
    },
    {
      label: 'CARGOS OPERATIVOS ($0.40/kg)',
      value: `$${totalExtraCharges.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: 'Maniobra y servicios',
      color: [190, 24, 93]
    },
    {
      label: 'TOTAL NETO LIQUIDADO',
      value: `$${totalLiquidated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: 'Monto liquidado a productores',
      color: [4, 120, 87]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + (idx * (kpiWidth + 3));
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, kpiY, kpiWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, kpiY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, kpiY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, kpiY + 13.2);
  });

  // 3. Table
  const tableData = filtered.map((b) => {
    const scalePaymentText = b.scale_fee_payment === 'efectivo' ? '(Efectivo)' : '(Descuento)';
    const extraKg = b.extra_charge_per_kg ?? 0.40;
    const extraTotal = b.extra_charge_total ?? ((b.weight_net || 0) * extraKg);
    const dateFormatted = b.date ? new Date(b.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';

    return [
      b.folio || `#REC-${String(b.id).padStart(5, '0')}`,
      b.scale_ticket_folio ? `Ticket: ${b.scale_ticket_folio}` : 'Báscula #1',
      dateFormatted,
      b.producer_name || 'SIN ASIGNAR',
      `${b.orchard || 'Pedernales'}\n(${b.variety || 'Persa'})`,
      `${(b.weight_gross || 0).toLocaleString('es-MX')} kg`,
      `${(b.weight_tare || 0).toLocaleString('es-MX')} kg`,
      `${(b.weight_net || 0).toLocaleString('es-MX')} kg`,
      `$${(b.price_per_kg || 0).toFixed(2)}`,
      `$${(b.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${(b.scale_fee || 50).toFixed(2)}\n${scalePaymentText}`,
      `$${extraTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n($${extraKg.toFixed(2)}/kg)`,
      `$${(b.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: kpiY + kpiHeight + 4,
    head: [[
      'Folio Rec.',
      'Folio Báscula',
      'Fecha',
      'Productor',
      'Huerto / Variedad',
      'P. Bruto',
      'Tara',
      'P. Neto',
      'Precio/kg',
      'Subtotal Fruta',
      'Cuota Báscula',
      'Cargo Op. ($/kg)',
      'Total Liquidado'
    ]],
    body: tableData,
    foot: [[
      'TOTALES',
      `${filtered.length} boletas`,
      '',
      '',
      '',
      `${totalGross.toLocaleString('es-MX')} kg`,
      `${totalTare.toLocaleString('es-MX')} kg`,
      `${totalNet.toLocaleString('es-MX')} kg`,
      '-',
      `$${totalSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${totalScaleFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${totalExtraCharges.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${totalLiquidated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'right'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 18 },
      1: { fontStyle: 'bold', halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 16 },
      3: { fontStyle: 'bold', cellWidth: 32 },
      4: { cellWidth: 25 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 16 },
      7: { fontStyle: 'bold', halign: 'right', textColor: [6, 78, 59], cellWidth: 19 },
      8: { halign: 'right', cellWidth: 16 },
      9: { fontStyle: 'bold', halign: 'right', cellWidth: 22 },
      10: { halign: 'right', cellWidth: 20 },
      11: { halign: 'right', textColor: [159, 18, 57], cellWidth: 22 },
      12: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87], cellWidth: 24 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin, bottom: 26 }
  });

  // Footer & Signatures
  const finalY = (doc as any).lastAutoTable.finalY + 4;
  if (finalY > pageHeight - 32) {
    doc.addPage();
  }
  const currentY = finalY > pageHeight - 32 ? 14 : finalY;
  const colWidth = (pageWidth - (margin * 2) - 10) / 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, colWidth, 20, 1.5, 1.5, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('DESGLOSE DE DEDUCCIONES Y RETENCIONES', margin + 3, currentY + 4.5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Báscula descontada de liquidación: $${totalScaleFeesDeducted.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + 3, currentY + 8.5);
  doc.text(`• Báscula pagada en efectivo en caseta: $${totalScaleFeesCash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + 3, currentY + 12);
  doc.text(`• Cargos por servicios operativos ($0.40/kg): $${totalExtraCharges.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + 3, currentY + 15.5);
  doc.text(`• Total deducciones aplicadas: $${(totalScaleFeesDeducted + totalExtraCharges).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + 3, currentY + 18.5);

  const sig1X = margin + colWidth + 5;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(sig1X, currentY, colWidth, 20, 1.5, 1.5, 'FD');
  doc.setDrawColor(148, 163, 184);
  doc.line(sig1X + 8, currentY + 13, sig1X + colWidth - 8, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CARLOS BARRAGÁN M.', sig1X + (colWidth / 2), currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Gerencia de Operaciones & Báscula • JBM', sig1X + (colWidth / 2), currentY + 18.5, { align: 'center' });

  const sig2X = sig1X + colWidth + 5;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(sig2X, currentY, colWidth, 20, 1.5, 1.5, 'FD');
  doc.setDrawColor(148, 163, 184);
  doc.line(sig2X + 8, currentY + 13, sig2X + colWidth - 8, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(filters?.producerName || 'PRODUCTORES / PROVEEDORES', sig2X + (colWidth / 2), currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma de Conformidad de Pesajes y Liquidación', sig2X + (colWidth / 2), currentY + 18.5, { align: 'center' });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('JBM CÍTRICOS S.A. DE C.V. • SISTEMA DE CONTROL DE BÁSCULA CAMIONERA Y LIQUIDACIONES • WWW.JBMCITRICOS.COM', margin, pageHeight - 4);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  }

  const fileName = `JBM_Historial_Recibos_Bascula_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// ----------------------------------------------------------------------
// 4. GENERATE OFFICIAL SETTLEMENT PDF (BOLETA DE LIQUIDACIÓN A PRODUCTOR)
// ----------------------------------------------------------------------
export function generateSettlementPdf(settlement: Settlement, producer?: Producer, batchesIncluded?: Batch[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Corporate Header
  drawCorporateHeader(
    doc,
    'LIQUIDACIÓN DE FRUTA CÍTRICA',
    `Folio: ${settlement.folio}`,
    settlement.date ? settlement.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    pageWidth,
    margin
  );

  // Producer Information Box
  const pBoxY = 32;
  const pBoxH = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, pBoxY, pageWidth - (margin * 2), pBoxH, 1.5, 1.5, 'FD');

  doc.setFillColor(6, 78, 59);
  doc.rect(margin, pBoxY, 1.5, pBoxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(6, 78, 59);
  doc.text('DATOS DEL PRODUCTOR BENEFICIARIO', margin + 4, pBoxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(settlement.producer_name, margin + 4, pBoxY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`R.F.C.: ${producer?.rfc || 'RAMP720815KJ8'} • ID Productor: #${settlement.producer_id}`, margin + 4, pBoxY + 13.5);
  doc.text(`Ubicación / Huerto: ${producer?.location || producer?.default_orchard || 'Pedernales Lote 4, Martínez de la Torre, Ver.'}`, margin + 4, pBoxY + 17.5);
  doc.text(`Método de Dispersión: ${settlement.payment_method} • Estado: ${(settlement.status || 'PAGADO').toUpperCase()}`, pageWidth - margin - 70, pBoxY + 13.5);

  // Batches Table
  const mockBatches = batchesIncluded && batchesIncluded.length > 0 ? batchesIncluded : [
    {
      id: 108,
      folio: '#REC-00108',
      scale_ticket_folio: 'BAS-8849',
      date: '2026-08-24',
      origin: 'Huerto Propio',
      orchard: 'Pedernales',
      variety: 'Limón Persa',
      quality: 'Exportación 1ra',
      weight_gross: 14500,
      weight_tare: 4200,
      weight_net: settlement.total_kg > 10000 ? Math.round(settlement.total_kg * 0.55) : settlement.total_kg,
      price_per_kg: 18.50,
      subtotal: settlement.subtotal * 0.55,
      scale_fee: 50,
      total: settlement.total_paid * 0.55,
      status: 'liquidado' as const,
      operator: 'Carlos Barragán'
    },
    {
      id: 104,
      folio: '#REC-00104',
      scale_ticket_folio: 'BAS-8845',
      date: '2026-08-22',
      origin: 'Huerto Propio',
      orchard: 'Pedernales',
      variety: 'Limón Persa',
      quality: 'Exportación 1ra',
      weight_gross: 16200,
      weight_tare: 4500,
      weight_net: settlement.total_kg > 10000 ? Math.round(settlement.total_kg * 0.45) : 0,
      price_per_kg: 18.50,
      subtotal: settlement.subtotal * 0.45,
      scale_fee: 50,
      total: settlement.total_paid * 0.45,
      status: 'liquidado' as const,
      operator: 'Carlos Barragán'
    }
  ].filter(b => b.weight_net > 0);

  const tableData = mockBatches.map(b => [
    b.folio || `#REC-${b.id}`,
    b.scale_ticket_folio || 'S/F',
    b.date ? b.date.slice(0, 10) : '2026-08-24',
    b.variety || 'Limón Persa (1ra)',
    `${(b.weight_gross || 0).toLocaleString()} kg`,
    `-${(b.weight_tare || 0).toLocaleString()} kg`,
    `${(b.weight_net || 0).toLocaleString()} kg`,
    `$${(b.price_per_kg || 18.50).toFixed(2)}`,
    `$${(b.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: pBoxY + pBoxH + 4,
    head: [[
      'Folio Entrada',
      'Boleta Báscula',
      'Fecha',
      'Variedad / Calidad',
      'P. Bruto',
      'Tara',
      'P. Neto',
      'Precio/kg',
      'Subtotal'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 22 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 },
      3: { cellWidth: 36 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 18, textColor: [159, 18, 57] },
      6: { fontStyle: 'bold', halign: 'right', textColor: [6, 78, 59], cellWidth: 20 },
      7: { halign: 'right', cellWidth: 14 },
      8: { fontStyle: 'bold', halign: 'right', cellWidth: 24 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  const afterTableY = (doc as any).lastAutoTable.finalY + 4;

  // Breakdown & Totals Box
  const colW = (pageWidth - (margin * 2) - 4) / 2;
  const breakH = 32;

  // Policies Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, afterTableY, colW, breakH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CONDICIONES DE LIQUIDACIÓN Y PAGO:', margin + 3.5, afterTableY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Pago dispersado mediante ${settlement.payment_method}.`, margin + 3.5, afterTableY + 8.5);
  doc.text('• Retención de servicios operativos y maniobra $0.40/kg aplicado.', margin + 3.5, afterTableY + 12);
  doc.text('• Cuotas de báscula certificada deducidas conforme a recibos.', margin + 3.5, afterTableY + 15.5);
  doc.text('• Fruta clasificada conforme a los estándares de calidad JBM.', margin + 3.5, afterTableY + 19);

  // Totals Box
  const totalsX = margin + colW + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsX, afterTableY, colW, breakH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Kilos Netos:`, totalsX + 4, afterTableY + 5.5);
  doc.text(`${settlement.total_kg.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg`, totalsX + colW - 4, afterTableY + 5.5, { align: 'right' });

  doc.text(`Subtotal Fruta:`, totalsX + 4, afterTableY + 10);
  doc.text(`$${settlement.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + colW - 4, afterTableY + 10, { align: 'right' });

  doc.setTextColor(159, 18, 57);
  doc.text(`(-) Deducciones Maniobra:`, totalsX + 4, afterTableY + 14.5);
  doc.text(`-$${(settlement.deductions || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + colW - 4, afterTableY + 14.5, { align: 'right' });

  doc.text(`(-) Cuotas de Báscula:`, totalsX + 4, afterTableY + 19);
  doc.text(`-$${(settlement.scale_fees || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + colW - 4, afterTableY + 19, { align: 'right' });

  // Total Neto
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(totalsX + 2, afterTableY + breakH - 9, colW - 4, 7.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL NETO A PAGAR:', totalsX + 4, afterTableY + breakH - 4);
  doc.text(`$${settlement.total_paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + colW - 4, afterTableY + breakH - 4, { align: 'right' });

  // Signatures
  const sigY = afterTableY + breakH + 12;
  const sigW = (pageWidth - (margin * 2) - 8) / 2;

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, sigY + 12, margin + sigW - 10, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('CARLOS BARRAGÁN M.', margin + (sigW / 2), sigY + 15.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Gerencia de Operaciones • JBM Cítricos', margin + (sigW / 2), sigY + 18.5, { align: 'center' });

  const sig2X = margin + sigW + 8;
  doc.line(sig2X + 10, sigY + 12, sig2X + sigW - 10, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(settlement.producer_name, sig2X + (sigW / 2), sigY + 15.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma de Conformidad del Productor', sig2X + (sigW / 2), sigY + 18.5, { align: 'center' });

  // Bottom Line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('BOLETA DE LIQUIDACIÓN OFICIAL • JBM CÍTRICOS S.A. DE C.V. • WWW.JBMCITRICOS.COM', margin, pageHeight - 4);
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 4, { align: 'right' });

  const filename = `Liquidacion_${settlement.folio}_${settlement.producer_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 5. GENERATE PRODUCER ACCOUNT STATEMENT PDF (ESTADO DE CUENTA PRODUCTOR)
// ----------------------------------------------------------------------
export interface ProducerStatementOptions {
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export function generateProducerAccountStatementPdf(
  producer: Producer,
  settlements: Settlement[],
  batches: Batch[],
  options?: ProducerStatementOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const statementFolio = `EDC-${producer.id ? String(producer.id).padStart(4, '0') : '0001'}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter settlements and batches for this producer
  const pSettlements = settlements.filter(s => s.producer_id === producer.id || (s.producer_name && producer.name && s.producer_name.toLowerCase() === producer.name.toLowerCase()));
  const pBatches = batches.filter(b => b.producer_id === producer.id || (b.producer_name && producer.name && b.producer_name.toLowerCase() === producer.name.toLowerCase()));

  // Calculate totals
  const totalKgBatches = pBatches.reduce((sum, b) => sum + (b.weight_net || 0), 0);
  const totalKgSettled = pSettlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
  const totalKg = totalKgBatches > 0 ? totalKgBatches : totalKgSettled;

  const totalSubtotal = pSettlements.length > 0 
    ? pSettlements.reduce((sum, s) => sum + (s.subtotal || 0), 0)
    : pBatches.reduce((sum, b) => sum + (b.subtotal || ((b.weight_net || 0) * (b.price_per_kg || 18.50))), 0);

  const totalDeductions = pSettlements.reduce((sum, s) => sum + (s.deductions || 0), 0);
  const totalScaleFees = pSettlements.reduce((sum, s) => sum + (s.scale_fees || 0), 0);
  const totalPaid = pSettlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);
  const currentBalance = typeof producer.balance === 'number' ? producer.balance : Math.max(0, totalSubtotal - totalPaid - totalDeductions - totalScaleFees);

  // 1. Corporate Header
  drawCorporateHeader(
    doc,
    'ESTADO DE CUENTA PRODUCTOR',
    `Folio: ${statementFolio}`,
    dateStr,
    pageWidth,
    margin
  );

  // 2. Producer Info & Bank Data Card
  const infoY = 32;
  const colW = (pageWidth - (margin * 2) - 4) / 2;
  const infoH = 26;

  // Box A: Producer Data
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, infoY, colW, infoH, 1.5, 1.5, 'FD');

  doc.setFillColor(6, 78, 59); // Green left accent
  doc.rect(margin, infoY, 1.5, infoH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 78, 59);
  doc.text('DATOS DEL PRODUCTOR / PROVEEDOR', margin + 4, infoY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(producer.name, margin + 4, infoY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`R.F.C.: ${producer.rfc || 'RAMP720815KJ8'} • ID: #${producer.id}`, margin + 4, infoY + 13.5);
  doc.text(`Huerto: ${producer.location || producer.default_orchard || 'Pedernales Lote 4, Ver.'}`, margin + 4, infoY + 17.5);
  doc.text(`Teléfono: ${producer.phone || '+52 (232) 104-9821'}`, margin + 4, infoY + 21.5);
  doc.text(`Periodo: ${options?.startDate || 'Temporada 2026'} al ${options?.endDate || dateStr}`, margin + 4, infoY + 25);

  // Box B: Account & Payment Summary
  const boxBX = margin + colW + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(boxBX, infoY, colW, infoH, 1.5, 1.5, 'FD');

  doc.setFillColor(217, 119, 6); // Amber left accent
  doc.rect(boxBX, infoY, 1.5, infoH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text('RESUMEN DE CUENTA & CONDICIONES', boxBX + 4, infoY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Cortes/Liquidaciones: ${pSettlements.length} emitidas`, boxBX + 4, infoY + 9);
  doc.text(`Entregas Báscula: ${pBatches.length} boletas registradas`, boxBX + 4, infoY + 13.5);
  doc.text(`Método de Dispersión: Transferencia SPEI / Cheque`, boxBX + 4, infoY + 17.5);
  doc.text(`Tarifa de Maniobra Aplicada: $0.40 MXN / kg neto`, boxBX + 4, infoY + 21.5);
  doc.text(`Estado de Cuenta: AL CORRIENTE / CONCILIADO`, boxBX + 4, infoY + 25);

  // 3. Mini KPI Strip
  const kpiY = infoY + infoH + 3;
  const kpiW = (pageWidth - (margin * 2) - 9) / 4;
  const kpiH = 14;

  const kpis = [
    { label: 'VOLUMEN TOTAL ENTREGADO', value: `${totalKg.toLocaleString('es-MX')} kg`, sub: `${(totalKg / 1000).toFixed(2)} Toneladas`, color: [6, 78, 59] },
    { label: 'VALOR BRUTO FRUTA', value: `$${totalSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, sub: 'Subtotal acumulado', color: [30, 41, 59] },
    { label: 'TOTAL LIQUIDADO', value: `$${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, sub: `${pSettlements.length} pólizas pagadas`, color: [4, 120, 87] },
    { label: 'SALDO EN CUENTA', value: `$${currentBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, sub: currentBalance === 0 ? 'Liquidado 100%' : 'Por dispersar', color: currentBalance > 0 ? [180, 83, 9] : [100, 116, 139] }
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + (idx * (kpiW + 3));
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kX, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');

    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(kX, kpiY, kpiW, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kX + 3, kpiY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, kX + 3, kpiY + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, kX + 3, kpiY + 12);
  });

  // 4. Movement Table (Liquidaciones y Entregas)
  const tableData: (string | number)[][] = [];

  if (pSettlements.length > 0) {
    pSettlements.forEach(s => {
      const dateFmt = s.date ? s.date.slice(0, 10) : dateStr;
      const totalDeds = (s.deductions || 0) + (s.scale_fees || 0);
      tableData.push([
        s.folio,
        'LIQUIDACIÓN',
        dateFmt,
        `${(s.total_kg || 0).toLocaleString()} kg`,
        `$${((s.subtotal || 0) / (s.total_kg || 1)).toFixed(2)}`,
        `$${(s.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `-$${totalDeds.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `$${(s.total_paid || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        s.payment_method || 'SPEI',
        (s.status || 'PAGADO').toUpperCase()
      ]);
    });
  } else if (pBatches.length > 0) {
    pBatches.forEach(b => {
      const dateFmt = b.date ? b.date.slice(0, 10) : dateStr;
      const sub = b.subtotal || ((b.weight_net || 0) * (b.price_per_kg || 18.50));
      const extra = b.extra_charge_total || ((b.weight_net || 0) * 0.40);
      const total = b.total || (sub - extra - (b.scale_fee || 50));
      tableData.push([
        b.folio || `#REC-${b.id}`,
        'RECEPCIÓN BÁSCULA',
        dateFmt,
        `${(b.weight_net || 0).toLocaleString()} kg`,
        `$${(b.price_per_kg || 18.50).toFixed(2)}`,
        `$${sub.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `-$${(extra + (b.scale_fee || 50)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        'Báscula',
        (b.status || 'RECIBIDO').toUpperCase()
      ]);
    });
  } else {
    // Default single summary row if no historic data
    tableData.push([
      `LIQ-${now.getFullYear()}-001`,
      'LIQUIDACIÓN CORTE',
      dateStr,
      '15,000 kg',
      '$18.50',
      '$277,500.00',
      '-$6,050.00',
      '$271,450.00',
      'SPEI',
      'PAGADO'
    ]);
  }

  autoTable(doc, {
    startY: kpiY + kpiH + 4,
    head: [[
      'Folio',
      'Tipo Movimiento',
      'Fecha',
      'Kilos Fruta',
      'Precio/kg',
      'Subtotal Fruta',
      'Deducciones',
      'Neto Dispersado',
      'Método',
      'Estado'
    ]],
    body: tableData,
    foot: [[
      'TOTALES',
      `${tableData.length} Movimientos`,
      '',
      `${totalKg.toLocaleString()} kg`,
      '-',
      `$${totalSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `-$${(totalDeductions + totalScaleFees).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      '',
      currentBalance === 0 ? 'CONCILIADO' : 'PENDIENTE'
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [6, 78, 59], // Emerald 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'right'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 16 },
      3: { fontStyle: 'bold', halign: 'right', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 14 },
      5: { fontStyle: 'bold', halign: 'right', cellWidth: 22 },
      6: { halign: 'right', textColor: [159, 18, 57], cellWidth: 18 },
      7: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87], cellWidth: 24 },
      8: { halign: 'center', cellWidth: 14 },
      9: { halign: 'center', fontStyle: 'bold', cellWidth: 16 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  const afterTableY = (doc as any).lastAutoTable.finalY + 4;

  // 5. Legal & Banking Notice Box
  const noticeH = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, afterTableY, pageWidth - (margin * 2), noticeH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text('CONCILIACIÓN CONTABLE Y DECLARATORIA DE SALDOS:', margin + 3.5, afterTableY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text('• Este estado de cuenta refleja fielmente las recepciones de fruta en báscula camionera y las dispersiones efectuadas a su favor.', margin + 3.5, afterTableY + 8.5);
  doc.text('• Las deducciones corresponden a tarifa de maniobra ($0.40/kg) y cuotas de pesaje certificado conforme a los acuerdos comerciales vigentes.', margin + 3.5, afterTableY + 12);
  doc.text('• Para cualquier aclaración de saldos o facturación fiscal complementaria, contactar al departamento de Tesorería en un plazo no mayor a 5 días hábiles.', margin + 3.5, afterTableY + 15.5);
  if (options?.notes) {
    doc.text(`• Observaciones: ${options.notes}`, margin + 3.5, afterTableY + 19);
  } else {
    doc.text('• Pagos protegidos bajo normas fitosanitarias de comercialización de cítricos en el Estado de Veracruz.', margin + 3.5, afterTableY + 19);
  }

  // 6. Signatures
  const sigY = afterTableY + noticeH + 8;
  const sigW = (pageWidth - (margin * 2) - 8) / 2;

  // JBM Treasury
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, sigY + 12, margin + sigW - 10, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('LIC. CARLOS BARRAGÁN M.', margin + (sigW / 2), sigY + 15.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tesorería & Contabilidad • JBM Cítricos S.A. de C.V.', margin + (sigW / 2), sigY + 18.5, { align: 'center' });

  // Producer signature
  const sig2X = margin + sigW + 8;
  doc.line(sig2X + 10, sigY + 12, sig2X + sigW - 10, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(producer.name, sig2X + (sigW / 2), sigY + 15.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma y Conformidad de Saldo del Productor', sig2X + (sigW / 2), sigY + 18.5, { align: 'center' });

  // Footer Line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('ESTADO DE CUENTA OFICIAL • JBM CÍTRICOS S.A. DE C.V. • PEDERNALES, VERACRUZ • WWW.JBMCITRICOS.COM', margin, pageHeight - 4);
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 4, { align: 'right' });

  // Save PDF
  const filename = `Estado_Cuenta_${producer.name.replace(/\s+/g, '_')}_${dateStr}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 6. GENERATE GLOBAL FINANCIAL STATEMENT PDF (ESTADO DE CUENTA GLOBAL)
// ----------------------------------------------------------------------
export function generateGlobalFinancialStatementPdf(
  settlements: Settlement[],
  producers: Producer[],
  batches: Batch[],
  options?: { startDate?: string; endDate?: string }
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const folioReporte = `EGF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

  // Totals
  const totalSettlementsPaid = settlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);
  const totalSubtotal = settlements.reduce((sum, s) => sum + (s.subtotal || 0), 0);
  const totalKg = settlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
  const totalDeductions = settlements.reduce((sum, s) => sum + (s.deductions || 0), 0);
  const totalScaleFees = settlements.reduce((sum, s) => sum + (s.scale_fees || 0), 0);

  // Corporate Header
  doc.setFillColor(6, 78, 59); // Deep Emerald
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(217, 119, 6); // Amber
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  const logoX = margin;
  const logoY = 12;

  // Vector Logo
  doc.setFillColor(180, 140, 30);
  doc.ellipse(logoX + 8, logoY + 4, 3, 5, 'F');
  doc.setFillColor(210, 165, 45);
  doc.ellipse(logoX + 13, logoY + 3, 2.5, 4, 'F');
  doc.setFillColor(11, 107, 52);
  doc.ellipse(logoX + 10, logoY + 12, 10, 7, 'F');
  doc.setFillColor(74, 222, 128);
  doc.ellipse(logoX + 10, logoY + 12, 8, 5.5, 'F');

  doc.setTextColor(180, 130, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('JBM', logoX + 10, logoY + 22, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(6, 78, 59);
  doc.text('JBM CÍTRICOS S.A. DE C.V.', logoX + 24, logoY + 6);

  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text('EMPACADORA & EXPORTADORA DE CÍTRICOS • DIRECCIÓN DE FINANZAS Y TESORERÍA', logoX + 24, logoY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('R.F.C.: JBM980412H82 • Régimen General de Ley • Martínez de la Torre, Veracruz', logoX + 24, logoY + 16);
  doc.text(`Periodo Contable Auditado: ${options?.startDate || '01/01/' + now.getFullYear()} al ${options?.endDate || dateStr}`, logoX + 24, logoY + 20);

  // Meta Box (Right)
  const metaBoxX = pageWidth - margin - 80;
  const metaBoxY = 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(metaBoxX, metaBoxY, 80, 22, 1.5, 1.5, 'FD');

  doc.setFillColor(6, 78, 59);
  doc.roundedRect(metaBoxX + 1.5, metaBoxY + 1.5, 77, 5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ESTADO FINANCIERO GLOBAL JBM', metaBoxX + 40, metaBoxY + 5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Folio: ${folioReporte}`, metaBoxX + 3.5, metaBoxY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha Emisión: ${dateStr}`, metaBoxX + 3.5, metaBoxY + 15);
  doc.text(`Productores Registrados: ${producers.length} cuentas`, metaBoxX + 3.5, metaBoxY + 19);

  // KPI Strip
  const kpiY = 36;
  const kpiWidth = (pageWidth - (margin * 2) - 12) / 5;
  const kpiHeight = 15;

  const kpis = [
    { label: 'VOLUMEN TOTAL FRUTA', value: `${totalKg.toLocaleString('es-MX')} kg`, sub: `${(totalKg / 1000).toFixed(2)} Toneladas`, color: [6, 78, 59] },
    { label: 'VALOR BRUTO FRUTA', value: `$${totalSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, sub: 'Subtotal adquirido', color: [30, 41, 59] },
    { label: 'RETENCIÓN MANIOBRA ($0.40/kg)', value: `$${totalDeductions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, sub: 'Fondo de cuadrilla y tolva', color: [190, 24, 93] },
    { label: 'CUOTAS DE BÁSCULA', value: `$${totalScaleFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, sub: 'Pesaje camionero', color: [180, 83, 9] },
    { label: 'TOTAL NETO DISPERSADO', value: `$${totalSettlementsPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, sub: `${settlements.length} liquidaciones`, color: [4, 120, 87] }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + (idx * (kpiWidth + 3));
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, kpiY, kpiWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, kpiY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, kpiY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, kpiY + 13.2);
  });

  // Table of Producers Breakdown
  const tableData = producers.map((p, idx) => {
    const pSettlements = settlements.filter(s => s.producer_id === p.id);
    const pKg = pSettlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
    const pSub = pSettlements.reduce((sum, s) => sum + (s.subtotal || 0), 0);
    const pDeds = pSettlements.reduce((sum, s) => sum + ((s.deductions || 0) + (s.scale_fees || 0)), 0);
    const pPaid = pSettlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);

    return [
      `#${p.id || idx + 1}`,
      p.name,
      p.rfc || 'RAMP720815KJ8',
      p.location || p.default_orchard || 'Pedernales, Ver.',
      `${pSettlements.length}`,
      `${pKg.toLocaleString()} kg`,
      `$${pSub.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `-$${pDeds.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${pPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${(p.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: kpiY + kpiHeight + 4,
    head: [[
      'ID',
      'Nombre del Productor / Proveedor',
      'RFC',
      'Ubicación / Huerto',
      'Cortes',
      'Volumen Entregado',
      'Subtotal Fruta',
      'Deducciones',
      'Total Liquidado',
      'Saldo Actual'
    ]],
    body: tableData,
    foot: [[
      'TOTALES',
      `${producers.length} Productores`,
      '',
      '',
      `${settlements.length}`,
      `${totalKg.toLocaleString()} kg`,
      `$${totalSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `-$${(totalDeductions + totalScaleFees).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${totalSettlementsPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${producers.reduce((s, p) => s + (p.balance || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'right'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 12 },
      1: { fontStyle: 'bold', cellWidth: 42 },
      2: { halign: 'center', cellWidth: 24 },
      3: { cellWidth: 32 },
      4: { halign: 'center', cellWidth: 14 },
      5: { fontStyle: 'bold', halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 26 },
      7: { halign: 'right', textColor: [159, 18, 57], cellWidth: 24 },
      8: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87], cellWidth: 28 },
      9: { fontStyle: 'bold', halign: 'right', cellWidth: 24 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin, bottom: 20 }
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('JBM CÍTRICOS S.A. DE C.V. • BALANCE FINANCIERO Y LIQUIDACIONES DE FRUTA • WWW.JBMCITRICOS.COM', margin, pageHeight - 4);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  }

  const filename = `Estado_Financiero_Global_JBM_${dateStr}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 7. GENERATE SETTLEMENT INVOICE PDF (FACTURA DE COMPRA/LIQUIDACIÓN A PRODUCTOR)
// ----------------------------------------------------------------------
export function generateSettlementInvoicePdf(
  settlement: Settlement,
  producer?: Producer,
  batches?: Batch[],
  customData?: Partial<InvoiceData>
) {
  const dateStr = settlement.date ? settlement.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const prodName = producer?.name || settlement.producer_name || 'Productor Citrícola';
  const prodRfc = producer?.rfc || 'XAXX010101000';
  const kg = settlement.total_kg || 15000;
  const priceKg = settlement.subtotal && settlement.total_kg ? (settlement.subtotal / settlement.total_kg) : 18.50;
  const subtotal = settlement.subtotal || (kg * priceKg);
  const deductions = (settlement.deductions || 0) + (settlement.scale_fees || 0);
  const total = settlement.total_paid || (subtotal - deductions);

  const invoiceData: InvoiceData = {
    folio: customData?.folio || `FAC-${settlement.folio.replace(/[^0-9]/g, '') || '00984'}`,
    uuid: customData?.uuid || `4C81A810-75E2-41D1-A19F-${String(settlement.id || 100).padStart(12, '0')}`,
    date: dateStr,
    dueDate: dateStr,
    currency: 'MXN',
    paymentMethod: 'PUE (Pago en una sola exhibición)',
    paymentForm: settlement.payment_method === 'Efectivo' 
      ? '01 - Efectivo' 
      : (settlement.payment_method === 'Cheque' ? '02 - Cheque nominativo' : '03 - Transferencia electrónica de fondos'),
    cfdiUse: 'G01 - Adquisición de mercancías',
    customer: {
      name: prodName,
      rfc: prodRfc,
      taxRegime: '621 - Incorporación Fiscal / 601 General',
      address: producer?.location || 'Martínez de la Torre, Veracruz, C.P. 93600',
      email: producer?.email || 'contacto@jbmcitricos.com',
      phone: producer?.phone || '+52 232 324 8890'
    },
    items: [
      {
        satCode: '50101518',
        description: 'Limón Persa Fresco (Citrus latifolia) - Recepción de Cítricos en Tolva',
        quantity: kg,
        unit: 'KGM - Kilogramo',
        unitPrice: priceKg,
        discount: 0,
        taxRate: 0, // 0% Tasa Agrícola
        amount: subtotal
      },
      ...(deductions > 0 ? [
        {
          satCode: '78101800',
          description: 'Descuento / Retención por Servicios de Maniobra, Tolva y Pesaje en Báscula Camionera',
          quantity: 1,
          unit: 'E48 - Unidad de servicio',
          unitPrice: -deductions,
          discount: 0,
          taxRate: 0,
          amount: -deductions
        }
      ] : [])
    ],
    subtotal: subtotal,
    discountTotal: deductions > 0 ? deductions : 0,
    taxTotal: 0,
    retentionTotal: deductions,
    total: total,
    totalInWords: numberToSpanishCurrency(total, 'MXN'),
    notes: `Liquidación respaldada por Folio ${settlement.folio}. Recepción y pesaje certificado en báscula de 80 Toneladas. Certificación SENASICA MEX-VER-CIT-2024.`,
    ...customData
  };

  generateInvoicePdf(invoiceData);
}

// ----------------------------------------------------------------------
// 8. GENERATE SALES REPORT PDF (REPORTE EJECUTIVO DE VENTAS Y FACTURACIÓN)
// ----------------------------------------------------------------------
export function generateSalesReportPdf(report: SalesReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const dateStr = report.generatedDate || new Date().toISOString().slice(0, 10);
  const folioStr = `REP-VTA-${dateStr.replace(/-/g, '')}`;

  // Official JBM Corporate Header
  drawCorporateHeader(
    doc,
    'REPORTE EJECUTIVO DE VENTAS',
    folioStr,
    dateStr,
    pageWidth,
    margin
  );

  let currentY = 32;

  // Filter and Period Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('PERÍODO ANALIZADO:', margin + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(report.periodLabel || `${report.startDate} al ${report.endDate}`, margin + 36, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('GENERADO POR:', margin + 110, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(report.generatedBy || 'Departamento de Finanzas & Ventas JBM', margin + 134, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Reporte consolidado de operaciones comerciales, ventas en mostrador, mayoristas y distribución nacional de cítricos.', margin + 3.5, currentY + 9.5);

  currentY += 16;

  // Executive KPI summary cards (4 Columns)
  const kpiWidth = (pageWidth - (margin * 2) - 9) / 4;
  const kpiHeight = 16;

  const kpis = [
    {
      title: 'FACTURACIÓN TOTAL',
      value: `$${(report.summary.totalRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${(report.summary.totalTransactions || 0)} notas emitidas`,
      bg: [236, 253, 245], // emerald-50
      border: [16, 185, 129], // emerald-500
      valColor: [4, 120, 87]
    },
    {
      title: 'VOLUMEN VENDIDO (KG)',
      value: `${(report.summary.totalKg || 0).toLocaleString('es-MX')} kg`,
      subtitle: `${((report.summary.totalKg || 0) / 1000).toFixed(2)} Toneladas`,
      bg: [239, 246, 255], // blue-50
      border: [59, 130, 246], // blue-500
      valColor: [29, 78, 216]
    },
    {
      title: 'TOTAL CAJAS DESPACHADAS',
      value: `${(report.summary.totalBoxes || 0).toLocaleString('es-MX')} cjs`,
      subtitle: 'Exportación y Nacional',
      bg: [254, 243, 199], // amber-50
      border: [245, 158, 11], // amber-500
      valColor: [180, 83, 9]
    },
    {
      title: 'TICKET PROMEDIO',
      value: `$${(report.summary.avgTicket || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Desc: $${(report.summary.totalDiscounts || 0).toLocaleString('es-MX')}`,
      bg: [245, 243, 255], // purple-50
      border: [139, 92, 246], // purple-500
      valColor: [109, 40, 217]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + (idx * (kpiWidth + 3));
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(kX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.title, kX + 2.5, currentY + 4.2);

    doc.setFontSize(8.5);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.value, kX + 2.5, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtitle, kX + 2.5, currentY + 13.5);
  });

  currentY += kpiHeight + 5;

  // Section 1: Desglose por Forma de Pago & Canales
  if (report.paymentMethods && report.paymentMethods.length > 0) {
    const pmTableData = report.paymentMethods.map(pm => [
      pm.method,
      `${pm.count} transacciones`,
      `${pm.percentage.toFixed(1)}%`,
      `$${pm.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [[
        'Método / Canal de Cobro',
        'Operaciones',
        'Participación (%)',
        'Monto Total Cobrado'
      ]],
      body: pmTableData,
      theme: 'grid',
      styles: {
        fontSize: 6.8,
        cellPadding: 1.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [6, 78, 59], // Emerald 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 35 },
        3: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87] }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Section 2: Resumen de Ventas Diarias / Calendario
  if (report.dailySales && report.dailySales.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('DESGLOSE DIARIO DE VENTAS Y VOLUMEN', margin, currentY + 3.5);

    const dailyRows = report.dailySales.map(d => [
      d.date,
      d.label || d.date,
      d.dayOfWeek || '',
      `${(d.totalKg || 0).toLocaleString()} kg`,
      `${(d.totalBoxes || 0).toLocaleString()} cjs`,
      `${d.transactionsCount || 0}`,
      `$${(d.avgTicket || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${(d.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    const totalKgSum = report.dailySales.reduce((acc, d) => acc + (d.totalKg || 0), 0);
    const totalBoxesSum = report.dailySales.reduce((acc, d) => acc + (d.totalBoxes || 0), 0);
    const totalTransSum = report.dailySales.reduce((acc, d) => acc + (d.transactionsCount || 0), 0);
    const totalAmountSum = report.dailySales.reduce((acc, d) => acc + (d.totalAmount || 0), 0);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Fecha',
        'Etiqueta',
        'Día',
        'Kilos (Kg)',
        'Cajas',
        'Tickets',
        'Ticket Prom.',
        'Total Ingreso'
      ]],
      body: dailyRows,
      foot: [[
        'TOTALES',
        `${report.dailySales.length} días`,
        '',
        `${totalKgSum.toLocaleString()} kg`,
        `${totalBoxesSum.toLocaleString()} cjs`,
        `${totalTransSum}`,
        `$${(totalAmountSum / (totalTransSum || 1)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `$${totalAmountSum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
      ]],
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'right'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 24 },
        1: { cellWidth: 22 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'right', cellWidth: 24 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 28 },
        7: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87], cellWidth: 32 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Section 3: Top Productos / Presentaciones Más Vendidas
  if (report.topProducts && report.topProducts.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('PRESENTACIONES Y PRODUCTOS CON MAYOR DEMANDA', margin, currentY + 3.5);

    const prodRows = report.topProducts.map(p => [
      p.name,
      p.calibre || '-',
      p.itemType === 'caja' ? 'Caja Empacada' : 'Granel / Kilo',
      p.boxesSold > 0 ? `${p.boxesSold.toLocaleString()} cjs` : '-',
      `${(p.kgSold || 0).toLocaleString()} kg`,
      `${(p.volumePercent || p.share || 0).toFixed(1)}%`,
      `$${(p.revenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Descripción del Producto / Presentación',
        'Calibre',
        'Tipo',
        'Cajas',
        'Kilos Totales',
        'Participación',
        'Ingresos Generados'
      ]],
      body: prodRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [180, 83, 9], // Amber 700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 56 },
        1: { halign: 'center', cellWidth: 18 },
        2: { cellWidth: 24 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'center', cellWidth: 20 },
        6: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87] }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Section 4: Individual Sales Log (if provided and small)
  if (report.salesList && report.salesList.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('ÚLTIMAS NOTAS DE VENTA EMITIDAS', margin, currentY + 3.5);

    const saleRows = report.salesList.slice(0, 15).map(s => [
      s.folio,
      (s.date || '').slice(0, 16).replace('T', ' '),
      s.customer_name || 'Venta Mostrador',
      s.payment_method || 'Efectivo',
      s.status === 'cancelada' ? 'CANCELADA' : 'COMPLETADA',
      `$${(s.discount_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${(s.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Folio Nota',
        'Fecha / Hora',
        'Cliente / Destino',
        'Método Pago',
        'Estado',
        'Descuento',
        'Importe Total'
      ]],
      body: saleRows,
      theme: 'grid',
      styles: {
        fontSize: 6.2,
        cellPadding: 1.3,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.5
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 32 },
        2: { cellWidth: 42 },
        3: { cellWidth: 24 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 20 },
        6: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87] }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Legal & Authorization Signature Block
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  const sigWidth = 55;
  const sigY = pageHeight - 25;

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 15, sigY, margin + 15 + sigWidth, sigY);
  doc.line(pageWidth - margin - 15 - sigWidth, sigY, pageWidth - margin - 15, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text('C.P. GERENCIA COMERCIAL', margin + 15 + (sigWidth / 2), sigY + 3.5, { align: 'center' });
  doc.text('DIRECCIÓN GENERAL / FINANZAS', pageWidth - margin - 15 - (sigWidth / 2), sigY + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Emisión y validación de ventas', margin + 15 + (sigWidth / 2), sigY + 6.5, { align: 'center' });
  doc.text('JBM Cítricos S.A. de C.V.', pageWidth - margin - 15 - (sigWidth / 2), sigY + 6.5, { align: 'center' });

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text('JBM CÍTRICOS S.A. DE C.V. • REPORTE OFICIAL DE VENTAS Y FACTURACIÓN • WWW.JBMCITRICOS.COM', margin, pageHeight - 3.8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 3.8, { align: 'right' });
  }

  const filename = `Reporte_Ventas_JBM_${dateStr}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 9. GENERATE MONTHLY BALANCE PDF (BALANCE GENERAL Y ESTADO DE RESULTADOS)
// ----------------------------------------------------------------------
export function generateMonthlyBalancePdf(balance: MonthlyBalanceData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const dateStr = balance.generatedDate || new Date().toISOString().slice(0, 10);
  const folioStr = balance.folio || `BAL-MEN-${balance.year}-${String(balance.monthName).toUpperCase()}`;

  // Official Corporate Header
  drawCorporateHeader(
    doc,
    'ESTADO DE RESULTADOS Y BALANCE',
    folioStr,
    dateStr,
    pageWidth,
    margin
  );

  let currentY = 32;

  // Period Banner Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('EJERCICIO CONTABLE:', margin + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(balance.periodLabel || `${balance.monthName} ${balance.year}`, margin + 38, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('EMISIÓN:', margin + 110, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`${dateStr} • Auditoría Interna JBM`, margin + 125, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Conciliación integral de ventas comerciales, liquidación de fruta a productores, cobro de báscula y gastos operativos.', margin + 3.5, currentY + 9.5);

  currentY += 16;

  // Top Financial Executive KPIs (5 Cards)
  const kpiCount = 5;
  const kpiWidth = (pageWidth - (margin * 2) - ((kpiCount - 1) * 2.5)) / kpiCount;
  const kpiHeight = 16;

  const kpis = [
    {
      title: 'INGRESOS TOTALES',
      value: `$${(balance.totalIncome || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Ventas + Báscula',
      bg: [236, 253, 245],
      border: [16, 185, 129],
      valColor: [4, 120, 87]
    },
    {
      title: 'COSTO MATERIA PRIMA',
      value: `$${(balance.fruitAcquisitionCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${(balance.totalFruitKgPurchased || 0).toLocaleString()} kg recibidos`,
      bg: [254, 242, 242],
      border: [239, 68, 68],
      valColor: [185, 28, 28]
    },
    {
      title: 'UTILIDAD BRUTA',
      value: `$${(balance.totalGrossProfit || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Margen: ${(balance.grossMarginPercent || 0).toFixed(1)}%`,
      bg: [239, 246, 255],
      border: [59, 130, 246],
      valColor: [29, 78, 216]
    },
    {
      title: 'GASTOS OPERATIVOS',
      value: `$${(balance.totalOperatingExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Maniobra + Fletes + Insumos',
      bg: [254, 243, 199],
      border: [245, 158, 11],
      valColor: [180, 83, 9]
    },
    {
      title: 'UTILIDAD NETA',
      value: `$${(balance.netOperatingIncome || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Margen Neto: ${(balance.netMarginPercent || 0).toFixed(1)}%`,
      bg: [245, 243, 255],
      border: [139, 92, 246],
      valColor: [109, 40, 217]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + (idx * (kpiWidth + 2.5));
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(kX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.title, kX + 2, currentY + 4.2);

    doc.setFontSize(7.8);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.value, kX + 2, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtitle, kX + 2, currentY + 13.5);
  });

  currentY += kpiHeight + 5;

  // Table 1: Estado de Resultados Integral (P&L Condensado)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('ESTADO DE RESULTADOS INTEGRAL (P&L CONDENSADO)', margin, currentY + 3.5);

  const pnlRows = [
    ['(+) Ventas de Fruta y Distribución (Mostrador, CEDA, Exportación)', `$${(balance.citrusSalesRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, '100.0%'],
    ['(+) Cobro de Servicios de Báscula y Pesaje a Terceros', `$${(balance.scaleServicesRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `${((balance.scaleServicesRevenue / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(+) Subproductos / Mermas y Fruta de Proceso Molino', `$${(balance.subproductsRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `${((balance.subproductsRevenue / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(=) TOTAL INGRESOS OPERACIONALES BRUTOS', `$${(balance.totalIncome || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, '100.0%'],
    ['(-) Costo de Adquisición de Fruta (Liquidaciones a Productores)', `-$${(balance.fruitAcquisitionCost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `-${(((balance.fruitAcquisitionCost || 0) / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(=) UTILIDAD BRUTA OPERATIVA', `$${(balance.totalGrossProfit || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `${(balance.grossMarginPercent || 0).toFixed(1)}%`],
    ['(-) Gastos de Maniobra de Descarga y Tolva ($0.40/kg)', `-$${(balance.maneuverAndTolvaExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `-${(((balance.maneuverAndTolvaExpenses || 0) / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(-) Combustible, Fletes y Transporte Local', `-$${(balance.localAndFreightExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `-${(((balance.localAndFreightExpenses || 0) / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(-) Insumos de Empaque (Cajas, Cintas, Tarimas HT, Esquineros)', `-$${(balance.suppliesAndPackagingExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `-${(((balance.suppliesAndPackagingExpenses || 0) / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(-) Mantenimiento, Energía Cámaras Frías y Servicios', `-$${(balance.maintenanceAndUtilitiesExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `-${(((balance.maintenanceAndUtilitiesExpenses || 0) / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(-) Nómina Operativa y Alimentos de Turno', `-$${(balance.payrollAndStaffExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `-${(((balance.payrollAndStaffExpenses || 0) / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(-) Otros Gastos Menores de Operación', `-$${(balance.otherExpenses || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `-${(((balance.otherExpenses || 0) / (balance.totalIncome || 1)) * 100).toFixed(1)}%`],
    ['(=) UTILIDAD NETA DEL PERÍODO (EBITDA ESTIMADO)', `$${(balance.netOperatingIncome || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, `${(balance.netMarginPercent || 0).toFixed(1)}%`]
  ];

  autoTable(doc, {
    startY: currentY + 5,
    head: [[
      'Rubro / Concepto Contable',
      'Monto en Pesos (MXN)',
      '% s/ Ingresos'
    ]],
    body: pnlRows,
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.4,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [6, 78, 59], // Emerald 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: 'right', cellWidth: 42, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26 }
    },
    didParseCell: (data) => {
      // Highlight total and subtotal rows
      const rowText = String(data.row.raw?.[0] || '');
      if (rowText.startsWith('(=)')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        if (rowText.includes('UTILIDAD NETA')) {
          data.cell.styles.textColor = [4, 120, 87];
          data.cell.styles.fillColor = [236, 253, 245];
        }
      }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Table 2: Conciliación de Cuentas de Balance (Working Capital)
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('CONCILIACIÓN DE ACTIVOS, INVENTARIOS Y PASIVOS CON PRODUCTORES', margin, currentY + 3.5);

  const balanceSheetRows = [
    ['Efectivo en Caja y Bancos (Disponibilidad Operativa)', `$${(balance.cashInHandAndBank || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Activo Circulante Disponible'],
    ['Valoración de Inventario en Cámara Fría y Bodega CDMX', `$${(balance.inventoryValuation || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Existencias de Fruta Valuada a Costo Base'],
    ['Saldo Pendiente de Liquidación a Productores (Cuentas por Pagar)', `$${(balance.producersPayablesBalance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Pasivo Corto Plazo con Productores'],
    ['Número de Lotes / Boletas Procesadas en el Mes', `${balance.batchesCount || 0} boletas`, 'Entregas en Báscula Pedernales'],
    ['Productores Activos con Entregas de Fruta', `${balance.producersCount || 0} productores`, 'Padrón de Productores Citrícolas']
  ];

  autoTable(doc, {
    startY: currentY + 5,
    head: [[
      'Cuenta de Balance / Indicador Operativo',
      'Saldo al Cierre (MXN)',
      'Detalle y Clasificación'
    ]],
    body: balanceSheetRows,
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.4,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { halign: 'right', cellWidth: 42, fontStyle: 'bold', textColor: [4, 120, 87] },
      2: { cellWidth: 56, textColor: [100, 116, 139] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Signatures and Auditor seal
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  const sigWidth = 55;
  const sigY = pageHeight - 25;

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 15, sigY, margin + 15 + sigWidth, sigY);
  doc.line(pageWidth - margin - 15 - sigWidth, sigY, pageWidth - margin - 15, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text('C.P. AUDITORÍA CONTABLE', margin + 15 + (sigWidth / 2), sigY + 3.5, { align: 'center' });
  doc.text('DIRECCIÓN GENERAL / FINANZAS', pageWidth - margin - 15 - (sigWidth / 2), sigY + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Revisión y conciliación fiscal', margin + 15 + (sigWidth / 2), sigY + 6.5, { align: 'center' });
  doc.text('JBM Cítricos S.A. de C.V.', pageWidth - margin - 15 - (sigWidth / 2), sigY + 6.5, { align: 'center' });

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text('JBM CÍTRICOS S.A. DE C.V. • ESTADO DE RESULTADOS Y BALANCE GENERAL • WWW.JBMCITRICOS.COM', margin, pageHeight - 3.8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 3.8, { align: 'right' });
  }

  const filename = `Balance_Mensual_JBM_${dateStr}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 10. GENERATE MONTHLY SALES REPORT PDF (REPORTE MENSUAL DE VENTAS)
// ----------------------------------------------------------------------
export function generateMonthlySalesReportPdf(report: MonthlySalesReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const dateStr = report.generatedDate ? report.generatedDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const folioStr = report.period ? `REP-VTA-${report.period.toUpperCase()}-${dateStr.replace(/-/g, '')}` : `REP-VTA-MEN-${dateStr.replace(/-/g, '')}`;

  // Official JBM Corporate Header with Logo
  drawCorporateHeader(
    doc,
    'REPORTE MENSUAL DE VENTAS',
    folioStr,
    dateStr,
    pageWidth,
    margin
  );

  let currentY = 32;

  // Filter and Period Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 13, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('PERÍODO ANALIZADO:', margin + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(report.periodLabel || `${report.startDate || ''} al ${report.endDate || dateStr}`, margin + 36, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('GENERADO POR:', margin + 110, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(report.generatedBy || 'Departamento de Finanzas & Comercial JBM', margin + 134, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Consolidado oficial de ventas comerciales, desplazamiento por canal de distribución, dispersión de cobranza y volumen despachado.', margin + 3.5, currentY + 9.5);

  currentY += 16;

  // Executive KPI summary cards (4 Columns)
  const kpiWidth = (pageWidth - (margin * 2) - 9) / 4;
  const kpiHeight = 16;

  const totalRev = report.totalRevenue || report.summary?.totalRevenue || 0;
  const totalKg = report.totalKgSold || report.summary?.totalKg || 0;
  const totalBoxes = report.totalBoxesSold || report.summary?.totalBoxes || 0;
  const totalTickets = report.totalTickets || report.summary?.totalTransactions || 0;
  const avgTicket = report.avgTicketValue || (totalTickets > 0 ? totalRev / totalTickets : 0);
  const totalDiscounts = report.totalDiscounts || report.summary?.totalDiscounts || 0;

  const kpis = [
    {
      title: 'FACTURACIÓN MENSUAL',
      value: `$${totalRev.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${totalTickets.toLocaleString()} transacciones emitidas`,
      bg: [236, 253, 245], // emerald-50
      border: [16, 185, 129], // emerald-500
      valColor: [4, 120, 87]
    },
    {
      title: 'VOLUMEN DESPLAZADO',
      value: `${totalKg.toLocaleString('es-MX')} kg`,
      subtitle: `${(totalKg / 1000).toFixed(2)} Toneladas de fruta`,
      bg: [239, 246, 255], // blue-50
      border: [59, 130, 246], // blue-500
      valColor: [29, 78, 216]
    },
    {
      title: 'CAJAS DESPACHADAS',
      value: `${totalBoxes.toLocaleString('es-MX')} cjs`,
      subtitle: 'Exportación y Mercado Nacional',
      bg: [254, 243, 199], // amber-50
      border: [245, 158, 11], // amber-500
      valColor: [180, 83, 9]
    },
    {
      title: 'TICKET PROMEDIO',
      value: `$${avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Descuentos: $${totalDiscounts.toLocaleString('es-MX')}`,
      bg: [245, 243, 255], // purple-50
      border: [139, 92, 246], // purple-500
      valColor: [109, 40, 217]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + (idx * (kpiWidth + 3));
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(kX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.title, kX + 2.5, currentY + 4.2);

    doc.setFontSize(8.2);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.value, kX + 2.5, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtitle, kX + 2.5, currentY + 13.5);
  });

  currentY += kpiHeight + 5;

  // Table 1: Top Calibres & Presentaciones
  if (report.topProducts && report.topProducts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('DESGLOSE DE VENTAS POR CALIBRE Y PRESENTACIÓN', margin, currentY + 3.5);

    const productRows = report.topProducts.map(p => [
      p.name,
      p.calibre || '-',
      p.boxesSold ? `${p.boxesSold.toLocaleString()} cjs` : '-',
      `${(p.kgSold || 0).toLocaleString('es-MX')} kg`,
      `${(p.volumePercent || 0).toFixed(1)}%`,
      `$${(p.revenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Presentación / Calibre',
        'Calibre',
        'Cajas Vendidas',
        'Kilos Netos',
        '% Vol.',
        'Facturación Total (MXN)'
      ]],
      body: productRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [6, 78, 59], // Emerald 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 26 },
        3: { halign: 'right', cellWidth: 26 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [4, 120, 87] }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Table 2: Desglose por Canal de Clientes & Métodos de Pago
  if (report.customerTypes && report.customerTypes.length > 0) {
    if (currentY > pageHeight - 75) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('PARTICIPACIÓN POR CANAL DE DISTRIBUCIÓN Y CLIENTES', margin, currentY + 3.5);

    const channelRows = report.customerTypes.map(c => [
      c.label || c.type,
      `${c.count || 0} compras`,
      c.boxes ? `${c.boxes.toLocaleString()} cjs` : '-',
      `${(c.kg || 0).toLocaleString('es-MX')} kg`,
      `${(c.percentage || 0).toFixed(1)}%`,
      `$${(c.revenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Segmento / Canal de Clientes',
        'Transacciones',
        'Cajas',
        'Volumen (Kg)',
        'Participación',
        'Monto Facturado (MXN)'
      ]],
      body: channelRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 65 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 26 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [29, 78, 216] }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Table 3: Métodos de Pago y Cobranza
  if (report.paymentMethods && report.paymentMethods.length > 0) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('CONCILIACIÓN POR FORMA DE COBRO Y TESORERÍA', margin, currentY + 3.5);

    const pmRows = report.paymentMethods.map(pm => [
      pm.method,
      `${pm.count} operaciones`,
      `${(pm.percentage || 0).toFixed(1)}%`,
      `$${(pm.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Método / Vía de Pago',
        'Número de Movimientos',
        'Porcentaje Cobrado',
        'Total Ingresado (MXN)'
      ]],
      body: pmRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [180, 83, 9], // Amber 700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 75 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 47, fontStyle: 'bold', textColor: [4, 120, 87] }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Signatures
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  const sigWidth = 55;
  const sigY = pageHeight - 24;

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 15, sigY, margin + 15 + sigWidth, sigY);
  doc.line(pageWidth - margin - 15 - sigWidth, sigY, pageWidth - margin - 15, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text('GERENCIA COMERCIAL & VENTAS', margin + 15 + (sigWidth / 2), sigY + 3.5, { align: 'center' });
  doc.text('DIRECCIÓN GENERAL / FINANZAS', pageWidth - margin - 15 - (sigWidth / 2), sigY + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Validación comercial y auditoría de ingresos', margin + 15 + (sigWidth / 2), sigY + 6.5, { align: 'center' });
  doc.text('JBM Cítricos S.A. de C.V.', pageWidth - margin - 15 - (sigWidth / 2), sigY + 6.5, { align: 'center' });

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text('JBM CÍTRICOS S.A. DE C.V. • REPORTE MENSUAL DE VENTAS • WWW.JBMCITRICOS.COM', margin, pageHeight - 3.8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 3.8, { align: 'right' });
  }

  const filename = `Reporte_Mensual_Ventas_JBM_${dateStr}.pdf`;
  doc.save(filename);
}

// ----------------------------------------------------------------------
// 11. GENERATE MONTHLY PRODUCTION REPORT PDF (REPORTE MENSUAL DE PRODUCCIÓN Y EMPAQUE)
// ----------------------------------------------------------------------
export function generateMonthlyProductionReportPdf(report: MonthlyProductionReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const dateStr = report.generatedDate ? report.generatedDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const folioStr = report.folio || `REP-PROD-${report.year}-${String(report.monthName).toUpperCase()}`;

  // Official JBM Corporate Header with Logo
  drawCorporateHeader(
    doc,
    'REPORTE MENSUAL DE PRODUCCIÓN',
    folioStr,
    dateStr,
    pageWidth,
    margin
  );

  let currentY = 32;

  // Header & Facility Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 13, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('PERÍODO DE PRODUCCIÓN:', margin + 3.5, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(report.periodLabel || `${report.monthName} ${report.year}`, margin + 42, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INSTALACIÓN / PLANTA:', margin + 110, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(report.plantName || 'Planta Empaque Pedernales, Ver.', margin + 143, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Informe técnico de proceso, clasificación por calibre/color, rendimiento de selección empaque, mermas y auditoría de insumos. Responsable: ${report.generatedBy || 'Carlos Barragán'}.`, margin + 3.5, currentY + 9.5);

  currentY += 16;

  // Executive KPI summary cards (4 Columns)
  const kpiWidth = (pageWidth - (margin * 2) - 9) / 4;
  const kpiHeight = 16;

  const kpis = [
    {
      title: 'FRUTA PROCESADA (KG)',
      value: `${(report.totalProcessedKg || 0).toLocaleString('es-MX')} kg`,
      subtitle: `${((report.totalProcessedKg || 0) / 1000).toFixed(2)} Toneladas corridas`,
      bg: [236, 253, 245], // emerald-50
      border: [16, 185, 129], // emerald-500
      valColor: [4, 120, 87]
    },
    {
      title: 'TOTAL CAJAS EMPACADAS',
      value: `${(report.totalBoxesPacked || 0).toLocaleString('es-MX')} cjs`,
      subtitle: `${Math.round((report.totalBoxesPacked || 0) / 54)} Tarimas / Pallets HT`,
      bg: [239, 246, 255], // blue-50
      border: [59, 130, 246], // blue-500
      valColor: [29, 78, 216]
    },
    {
      title: 'RENDIMIENTO / YIELD',
      value: `${(report.efficiencyYieldPercent || 94.5).toFixed(1)}%`,
      subtitle: 'Aprovechamiento 1ra y 2da',
      bg: [254, 243, 199], // amber-50
      border: [245, 158, 11], // amber-500
      valColor: [180, 83, 9]
    },
    {
      title: 'MERMA & MOLINO',
      value: `${(report.totalDiscardKg || 0).toLocaleString('es-MX')} kg`,
      subtitle: `Impacto: ${(report.discardPercent || 5.5).toFixed(1)}% del volumen`,
      bg: [255, 241, 242], // rose-50
      border: [244, 63, 94], // rose-500
      valColor: [190, 18, 60]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kX = margin + (idx * (kpiWidth + 3));
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(kX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.title, kX + 2.5, currentY + 4.2);

    doc.setFontSize(8.2);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.value, kX + 2.5, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtitle, kX + 2.5, currentY + 13.5);
  });

  currentY += kpiHeight + 5;

  // Table 1: Clasificación de Producción por Calibre, Color y Presentación
  if (report.calibreBreakdown && report.calibreBreakdown.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('CLASIFICACIÓN DE PRODUCCIÓN POR CALIBRE, COLOR Y CALIDAD', margin, currentY + 3.5);

    const calibreRows = report.calibreBreakdown.map(c => [
      c.calibre,
      c.color === 'verde' ? 'Verde (Exportación)' : c.color === 'alimonado' ? 'Alimonado (Nacional)' : 'Amarillo (Molino / Ind.)',
      c.quality === 'primera' ? '1ra Calidad Selecta' : c.quality === 'segunda' ? '2da Calidad Estándar' : 'Industria / Molino',
      c.presentation,
      c.boxesCount ? `${c.boxesCount.toLocaleString()} cjs` : '-',
      `${(c.weightKg || 0).toLocaleString('es-MX')} kg`,
      `${(c.percentage || 0).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Calibre',
        'Color / Selección',
        'Calidad',
        'Presentación / Empaque',
        'Cajas',
        'Kilos Netos',
        '% Rendimiento'
      ]],
      body: calibreRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [6, 78, 59], // Emerald 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20 },
        1: { cellWidth: 36 },
        2: { cellWidth: 32 },
        3: { cellWidth: 44 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
        6: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [4, 120, 87] }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Table 2: Distribución por Destino Operativo
  if (report.destinationBreakdown && report.destinationBreakdown.length > 0) {
    if (currentY > pageHeight - 75) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('DISTRIBUCIÓN Y UBICACIÓN OPERATIVA DE FRUTA EMPACADA', margin, currentY + 3.5);

    const destRows = report.destinationBreakdown.map(d => [
      d.label || d.destination,
      d.boxesCount ? `${d.boxesCount.toLocaleString()} cjs` : '-',
      `${(d.weightKg || 0).toLocaleString('es-MX')} kg`,
      `${(d.percentage || 0).toFixed(1)}%`,
      d.destination === 'camara_fria' ? 'Temperatura 4.0°C - Conservación' : 
      d.destination === 'piso_empaque' ? 'Estiba en Tarimas para Carga Inmediata' :
      d.destination === 'transporte_directo' ? 'Carga Directa a Caja Refrigerada' : 'Extracción Industrial de Jugo'
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Destino / Área de Planta',
        'Cajas',
        'Volumen (Kg)',
        'Participación',
        'Estatus / Control Térmico'
      ]],
      body: destRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 46 },
        1: { halign: 'right', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 24 },
        4: { cellWidth: 74, textColor: [100, 116, 139] }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Table 3: Auditoría de Mermas y Descartes Fitosanitarios
  if (report.discardReasons && report.discardReasons.length > 0) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(190, 18, 60);
    doc.text('AUDITORÍA DE DESCARTE Y CONTROL DE MERMA EN LÍNEA', margin, currentY + 3.5);

    const discardRows = report.discardReasons.map(d => [
      d.type,
      `${(d.kg || 0).toLocaleString('es-MX')} kg`,
      `${(d.impactPercent || 0).toFixed(1)}%`,
      d.trend || 'Estable',
      d.notes || 'Revisión en tolva de recepción y selección óptica'
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Causa de Descarte / Fitosanidad',
        'Kilos Afectados',
        '% Impacto s/ Total',
        'Tendencia',
        'Acción Correctiva / Huerto'
      ]],
      body: discardRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [190, 18, 60], // Rose 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [190, 18, 60] },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 22 },
        4: { cellWidth: 64, textColor: [100, 116, 139] }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Table 4: Consumo de Insumos y Materiales de Empaque (BOM)
  if (report.suppliesConsumed && report.suppliesConsumed.length > 0) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('BALANCE DE INSUMOS Y MATERIALES DE EMPAQUE CONSUMIDOS', margin, currentY + 3.5);

    const supplyRows = report.suppliesConsumed.map(s => [
      s.item_name,
      s.category,
      `${(s.quantity || 0).toLocaleString('es-MX')}`,
      s.unit
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [[
        'Insumo / Material de Empaque',
        'Categoría',
        'Cantidad Consumida',
        'Unidad de Medida'
      ]],
      body: supplyRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [4, 120, 87], // Emerald 700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 42 },
        2: { halign: 'right', cellWidth: 35, fontStyle: 'bold', textColor: [4, 120, 87] },
        3: { halign: 'center', cellWidth: 35 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Signatures
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  const sigWidth = 50;
  const sigY = pageHeight - 24;

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 6, sigY, margin + 6 + sigWidth, sigY);
  doc.line(margin + (pageWidth - (margin * 2)) / 2 - (sigWidth / 2), sigY, margin + (pageWidth - (margin * 2)) / 2 + (sigWidth / 2), sigY);
  doc.line(pageWidth - margin - 6 - sigWidth, sigY, pageWidth - margin - 6, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(30, 41, 59);
  doc.text('JEFATURA DE PRODUCCIÓN', margin + 6 + (sigWidth / 2), sigY + 3.5, { align: 'center' });
  doc.text('CONTROL DE CALIDAD / SENASICA', margin + (pageWidth - (margin * 2)) / 2, sigY + 3.5, { align: 'center' });
  doc.text('DIRECCIÓN DE OPERACIONES', pageWidth - margin - 6 - (sigWidth / 2), sigY + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Supervisión de línea y calibrado', margin + 6 + (sigWidth / 2), sigY + 6.5, { align: 'center' });
  doc.text('Inspección fitosanitaria y lotes', margin + (pageWidth - (margin * 2)) / 2, sigY + 6.5, { align: 'center' });
  doc.text('JBM Cítricos S.A. de C.V.', pageWidth - margin - 6 - (sigWidth / 2), sigY + 6.5, { align: 'center' });

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text('JBM CÍTRICOS S.A. DE C.V. • REPORTE MENSUAL DE PRODUCCIÓN Y EMPAQUE • WWW.JBMCITRICOS.COM', margin, pageHeight - 3.8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 3.8, { align: 'right' });
  }

  const filename = `Reporte_Mensual_Produccion_JBM_${dateStr}.pdf`;
  doc.save(filename);
}

