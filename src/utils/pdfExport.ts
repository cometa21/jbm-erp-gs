import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Batch, Settlement, Producer } from '../types';

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
