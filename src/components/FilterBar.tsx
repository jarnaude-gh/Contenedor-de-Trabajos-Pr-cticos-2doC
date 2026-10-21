import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Star, Wrench, Tag, User } from 'lucide-react';
import { Category } from '../types';

export interface FilterState {
  search: string;
  autor: string;
  categoria_id: string;
  herramienta: string;
  calificacion_minima: string;
  fecha_desde: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: Category[];
  tools: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  categories,
  tools,
  totalResults,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.autor !== '' ||
    filters.categoria_id !== 'todas' ||
    filters.herramienta !== 'todas' ||
    filters.calificacion_minima !== '0' ||
    filters.fecha_desde !== 'todas';

  const handleClear = () => {
    onChange({
      search: '',
      autor: '',
      categoria_id: 'todas',
      herramienta: 'todas',
      calificacion_minima: '0',
      fecha_desde: 'todas',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-8">
      {/* Search inputs row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Search by app name */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar por nombre de aplicación..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
          />
        </div>

        {/* Search by author */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.autor}
            onChange={(e) => onChange({ ...filters, autor: e.target.value })}
            placeholder="Buscar por nombre de alumno / autor..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Select filters row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-blue-600" />
            Categoría
          </label>
          <select
            value={filters.categoria_id}
            onChange={(e) => onChange({ ...filters, categoria_id: e.target.value })}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Vibe Coding Tool */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-blue-600" />
            Herramienta Vibe Coding
          </label>
          <select
            value={filters.herramienta}
            onChange={(e) => onChange({ ...filters, herramienta: e.target.value })}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
          >
            <option value="todas">Todas las herramientas</option>
            {tools.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum rating */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            Calificación mínima
          </label>
          <select
            value={filters.calificacion_minima}
            onChange={(e) => onChange({ ...filters, calificacion_minima: e.target.value })}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
          >
            <option value="0">Cualquier calificación</option>
            <option value="1">★ 1 estrella o más</option>
            <option value="2">★★ 2 estrellas o más</option>
            <option value="3">★★★ 3 estrellas o más</option>
            <option value="4">★★★★ 4 estrellas o más</option>
            <option value="5">★★★★★ 5 estrellas</option>
          </select>
        </div>

        {/* Publication date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-600" />
            Fecha de publicación
          </label>
          <select
            value={filters.fecha_desde}
            onChange={(e) => onChange({ ...filters, fecha_desde: e.target.value })}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
          >
            <option value="todas">Cualquier fecha</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="year">Este año lectivo</option>
          </select>
        </div>
      </div>

      {/* Footer bar: Results counter + Clear filters button */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Mostrando <strong className="text-slate-800">{totalResults}</strong> trabajos encontrados
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
};
