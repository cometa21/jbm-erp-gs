import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("jbm_citricos.db");

// Initialize Database Schema with rich fields
db.exec(`
  CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT DEFAULT 'JBM CÍTIRCOS BARRAGÁN',
    trade_name TEXT DEFAULT 'LIMONES BARRAGAN',
    rfc TEXT DEFAULT 'JBM980412H82',
    address TEXT DEFAULT 'Carretera Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Ver.',
    phone TEXT DEFAULT '+52 (232) 324-8890',
    email TEXT DEFAULT 'contacto@jbmcitricos.com',
    portal_url TEXT DEFAULT 'https://portal.jbmcitricos.com',
    scale_fee REAL DEFAULT 50.00,
    default_price_kg REAL DEFAULT 18.50
  );

  CREATE TABLE IF NOT EXISTS producers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rfc TEXT,
    phone TEXT,
    location TEXT,
    default_orchard TEXT,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT,
    scale_ticket_folio TEXT,
    producer_id INTEGER,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    origin TEXT DEFAULT 'Cosecha propia',
    orchard TEXT DEFAULT 'Pedernales',
    variety TEXT DEFAULT 'Limón Mexicano',
    quality TEXT DEFAULT 'Estándar',
    weight_gross REAL NOT NULL,
    weight_tare REAL NOT NULL,
    weight_net REAL NOT NULL,
    price_per_kg REAL DEFAULT 18.50,
    subtotal REAL DEFAULT 0,
    scale_fee REAL DEFAULT 50.00,
    scale_fee_payment TEXT DEFAULT 'descuento',
    extra_charge_per_kg REAL DEFAULT 0.40,
    extra_charge_total REAL DEFAULT 0,
    extra_charge_concept TEXT DEFAULT 'Servicios operativos y maniobra',
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'completado',
    operator TEXT DEFAULT 'Carlos Barragán',
    notes TEXT,
    FOREIGN KEY(producer_id) REFERENCES producers(id)
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT NOT NULL,
    producer_id INTEGER NOT NULL,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    batches_count INTEGER DEFAULT 1,
    total_kg REAL NOT NULL,
    subtotal REAL NOT NULL,
    scale_fees REAL DEFAULT 50.00,
    deductions REAL DEFAULT 0,
    total_paid REAL NOT NULL,
    status TEXT DEFAULT 'pagado',
    payment_method TEXT DEFAULT 'Transferencia',
    FOREIGN KEY(producer_id) REFERENCES producers(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'Empaque',
    quantity INTEGER DEFAULT 0,
    unit TEXT,
    min_stock INTEGER DEFAULT 100,
    critical_stock INTEGER DEFAULT 50,
    cost_unit REAL DEFAULT 0,
    supplier TEXT DEFAULT 'Cartonera del Golfo S.A.',
    sku TEXT DEFAULT '',
    lead_time_days INTEGER DEFAULT 3,
    last_restock_date TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    type TEXT NOT NULL,
    qty INTEGER NOT NULL,
    prev_qty INTEGER DEFAULT 0,
    new_qty INTEGER DEFAULT 0,
    reason TEXT DEFAULT '',
    user TEXT DEFAULT 'Almacén',
    date TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT,
    customer_name TEXT,
    items_count INTEGER DEFAULT 1,
    subtotal REAL,
    tax REAL,
    total REAL,
    payment_method TEXT DEFAULT 'Efectivo',
    date TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS production_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    calibre TEXT NOT NULL,
    color TEXT NOT NULL,
    quality TEXT NOT NULL,
    presentation_id TEXT,
    presentation_name TEXT,
    boxes_count INTEGER DEFAULT 0,
    weight_total_kg REAL NOT NULL,
    destination TEXT NOT NULL,
    operator TEXT DEFAULT 'Carlos Barragán',
    cost_total REAL DEFAULT 0,
    cost_per_box REAL DEFAULT 0,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY(batch_id) REFERENCES batches(id)
  );

  CREATE TABLE IF NOT EXISTS production_discards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER,
    type TEXT NOT NULL,
    kg REAL NOT NULL,
    impact_percent REAL DEFAULT 0,
    trend TEXT DEFAULT 'Estable',
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY(batch_id) REFERENCES batches(id)
  );

  CREATE TABLE IF NOT EXISTS pallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pallet_number TEXT UNIQUE NOT NULL,
    batch_id INTEGER NOT NULL,
    calibre TEXT NOT NULL,
    color TEXT NOT NULL,
    quality TEXT NOT NULL DEFAULT 'primera',
    presentation_name TEXT DEFAULT 'Caja JBM Export 18.14 kg',
    boxes_count INTEGER NOT NULL DEFAULT 54,
    weight_kg REAL NOT NULL,
    location_zone TEXT DEFAULT 'A1',
    status TEXT DEFAULT 'en_camara',
    packed_date TEXT DEFAULT CURRENT_TIMESTAMP,
    operator TEXT DEFAULT 'Carlos Barragán',
    treatment TEXT DEFAULT 'Cera Carnauba Grado Alimento + Tiabendazol',
    notes TEXT,
    FOREIGN KEY(batch_id) REFERENCES batches(id)
  );

  CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT UNIQUE NOT NULL,
    destination TEXT NOT NULL,
    client_name TEXT,
    carrier_name TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    driver_license TEXT,
    plates_truck TEXT NOT NULL,
    plates_trailer TEXT,
    thermograph_id TEXT,
    seal_number TEXT,
    total_pallets INTEGER DEFAULT 0,
    total_boxes INTEGER DEFAULT 0,
    total_kg REAL DEFAULT 0,
    status TEXT DEFAULT 'preparando',
    departure_date TEXT DEFAULT CURRENT_TIMESTAMP,
    eta TEXT,
    temp_celsius REAL DEFAULT 4.0,
    operator TEXT DEFAULT 'Carlos Barragán',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS shipment_pallets (
    shipment_id INTEGER NOT NULL,
    pallet_id INTEGER NOT NULL,
    PRIMARY KEY(shipment_id, pallet_id),
    FOREIGN KEY(shipment_id) REFERENCES shipments(id),
    FOREIGN KEY(pallet_id) REFERENCES pallets(id)
  );
`);

// Migration helper for SQLite existing tables
function ensureColumn(tableName: string, columnName: string, columnDef: string) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
    const hasColumn = tableInfo.some(col => col.name.toLowerCase() === columnName.toLowerCase());
    if (!hasColumn) {
      // SQLite ALTER TABLE ADD COLUMN cannot have non-constant defaults like CURRENT_TIMESTAMP
      const sanitizedDef = columnDef.replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, "DEFAULT ''");
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sanitizedDef}`);
      if (/CURRENT_TIMESTAMP/i.test(columnDef)) {
        db.exec(`UPDATE ${tableName} SET ${columnName} = datetime('now', 'localtime') WHERE ${columnName} IS NULL OR ${columnName} = ''`);
      }
    }
  } catch (err) {
    console.error(`Migration error for ${tableName}.${columnName}:`, err);
  }
}

// Ensure all columns exist for producers
ensureColumn("producers", "rfc", "TEXT DEFAULT ''");
ensureColumn("producers", "phone", "TEXT DEFAULT ''");
ensureColumn("producers", "location", "TEXT DEFAULT 'Pedernales, Ver.'");
ensureColumn("producers", "default_orchard", "TEXT DEFAULT 'Huerto Propio'");
ensureColumn("producers", "balance", "REAL DEFAULT 0");

// Ensure all columns exist for batches
ensureColumn("batches", "folio", "TEXT");
ensureColumn("batches", "scale_ticket_folio", "TEXT DEFAULT ''");
ensureColumn("batches", "producer_id", "INTEGER");
ensureColumn("batches", "date", "TEXT DEFAULT CURRENT_TIMESTAMP");
ensureColumn("batches", "origin", "TEXT DEFAULT 'Cosecha propia'");
ensureColumn("batches", "orchard", "TEXT DEFAULT 'Pedernales'");
ensureColumn("batches", "variety", "TEXT DEFAULT 'Limón Mexicano'");
ensureColumn("batches", "quality", "TEXT DEFAULT 'Estándar'");
ensureColumn("batches", "weight_gross", "REAL DEFAULT 0");
ensureColumn("batches", "weight_tare", "REAL DEFAULT 0");
ensureColumn("batches", "weight_net", "REAL DEFAULT 0");
ensureColumn("batches", "price_per_kg", "REAL DEFAULT 18.50");
ensureColumn("batches", "subtotal", "REAL DEFAULT 0");
ensureColumn("batches", "scale_fee", "REAL DEFAULT 50.00");
ensureColumn("batches", "scale_fee_payment", "TEXT DEFAULT 'descuento'");
ensureColumn("batches", "extra_charge_per_kg", "REAL DEFAULT 0.40");
ensureColumn("batches", "extra_charge_total", "REAL DEFAULT 0");
ensureColumn("batches", "extra_charge_concept", "TEXT DEFAULT 'Servicios operativos y maniobra'");
ensureColumn("batches", "total", "REAL DEFAULT 0");
ensureColumn("batches", "status", "TEXT DEFAULT 'completado'");
ensureColumn("batches", "operator", "TEXT DEFAULT 'Carlos Barragán'");
ensureColumn("batches", "notes", "TEXT DEFAULT ''");

// Ensure all columns exist for settlements
ensureColumn("settlements", "folio", "TEXT NOT NULL DEFAULT 'LIQ-00001'");
ensureColumn("settlements", "producer_id", "INTEGER NOT NULL DEFAULT 1");
ensureColumn("settlements", "date", "TEXT DEFAULT CURRENT_TIMESTAMP");
ensureColumn("settlements", "batches_count", "INTEGER DEFAULT 1");
ensureColumn("settlements", "total_kg", "REAL DEFAULT 0");
ensureColumn("settlements", "subtotal", "REAL DEFAULT 0");
ensureColumn("settlements", "scale_fees", "REAL DEFAULT 50.00");
ensureColumn("settlements", "deductions", "REAL DEFAULT 0");
ensureColumn("settlements", "total_paid", "REAL DEFAULT 0");
ensureColumn("settlements", "status", "TEXT DEFAULT 'pagado'");
ensureColumn("settlements", "payment_method", "TEXT DEFAULT 'Transferencia'");

// Ensure all columns exist for company_settings
ensureColumn("company_settings", "name", "TEXT DEFAULT 'JBM CÍTIRCOS BARRAGÁN'");
ensureColumn("company_settings", "trade_name", "TEXT DEFAULT 'LIMONES BARRAGAN'");
ensureColumn("company_settings", "rfc", "TEXT DEFAULT 'JBM980412H82'");
ensureColumn("company_settings", "address", "TEXT DEFAULT 'Carretera Federal Martínez - Misantla Km 4.5, Col. Pedernales, Martínez de la Torre, Ver.'");
ensureColumn("company_settings", "phone", "TEXT DEFAULT '+52 (232) 324-8890'");
ensureColumn("company_settings", "email", "TEXT DEFAULT 'contacto@jbmcitricos.com'");
ensureColumn("company_settings", "portal_url", "TEXT DEFAULT 'https://portal.jbmcitricos.com'");
ensureColumn("company_settings", "scale_fee", "REAL DEFAULT 50.00");
ensureColumn("company_settings", "default_price_kg", "REAL DEFAULT 18.50");

// Ensure all columns exist for inventory
ensureColumn("inventory", "category", "TEXT DEFAULT 'Empaque'");
ensureColumn("inventory", "min_stock", "INTEGER DEFAULT 100");
ensureColumn("inventory", "critical_stock", "INTEGER DEFAULT 50");
ensureColumn("inventory", "cost_unit", "REAL DEFAULT 0");
ensureColumn("inventory", "supplier", "TEXT DEFAULT 'Cartonera del Golfo S.A.'");
ensureColumn("inventory", "sku", "TEXT DEFAULT ''");
ensureColumn("inventory", "lead_time_days", "INTEGER DEFAULT 3");
ensureColumn("inventory", "last_restock_date", "TEXT DEFAULT CURRENT_TIMESTAMP");

// Ensure all columns exist for sales
ensureColumn("sales", "folio", "TEXT");
ensureColumn("sales", "customer_name", "TEXT DEFAULT 'Venta Mostrador'");
ensureColumn("sales", "items_count", "INTEGER DEFAULT 1");
ensureColumn("sales", "subtotal", "REAL DEFAULT 0");
ensureColumn("sales", "tax", "REAL DEFAULT 0");
ensureColumn("sales", "total", "REAL DEFAULT 0");
ensureColumn("sales", "payment_method", "TEXT DEFAULT 'Efectivo'");
ensureColumn("sales", "date", "TEXT DEFAULT CURRENT_TIMESTAMP");

// Backfill missing folios or calculations in batches if needed
try {
  db.exec(`UPDATE batches SET folio = 'REC-' || printf('%05d', id) WHERE folio IS NULL OR folio = ''`);
  db.exec(`UPDATE batches SET scale_ticket_folio = '' WHERE scale_ticket_folio IS NULL`);
  db.exec(`UPDATE batches SET scale_fee_payment = 'descuento' WHERE scale_fee_payment IS NULL OR scale_fee_payment = ''`);
  db.exec(`UPDATE batches SET extra_charge_per_kg = 0.40 WHERE extra_charge_per_kg IS NULL`);
  db.exec(`UPDATE batches SET extra_charge_concept = 'Servicios operativos y maniobra' WHERE extra_charge_concept IS NULL OR extra_charge_concept = ''`);
  db.exec(`UPDATE batches SET weight_net = MAX(0, COALESCE(weight_gross, 0) - COALESCE(weight_tare, 0)) WHERE weight_net IS NULL OR weight_net = 0`);
  db.exec(`UPDATE batches SET subtotal = weight_net * COALESCE(price_per_kg, 18.50) WHERE subtotal IS NULL OR subtotal = 0`);
  db.exec(`UPDATE batches SET extra_charge_total = weight_net * COALESCE(extra_charge_per_kg, 0.40) WHERE extra_charge_total IS NULL OR extra_charge_total = 0`);
  db.exec(`UPDATE batches SET total = MAX(0, subtotal - (CASE WHEN scale_fee_payment = 'descuento' THEN COALESCE(scale_fee, 50) ELSE 0 END) - COALESCE(extra_charge_total, 0)) WHERE total IS NULL OR total = 0`);
} catch (e) {
  console.error("Backfill error:", e);
}

// Check if company settings exists
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM company_settings").get() as { count: number };
if (settingsCount.count === 0) {
  db.prepare(`
    INSERT INTO company_settings (id, name, trade_name, rfc, address, phone, email, portal_url, scale_fee, default_price_kg)
    VALUES (1, 'JBM CÍTRICOS BARRAGÁN', 'LIMONES BARRAGAN', 'JBM980412H82', 'Carretera Federal Martínez - Misantla Km 4.5, Pedernales', '+52 (232) 324-8890', 'operaciones@jbmcitricos.com', 'https://portal.jbmcitricos.com', 50.00, 18.50)
  `).run();
}

// Seed initial producers if empty or upgrade
const producerCount = db.prepare("SELECT COUNT(*) as count FROM producers").get() as { count: number };
if (producerCount.count === 0) {
  db.prepare("INSERT INTO producers (name, rfc, phone, location, default_orchard, balance) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Don Pedro Ramírez Méndez", "RAMP720815KJ8", "232-105-8842", "Pedernales, Ver.", "Huerto Pedernales Lote 4", 84500
  );
  db.prepare("INSERT INTO producers (name, rfc, phone, location, default_orchard, balance) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Rancho San José (Ing. Mario Barragán)", "BAM800311LP3", "232-118-9901", "Martínez de la Torre", "San José El Grande", 125000
  );
  db.prepare("INSERT INTO producers (name, rfc, phone, location, default_orchard, balance) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Huerta La Esperanza (C. Lucía Gómez)", "GAML650920MM1", "235-102-4419", "Misantla, Ver.", "La Esperanza Sector B", -12000
  );
  db.prepare("INSERT INTO producers (name, rfc, phone, location, default_orchard, balance) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Sociedad Agrícola Cuitláhuac S.P.R.", "SAC120518TT9", "278-732-1100", "Cuitláhuac, Ver.", "El Limonar 2", 210000
  );
}

// Seed initial batches if empty
const batchCount = db.prepare("SELECT COUNT(*) as count FROM batches").get() as { count: number };
if (batchCount.count === 0) {
  const insertBatch = db.prepare(`
    INSERT INTO batches (folio, producer_id, date, origin, orchard, variety, quality, weight_gross, weight_tare, weight_net, price_per_kg, subtotal, scale_fee, scale_fee_payment, extra_charge_per_kg, extra_charge_total, extra_charge_concept, total, status, operator, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBatch.run("REC-00108", 1, "2026-08-24 10:35:23", "Cosecha propia", "Pedernales", "Limón Mexicano", "Estándar", 14500.00, 4200.00, 10300.00, 18.50, 190550.00, 50.00, "descuento", 0.40, 4120.00, "Servicios operativos y maniobra", 186380.00, "completado", "Carlos Barragán", "Fruta con excelente jugo y turgencia");
  insertBatch.run("REC-00107", 2, "2026-08-24 08:15:10", "Huerto propio", "San José El Grande", "Limón Mexicano", "Estándar", 18200.00, 5100.00, 13100.00, 19.00, 248900.00, 50.00, "descuento", 0.40, 5240.00, "Servicios operativos y maniobra", 243610.00, "completado", "Carlos Barragán", "Calibres ideales para empaque");
  insertBatch.run("REC-00106", 3, "2026-08-23 16:40:00", "Compra libre", "La Esperanza Sector B", "Limón Mexicano", "Estándar", 9800.00, 3100.00, 6700.00, 18.20, 121940.00, 50.00, "descuento", 0.40, 2680.00, "Servicios operativos y maniobra", 119210.00, "liquidado", "Carlos Barragán", "Corte fresco matutino");
  insertBatch.run("REC-00105", 4, "2026-08-22 11:20:45", "Cosecha propia", "El Limonar 2", "Limón Mexicano", "Estándar", 16400.00, 4800.00, 11600.00, 18.50, 214600.00, 50.00, "descuento", 0.40, 4640.00, "Servicios operativos y maniobra", 209910.00, "completado", "Arturo Mendoza", "Excelente rendimiento de jugo");
}

// Seed inventory if empty or upgrade
const invCount = db.prepare("SELECT COUNT(*) as count FROM inventory").get() as { count: number };
if (invCount.count === 0) {
  const insertInv = db.prepare(`
    INSERT INTO inventory (item_name, category, quantity, unit, min_stock, critical_stock, cost_unit, supplier, sku)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Basic Packaging Materials (Boxes & Labels) - some configured below critical to trigger visual alerts
  insertInv.run("Caja Exportación 18.14 kg (40 lbs) JBM Green Lemon", "Cajas & Empaque", 320, "pzas", 1200, 450, 48.50, "Cartonera del Golfo S.A. de C.V.", "CJ-EXP-40LBS");
  insertInv.run("Caja Exportación 15 kg Master Cartón Corrugado", "Cajas & Empaque", 2400, "pzas", 800, 300, 42.00, "Cartonera del Golfo S.A. de C.V.", "CJ-EXP-15KG");
  insertInv.run("Caja Nacional 20 kg Madera/Plástico", "Cajas & Empaque", 210, "pzas", 350, 120, 28.00, "Empaques Regionales Martínez", "CJ-NAC-20KG");
  insertInv.run("Caja Telescópica 4.5 kg (10 lbs) Gourmet", "Cajas & Empaque", 45, "pzas", 250, 80, 22.50, "Cartonera del Golfo S.A. de C.V.", "CJ-TEL-10LBS");
  
  insertInv.run("Etiquetas Adhesivas PLU #4048 (Limón Mexicano Grande)", "Etiquetas & Marcaje", 1200, "millares", 6000, 2000, 0.18, "Etiquetas Industriales del Sureste", "LBL-PLU-4048");
  insertInv.run("Etiquetas Adhesivas PLU #4045 (Limón Mexicano Mediano)", "Etiquetas & Marcaje", 8500, "millares", 5000, 1500, 0.18, "Etiquetas Industriales del Sureste", "LBL-PLU-4045");
  insertInv.run("Etiquetas Trazabilidad SENASICA / USDA Lote Código QR", "Etiquetas & Marcaje", 420, "pzas", 2500, 800, 0.45, "Soluciones Gráficas Veracruz", "LBL-SENASICA-QR");
  insertInv.run("Etiquetas Marca Comercial JBM Premium Citrus", "Etiquetas & Marcaje", 3400, "pzas", 2500, 800, 0.35, "Soluciones Gráficas Veracruz", "LBL-BRAND-JBM");

  insertInv.run("Pallet Madera Tratada HT 40x48 (NIMF-15)", "Tarimas & Estiba", 140, "pzas", 100, 40, 230.00, "Maderas y Tarimas del Papaloapan", "PLT-HT-4048");
  insertInv.run("Esquinero de Cartón Reforzado 2.0m", "Protección & Flejado", 320, "pzas", 500, 150, 14.50, "Cartonera del Golfo S.A. de C.V.", "ESQ-CRT-200");
  insertInv.run("Fleje Polipropileno 1/2 pulgada (Rollos 3000m)", "Protección & Flejado", 8, "rollos", 15, 5, 850.00, "Flejados y Empaques Industriales", "FLJ-PP-050");
  insertInv.run("Grapas Metálicas / Sellos para Fleje 1/2\"", "Protección & Flejado", 850, "pzas", 2000, 500, 0.85, "Flejados y Empaques Industriales", "GRP-MET-050");
  insertInv.run("Cera Cítrica Carnauba Grado Alimento", "Tratamiento Poscosecha", 16, "tambos 200L", 6, 2, 14800.00, "Agroquímica Poscosecha Veracruz", "CER-CARN-200L");
  insertInv.run("Papel Encerado Microperforado 30x30 cm", "Protección & Flejado", 550, "pliegos", 2500, 800, 0.90, "Papelera San Rafael", "PAP-ENC-3030");
} else {
  // Check if critical_stock is populated, if not set realistic defaults
  try {
    db.exec(`UPDATE inventory SET critical_stock = CAST(min_stock * 0.4 AS INTEGER) WHERE critical_stock IS NULL OR critical_stock = 0 OR critical_stock = 50`);
  } catch (e) {
    console.error("Critical stock update err:", e);
  }
}

// Seed inventory logs if empty
const logCount = db.prepare("SELECT COUNT(*) as count FROM inventory_logs").get() as { count: number };
if (logCount.count === 0) {
  const insertLog = db.prepare(`
    INSERT INTO inventory_logs (item_id, item_name, type, qty, prev_qty, new_qty, reason, user, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertLog.run(1, "Caja Exportación 18.14 kg (40 lbs) JBM Green Lemon", "Salida", 450, 770, 320, "Consumo en línea de empaque para embarque McAllen EMB-084", "Carlos Barragán", "2026-08-24 11:30:00");
  insertLog.run(5, "Etiquetas Adhesivas PLU #4048 (Limón Mexicano Grande)", "Salida", 1800, 3000, 1200, "Etiquetado manual en banda de selección", "Almacén", "2026-08-24 14:15:00");
  insertLog.run(2, "Caja Exportación 15 kg Master Cartón Corrugado", "Entrada", 1000, 1400, 2400, "Recepción pedido proveedor Cartonera del Golfo", "Admin", "2026-08-23 09:00:00");
  insertLog.run(7, "Etiquetas Trazabilidad SENASICA / USDA Lote Código QR", "Salida", 800, 1220, 420, "Identificación de tarimas para inspección fitosanitaria", "Carlos Barragán", "2026-08-24 16:45:00");
  insertLog.run(4, "Caja Telescópica 4.5 kg (10 lbs) Gourmet", "Salida", 120, 165, 45, "Empaque de lote especial para supermercados", "Almacén", "2026-08-24 09:10:00");
}

// Seed settlements if empty
const settlementCount = db.prepare("SELECT COUNT(*) as count FROM settlements").get() as { count: number };
if (settlementCount.count === 0) {
  const insertSettlement = db.prepare(`
    INSERT INTO settlements (folio, producer_id, date, batches_count, total_kg, subtotal, scale_fees, deductions, total_paid, status, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSettlement.run("LIQ-00042", 1, "2026-08-24 14:30:00", 2, 22000.00, 407000.00, 100.00, 14900.00, 392100.00, "pagado", "Transferencia");
  insertSettlement.run("LIQ-00041", 2, "2026-08-23 18:15:00", 3, 34500.00, 655500.00, 150.00, 25000.00, 630500.00, "pagado", "Transferencia");
  insertSettlement.run("LIQ-00040", 3, "2026-08-22 12:45:00", 2, 12800.00, 236800.00, 100.00, 12000.00, 224800.00, "pagado", "Cheque");
  insertSettlement.run("LIQ-00039", 4, "2026-08-21 16:00:00", 4, 45000.00, 832500.00, 200.00, 30000.00, 802500.00, "pagado", "Transferencia");
}

// Seed production runs if empty
const prodCount = db.prepare("SELECT COUNT(*) as count FROM production_runs").get() as { count: number };
if (prodCount.count === 0) {
  const insertProd = db.prepare(`
    INSERT INTO production_runs (batch_id, calibre, color, quality, presentation_id, presentation_name, boxes_count, weight_total_kg, destination, operator, cost_total, cost_per_box, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProd.run(1, 'V-XX', 'verde', 'primera', 'caja_18kg', 'Caja JBM Export 18 kg (40 lbs)', 150, 2700, 'camara_fria', 'Carlos Barragán', 49950, 333, '2026-08-24 11:45:00', 'Fruta turgente de primera calidad');
  insertProd.run(1, 'V-X', 'verde', 'primera', 'caja_18kg', 'Caja JBM Export 18 kg (40 lbs)', 120, 2160, 'piso_empaque', 'Carlos Barragán', 39960, 333, '2026-08-24 12:30:00', 'Palletizado en piso de empaque');
  insertProd.run(1, 'AL-XX', 'alimonado', 'segunda', 'caja_20kg', 'Caja Nacional 20 kg', 80, 1600, 'transporte_directo', 'Carlos Barragán', 29600, 370, '2026-08-24 13:15:00', 'Destino Central de Abastos CDMX');
  insertProd.run(1, 'AM-X', 'amarillo', 'industria', null, 'Granel / Molino', 0, 850, 'molino', 'Carlos Barragán', 15725, 0, '2026-08-24 14:00:00', 'Fruta sobremadura enviada a tolva de jugo');
  insertProd.run(2, 'V-XXX', 'verde', 'primera', 'caja_18kg', 'Caja JBM Export 18 kg (40 lbs)', 200, 3600, 'camara_fria', 'Arturo Mendoza', 68400, 342, '2026-08-24 09:30:00', 'Cámara fría Rack 2');
}

// Seed production discards if empty
const discardCount = db.prepare("SELECT COUNT(*) as count FROM production_discards").get() as { count: number };
if (discardCount.count === 0) {
  const insertDiscard = db.prepare(`
    INSERT INTO production_discards (batch_id, type, kg, impact_percent, trend, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertDiscard.run(1, 'Mancha de Trips / Ácaro (Daño Superficial)', 320, 3.1, 'Baja', '2026-08-24 11:00:00', 'Afecta solo apariencia exterior');
  insertDiscard.run(1, 'Partidura de Uña / Golpe de Cosecha', 180, 1.7, 'Estable', '2026-08-24 11:30:00', 'Manejo en campo');
  insertDiscard.run(1, 'Sobremaduro / Fruta Amarilla no Industrial', 140, 1.3, 'Baja', '2026-08-24 12:00:00', 'Corte tardío');
  insertDiscard.run(2, 'Roña / Mancha Grasosa (Clasif. B)', 290, 2.2, 'Alza', '2026-08-24 09:00:00', 'Revisar huerto origen');
}

// Seed pallets if empty
const palletCount = db.prepare("SELECT COUNT(*) as count FROM pallets").get() as { count: number };
if (palletCount.count === 0) {
  const insertPallet = db.prepare(`
    INSERT INTO pallets (pallet_number, batch_id, calibre, color, quality, presentation_name, boxes_count, weight_kg, location_zone, status, packed_date, operator, treatment, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPallet.run('PLT-2026-001', 1, 'V-XX', 'verde', 'primera', 'Caja JBM Export 18.14 kg (40 lbs)', 54, 979.56, 'A1', 'en_camara', '2026-08-24 11:45:00', 'Carlos Barragán', 'Cera Carnauba Grado Alimento + Tiabendazol', 'Pallet calidad exportación USDA');
  insertPallet.run('PLT-2026-002', 1, 'V-XX', 'verde', 'primera', 'Caja JBM Export 18.14 kg (40 lbs)', 54, 979.56, 'A1', 'en_camara', '2026-08-24 11:55:00', 'Carlos Barragán', 'Cera Carnauba Grado Alimento + Tiabendazol', 'Pallet calidad exportación USDA');
  insertPallet.run('PLT-2026-003', 1, 'V-X', 'verde', 'primera', 'Caja JBM Export 18.14 kg (40 lbs)', 54, 979.56, 'A2', 'en_camara', '2026-08-24 12:30:00', 'Carlos Barragán', 'Cera Carnauba Grado Alimento + Tiabendazol', 'Tarima lista para McAllen');
  insertPallet.run('PLT-2026-004', 2, 'V-XXX', 'verde', 'primera', 'Caja JBM Export 18.14 kg (40 lbs)', 54, 979.56, 'B1', 'en_camara', '2026-08-24 09:30:00', 'Arturo Mendoza', 'Cera Carnauba Grado Alimento', 'Fruta extra turgente Rancho San José');
  insertPallet.run('PLT-2026-005', 1, 'AL-XX', 'alimonado', 'segunda', 'Caja Nacional 20 kg', 60, 1200.00, 'B2', 'en_camara', '2026-08-24 13:15:00', 'Carlos Barragán', 'Tratamiento estándar', 'Destinado a Central de Abasto');
  insertPallet.run('PLT-2026-006', 2, 'V-5', 'verde', 'primera', 'Caja JBM Export 18.14 kg (40 lbs)', 54, 979.56, 'C1', 'en_camara', '2026-08-23 15:00:00', 'Arturo Mendoza', 'Cera Carnauba Grado Alimento', 'Ingreso hace 2 días');
  insertPallet.run('PLT-2026-007', 3, 'V-4', 'verde', 'primera', 'Caja JBM Export 18.14 kg (40 lbs)', 54, 979.56, 'C1', 'en_camara', '2026-08-22 17:00:00', 'Carlos Barragán', 'Cera Carnauba Grado Alimento', 'Prioridad FIFO salida');
}

// Seed shipments if empty
const shipmentCount = db.prepare("SELECT COUNT(*) as count FROM shipments").get() as { count: number };
if (shipmentCount.count === 0) {
  const insertShipment = db.prepare(`
    INSERT INTO shipments (folio, destination, client_name, carrier_name, driver_name, driver_license, plates_truck, plates_trailer, thermograph_id, seal_number, total_pallets, total_boxes, total_kg, status, departure_date, eta, temp_celsius, operator, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertShipment.run(
    'EMB-2026-084',
    'McAllen, TX, USA (Aduana Reynosa)',
    'Texas Fresh Citrus LLC',
    'Transportes Refrigerados del Golfo S.A.',
    'Roberto Morales',
    'LIC-FED-849201',
    '52-AE-9K',
    'REM-44-TX',
    'TG-9941-SENSITECH',
    'SEAL-JBM-88410',
    20,
    1080,
    19591.20,
    'en_transito',
    '2026-08-24 06:00:00',
    '2026-08-25 06:00 hrs',
    3.8,
    'Carlos Barragán',
    'Carta Porte Digital 3.0 timbrada con CFDI Ingreso'
  );
  insertShipment.run(
    'EMB-2026-085',
    'Central de Abasto CDMX (Bodega I-42)',
    'Frutas y Legumbres Barragán Hnos.',
    'Fletes Barragán Express',
    'Héctor Salgado',
    'LIC-FED-910412',
    '88-BB-2M',
    'REM-91-DF',
    'TG-8812-DELTA',
    'SEAL-JBM-88411',
    16,
    960,
    19200.00,
    'preparando',
    '2026-08-24 16:30:00',
    '2026-08-24 23:30 hrs',
    4.1,
    'Carlos Barragán',
    'En proceso de carga y verificación en andén'
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Company Settings
  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM company_settings WHERE id = 1").get();
      res.json(settings || {});
    } catch (err: any) {
      console.error("Error in GET /api/settings:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const { name, trade_name, rfc, address, phone, email, portal_url, scale_fee, default_price_kg } = req.body;
      db.prepare(`
        UPDATE company_settings 
        SET name = ?, trade_name = ?, rfc = ?, address = ?, phone = ?, email = ?, portal_url = ?, scale_fee = ?, default_price_kg = ?
        WHERE id = 1
      `).run(name, trade_name, rfc, address, phone, email, portal_url, scale_fee, default_price_kg);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error in POST /api/settings:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", (req, res) => {
    try {
      const totalBatchesKg = db.prepare("SELECT SUM(weight_net) as total FROM batches").get() as { total: number };
      const totalReceived = (totalBatchesKg?.total || 0) + 145200;

      res.json({
        kilosReceived: Math.round(totalReceived),
        boxesPacked: 8940,
        coldStorageStock: 142,
        millStock: 38,
        alerts: [
          { id: 1, type: 'warning', message: 'Temperatura en Cámara Fría 2 estable a 3.8°C' },
          { id: 2, type: 'info', message: 'Embarque Exportación McAllen Texas programado 17:00h' },
          { id: 3, type: 'info', message: 'Corte de fruta en Pedernales finalizado (10,300 kg)' }
        ]
      });
    } catch (err: any) {
      console.error("Error in GET /api/dashboard/stats:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Analytics: 30-day citrus reception and operational cost distribution per kg
  app.get("/api/analytics/reception-30days", (req, res) => {
    try {
      // 1. Fetch real batches from the database
      const dbBatches = db.prepare(`
        SELECT 
          date,
          weight_net,
          total,
          price_per_kg,
          extra_charge_total,
          scale_fee
        FROM batches
      `).all() as any[];

      // Build 30 calendar days
      const days = 30;
      const today = new Date();
      const dailyData: any[] = [];
      let runningTotalKg = 0;

      // Realistic daily patterns for seasonal citrus baseline (Martínez de la Torre / Pedernales)
      const baselineVolumes = [
        9400, 11200, 13800, 8900, 14200, 17500, 7200,
        10500, 12800, 15400, 9800, 16100, 18900, 6800,
        11900, 13400, 14800, 10200, 15700, 19200, 8100,
        12400, 14100, 16300, 10900, 17200, 20400, 7900,
        13100, 15600
      ];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const shortDate = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
        const weekday = d.toLocaleDateString('es-MX', { weekday: 'short' });

        // Sum batches from DB for this exact date
        const matchingBatches = dbBatches.filter(b => b.date && b.date.startsWith(dateKey));
        const dbKgForDay = matchingBatches.reduce((acc, b) => acc + (b.weight_net || 0), 0);
        const dbTotalForDay = matchingBatches.reduce((acc, b) => acc + (b.total || 0), 0);

        // Combine DB with baseline
        const baseIndex = (days - 1 - i) % baselineVolumes.length;
        const simulatedDayKg = baselineVolumes[baseIndex];
        const finalDayKg = dbKgForDay > 0 ? dbKgForDay + Math.round(simulatedDayKg * 0.4) : simulatedDayKg;
        const simulatedAmount = finalDayKg * 18.50;
        const finalAmount = dbTotalForDay > 0 ? dbTotalForDay + (simulatedAmount * 0.4) : simulatedAmount;
        const trucksCount = matchingBatches.length > 0 ? matchingBatches.length + 1 : Math.max(1, Math.round(finalDayKg / 8000));

        runningTotalKg += finalDayKg;

        dailyData.push({
          date: dateKey,
          label: shortDate,
          weekday: weekday.toUpperCase(),
          kilos: Math.round(finalDayKg),
          tons: Number((finalDayKg / 1000).toFixed(2)),
          accumulatedKg: Math.round(runningTotalKg),
          accumulatedTons: Number((runningTotalKg / 1000).toFixed(2)),
          amount: Math.round(finalAmount),
          trucks: trucksCount,
          variety: 'Limón Mexicano'
        });
      }

      // Compute 7-day moving averages
      for (let idx = 0; idx < dailyData.length; idx++) {
        const windowStart = Math.max(0, idx - 6);
        const slice = dailyData.slice(windowStart, idx + 1);
        const avg = slice.reduce((sum, item) => sum + item.kilos, 0) / slice.length;
        dailyData[idx].movingAverage = Math.round(avg);
      }

      // Operational cost distribution per kilo (Desglose de costos por kg)
      const costDistribution = [
        {
          id: 'fruta',
          concept: 'Fruta Limón Mexicano (Productor)',
          costPerKg: 18.50,
          percentage: 83.9,
          category: 'Materia Prima',
          color: '#10b981', // emerald-500
          description: 'Liquidación directa al productor por kilo neto recibido en báscula',
          isOperational: false
        },
        {
          id: 'maniobra',
          concept: 'Cargo Operativo y Maniobra de Descarga',
          costPerKg: 0.40,
          percentage: 1.8,
          category: 'Recepción & Báscula',
          color: '#f59e0b', // amber-500
          description: 'Cuadrilla de descargadores, estiba inicial y control de calidad en tolva ($0.40/kg)',
          isOperational: true
        },
        {
          id: 'pesaje',
          concept: 'Pesaje Báscula Camionera Certificada',
          costPerKg: 0.05,
          percentage: 0.2,
          category: 'Recepción & Báscula',
          color: '#eab308', // yellow-500
          description: 'Calibración oficial PROFECO, boleta electrónica y mantenimiento 80 Ton',
          isOperational: true
        },
        {
          id: 'lavado',
          concept: 'Lavado, Desinfección y Encerado Grado FDA',
          costPerKg: 0.60,
          percentage: 2.7,
          category: 'Planta & Proceso',
          color: '#06b6d4', // cyan-500
          description: 'Detergente biodegradable, fungicida autorizado y cera carnauba grado alimento',
          isOperational: true
        },
        {
          id: 'empaque',
          concept: 'Selección Óptica, Calibrado y Empaque',
          costPerKg: 0.90,
          percentage: 4.1,
          category: 'Planta & Proceso',
          color: '#3b82f6', // blue-500
          description: 'Mano de obra especializada, caja de cartón corrugado 15kg/40lbs y etiquetado',
          isOperational: true
        },
        {
          id: 'frio',
          concept: 'Cadena de Frío (Cámara 4°C - 6°C)',
          costPerKg: 0.35,
          percentage: 1.6,
          category: 'Almacenamiento',
          color: '#6366f1', // indigo-500
          description: 'Energía eléctrica industrial, monitoreo térmico 24/7 y control de humedad 90%',
          isOperational: true
        },
        {
          id: 'insumos',
          concept: 'Tarimas HT, Esquineros y Flejado',
          costPerKg: 0.45,
          percentage: 2.0,
          category: 'Empaque & Pallet',
          color: '#8b5cf6', // purple-500
          description: 'Pallet madera tratada térmica HT 40x48, 4 esquineros y fleje de polipropileno',
          isOperational: true
        },
        {
          id: 'logistica',
          concept: 'Flete Refrigerado & Carta Porte',
          costPerKg: 0.80,
          percentage: 3.6,
          category: 'Distribución',
          color: '#ec4899', // pink-500
          description: 'Transporte en termoking con Carta Porte y complemento SAT (Martínez - McAllen)',
          isOperational: true
        }
      ];

      const totalOperationalCostPerKg = costDistribution
        .filter(c => c.isOperational)
        .reduce((sum, c) => sum + c.costPerKg, 0);

      const totalFullCostPerKg = costDistribution
        .reduce((sum, c) => sum + c.costPerKg, 0);

      const totalVolumeKg = dailyData.reduce((sum, d) => sum + d.kilos, 0);
      const totalVolumeTons = Number((totalVolumeKg / 1000).toFixed(2));
      const dailyAverageKg = Math.round(totalVolumeKg / days);

      let peakDay = dailyData[0];
      for (const d of dailyData) {
        if (d.kilos > peakDay.kilos) {
          peakDay = d;
        }
      }

      res.json({
        dailyData,
        costDistribution,
        summary: {
          period: 'Últimos 30 Días',
          variety: 'Limón Mexicano (100% Acopio Exclusivo)',
          totalVolumeKg,
          totalVolumeTons,
          dailyAverageKg,
          peakDay: {
            date: peakDay.date,
            label: peakDay.label,
            kilos: peakDay.kilos,
            tons: peakDay.tons
          },
          totalOperationalCostPerKg: Number(totalOperationalCostPerKg.toFixed(2)), // $3.55
          totalFruitCostPerKg: 18.50,
          totalFullCostPerKg: Number(totalFullCostPerKg.toFixed(2)), // $22.05
          standardCapacityKgDay: 12000,
          receptionExtraChargePerKg: 0.40,
          scaleFeeDefault: 50.00
        }
      });
    } catch (err: any) {
      console.error("Error in GET /api/analytics/reception-30days:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Producers
  app.get("/api/producers", (req, res) => {
    try {
      const producers = db.prepare("SELECT id, name, COALESCE(rfc, '') as rfc, COALESCE(phone, '') as phone, COALESCE(location, 'Pedernales, Ver.') as location, COALESCE(default_orchard, 'Huerto Propio') as default_orchard, COALESCE(balance, 0) as balance FROM producers ORDER BY name ASC").all();
      res.json(producers);
    } catch (err: any) {
      console.error("Error in GET /api/producers:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/producers", (req, res) => {
    try {
      const { name, rfc, phone, location, default_orchard } = req.body;
      const result = db.prepare(
        "INSERT INTO producers (name, rfc, phone, location, default_orchard, balance) VALUES (?, ?, ?, ?, ?, 0)"
      ).run(name, rfc || '', phone || '', location || '', default_orchard || '');
      res.json({ id: result.lastInsertRowid, name });
    } catch (err: any) {
      console.error("Error in POST /api/producers:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/producers/:id", (req, res) => {
    try {
      const { id } = req.params;
      // Check if producer has batches
      const hasBatches = db.prepare("SELECT COUNT(*) as count FROM batches WHERE producer_id = ?").get(id) as { count: number };
      if (hasBatches && hasBatches.count > 0) {
        return res.status(400).json({ error: `No se puede eliminar: El productor tiene ${hasBatches.count} boletas de báscula asociadas.` });
      }
      db.prepare("DELETE FROM producers WHERE id = ?").run(id);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error("Error in DELETE /api/producers/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Batches / Fruit Reception
  app.get("/api/batches", (req, res) => {
    try {
      const batches = db.prepare(`
        SELECT 
          b.id,
          COALESCE(b.folio, 'REC-' || printf('%05d', b.id)) as folio,
          COALESCE(b.scale_ticket_folio, '') as scale_ticket_folio,
          b.producer_id,
          COALESCE(p.name, 'SIN ASIGNAR') as producer_name,
          b.date,
          COALESCE(b.origin, 'Cosecha propia') as origin,
          COALESCE(b.orchard, 'Pedernales') as orchard,
          COALESCE(b.variety, 'Limón Mexicano') as variety,
          COALESCE(b.quality, 'Estándar') as quality,
          COALESCE(b.weight_gross, 0) as weight_gross,
          COALESCE(b.weight_tare, 0) as weight_tare,
          COALESCE(b.weight_net, 0) as weight_net,
          COALESCE(b.price_per_kg, 18.50) as price_per_kg,
          COALESCE(b.subtotal, b.weight_net * COALESCE(b.price_per_kg, 18.50)) as subtotal,
          COALESCE(b.scale_fee, 50.00) as scale_fee,
          COALESCE(b.scale_fee_payment, 'descuento') as scale_fee_payment,
          COALESCE(b.extra_charge_per_kg, 0.40) as extra_charge_per_kg,
          COALESCE(b.extra_charge_total, b.weight_net * COALESCE(b.extra_charge_per_kg, 0.40)) as extra_charge_total,
          COALESCE(b.extra_charge_concept, 'Servicios operativos y maniobra') as extra_charge_concept,
          COALESCE(b.total, 0) as total,
          COALESCE(b.status, 'completado') as status,
          COALESCE(b.operator, 'Carlos Barragán') as operator,
          COALESCE(b.notes, '') as notes
        FROM batches b 
        LEFT JOIN producers p ON b.producer_id = p.id
        ORDER BY b.id DESC
      `).all();
      res.json(batches);
    } catch (err: any) {
      console.error("Error in GET /api/batches:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/batches", (req, res) => {
    try {
      const { 
        scale_ticket_folio = '',
        producer_id, 
        origin = 'Cosecha propia', 
        orchard = 'Pedernales', 
        variety = 'Limón Mexicano', 
        quality = 'Estándar',
        weight_gross, 
        weight_tare, 
        price_per_kg = 18.50,
        scale_fee = 50.00,
        scale_fee_payment = 'descuento', // 'descuento' (resta al pago) | 'efectivo' (ya pagado en efectivo)
        extra_charge_per_kg = 0.40,
        extra_charge_concept = 'Servicios operativos y maniobra',
        operator = 'Carlos Barragán',
        notes = ''
      } = req.body;

      const wGross = parseFloat(weight_gross) || 0;
      const wTare = parseFloat(weight_tare) || 0;
      const weight_net = Math.max(0, wGross - wTare);
      const pKg = parseFloat(price_per_kg) || 0;
      const sFee = parseFloat(scale_fee) || 0;
      const extraKg = parseFloat(extra_charge_per_kg) || 0;

      const subtotal = Number((weight_net * pKg).toFixed(2));
      const extra_charge_total = Number((weight_net * extraKg).toFixed(2));
      const scale_fee_deduction = (scale_fee_payment === 'descuento') ? sFee : 0;
      
      // Total a pagar al productor = Subtotal Fruta - Descuento Báscula - Cargos Operativos
      const total = Number(Math.max(0, subtotal - scale_fee_deduction - extra_charge_total).toFixed(2));

      // Next folio
      const lastBatch = db.prepare("SELECT MAX(id) as last_id FROM batches").get() as { last_id: number };
      const nextId = (lastBatch?.last_id || 0) + 1;
      const folio = `REC-${String(nextId).padStart(5, '0')}`;

      const prodId = producer_id ? parseInt(producer_id) : null;

      const result = db.prepare(`
        INSERT INTO batches (
          folio, scale_ticket_folio, producer_id, origin, orchard, variety, quality,
          weight_gross, weight_tare, weight_net,
          price_per_kg, subtotal, scale_fee, scale_fee_payment,
          extra_charge_per_kg, extra_charge_total, extra_charge_concept, total,
          status, operator, notes, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completado', ?, ?, datetime('now', 'localtime'))
      `).run(
        folio, scale_ticket_folio, prodId, origin, orchard, variety, quality,
        wGross, wTare, weight_net,
        pKg, subtotal, sFee, scale_fee_payment,
        extraKg, extra_charge_total, extra_charge_concept, total,
        operator, notes
      );

      // Update producer balance if producer specified
      if (prodId) {
        db.prepare("UPDATE producers SET balance = balance + ? WHERE id = ?").run(total, prodId);
      }

      const inserted = db.prepare(`
        SELECT 
          b.*,
          COALESCE(p.name, 'SIN ASIGNAR') as producer_name
        FROM batches b 
        LEFT JOIN producers p ON b.producer_id = p.id
        WHERE b.id = ?
      `).get(result.lastInsertRowid);

      res.json(inserted);
    } catch (err: any) {
      console.error("Error in POST /api/batches:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/batches/:id", (req, res) => {
    try {
      const { id } = req.params;
      const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(id) as any;
      if (!batch) {
        return res.status(404).json({ error: "Boleta no encontrada" });
      }
      // If batch is tied to producer balance, adjust
      if (batch.producer_id && batch.total) {
        db.prepare("UPDATE producers SET balance = MAX(0, balance - ?) WHERE id = ?").run(batch.total, batch.producer_id);
      }
      // Also delete any production runs linked to this batch or disassociate
      db.prepare("DELETE FROM production_runs WHERE batch_id = ?").run(id);
      db.prepare("DELETE FROM batches WHERE id = ?").run(id);
      res.json({ success: true, deletedId: id, folio: batch.folio });
    } catch (err: any) {
      console.error("Error in DELETE /api/batches/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Settlements / Liquidaciones
  app.get("/api/settlements", (req, res) => {
    try {
      const settlements = db.prepare(`
        SELECT 
          s.*, 
          COALESCE(p.name, 'SIN ASIGNAR') as producer_name, 
          COALESCE(p.rfc, '') as producer_rfc
        FROM settlements s
        LEFT JOIN producers p ON s.producer_id = p.id
        ORDER BY s.id DESC
      `).all();
      res.json(settlements);
    } catch (err: any) {
      console.error("Error in GET /api/settlements:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/settlements", (req, res) => {
    try {
      const { producer_id, batches_count, total_kg, subtotal, scale_fees, deductions, total_paid, payment_method } = req.body;
      const lastSettlement = db.prepare("SELECT MAX(id) as last_id FROM settlements").get() as { last_id: number };
      const nextId = (lastSettlement?.last_id || 0) + 1;
      const folio = `LIQ-${String(nextId).padStart(5, '0')}`;

      const result = db.prepare(`
        INSERT INTO settlements (folio, producer_id, batches_count, total_kg, subtotal, scale_fees, deductions, total_paid, status, payment_method, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pagado', ?, datetime('now', 'localtime'))
      `).run(folio, producer_id, batches_count, total_kg, subtotal, scale_fees, deductions, total_paid, payment_method || 'Transferencia');

      res.json({ id: result.lastInsertRowid, folio });
    } catch (err: any) {
      console.error("Error in POST /api/settlements:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/settlements/:id", (req, res) => {
    try {
      const { id } = req.params;
      const settlement = db.prepare("SELECT * FROM settlements WHERE id = ?").get(id) as any;
      if (!settlement) {
        return res.status(404).json({ error: "Liquidación no encontrada" });
      }
      db.prepare("DELETE FROM settlements WHERE id = ?").run(id);
      res.json({ success: true, deletedId: id, folio: settlement.folio });
    } catch (err: any) {
      console.error("Error in DELETE /api/settlements/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Inventory & Supplies with Visual Alert Management
  app.get("/api/inventory", (req, res) => {
    try {
      const items = db.prepare(`
        SELECT 
          id,
          item_name,
          COALESCE(category, 'Empaque') as category,
          COALESCE(quantity, 0) as quantity,
          COALESCE(unit, 'pzas') as unit,
          COALESCE(min_stock, 100) as min_stock,
          COALESCE(critical_stock, 50) as critical_stock,
          COALESCE(cost_unit, 0) as cost_unit,
          COALESCE(supplier, 'Cartonera del Golfo S.A.') as supplier,
          COALESCE(sku, '') as sku,
          COALESCE(lead_time_days, 3) as lead_time_days,
          COALESCE(last_restock_date, datetime('now', 'localtime')) as last_restock_date
        FROM inventory 
        ORDER BY 
          CASE 
            WHEN quantity <= critical_stock THEN 1
            WHEN quantity <= min_stock THEN 2
            ELSE 3
          END ASC,
          category ASC, 
          item_name ASC
      `).all() as any[];

      // Annotate with alert levels
      const enriched = items.map(item => {
        const isCritical = item.quantity <= item.critical_stock;
        const isLow = !isCritical && item.quantity <= item.min_stock;
        const status = isCritical ? 'critical' : isLow ? 'low' : 'optimal';
        const deficit = Math.max(0, item.min_stock - item.quantity);
        const criticalDeficit = Math.max(0, item.critical_stock - item.quantity);

        return {
          ...item,
          status,
          isCritical,
          isLow,
          deficit,
          criticalDeficit,
          reorderSuggestedQty: Math.max(0, (item.min_stock * 1.5) - item.quantity)
        };
      });

      res.json(enriched);
    } catch (err: any) {
      console.error("Error in GET /api/inventory:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory", (req, res) => {
    try {
      const { 
        item_name, 
        category = 'Empaque', 
        quantity = 0, 
        unit = 'pzas', 
        min_stock = 100, 
        critical_stock = 50, 
        cost_unit = 0, 
        supplier = 'Cartonera del Golfo S.A.', 
        sku = '' 
      } = req.body;

      if (!item_name || !item_name.trim()) {
        return res.status(400).json({ error: "El nombre del insumo es requerido." });
      }

      const result = db.prepare(`
        INSERT INTO inventory (item_name, category, quantity, unit, min_stock, critical_stock, cost_unit, supplier, sku, last_restock_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(item_name.trim(), category, quantity, unit, min_stock, critical_stock, cost_unit, supplier, sku);

      const newItem = db.prepare("SELECT * FROM inventory WHERE id = ?").get(result.lastInsertRowid);
      
      // Log creation
      db.prepare(`
        INSERT INTO inventory_logs (item_id, item_name, type, qty, prev_qty, new_qty, reason, user, date)
        VALUES (?, ?, 'Entrada', ?, 0, ?, 'Alta inicial de material en sistema', 'Admin', datetime('now', 'localtime'))
      `).run(result.lastInsertRowid, item_name.trim(), quantity, quantity);

      res.json(newItem);
    } catch (err: any) {
      console.error("Error in POST /api/inventory:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/inventory/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { 
        item_name, 
        category, 
        quantity, 
        unit, 
        min_stock, 
        critical_stock, 
        cost_unit, 
        supplier, 
        sku 
      } = req.body;

      const current = db.prepare("SELECT * FROM inventory WHERE id = ?").get(id) as any;
      if (!current) {
        return res.status(404).json({ error: "Material no encontrado." });
      }

      db.prepare(`
        UPDATE inventory 
        SET 
          item_name = COALESCE(?, item_name),
          category = COALESCE(?, category),
          quantity = COALESCE(?, quantity),
          unit = COALESCE(?, unit),
          min_stock = COALESCE(?, min_stock),
          critical_stock = COALESCE(?, critical_stock),
          cost_unit = COALESCE(?, cost_unit),
          supplier = COALESCE(?, supplier),
          sku = COALESCE(?, sku)
        WHERE id = ?
      `).run(
        item_name, 
        category, 
        quantity !== undefined ? quantity : current.quantity, 
        unit, 
        min_stock !== undefined ? min_stock : current.min_stock, 
        critical_stock !== undefined ? critical_stock : current.critical_stock, 
        cost_unit, 
        supplier, 
        sku, 
        id
      );

      // If quantity changed, log adjustment
      if (quantity !== undefined && quantity !== current.quantity) {
        const delta = quantity - current.quantity;
        db.prepare(`
          INSERT INTO inventory_logs (item_id, item_name, type, qty, prev_qty, new_qty, reason, user, date)
          VALUES (?, ?, ?, ?, ?, ?, 'Actualización manual de parámetros y stock', 'Admin', datetime('now', 'localtime'))
        `).run(id, current.item_name, delta >= 0 ? 'Entrada' : 'Salida', Math.abs(delta), current.quantity, quantity);
      }

      const updated = db.prepare("SELECT * FROM inventory WHERE id = ?").get(id);
      res.json(updated);
    } catch (err: any) {
      console.error("Error in PUT /api/inventory/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/inventory/:id", (req, res) => {
    try {
      const { id } = req.params;
      const item = db.prepare("SELECT * FROM inventory WHERE id = ?").get(id) as any;
      if (!item) {
        return res.status(404).json({ error: "Material no encontrado" });
      }
      db.prepare("DELETE FROM inventory WHERE id = ?").run(id);
      res.json({ success: true, deletedId: id, item_name: item.item_name });
    } catch (err: any) {
      console.error("Error in DELETE /api/inventory/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory/adjust", (req, res) => {
    try {
      const { id, delta, type = 'Ajuste', reason = 'Ajuste de conteo físico', user = 'Almacén' } = req.body;
      const current = db.prepare("SELECT * FROM inventory WHERE id = ?").get(id) as any;
      if (!current) {
        return res.status(404).json({ error: "Material no encontrado." });
      }

      const prevQty = current.quantity;
      const newQty = Math.max(0, prevQty + delta);
      const isRestock = delta > 0;

      db.prepare(`
        UPDATE inventory 
        SET 
          quantity = ?,
          last_restock_date = CASE WHEN ? = 1 THEN datetime('now', 'localtime') ELSE last_restock_date END
        WHERE id = ?
      `).run(newQty, isRestock ? 1 : 0, id);

      // Log movement
      const logType = delta > 0 ? (type || 'Entrada') : (type || 'Salida');
      db.prepare(`
        INSERT INTO inventory_logs (item_id, item_name, type, qty, prev_qty, new_qty, reason, user, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(id, current.item_name, logType, Math.abs(delta), prevQty, newQty, reason, user);

      const updated = db.prepare("SELECT * FROM inventory WHERE id = ?").get(id);
      res.json(updated);
    } catch (err: any) {
      console.error("Error in POST /api/inventory/adjust:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/inventory/logs", (req, res) => {
    try {
      const logs = db.prepare("SELECT * FROM inventory_logs ORDER BY id DESC LIMIT 50").all();
      res.json(logs);
    } catch (err: any) {
      console.error("Error in GET /api/inventory/logs:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory/configure-thresholds", (req, res) => {
    try {
      const { updates } = req.body; // Array of { id, min_stock, critical_stock }
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Se requiere una lista de actualizaciones." });
      }

      const updateStmt = db.prepare(`
        UPDATE inventory 
        SET 
          min_stock = COALESCE(?, min_stock),
          critical_stock = COALESCE(?, critical_stock)
        WHERE id = ?
      `);

      const transaction = db.transaction((items: any[]) => {
        for (const item of items) {
          updateStmt.run(item.min_stock, item.critical_stock, item.id);
        }
      });

      transaction(updates);
      const allItems = db.prepare("SELECT * FROM inventory ORDER BY category, item_name").all();
      res.json({ success: true, count: updates.length, items: allItems });
    } catch (err: any) {
      console.error("Error in POST /api/inventory/configure-thresholds:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Production & Classification Runs
  app.get("/api/production", (req, res) => {
    try {
      const runs = db.prepare(`
        SELECT 
          pr.*,
          COALESCE(b.folio, 'REC-' || printf('%05d', b.id)) as batch_folio,
          COALESCE(p.name, 'Productor Desconocido') as producer_name,
          COALESCE(b.orchard, 'Huerto General') as orchard
        FROM production_runs pr
        LEFT JOIN batches b ON pr.batch_id = b.id
        LEFT JOIN producers p ON b.producer_id = p.id
        ORDER BY pr.id DESC
      `).all();

      res.json(runs);
    } catch (err: any) {
      console.error("Error in GET /api/production:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/production/kpis", (req, res) => {
    try {
      const runs = db.prepare("SELECT * FROM production_runs").all() as any[];
      const discards = db.prepare("SELECT * FROM production_discards").all() as any[];
      const batches = db.prepare("SELECT * FROM batches").all() as any[];

      const totalReceivedKg = batches.reduce((sum, b) => sum + (b.weight_net || 0), 0);
      const totalProcessedKg = runs.reduce((sum, r) => sum + (r.weight_total_kg || 0), 0);
      const totalDiscardKg = discards.reduce((sum, d) => sum + (d.kg || 0), 0);

      // Kilos processed per batch
      const processedByBatch: Record<number, number> = {};
      runs.forEach(r => {
        processedByBatch[r.batch_id] = (processedByBatch[r.batch_id] || 0) + (r.weight_total_kg || 0);
      });

      // Caliber distribution
      const caliberDistribution: Record<string, number> = {};
      runs.forEach(r => {
        if (r.calibre) {
          caliberDistribution[r.calibre] = (caliberDistribution[r.calibre] || 0) + (r.boxes_count > 0 ? r.boxes_count : Math.round(r.weight_total_kg / 18));
        }
      });

      const efficiency = totalReceivedKg > 0 ? Math.min(100, Math.round(((totalProcessedKg) / (totalProcessedKg + totalDiscardKg || 1)) * 1000) / 10) : 94.2;
      const merma = totalReceivedKg > 0 ? Math.round(((totalDiscardKg) / (totalReceivedKg || 1)) * 1000) / 10 : 3.8;

      res.json({
        totalReceivedKg,
        totalProcessedKg,
        totalDiscardKg,
        efficiency: efficiency || 94.5,
        merma: merma || 3.5,
        produccion_hoy: totalProcessedKg,
        processedByBatch,
        caliberDistribution
      });
    } catch (err: any) {
      console.error("Error in GET /api/production/kpis:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/production", (req, res) => {
    try {
      const {
        batch_id,
        calibre,
        color,
        quality = 'primera',
        presentation_id,
        presentation_name,
        boxes_count = 0,
        weight_total_kg,
        destination = 'piso_empaque',
        operator = 'Carlos Barragán',
        notes = ''
      } = req.body;

      if (!batch_id || !calibre || !weight_total_kg) {
        return res.status(400).json({ error: "Faltan campos obligatorios para registrar producción" });
      }

      // Check batch limits
      const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batch_id) as any;
      if (!batch) {
        return res.status(404).json({ error: "Lote no encontrado" });
      }

      const prevRuns = db.prepare("SELECT COALESCE(SUM(weight_total_kg), 0) as sum FROM production_runs WHERE batch_id = ?").get(batch_id) as { sum: number };
      const alreadyProcessed = prevRuns?.sum || 0;
      const availableKg = Math.max(0, (batch.weight_net || 0) - alreadyProcessed);

      if (weight_total_kg > availableKg + 10) {
        return res.status(400).json({ 
          error: `Kilos insuficientes. Disponible: ${availableKg.toFixed(2)} kg, Solicitado: ${weight_total_kg.toFixed(2)} kg` 
        });
      }

      // Calculate costs
      const cost_per_kg = 22.05; // 18.50 fruit + 3.55 ops
      const cost_total = Number((weight_total_kg * cost_per_kg).toFixed(2));
      const cost_per_box = boxes_count > 0 ? Number((cost_total / boxes_count).toFixed(2)) : 0;

      // Insert record
      const result = db.prepare(`
        INSERT INTO production_runs (batch_id, calibre, color, quality, presentation_id, presentation_name, boxes_count, weight_total_kg, destination, operator, cost_total, cost_per_box, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
      `).run(
        batch_id,
        calibre,
        color,
        quality,
        presentation_id || null,
        presentation_name || 'Granel',
        boxes_count,
        weight_total_kg,
        destination,
        operator,
        cost_total,
        cost_per_box,
        notes
      );

      // Automatic BOM / Supply deductions
      const deductions: { insumoNombre: string; cantidadDescontada: number }[] = [];
      const errores: { insumoNombre: string; error: string }[] = [];

      if (boxes_count > 0) {
        // Deduct boxes
        try {
          const boxItem = db.prepare("SELECT * FROM inventory WHERE item_name LIKE '%Caja%' LIMIT 1").get() as any;
          if (boxItem) {
            db.prepare("UPDATE inventory SET quantity = MAX(0, quantity - ?) WHERE id = ?").run(boxes_count, boxItem.id);
            deductions.push({ insumoNombre: boxItem.item_name, cantidadDescontada: boxes_count });
          }
        } catch (e: any) {
          errores.push({ insumoNombre: 'Cajas', error: e.message });
        }

        // Deduct pallets HT if destination is storage
        if (boxes_count >= 20) {
          const palletsNeeded = Math.max(1, Math.round(boxes_count / 54));
          try {
            const palletItem = db.prepare("SELECT * FROM inventory WHERE item_name LIKE '%Pallet%' LIMIT 1").get() as any;
            if (palletItem) {
              db.prepare("UPDATE inventory SET quantity = MAX(0, quantity - ?) WHERE id = ?").run(palletsNeeded, palletItem.id);
              deductions.push({ insumoNombre: palletItem.item_name, cantidadDescontada: palletsNeeded });
            }
          } catch (e: any) {
            errores.push({ insumoNombre: 'Pallets HT', error: e.message });
          }
        }
      }

      // Update batch status to en_proceso
      db.prepare("UPDATE batches SET status = 'en_proceso' WHERE id = ? AND status = 'pendiente'").run(batch_id);

      const inserted = db.prepare(`
        SELECT 
          pr.*,
          COALESCE(b.folio, 'REC-' || printf('%05d', b.id)) as batch_folio,
          COALESCE(p.name, 'Productor') as producer_name
        FROM production_runs pr
        LEFT JOIN batches b ON pr.batch_id = b.id
        LEFT JOIN producers p ON b.producer_id = p.id
        WHERE pr.id = ?
      `).get(result.lastInsertRowid);

      res.json({
        record: inserted,
        deducciones: deductions,
        errores: errores,
        kilosDisponiblesRestantes: Math.max(0, availableKg - weight_total_kg)
      });
    } catch (err: any) {
      console.error("Error in POST /api/production:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Discards and Quality Defects
  app.get("/api/production/discards", (req, res) => {
    try {
      const discards = db.prepare(`
        SELECT 
          pd.*,
          COALESCE(b.folio, 'REC-' || printf('%05d', b.id)) as batch_folio,
          COALESCE(p.name, 'Productor') as producer_name
        FROM production_discards pd
        LEFT JOIN batches b ON pd.batch_id = b.id
        LEFT JOIN producers p ON b.producer_id = p.id
        ORDER BY pd.id DESC
      `).all();

      res.json(discards);
    } catch (err: any) {
      console.error("Error in GET /api/production/discards:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/production/discards", (req, res) => {
    try {
      const { batch_id, type, kg, impact_percent = 2.0, trend = 'Estable', notes = '' } = req.body;
      const result = db.prepare(`
        INSERT INTO production_discards (batch_id, type, kg, impact_percent, trend, date, notes)
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
      `).run(batch_id || null, type, kg, impact_percent, trend, notes);

      res.json({ id: result.lastInsertRowid, type, kg });
    } catch (err: any) {
      console.error("Error in POST /api/production/discards:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/production/:id", (req, res) => {
    try {
      const { id } = req.params;
      const run = db.prepare("SELECT * FROM production_runs WHERE id = ?").get(id) as any;
      if (!run) {
        return res.status(404).json({ error: "Registro de corrida no encontrado" });
      }
      db.prepare("DELETE FROM production_runs WHERE id = ?").run(id);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error("Error in DELETE /api/production/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/production/discards/:id", (req, res) => {
    try {
      const { id } = req.params;
      const discard = db.prepare("SELECT * FROM production_discards WHERE id = ?").get(id) as any;
      if (!discard) {
        return res.status(404).json({ error: "Registro de descarte no encontrado" });
      }
      db.prepare("DELETE FROM production_discards WHERE id = ?").run(id);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error("Error in DELETE /api/production/discards/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Sales / POS
  app.get("/api/sales", (req, res) => {
    try {
      const sales = db.prepare("SELECT * FROM sales ORDER BY id DESC LIMIT 50").all();
      res.json(sales);
    } catch (err: any) {
      console.error("Error in GET /api/sales:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sales", (req, res) => {
    try {
      const { customer_name, items_count, subtotal, tax, total, payment_method } = req.body;
      const lastSale = db.prepare("SELECT MAX(id) as last_id FROM sales").get() as { last_id: number };
      const nextId = (lastSale?.last_id || 0) + 1;
      const folio = `VEN-${String(nextId).padStart(5, '0')}`;

      const result = db.prepare(`
        INSERT INTO sales (folio, customer_name, items_count, subtotal, tax, total, payment_method, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(folio, customer_name || 'Venta Mostrador', items_count, subtotal, tax, total, payment_method || 'Efectivo');

      res.json({ id: result.lastInsertRowid, folio, total });
    } catch (err: any) {
      console.error("Error in POST /api/sales:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Global Multi-Entity Search API
  app.get("/api/search", (req, res) => {
    try {
      const query = String(req.query.q || '').trim();
      const categoryFilter = String(req.query.category || 'all').toLowerCase(); // 'all', 'tickets', 'batches', 'clients', 'supplies'
      const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 50);

      if (!query) {
        // Return recent items when query is empty
        const recentTickets = db.prepare(`
          SELECT b.*, COALESCE(p.name, 'SIN ASIGNAR') as producer_name
          FROM batches b
          LEFT JOIN producers p ON b.producer_id = p.id
          ORDER BY b.id DESC LIMIT 4
        `).all() as any[];

        const recentPallets = db.prepare(`
          SELECT * FROM pallets ORDER BY id DESC LIMIT 3
        `).all() as any[];

        const recentProducers = db.prepare(`
          SELECT * FROM producers ORDER BY id DESC LIMIT 3
        `).all() as any[];

        const results: any[] = [];

        recentTickets.forEach(b => {
          results.push({
            id: `ticket-${b.id}`,
            category: 'tickets',
            type: 'ticket',
            title: `Boleta ${b.folio || 'REC-' + String(b.id).padStart(5, '0')}`,
            subtitle: `${b.producer_name} • ${b.variety || 'Limón Mexicano'} • ${b.orchard || 'Pedernales'}`,
            code: b.scale_ticket_folio ? `${b.folio} (Báscula: ${b.scale_ticket_folio})` : (b.folio || `REC-${b.id}`),
            date: b.date,
            badge: { text: `${(b.weight_net || 0).toLocaleString('es-MX')} kg`, variant: 'emerald' },
            metrics: [
              { label: 'Peso Neto', value: `${(b.weight_net || 0).toLocaleString('es-MX')} kg` },
              { label: 'Liquidación', value: `$${(b.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
              { label: 'Precio/kg', value: `$${(b.price_per_kg || 18.50).toFixed(2)}` }
            ],
            route: `/recepcion?ticketId=${b.id}`,
            rawData: b
          });
        });

        recentPallets.forEach(p => {
          results.push({
            id: `pallet-${p.id}`,
            category: 'batches',
            type: 'pallet',
            title: `Tarima ${p.pallet_number}`,
            subtitle: `${p.presentation_name || 'Caja Exportación'} • Calibre ${p.calibre} (${p.color})`,
            code: p.pallet_number,
            date: p.packed_date,
            badge: { text: `Zona ${p.location_zone || 'A1'}`, variant: 'indigo' },
            metrics: [
              { label: 'Cajas', value: `${p.boxes_count} cjs` },
              { label: 'Peso', value: `${p.weight_kg} kg` },
              { label: 'Estado', value: p.status === 'en_camara' ? 'Cámara Fría' : p.status }
            ],
            route: `/camara?pallet=${p.pallet_number}`,
            rawData: p
          });
        });

        recentProducers.forEach(pr => {
          results.push({
            id: `producer-${pr.id}`,
            category: 'clients',
            type: 'producer',
            title: pr.name,
            subtitle: `${pr.location || 'Martínez de la Torre'} • Huerto: ${pr.default_orchard || 'General'}`,
            code: pr.rfc || `ID #${pr.id}`,
            badge: { text: pr.rfc ? `RFC: ${pr.rfc}` : 'Productor', variant: 'amber' },
            metrics: [
              { label: 'Saldo Pendiente', value: `$${(pr.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
              { label: 'Teléfono', value: pr.phone || 'Sin registrar' }
            ],
            route: `/finanzas?producerId=${pr.id}`,
            rawData: pr
          });
        });

        return res.json({
          query: '',
          count: results.length,
          results
        });
      }

      const searchPattern = `%${query}%`;
      const numericQuery = parseInt(query, 10);
      const isNumeric = !isNaN(numericQuery) && String(numericQuery) === query;
      const results: any[] = [];

      // 1. Search Weigh-in Tickets / Batches
      if (categoryFilter === 'all' || categoryFilter === 'tickets') {
        const ticketQuery = `
          SELECT 
            b.*,
            COALESCE(p.name, 'SIN ASIGNAR') as producer_name,
            COALESCE(p.rfc, '') as producer_rfc
          FROM batches b
          LEFT JOIN producers p ON b.producer_id = p.id
          WHERE 
            b.folio LIKE ? 
            OR b.scale_ticket_folio LIKE ? 
            OR b.id = ? 
            OR p.name LIKE ? 
            OR p.rfc LIKE ?
            OR b.orchard LIKE ? 
            OR b.origin LIKE ? 
            OR b.variety LIKE ? 
            OR b.quality LIKE ?
            OR b.operator LIKE ?
            OR b.notes LIKE ?
          ORDER BY b.id DESC
          LIMIT ?
        `;
        const ticketMatches = db.prepare(ticketQuery).all(
          searchPattern, 
          searchPattern, 
          isNumeric ? numericQuery : -1, 
          searchPattern, 
          searchPattern,
          searchPattern, 
          searchPattern, 
          searchPattern, 
          searchPattern, 
          searchPattern,
          searchPattern,
          limit
        ) as any[];

        ticketMatches.forEach(b => {
          results.push({
            id: `ticket-${b.id}`,
            category: 'tickets',
            type: 'ticket',
            title: `Boleta ${b.folio || 'REC-' + String(b.id).padStart(5, '0')}`,
            subtitle: `${b.producer_name} • ${b.variety || 'Limón Mexicano'} (${b.orchard || 'Pedernales'})`,
            code: b.scale_ticket_folio ? `${b.folio} | Báscula: ${b.scale_ticket_folio}` : (b.folio || `REC-${b.id}`),
            date: b.date,
            badge: { 
              text: `${(b.weight_net || 0).toLocaleString('es-MX')} kg`, 
              variant: b.status === 'completado' ? 'emerald' : 'amber' 
            },
            metrics: [
              { label: 'Bruto', value: `${(b.weight_gross || 0).toLocaleString('es-MX')} kg` },
              { label: 'Tara', value: `${(b.weight_tare || 0).toLocaleString('es-MX')} kg` },
              { label: 'Neto', value: `${(b.weight_net || 0).toLocaleString('es-MX')} kg` },
              { label: 'Total', value: `$${(b.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` }
            ],
            route: `/recepcion?ticketId=${b.id}&folio=${encodeURIComponent(b.folio || '')}`,
            rawData: b
          });
        });
      }

      // 2. Search Product Batches & Pallets
      if (categoryFilter === 'all' || categoryFilter === 'batches') {
        // Pallets
        const palletQuery = `
          SELECT 
            p.*,
            COALESCE(b.folio, 'REC-' || printf('%05d', b.id)) as batch_folio,
            COALESCE(pr.name, 'Productor') as producer_name
          FROM pallets p
          LEFT JOIN batches b ON p.batch_id = b.id
          LEFT JOIN producers pr ON b.producer_id = pr.id
          WHERE 
            p.pallet_number LIKE ? 
            OR p.id = ? 
            OR p.calibre LIKE ? 
            OR p.color LIKE ? 
            OR p.presentation_name LIKE ? 
            OR p.location_zone LIKE ? 
            OR p.status LIKE ?
            OR b.folio LIKE ?
          ORDER BY p.id DESC
          LIMIT ?
        `;
        const palletMatches = db.prepare(palletQuery).all(
          searchPattern,
          isNumeric ? numericQuery : -1,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          limit
        ) as any[];

        palletMatches.forEach(p => {
          results.push({
            id: `pallet-${p.id}`,
            category: 'batches',
            type: 'pallet',
            title: `Tarima ${p.pallet_number}`,
            subtitle: `${p.presentation_name || 'Caja Exportación'} • Calibre ${p.calibre} (${p.color}) • Lote ${p.batch_folio}`,
            code: p.pallet_number,
            date: p.packed_date,
            badge: { 
              text: `Ubicación: ${p.location_zone || 'A1'}`, 
              variant: p.status === 'en_camara' ? 'indigo' : 'purple' 
            },
            metrics: [
              { label: 'Cajas', value: `${p.boxes_count} cjs` },
              { label: 'Peso', value: `${p.weight_kg} kg` },
              { label: 'Calidad', value: p.quality || 'Primera' },
              { label: 'Estado', value: p.status === 'en_camara' ? 'En Cámara Fría' : p.status }
            ],
            route: `/camara?pallet=${p.pallet_number}`,
            rawData: p
          });
        });

        // Production Runs
        const runQuery = `
          SELECT 
            pr.*,
            COALESCE(b.folio, 'REC-' || printf('%05d', b.id)) as batch_folio,
            COALESCE(p.name, 'Productor') as producer_name
          FROM production_runs pr
          LEFT JOIN batches b ON pr.batch_id = b.id
          LEFT JOIN producers p ON b.producer_id = p.id
          WHERE 
            pr.id = ? 
            OR pr.calibre LIKE ? 
            OR pr.color LIKE ? 
            OR pr.presentation_name LIKE ? 
            OR pr.destination LIKE ? 
            OR b.folio LIKE ?
            OR pr.notes LIKE ?
          ORDER BY pr.id DESC
          LIMIT ?
        `;
        const runMatches = db.prepare(runQuery).all(
          isNumeric ? numericQuery : -1,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          limit
        ) as any[];

        runMatches.forEach(r => {
          results.push({
            id: `run-${r.id}`,
            category: 'batches',
            type: 'production_run',
            title: `Corrida #${r.id} (${r.calibre} - ${r.color})`,
            subtitle: `${r.presentation_name || 'Granel'} • ${(r.weight_total_kg || 0).toLocaleString('es-MX')} kg • Lote ${r.batch_folio}`,
            code: `Lote ${r.batch_folio} / Corrida #${r.id}`,
            date: r.date,
            badge: { 
              text: `${r.boxes_count || 0} Cajas`, 
              variant: 'blue' 
            },
            metrics: [
              { label: 'Calibre', value: r.calibre },
              { label: 'Color', value: r.color },
              { label: 'Destino', value: r.destination === 'camara_fria' ? 'Cámara Fría' : r.destination },
              { label: 'Costo Total', value: `$${(r.cost_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` }
            ],
            route: `/produccion?runId=${r.id}`,
            rawData: r
          });
        });
      }

      // 3. Search Clients & Producers & Shipment Buyers
      if (categoryFilter === 'all' || categoryFilter === 'clients') {
        // Producers
        const producerQuery = `
          SELECT 
            p.*,
            (SELECT COUNT(*) FROM batches WHERE producer_id = p.id) as total_batches,
            (SELECT COALESCE(SUM(weight_net), 0) FROM batches WHERE producer_id = p.id) as total_kg_delivered
          FROM producers p
          WHERE 
            p.name LIKE ? 
            OR p.rfc LIKE ? 
            OR p.phone LIKE ? 
            OR p.location LIKE ? 
            OR p.default_orchard LIKE ? 
            OR p.id = ?
          ORDER BY p.name ASC
          LIMIT ?
        `;
        const producerMatches = db.prepare(producerQuery).all(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          isNumeric ? numericQuery : -1,
          limit
        ) as any[];

        producerMatches.forEach(pr => {
          results.push({
            id: `producer-${pr.id}`,
            category: 'clients',
            type: 'producer',
            title: pr.name,
            subtitle: `Productor / Citricultor • ${pr.location || 'Martínez de la Torre'}`,
            code: pr.rfc ? `RFC: ${pr.rfc}` : `Productor ID #${pr.id}`,
            badge: { text: 'Productor', variant: 'amber' },
            metrics: [
              { label: 'Saldo', value: `$${(pr.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
              { label: 'Boletas', value: `${pr.total_batches || 0} entregas` },
              { label: 'Kg Acopiados', value: `${(pr.total_kg_delivered || 0).toLocaleString('es-MX')} kg` }
            ],
            route: `/finanzas?producerId=${pr.id}`,
            rawData: pr
          });
        });

        // Sales / POS Customers
        const salesQuery = `
          SELECT * FROM sales 
          WHERE customer_name LIKE ? OR folio LIKE ? OR id = ?
          ORDER BY id DESC LIMIT ?
        `;
        const salesMatches = db.prepare(salesQuery).all(
          searchPattern,
          searchPattern,
          isNumeric ? numericQuery : -1,
          limit
        ) as any[];

        salesMatches.forEach(s => {
          results.push({
            id: `sale-${s.id}`,
            category: 'clients',
            type: 'customer',
            title: s.customer_name || 'Venta Mostrador',
            subtitle: `Venta Mostrador / Cliente • Folio ${s.folio}`,
            code: s.folio,
            date: s.date,
            badge: { text: `Venta: $${(s.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, variant: 'emerald' },
            metrics: [
              { label: 'Folio', value: s.folio },
              { label: 'Pago', value: s.payment_method || 'Efectivo' },
              { label: 'Artículos', value: `${s.items_count || 1} cjs` }
            ],
            route: `/ventas?folio=${encodeURIComponent(s.folio || '')}`,
            rawData: s
          });
        });

        // Shipments Clients
        const shipmentQuery = `
          SELECT * FROM shipments 
          WHERE client_name LIKE ? OR destination LIKE ? OR folio LIKE ? OR id = ?
          ORDER BY id DESC LIMIT ?
        `;
        const shipmentMatches = db.prepare(shipmentQuery).all(
          searchPattern,
          searchPattern,
          searchPattern,
          isNumeric ? numericQuery : -1,
          limit
        ) as any[];

        shipmentMatches.forEach(sh => {
          results.push({
            id: `shipment-${sh.id}`,
            category: 'clients',
            type: 'shipment_client',
            title: sh.client_name || sh.destination,
            subtitle: `Comprador Exportación / Destino: ${sh.destination} • Embarque ${sh.folio}`,
            code: sh.folio,
            date: sh.departure_date,
            badge: { text: `Embarque ${sh.status || 'preparando'}`, variant: 'rose' },
            metrics: [
              { label: 'Destino', value: sh.destination },
              { label: 'Tarimas', value: `${sh.total_pallets || 0} plts` },
              { label: 'Kilos', value: `${(sh.total_kg || 0).toLocaleString('es-MX')} kg` }
            ],
            route: `/logistica?shipment=${encodeURIComponent(sh.folio || '')}`,
            rawData: sh
          });
        });
      }

      // 4. Search Packaging / Inventory items
      if (categoryFilter === 'all' || categoryFilter === 'supplies') {
        const invQuery = `
          SELECT * FROM inventory 
          WHERE item_name LIKE ? OR sku LIKE ? OR supplier LIKE ? OR category LIKE ? OR id = ?
          ORDER BY id ASC LIMIT ?
        `;
        const invMatches = db.prepare(invQuery).all(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          isNumeric ? numericQuery : -1,
          limit
        ) as any[];

        invMatches.forEach(item => {
          const isCritical = item.quantity <= (item.critical_stock || (item.min_stock * 0.4));
          results.push({
            id: `inventory-${item.id}`,
            category: 'supplies',
            type: 'supply',
            title: item.item_name,
            subtitle: `${item.category} • Proveedor: ${item.supplier || 'Cartonera'}`,
            code: item.sku || `SKU-${item.id}`,
            badge: { 
              text: `${item.quantity} ${item.unit || 'pzas'}`, 
              variant: isCritical ? 'rose' : (item.quantity <= item.min_stock ? 'amber' : 'emerald') 
            },
            metrics: [
              { label: 'Existencia', value: `${item.quantity} ${item.unit || 'pzas'}` },
              { label: 'Mínimo', value: `${item.min_stock} ${item.unit || 'pzas'}` },
              { label: 'Costo Unit.', value: `$${(item.cost_unit || 0).toFixed(2)}` }
            ],
            route: `/insumos?itemId=${item.id}`,
            rawData: item
          });
        });
      }

      res.json({
        query,
        count: results.length,
        results
      });
    } catch (err: any) {
      console.error("Error in GET /api/search:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
