import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Batch } from '../types';

export interface ReportFilterOptions {
  producerName?: string;
  startDate?: string;
  endDate?: string;
  variety?: string;
  notes?: string;
}

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

  // -------------------------------------------------------------
  // 1. CORPORATE HEADER (EMERALD & GOLD BRANDING)
  // -------------------------------------------------------------
  
  // Top green banner accent line
  doc.setFillColor(6, 78, 59); // Deep Emerald #064e3b
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Amber/Gold sub-stripe
  doc.setFillColor(217, 119, 6); // Amber #d97706
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Vector Corporate Logo Emulation (High-Resolution Vector Graphics)
  const logoX = margin;
  const logoY = 12;

  // Leaf 1 (Gold/Green)
  doc.setFillColor(180, 140, 30);
  doc.ellipse(logoX + 8, logoY + 4, 3, 5, 'F');
  // Leaf 2
  doc.setFillColor(210, 165, 45);
  doc.ellipse(logoX + 13, logoY + 3, 2.5, 4, 'F');

  // Lime Dome Outer (Forest Green)
  doc.setFillColor(11, 107, 52);
  doc.ellipse(logoX + 10, logoY + 12, 10, 7, 'F');

  // Lime Dome Inner Pulp (Bright Lime)
  doc.setFillColor(74, 222, 128);
  doc.ellipse(logoX + 10, logoY + 12, 8, 5.5, 'F');

  // JBM Text in Logo
  doc.setTextColor(180, 130, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('JBM', logoX + 10, logoY + 22, { align: 'center' });

  // Company Name Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('JBM CÍTRICOS S.A. DE C.V.', logoX + 24, logoY + 6);

  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('EMPACADORA & EXPORTADORA DE CÍTRICOS • LIMONES BARRAGÁN', logoX + 24, logoY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('R.F.C.: JBM980412H82 • Reg. SENASICA / FDA Certificado • Báscula Camionera Certificada 80 Ton', logoX + 24, logoY + 16);
  doc.text('Carretera Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Veracruz • C.P. 93600', logoX + 24, logoY + 20);

  // Document Title & Metadata Box (Right Side)
  const metaBoxX = pageWidth - margin - 85;
  const metaBoxY = 10;
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(metaBoxX, metaBoxY, 85, 23, 2, 2, 'FD');

  doc.setFillColor(15, 23, 42); // Slate 900 badge
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

  // -------------------------------------------------------------
  // 2. FINANCIAL & OPERATIONAL KPI SUMMARY CARDS
  // -------------------------------------------------------------
  const kpiY = 36;
  const kpiWidth = (pageWidth - (margin * 2) - 12) / 5;
  const kpiHeight = 15;

  const kpis = [
    {
      label: 'TOTAL KILOS NETOS',
      value: `${totalNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg`,
      sub: `${filtered.length} pesajes realizados`,
      color: [6, 78, 59] // Emerald
    },
    {
      label: 'SUBTOTAL FRUTA',
      value: `$${totalSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: 'Valor bruto recibido',
      color: [30, 41, 59] // Slate
    },
    {
      label: 'CUOTAS DE BÁSCULA',
      value: `$${totalScaleFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: `Desc: $${totalScaleFeesDeducted.toFixed(0)} | Efec: $${totalScaleFeesCash.toFixed(0)}`,
      color: [180, 83, 9] // Amber
    },
    {
      label: 'CARGOS OPERATIVOS ($0.40/kg)',
      value: `$${totalExtraCharges.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: 'Maniobra y servicios',
      color: [190, 24, 93] // Rose/Pink
    },
    {
      label: 'TOTAL NETO LIQUIDADO',
      value: `$${totalLiquidated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sub: 'Monto liquidado a productores',
      color: [4, 120, 87] // Green
    }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + (idx * (kpiWidth + 3));
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    // Color top bar
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

  // -------------------------------------------------------------
  // 3. STRUCTURED TABLE WITH AUTOTABLE
  // -------------------------------------------------------------
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
    margin: { left: margin, right: margin, bottom: 26 },
    didDrawPage: (data) => {
      // Header for additional pages if table spans multiple pages
      const pageNum = doc.getNumberOfPages();
      if (pageNum > 1) {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`JBM Cítricos • Historial de Recibos y Báscula (Cont.) - Página ${pageNum}`, margin, 8);
      }
    }
  });

  // -------------------------------------------------------------
  // 4. SUMMARY BOXES & SIGNATURES FOOTER (ON LAST PAGE)
  // -------------------------------------------------------------
  const finalY = (doc as any).lastAutoTable.finalY + 4;
  
  // If not enough room on current page, add new page
  if (finalY > pageHeight - 32) {
    doc.addPage();
  }

  const currentY = finalY > pageHeight - 32 ? 14 : finalY;

  // Notes & Signatures Layout
  const colWidth = (pageWidth - (margin * 2) - 10) / 3;

  // Box 1: Accounting Summary
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

  // Box 2: Signature Operator / Gerencia
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

  // Box 3: Signature Producer / Conformance
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

  // Bottom Security Footer on all pages
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

  // Save the document
  const fileName = `JBM_Historial_Recibos_Bascula_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
