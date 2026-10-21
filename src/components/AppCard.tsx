import React from 'react';
import {
  ExternalLink,
  User as UserIcon,
  Tag,
  Sparkles,
  Award,
  FileText,
  FileDown,
  Download,
  Upload,
  Paperclip,
} from 'lucide-react';
import { Application } from '../types';
import { AppLogo } from './AppLogo';
import { StarRating } from './StarRating';

interface AppCardProps {
  app: Application;
  onSelect: (app: Application) => void;
  onSelectAuthor: (authorId: string) => void;
  onUploadSpec?: (app: Application) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onSelect,
  onSelectAuthor,
  onUploadSpec,
}) => {
  const getToolColor = (tool: string) => {
    switch (tool.toLowerCase()) {
      case 'google ai studio':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'lovable':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'replit':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'bolt':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'base44':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const fileExtension = app.especificacion
    ? app.especificacion.nombre_archivo.split('.').pop()?.toUpperCase() || 'DOC'
    : '';

  return (
    <div
      onClick={() => onSelect(app)}
      className={`group rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden cursor-pointer shadow-xs hover:shadow-md ${
        app.es_trabajo_final
          ? 'border-amber-300 ring-2 ring-amber-300/40 bg-gradient-to-b from-amber-50/40 via-white to-white hover:border-amber-400'
          : 'bg-white border-slate-200/90 hover:border-blue-400'
      }`}
    >
      {/* Golden Banner for Trabajo Final */}
      {app.es_trabajo_final && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 font-extrabold text-[11px] px-3.5 py-1 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-1.5 tracking-wide uppercase">
            <Award className="w-3.5 h-3.5 text-amber-950" />
            Trabajo Final
          </span>
          <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded">
            Oficial
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Top bar: Logo + Title + Badges */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <AppLogo logo={app.logo} name={app.nombre} size="md" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getToolColor(
                  app.herramienta
                )}`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {app.herramienta}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {app.categoria_nombre}
              </span>
              {app.especificacion && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                  title={`Especificación adjunta: ${app.especificacion.nombre_archivo}`}
                >
                  <FileText className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{fileExtension}</span>
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
              {app.nombre}
            </h3>

            {/* Author */}
            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Por:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAuthor(app.autor_id);
                }}
                className="font-medium text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
              >
                {app.autor_nombre} {app.autor_apellido}
              </button>
            </div>
          </div>
        </div>

        {/* Description excerpt */}
        <p className="text-xs leading-relaxed text-slate-600 line-clamp-2 mb-3 flex-1">
          {app.descripcion}
        </p>

        {/* Specification & Instructions Row for each published work */}
        <div
          className="mb-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {app.especificacion ? (
            <div className="flex items-center justify-between w-full gap-2">
              <a
                href={app.especificacion.url}
                target="_blank"
                rel="noopener noreferrer"
                download={app.especificacion.nombre_archivo}
                className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 truncate"
                title={`Descargar instrucciones: ${app.especificacion.nombre_archivo}`}
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Instrucciones ({fileExtension})</span>
              </a>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={app.especificacion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={app.especificacion.nombre_archivo}
                  className="p-1 text-blue-700 hover:bg-blue-100 rounded transition"
                  title="Descargar archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {onUploadSpec && (
                  <button
                    type="button"
                    onClick={() => onUploadSpec(app)}
                    className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-100/70 rounded transition cursor-pointer"
                    title="Subir nuevo archivo para reemplazar el actual"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Instrucciones no adjuntas</span>
              </span>

              {onUploadSpec && (
                <button
                  type="button"
                  onClick={() => onUploadSpec(app)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 hover:border-blue-500 rounded-lg shadow-2xs transition cursor-pointer shrink-0"
                  title="Subir archivo Word, PDF o Texto con las instrucciones utilizadas"
                >
                  <Paperclip className="w-3 h-3 text-blue-600" />
                  <span>Subir archivo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rating and Actions footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <StarRating
            rating={app.promedio_calificacion}
            totalVotes={app.cantidad_votos}
            size="sm"
          />

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <a
              href={app.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60"
              title="Abrir aplicación en una nueva pestaña"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
