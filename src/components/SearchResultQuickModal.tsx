import React from 'react';
import { 
  X, 
  ExternalLink, 
  Printer, 
  Scale, 
  Package, 
  User, 
  Truck, 
  DollarSign, 
  Calendar, 
  Tag, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  Boxes,
  FileText
} from 'lucide-react';
import type { SearchResultItem } from '../types';
import { useNavigate } from 'react-router-dom';

interface SearchResultQuickModalProps {
  item: SearchResultItem | null;
  onClose: () => void;
}

export function SearchResultQuickModal({ item, onClose }: SearchResultQuickModalProps) {
  const navigate = useNavigate();

  if (!item) return null;

  const handleNavigate = () => {
    onClose();
    navigate(item.route);
  };

  const handlePrint = () => {
    window.print();
  };

  const raw = item.rawData || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className={`p-3 rounded-xl ${
              item.category === 'tickets' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              item.category === 'batches' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
              item.category === 'clients' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {item.category === 'tickets' && <Scale className="w-6 h-6" />}
              {item.category === 'batches' && <Boxes className="w-6 h-6" />}
              {item.category === 'clients' && <User className="w-6 h-6" />}
              {item.category === 'supplies' && <Package className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category === 'tickets' ? 'Boleta de Báscula' :
                   item.category === 'batches' ? (item.type === 'pallet' ? 'Tarima Terminada' : 'Corrida de Producción') :
                   item.category === 'clients' ? (item.type === 'producer' ? 'Productor Citricultor' : 'Cliente / Venta') :
                   'Insumo / Material'}
                </span>
                <span className="text-xs text-slate-400">{item.code}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{item.title}</h2>
              <p className="text-xs text-slate-300 mt-0.5">{item.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Key Metrics Grid */}
          {item.metrics && item.metrics.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Métricas Principales
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {item.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">{metric.label}</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specific Details based on Entity Type */}
          {item.type === 'ticket' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Detalle de Pesaje en Báscula 80 Ton
                </span>
                <span className="text-xs text-slate-500">
                  {raw.date ? new Date(raw.date).toLocaleString('es-MX') : 'Fecha no registrada'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Folio de Boleta</span>
                  <span className="font-semibold text-slate-800">{raw.folio || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Folio Báscula</span>
                  <span className="font-semibold text-slate-800">{raw.scale_ticket_folio || 'Directo'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Productor</span>
                  <span className="font-semibold text-slate-800">{raw.producer_name || 'Sin Asignar'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Huerto / Predio</span>
                  <span className="font-semibold text-slate-800">{raw.orchard || 'Pedernales'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Variedad</span>
                  <span className="font-semibold text-slate-800">{raw.variety || 'Limón Mexicano'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Calidad Declarada</span>
                  <span className="font-semibold text-slate-800">{raw.quality || 'Estándar'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Peso Bruto</span>
                  <span className="font-bold text-slate-700">{raw.weight_gross?.toLocaleString('es-MX')} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tara Camión</span>
                  <span className="font-bold text-slate-700">{raw.weight_tare?.toLocaleString('es-MX')} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Peso Neto Fruta</span>
                  <span className="font-bold text-emerald-600 text-sm">{raw.weight_net?.toLocaleString('es-MX')} kg</span>
                </div>
              </div>

              {/* Economic Summary */}
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 block font-medium">Precio Pactado por Kilo</span>
                  <span className="text-sm font-bold text-emerald-900">${(raw.price_per_kg || 18.50).toFixed(2)} MXN/kg</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-800 block font-medium">Total Liquidación Fruta</span>
                  <span className="text-base font-extrabold text-emerald-950">
                    ${(raw.total || (raw.weight_net * (raw.price_per_kg || 18.50))).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              </div>
            </div>
          )}

          {item.type === 'pallet' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  Especificaciones de Tarima / Pallet
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  raw.status === 'en_camara' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {raw.status === 'en_camara' ? '❄️ En Cámara Fría' : raw.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Número de Tarima</span>
                  <span className="font-bold text-indigo-900">{raw.pallet_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ubicación / Rack</span>
                  <span className="font-bold text-slate-800">Zona {raw.location_zone || 'A1'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Calibre & Color</span>
                  <span className="font-semibold text-slate-800">{raw.calibre} • {raw.color}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Presentación</span>
                  <span className="font-semibold text-slate-800">{raw.presentation_name || 'Caja Exportación'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Cajas</span>
                  <span className="font-bold text-slate-800">{raw.boxes_count} cajas</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Peso Total</span>
                  <span className="font-bold text-slate-800">{raw.weight_kg} kg</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block">Tratamiento Poscosecha</span>
                  <span className="font-medium text-slate-700">{raw.treatment || 'Cera Carnauba Grado Alimento'}</span>
                </div>
              </div>
            </div>
          )}

          {item.type === 'producer' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-600" />
                  Ficha de Citricultor / Proveedor
                </span>
                <span className="text-xs text-slate-500">ID #{raw.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">RFC</span>
                  <span className="font-semibold text-slate-800">{raw.rfc || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Teléfono de Contacto</span>
                  <span className="font-semibold text-slate-800">{raw.phone || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ubicación Predio</span>
                  <span className="font-semibold text-slate-800">{raw.location || 'Pedernales, Ver.'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Huerto Predeterminado</span>
                  <span className="font-semibold text-slate-800">{raw.default_orchard || 'Huerto Propio'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Saldo Pendiente de Pago</span>
                  <span className="font-bold text-amber-700 text-sm">
                    ${(raw.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Entregas Realizadas</span>
                  <span className="font-bold text-slate-800">{raw.total_batches || 0} boletas</span>
                </div>
              </div>
            </div>
          )}

          {item.type === 'supply' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Estado de Inventario de Insumo
                </span>
                <span className="text-xs font-mono text-slate-500">{raw.sku || `ID-${raw.id}`}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Categoría</span>
                  <span className="font-semibold text-slate-800">{raw.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Stock Actual</span>
                  <span className="font-bold text-slate-900 text-sm">{raw.quantity} {raw.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Stock Mínimo</span>
                  <span className="font-semibold text-slate-700">{raw.min_stock} {raw.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nivel Crítico</span>
                  <span className="font-bold text-rose-600">{raw.critical_stock || Math.round(raw.min_stock * 0.4)} {raw.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Costo Unitario</span>
                  <span className="font-semibold text-slate-800">${(raw.cost_unit || 0).toFixed(2)} MXN</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Proveedor</span>
                  <span className="font-semibold text-slate-800">{raw.supplier || 'Cartonera'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <div className="flex items-center gap-2">
            {item.type === 'ticket' && (
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Ficha
              </button>
            )}
            <button
              onClick={handleNavigate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <span>Ir al Módulo Principal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
