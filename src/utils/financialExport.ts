/**
 * Financial Export Utilities for JBM Cítricos ERP
 * Supports CSV (with UTF-8 BOM for Excel compatibility) and Excel Spreadsheet XML
 */

import type { Settlement, Producer, Batch } from '../types';

export interface CompanyMetadata {
  name?: string;
  rfc?: string;
  address?: string;
  phone?: string;
  email?: string;
}

const DEFAULT_COMPANY: CompanyMetadata = {
  name: 'JBM CÍTRICOS BARRAGÁN S.A. DE C.V.',
  rfc: 'JBM980412H82',
  address: 'Carretera Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Ver.',
  phone: '+52 (232) 324-8890',
  email: 'administracion@jbmcitricos.com'
};

/**
 * Trigger browser file download from Blob
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Clean & escape string for CSV
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Format currency for CSV export
 */
function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Export generic tabular data to CSV with UTF-8 BOM for Excel
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  title: string = 'Reporte Financiero',
  metadata?: CompanyMetadata
) {
  const meta = { ...DEFAULT_COMPANY, ...metadata };
  const dateStr = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });

  const csvLines: string[] = [];
  
  // Header block
  csvLines.push(escapeCSV(meta.name));
  csvLines.push(escapeCSV(`RFC: ${meta.rfc} | Ubicación: ${meta.address}`));
  csvLines.push(escapeCSV(`REPORTE: ${title}`));
  csvLines.push(escapeCSV(`Fecha de Generación: ${dateStr}`));
  csvLines.push(escapeCSV('Moneda: MXN (Pesos Mexicanos)'));
  csvLines.push(''); // Empty separator line

  // Column Headers
  csvLines.push(headers.map(escapeCSV).join(','));

  // Data Rows
  rows.forEach(row => {
    csvLines.push(row.map(escapeCSV).join(','));
  });

  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const fullContent = BOM + csvLines.join('\r\n');

  downloadFile(fullContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export tabular data as Microsoft Excel XML 2003 Spreadsheet (.xls/.xml)
 * Compatible with Excel, LibreOffice, Google Sheets and accounting software
 */
export function exportToExcelXML(
  filename: string,
  sheetName: string,
  headers: { label: string; type: 'String' | 'Number'; width?: number }[],
  rows: (string | number)[][],
  title: string = 'Reporte Financiero JBM Cítricos',
  summaryRows?: { label: string; values: (string | number)[] }[],
  metadata?: CompanyMetadata
) {
  const meta = { ...DEFAULT_COMPANY, ...metadata };
  const dateStr = new Date().toLocaleString('es-MX');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1e293b"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#065f46"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubtitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748b"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#065f46"/>
   </Borders>
  </Style>
  <Style ss:ID="StringCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CenterCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="CurrencyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="TotalLabelStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0f172a"/>
   <Interior ss:Color="#ecfdf5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#047857"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalValueStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#065f46"/>
   <Interior ss:Color="#ecfdf5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#047857"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName.replace(/[:\\/?*\[\]]/g, '')}">
  <Table ss:DefaultRowHeight="20">
`;

  // Define Columns
  headers.forEach(h => {
    const width = h.width || (h.type === 'Number' ? 100 : 140);
    xml += `   <Column ss:AutoFitWidth="1" ss:Width="${width}"/>\n`;
  });

  // Title Rows
  xml += `   <Row ss:Height="24">
    <Cell ss:StyleID="TitleStyle" ss:MergeAcross="${headers.length - 1}"><Data ss:Type="String">${meta.name} - ${title}</Data></Cell>
   </Row>
   <Row ss:Height="16">
    <Cell ss:StyleID="SubtitleStyle" ss:MergeAcross="${headers.length - 1}"><Data ss:Type="String">RFC: ${meta.rfc} | Domicilio: ${meta.address} | Tel: ${meta.phone}</Data></Cell>
   </Row>
   <Row ss:Height="16">
    <Cell ss:StyleID="SubtitleStyle" ss:MergeAcross="${headers.length - 1}"><Data ss:Type="String">Generado el: ${dateStr} | Sistema ERP JBM Cítricos v2.4</Data></Cell>
   </Row>
   <Row ss:Height="8"></Row>
`;

  // Headers Row
  xml += `   <Row ss:Height="26">\n`;
  headers.forEach(h => {
    xml += `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${h.label}</Data></Cell>\n`;
  });
  xml += `   </Row>\n`;

  // Data Rows
  rows.forEach(row => {
    xml += `   <Row ss:Height="20">\n`;
    row.forEach((val, idx) => {
      const col = headers[idx];
      const isNum = typeof val === 'number' || (col && col.type === 'Number');
      const numVal = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));

      if (isNum && !isNaN(numVal)) {
        const isMoney = col?.label.toLowerCase().includes('$') || 
                        col?.label.toLowerCase().includes('total') || 
                        col?.label.toLowerCase().includes('subtotal') || 
                        col?.label.toLowerCase().includes('precio') || 
                        col?.label.toLowerCase().includes('deducc') ||
                        col?.label.toLowerCase().includes('pago') ||
                        col?.label.toLowerCase().includes('saldo');
        xml += `    <Cell ss:StyleID="${isMoney ? 'CurrencyCell' : 'NumberCell'}"><Data ss:Type="Number">${numVal}</Data></Cell>\n`;
      } else {
        const strVal = String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const isCenter = col?.label.toLowerCase().includes('fecha') || col?.label.toLowerCase().includes('folio') || col?.label.toLowerCase().includes('estado') || col?.label.toLowerCase().includes('método');
        xml += `    <Cell ss:StyleID="${isCenter ? 'CenterCell' : 'StringCell'}"><Data ss:Type="String">${strVal}</Data></Cell>\n`;
      }
    });
    xml += `   </Row>\n`;
  });

  // Summary Rows if provided
  if (summaryRows && summaryRows.length > 0) {
    xml += `   <Row ss:Height="8"></Row>\n`;
    summaryRows.forEach(sRow => {
      xml += `   <Row ss:Height="22">\n`;
      sRow.values.forEach((v, idx) => {
        const isLast = idx === sRow.values.length - 1;
        const numVal = typeof v === 'number' ? v : parseFloat(String(v).replace(/[$,]/g, ''));
        if (typeof v === 'number' || (!isNaN(numVal) && String(v).trim() !== '')) {
          xml += `    <Cell ss:StyleID="TotalValueStyle"><Data ss:Type="Number">${numVal}</Data></Cell>\n`;
        } else {
          xml += `    <Cell ss:StyleID="TotalLabelStyle"><Data ss:Type="String">${String(v || '')}</Data></Cell>\n`;
        }
      });
      xml += `   </Row>\n`;
    });
  }

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  downloadFile(xml, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8');
}

/**
 * Report 1: Detailed Settlements Report
 */
export function exportSettlementsReport(
  settlements: Settlement[],
  format: 'csv' | 'excel',
  filtersDescription: string = 'Todos los registros'
) {
  const filename = `Liquidaciones_JBM_${new Date().toISOString().slice(0, 10)}`;
  const title = `Reporte General de Liquidaciones a Productores (${filtersDescription})`;

  const headersCSV = [
    'Folio Liquidación',
    'Fecha',
    'ID Productor',
    'Nombre del Productor',
    'Boletas Liquidadas',
    'Kilos Netos (kg)',
    'Subtotal Fruta ($)',
    'Cuota Báscula ($)',
    'Deducciones / Maniobra ($)',
    'Total Pagado ($)',
    'Método de Pago',
    'Estado Contable'
  ];

  const headersExcel: { label: string; type: 'String' | 'Number'; width?: number }[] = [
    { label: 'Folio Liq.', type: 'String', width: 90 },
    { label: 'Fecha', type: 'String', width: 100 },
    { label: 'ID Prod.', type: 'Number', width: 60 },
    { label: 'Nombre del Productor', type: 'String', width: 220 },
    { label: 'Boletas', type: 'Number', width: 65 },
    { label: 'Kilos Netos (kg)', type: 'Number', width: 110 },
    { label: 'Subtotal Fruta ($)', type: 'Number', width: 120 },
    { label: 'Cuota Báscula ($)', type: 'Number', width: 110 },
    { label: 'Deducciones ($)', type: 'Number', width: 110 },
    { label: 'Total Pagado ($)', type: 'Number', width: 130 },
    { label: 'Método de Pago', type: 'String', width: 110 },
    { label: 'Estado', type: 'String', width: 90 }
  ];

  const rows = settlements.map(s => [
    s.folio,
    s.date ? s.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    s.producer_id || 0,
    s.producer_name || 'SIN ASIGNAR',
    s.batches_count || 1,
    s.total_kg || 0,
    s.subtotal || 0,
    s.scale_fees || 0,
    s.deductions || 0,
    s.total_paid || 0,
    s.payment_method || 'Transferencia',
    (s.status || 'pagado').toUpperCase()
  ]);

  const totalKg = settlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
  const totalSubtotal = settlements.reduce((sum, s) => sum + (s.subtotal || 0), 0);
  const totalScaleFees = settlements.reduce((sum, s) => sum + (s.scale_fees || 0), 0);
  const totalDeductions = settlements.reduce((sum, s) => sum + (s.deductions || 0), 0);
  const totalPaid = settlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);

  if (format === 'csv') {
    const csvRowsWithTotals = [
      ...rows,
      ['---', '---', '', 'TOTALES GENERALES', settlements.length, totalKg, totalSubtotal, totalScaleFees, totalDeductions, totalPaid, '---', '---']
    ];
    exportToCSV(filename, headersCSV, csvRowsWithTotals as any, title);
  } else {
    const summaryRows = [
      {
        label: 'TOTAL GENERAL',
        values: ['TOTALES', '', '', `${settlements.length} liquidaciones`, '', totalKg, totalSubtotal, totalScaleFees, totalDeductions, totalPaid, '', '']
      }
    ];
    exportToExcelXML(filename, 'Liquidaciones', headersExcel, rows, title, summaryRows);
  }
}

/**
 * Report 2: Producer Account Ledger / Auxiliar Contable
 */
export function exportProducerLedgerReport(
  producers: Producer[],
  settlements: Settlement[],
  format: 'csv' | 'excel'
) {
  const filename = `Auxiliar_Productores_JBM_${new Date().toISOString().slice(0, 10)}`;
  const title = 'Auxiliar Contable de Productores y Cuentas por Pagar';

  const headersCSV = [
    'ID Productor',
    'Nombre del Productor',
    'RFC',
    'Ubicación / Huerto',
    'Teléfono',
    'Liquidaciones Registradas',
    'Kilos Entregados (kg)',
    'Total Liquidado ($)',
    'Deducciones Totales ($)',
    'Saldo Actual ($)'
  ];

  const headersExcel: { label: string; type: 'String' | 'Number'; width?: number }[] = [
    { label: 'ID Prod.', type: 'Number', width: 60 },
    { label: 'Nombre del Productor', type: 'String', width: 230 },
    { label: 'RFC', type: 'String', width: 120 },
    { label: 'Ubicación / Huerto', type: 'String', width: 180 },
    { label: 'Teléfono', type: 'String', width: 110 },
    { label: 'Liquidaciones', type: 'Number', width: 90 },
    { label: 'Kilos Totales (kg)', type: 'Number', width: 120 },
    { label: 'Total Liquidado ($)', type: 'Number', width: 130 },
    { label: 'Deducciones ($)', type: 'Number', width: 110 },
    { label: 'Saldo en Cuenta ($)', type: 'Number', width: 130 }
  ];

  const rows = producers.map(p => {
    const pSettlements = settlements.filter(s => s.producer_id === p.id);
    const pKg = pSettlements.reduce((sum, s) => sum + (s.total_kg || 0), 0);
    const pPaid = pSettlements.reduce((sum, s) => sum + (s.total_paid || 0), 0);
    const pDeductions = pSettlements.reduce((sum, s) => sum + (s.deductions || 0), 0);

    return [
      p.id,
      p.name,
      p.rfc || 'XAXX010101000',
      p.location || p.default_orchard || 'Pedernales, Ver.',
      p.phone || 'S/N',
      pSettlements.length,
      pKg,
      pPaid,
      pDeductions,
      p.balance || 0
    ];
  });

  const totalKg = rows.reduce((sum, r) => sum + (Number(r[6]) || 0), 0);
  const totalPaid = rows.reduce((sum, r) => sum + (Number(r[7]) || 0), 0);
  const totalDeductions = rows.reduce((sum, r) => sum + (Number(r[8]) || 0), 0);
  const totalBalance = rows.reduce((sum, r) => sum + (Number(r[9]) || 0), 0);

  if (format === 'csv') {
    const csvRowsWithTotals = [
      ...rows,
      ['---', 'TOTALES GENERALES', '', '', '', producers.length, totalKg, totalPaid, totalDeductions, totalBalance]
    ];
    exportToCSV(filename, headersCSV, csvRowsWithTotals as any, title);
  } else {
    const summaryRows = [
      {
        label: 'TOTAL',
        values: ['TOTALES', '', '', '', '', `${producers.length} productores`, totalKg, totalPaid, totalDeductions, totalBalance]
      }
    ];
    exportToExcelXML(filename, 'Auxiliar Productores', headersExcel, rows, title, summaryRows);
  }
}

/**
 * Report 3: Operations & Maneuver Cost Breakdown ($0.40/kg Maniobra + Pesajes)
 */
export function exportOperationsCostReport(
  batches: Batch[],
  format: 'csv' | 'excel'
) {
  const filename = `Costos_Operativos_Maniobra_${new Date().toISOString().slice(0, 10)}`;
  const title = 'Auditoría y Desglose de Servicios Operativos, Maniobra y Báscula';

  const headersCSV = [
    'Folio Recepción',
    'Boleta Báscula',
    'Fecha',
    'Productor',
    'Kilos Netos (kg)',
    'Tarifa Maniobra/kg ($)',
    'Total Maniobra ($)',
    'Concepto Maniobra',
    'Cuota Báscula ($)',
    'Forma Pago Báscula',
    'Importe Retenido Total ($)'
  ];

  const headersExcel: { label: string; type: 'String' | 'Number'; width?: number }[] = [
    { label: 'Folio Entrada', type: 'String', width: 95 },
    { label: 'Folio Báscula', type: 'String', width: 95 },
    { label: 'Fecha', type: 'String', width: 100 },
    { label: 'Productor', type: 'String', width: 200 },
    { label: 'Kilos Netos (kg)', type: 'Number', width: 110 },
    { label: 'Tarifa/kg ($)', type: 'Number', width: 90 },
    { label: 'Maniobra Total ($)', type: 'Number', width: 120 },
    { label: 'Concepto Operativo', type: 'String', width: 200 },
    { label: 'Cuota Báscula ($)', type: 'Number', width: 110 },
    { label: 'Pago Báscula', type: 'String', width: 100 },
    { label: 'Retención Total ($)', type: 'Number', width: 130 }
  ];

  const rows = batches.map(b => {
    const scaleDeduction = b.scale_fee_payment === 'descuento' ? (b.scale_fee || 50) : 0;
    const extraTotal = b.extra_charge_total || ((b.weight_net || 0) * (b.extra_charge_per_kg || 0.40));
    const totalRetained = scaleDeduction + extraTotal;

    return [
      b.folio || `#REC-${b.id}`,
      b.scale_ticket_folio || 'S/F',
      b.date ? b.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      b.producer_name || 'SIN ASIGNAR',
      b.weight_net || 0,
      b.extra_charge_per_kg || 0.40,
      extraTotal,
      b.extra_charge_concept || 'Servicios operativos y maniobra',
      b.scale_fee || 50.00,
      b.scale_fee_payment === 'efectivo' ? 'Efectivo en Báscula' : 'Descontado en Liquidación',
      totalRetained
    ];
  });

  const totalKg = batches.reduce((sum, b) => sum + (b.weight_net || 0), 0);
  const totalExtra = batches.reduce((sum, b) => sum + (b.extra_charge_total || ((b.weight_net || 0) * (b.extra_charge_per_kg || 0.40))), 0);
  const totalScaleFees = batches.reduce((sum, b) => sum + (b.scale_fee || 50), 0);
  const totalRetainedSum = rows.reduce((sum, r) => sum + (Number(r[10]) || 0), 0);

  if (format === 'csv') {
    const csvRowsWithTotals = [
      ...rows,
      ['---', '---', '', 'TOTALES AUDITORÍA', totalKg, '---', totalExtra, '---', totalScaleFees, '---', totalRetainedSum]
    ];
    exportToCSV(filename, headersCSV, csvRowsWithTotals as any, title);
  } else {
    const summaryRows = [
      {
        label: 'TOTAL',
        values: ['TOTALES', '', '', `${batches.length} entradas`, totalKg, '', totalExtra, '', totalScaleFees, '', totalRetainedSum]
      }
    ];
    exportToExcelXML(filename, 'Maniobra y Báscula', headersExcel, rows, title, summaryRows);
  }
}

/**
 * Report 4: Single Settlement Accounting Voucher (Póliza de Liquidación)
 */
export function exportSingleSettlementVoucher(
  settlement: Settlement,
  producer?: Producer,
  format: 'csv' | 'excel' = 'excel'
) {
  const filename = `Poliza_${settlement.folio}_${new Date().toISOString().slice(0, 10)}`;
  const title = `Póliza Contable de Liquidación - Folio ${settlement.folio}`;

  const headersCSV = ['Concepto Contable', 'Cuenta / Referencia', 'Debe / Cargo (MXN)', 'Haber / Abono (MXN)', 'Observaciones'];
  const headersExcel: { label: string; type: 'String' | 'Number'; width?: number }[] = [
    { label: 'Concepto Contable', type: 'String', width: 220 },
    { label: 'Cuenta / Referencia', type: 'String', width: 140 },
    { label: 'Debe (Cargo)', type: 'Number', width: 120 },
    { label: 'Haber (Abono)', type: 'Number', width: 120 },
    { label: 'Observaciones', type: 'String', width: 200 }
  ];

  const subtotal = settlement.subtotal || 0;
  const deductions = settlement.deductions || 0;
  const scaleFees = settlement.scale_fees || 0;
  const totalPaid = settlement.total_paid || 0;

  const rows = [
    ['Compra de Fruta Cítrica (Materia Prima)', '501-01-001 Compra Limón Mexicano', subtotal, 0, `${settlement.total_kg?.toLocaleString()} kg @ precio pactado`],
    ['Retención Cuota de Báscula Camionera', '205-02-004 Retención Báscula', 0, scaleFees, 'Servicio de pesaje certificado'],
    ['Retención Maniobra y Operación de Tolva', '205-02-005 Retención Servicios Maniobra', 0, deductions, '$0.40/kg servicios operativos'],
    [`Pago a Productor (${settlement.payment_method})`, '102-01-001 Bancos / Tesorería', 0, totalPaid, `Liquidación a ${settlement.producer_name} (RFC: ${producer?.rfc || 'S/R'})`]
  ];

  const totalDebe = subtotal;
  const totalHaber = scaleFees + deductions + totalPaid;

  if (format === 'csv') {
    const csvRowsWithTotals = [
      ...rows,
      ['SUMAS IGUALES PÓLIZA', 'CUADRE CONTABLE', totalDebe, totalHaber, 'Póliza Balanceada']
    ];
    exportToCSV(filename, headersCSV, csvRowsWithTotals as any, title);
  } else {
    const summaryRows = [
      {
        label: 'SUMAS IGUALES',
        values: ['SUMAS IGUALES PÓLIZA', 'CUADRE CONTABLE', totalDebe, totalHaber, 'Póliza Cuadrada 100%']
      }
    ];
    exportToExcelXML(filename, 'Póliza Contable', headersExcel, rows, title, summaryRows);
  }
}

/**
 * Report 5: Shipments & Freight / Logistics Report (Carta Porte Digital 3.0)
 */
export interface ShipmentData {
  id: string;
  dest: string;
  carrier: string;
  driver: string;
  boxes: string;
  boxesCount?: number;
  weightTon?: number;
  status: string;
  temp: string;
  eta: string;
  plates?: string;
  cfdiCartaPorte?: string;
  sealNumber?: string;
  departureDate?: string;
  freightCost?: number;
}

export function exportShipmentsReport(
  shipments: ShipmentData[],
  format: 'csv' | 'excel' = 'csv',
  filterTitle: string = 'Todos los Embarques'
) {
  const filename = `Embarques_CartaPorte_JBM_${new Date().toISOString().slice(0, 10)}`;
  const title = `Reporte de Embarques y Despacho Logístico (${filterTitle})`;

  const headersCSV = [
    'Folio Embarque',
    'Carta Porte CFDI',
    'Fecha Despacho',
    'Destino / Cliente',
    'Transportista',
    'Operador',
    'Placas Unidad',
    'Sello Fiscal / Candado',
    'Cajas',
    'Peso Neto (Ton)',
    'Temperatura (°C)',
    'ETA Estimado',
    'Costo Flete ($)',
    'Estado Embarque'
  ];

  const headersExcel: { label: string; type: 'String' | 'Number'; width?: number }[] = [
    { label: 'Folio Emb.', type: 'String', width: 95 },
    { label: 'Carta Porte', type: 'String', width: 120 },
    { label: 'Fecha Despacho', type: 'String', width: 100 },
    { label: 'Destino / Cliente', type: 'String', width: 240 },
    { label: 'Línea Transportista', type: 'String', width: 180 },
    { label: 'Operador', type: 'String', width: 150 },
    { label: 'Placas', type: 'String', width: 90 },
    { label: 'Sello / Candado', type: 'String', width: 110 },
    { label: 'Cajas', type: 'Number', width: 80 },
    { label: 'Peso (Ton)', type: 'Number', width: 90 },
    { label: 'Temp (°C)', type: 'String', width: 80 },
    { label: 'ETA', type: 'String', width: 130 },
    { label: 'Costo Flete ($)', type: 'Number', width: 110 },
    { label: 'Estado', type: 'String', width: 120 }
  ];

  const rows = shipments.map(s => {
    const boxesNum = s.boxesCount || parseInt(s.boxes.replace(/[^\d]/g, '')) || 0;
    const tonNum = s.weightTon || parseFloat(s.boxes.match(/([\d.]+)\s*Ton/i)?.[1] || '0');
    const fCost = s.freightCost || 18500;

    return [
      s.id,
      s.cfdiCartaPorte || `CP-30-${s.id.slice(-3)}`,
      s.departureDate || new Date().toISOString().slice(0, 10),
      s.dest,
      s.carrier,
      s.driver,
      s.plates || '98-AK-2L / CA-552',
      s.sealNumber || 'MX-SAT-884920',
      boxesNum,
      tonNum,
      s.temp,
      s.eta,
      fCost,
      s.status
    ];
  });

  const totalBoxes = rows.reduce((sum, r) => sum + (Number(r[8]) || 0), 0);
  const totalTon = rows.reduce((sum, r) => sum + (Number(r[9]) || 0), 0);
  const totalFreight = rows.reduce((sum, r) => sum + (Number(r[12]) || 0), 0);

  if (format === 'csv') {
    const csvRowsWithTotals = [
      ...rows,
      ['---', '---', '', 'TOTALES LOGÍSTICA', '', '', '', '', totalBoxes, Number(totalTon.toFixed(2)), '---', '---', totalFreight, `${shipments.length} embarques`]
    ];
    exportToCSV(filename, headersCSV, csvRowsWithTotals as any, title);
  } else {
    const summaryRows = [
      {
        label: 'TOTALES',
        values: ['TOTALES', '', '', `${shipments.length} embarques`, '', '', '', '', totalBoxes, Number(totalTon.toFixed(2)), '', '', totalFreight, '']
      }
    ];
    exportToExcelXML(filename, 'Embarques Logística', headersExcel, rows, title, summaryRows);
  }
}

