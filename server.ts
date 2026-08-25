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
    min_stock INTEGER DEFAULT 100
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
`);

// Migration helper for SQLite existing tables
function ensureColumn(tableName: string, columnName: string, columnDef: string) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
    const hasColumn = tableInfo.some(col => col.name.toLowerCase() === columnName.toLowerCase());
    if (!hasColumn) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
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

// Seed inventory if empty
const invCount = db.prepare("SELECT COUNT(*) as count FROM inventory").get() as { count: number };
if (invCount.count === 0) {
  db.prepare("INSERT INTO inventory (item_name, category, quantity, unit, min_stock) VALUES (?, ?, ?, ?, ?)").run("Caja Exportación 15kg JBM", "Empaque", 2400, "pzas", 500);
  db.prepare("INSERT INTO inventory (item_name, category, quantity, unit, min_stock) VALUES (?, ?, ?, ?, ?)").run("Pallet Madera Tratada HT 40x48", "Tarimas", 480, "pzas", 100);
  db.prepare("INSERT INTO inventory (item_name, category, quantity, unit, min_stock) VALUES (?, ?, ?, ?, ?)").run("Esquinero de Cartón 2.0m", "Protección", 1850, "pzas", 300);
  db.prepare("INSERT INTO inventory (item_name, category, quantity, unit, min_stock) VALUES (?, ?, ?, ?, ?)").run("Fleje Polipropileno 1/2 pulgada", "Sujeción", 45, "rollos", 10);
  db.prepare("INSERT INTO inventory (item_name, category, quantity, unit, min_stock) VALUES (?, ?, ?, ?, ?)").run("Cera Cítrica Carnauba Grado Alimento", "Químicos", 18, "tambos 200L", 5);
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

  // Inventory
  app.get("/api/inventory", (req, res) => {
    try {
      const items = db.prepare("SELECT * FROM inventory ORDER BY category, item_name").all();
      res.json(items);
    } catch (err: any) {
      console.error("Error in GET /api/inventory:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory/adjust", (req, res) => {
    try {
      const { id, delta } = req.body;
      db.prepare("UPDATE inventory SET quantity = MAX(0, quantity + ?) WHERE id = ?").run(delta, id);
      const updated = db.prepare("SELECT * FROM inventory WHERE id = ?").get(id);
      res.json(updated);
    } catch (err: any) {
      console.error("Error in POST /api/inventory/adjust:", err);
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
