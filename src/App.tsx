/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Reception } from './components/Reception';
import { ColdStorage } from './components/ColdStorage';
import { POS } from './components/POS';
import { Supplies } from './components/Supplies';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recepcion" element={<Reception />} />
            <Route path="/camara" element={<ColdStorage />} />
            <Route path="/ventas" element={<POS />} />
            <Route path="/insumos" element={<Supplies />} />
            {/* Placeholder routes for others */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <h2 className="text-2xl font-bold">Módulo en Desarrollo</h2>
                <p>Esta sección estará disponible próximamente.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

