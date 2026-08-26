import React from 'react';
import { 
  Search, 
  X, 
  Scale, 
  Boxes, 
  User, 
  Package, 
  ExternalLink, 
  Eye, 
  Clock, 
  Command, 
  ArrowRight,
  Filter,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { SearchCategory, SearchResultItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { SearchResultQuickModal } from './SearchResultQuickModal';

const RECENT_SEARCHES_KEY = 'jbm_recent_searches_v1';

export function GlobalSearchBar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<SearchCategory>('all');
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [previewItem, setPreviewItem] = React.useState<SearchResultItem | null>(null);

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter(s => s !== term);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Keyboard shortcut listener for Ctrl+K, Cmd+K, or /
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Perform search with debounce
  React.useEffect(() => {
    let isCancelled = false;
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const url = `/api/search?q=${encodeURIComponent(query)}&category=${selectedCategory}&limit=25`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        if (!isCancelled) {
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        if (!isCancelled) {
          setResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchResults, query ? 180 : 50);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedCategory]);

  // Keyboard navigation within dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    saveRecentSearch(item.code || item.title);
    setIsOpen(false);
    navigate(item.route);
  };

  const handleOpenPreview = (item: SearchResultItem, e: React.MouseEvent) => {
    e.stopPropagation();
    saveRecentSearch(item.code || item.title);
    setPreviewItem(item);
  };

  const categories: { id: SearchCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'tickets', label: 'Boletas Báscula', icon: Scale },
    { id: 'batches', label: 'Lotes & Tarimas', icon: Boxes },
    { id: 'clients', label: 'Clientes & Citricultores', icon: User },
    { id: 'supplies', label: 'Insumos', icon: Package },
  ];

  return (
    <>
      <div className="relative w-full max-w-2xl">
        {/* Search Input Bar */}
        <div className={`relative flex items-center w-full transition-all duration-200 ${
          isOpen ? 'ring-2 ring-emerald-500 rounded-xl shadow-lg' : ''
        }`}>
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-slate-400" />
            )}
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar por boleta (REC-001, BSC-...), lote, tarima o cliente..."
            className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-800 text-xs font-medium pl-10 pr-24 py-2 rounded-xl border border-slate-200 focus:outline-none transition-all placeholder:text-slate-400"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {query ? (
              <button
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-md shadow-xs pointer-events-none">
                <Command className="w-3 h-3" /> K
              </kbd>
            )}
          </div>
        </div>

        {/* Global Search Results Dropdown */}
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[75vh]"
          >
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Container */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {/* Recent Searches Header (if query is empty and has history) */}
              {!query && recentSearches.length > 0 && (
                <div className="p-3 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Búsquedas Recientes
                    </span>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem(RECENT_SEARCHES_KEY);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Borrar Historial
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(term);
                          searchInputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors shadow-2xs group"
                      >
                        <span>{term}</span>
                        <X 
                          className="w-3 h-3 text-slate-300 group-hover:text-slate-500 hover:text-rose-500" 
                          onClick={(e) => removeRecentSearch(term, e)}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results List */}
              {results.length > 0 ? (
                <div className="py-2">
                  <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>
                      {query ? `Resultados (${results.length})` : 'Entradas y Lotes Recientes'}
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Usa ↑↓ para navegar • Enter para abrir
                    </span>
                  </div>

                  {results.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`group px-4 py-3 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Category Icon */}
                          <div className={`p-2 rounded-xl flex-shrink-0 ${
                            item.category === 'tickets' ? 'bg-amber-100 text-amber-700' :
                            item.category === 'batches' ? 'bg-indigo-100 text-indigo-700' :
                            item.category === 'clients' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {item.category === 'tickets' && <Scale className="w-4 h-4" />}
                            {item.category === 'batches' && <Boxes className="w-4 h-4" />}
                            {item.category === 'clients' && <User className="w-4 h-4" />}
                            {item.category === 'supplies' && <Package className="w-4 h-4" />}
                          </div>

                          {/* Titles & Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {item.code}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                item.badge.variant === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                                item.badge.variant === 'amber' ? 'bg-amber-100 text-amber-800' :
                                item.badge.variant === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                                item.badge.variant === 'rose' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {item.badge.text}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {item.subtitle}
                            </p>

                            {/* Extra metrics chips */}
                            {item.metrics && item.metrics.length > 0 && (
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
                                {item.metrics.slice(0, 3).map((m, mIdx) => (
                                  <span key={mIdx} className="inline-flex items-center gap-1 font-medium">
                                    <span className="text-slate-400">{m.label}:</span>
                                    <span className="font-semibold text-slate-700">{m.value}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 pl-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleOpenPreview(item, e)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Vista Rápida"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSelectItem(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-0.5 text-xs font-semibold"
                            title="Ir al Registro"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    No se encontraron registros para "{query}"
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Intenta buscar por número de boleta (ej. REC-00001), folio de báscula, tarima (ej. PLT-2026-001) o nombre del productor/cliente.
                  </p>
                </div>
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Búsqueda Multientidad JBM
                </span>
                <span className="hidden sm:inline text-slate-400">• Báscula, Lotes, Pallets y Productores</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] font-semibold text-slate-600 shadow-2xs">ESC</kbd>
                <span>para cerrar</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Details Modal Preview */}
      {previewItem && (
        <SearchResultQuickModal 
          item={previewItem} 
          onClose={() => setPreviewItem(null)} 
        />
      )}
    </>
  );
}
