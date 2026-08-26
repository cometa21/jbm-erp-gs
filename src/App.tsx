/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { Dashboard } from './components/Dashboard';
import { Reception } from './components/Reception';
import { ColdStorage } from './components/ColdStorage';
import { POS } from './components/POS';
import { Supplies } from './components/Supplies';
import { Production } from './components/Production';
import { Logistics } from './components/Logistics';
import { Finances } from './components/Finances';
import { Documents } from './components/Documents';
import { SettingsPage } from './components/SettingsPage';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/recepcion" element={<Reception />} />
              <Route path="/produccion" element={<Production />} />
              <Route path="/camara" element={<ColdStorage />} />
              <Route path="/ventas" element={<POS />} />
              <Route path="/logistica" element={<Logistics />} />
              <Route path="/finanzas" element={<Finances />} />
              <Route path="/documentos" element={<Documents />} />
              <Route path="/insumos" element={<Supplies />} />
              <Route path="/config" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}



