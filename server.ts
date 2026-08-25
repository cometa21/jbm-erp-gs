import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("jbm_citricos.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS producers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producer_id INTEGER,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    weight_gross REAL,
    weight_tare REAL,
    weight_net REAL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(producer_id) REFERENCES producers(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    total REAL,
    date TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const producerCount = db.prepare("SELECT COUNT(*) as count FROM producers").get() as { count: number };
if (producerCount.count === 0) {
  db.prepare("INSERT INTO producers (name, location, balance) VALUES (?, ?, ?)").run("Rancho San José", "Martínez de la Torre", 45000);
  db.prepare("INSERT INTO producers (name, location, balance) VALUES (?, ?, ?)").run("Huerta La Esperanza", "Misantla", -12000);
  db.prepare("INSERT INTO inventory (item_name, quantity, unit) VALUES (?, ?, ?)").run("Caja Exportación 15kg", 1200, "pzas");
  db.prepare("INSERT INTO inventory (item_name, quantity, unit) VALUES (?, ?, ?)").run("Pallet Madera", 450, "pzas");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/dashboard/stats", (req, res) => {
    res.json({
      kilosReceived: 145200,
      boxesPacked: 8450,
      coldStorageStock: 124,
      millStock: 45,
      alerts: [
        { id: 1, type: 'warning', message: 'Temperatura en Cámara 1 subiendo (4.2°C)' },
        { id: 2, type: 'info', message: 'Llegada de camión programada 14:00h' }
      ]
    });
  });

  app.get("/api/producers", (req, res) => {
    const producers = db.prepare("SELECT * FROM producers").all();
    res.json(producers);
  });

  app.get("/api/inventory", (req, res) => {
    const items = db.prepare("SELECT * FROM inventory").all();
    res.json(items);
  });

  app.get("/api/batches", (req, res) => {
    const batches = db.prepare(`
      SELECT b.*, p.name as producer_name 
      FROM batches b 
      JOIN producers p ON b.producer_id = p.id
      ORDER BY b.date DESC
    `).all();
    res.json(batches);
  });

  app.post("/api/batches", (req, res) => {
    const { producer_id, weight_gross, weight_tare } = req.body;
    const weight_net = weight_gross - weight_tare;
    const result = db.prepare("INSERT INTO batches (producer_id, weight_gross, weight_tare, weight_net) VALUES (?, ?, ?, ?)").run(producer_id, weight_gross, weight_tare, weight_net);
    res.json({ id: result.lastInsertRowid, weight_net });
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
