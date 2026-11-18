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
  Github,
  Workflow,
  Zap,
  Video,
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
          ? 'border-amber-300 dark:border-amber-500/60 ring-2 ring-amber-300/40 dark:ring-amber-500/20 bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 hover:border-amber-400 dark:hover:border-amber-400'
          : app.es_ejercitacion_pipeline
          ? 'border-indigo-300/90 dark:border-indigo-500/50 ring-1 ring-indigo-400/30 dark:ring-indigo-500/20 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-400'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
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

      {/* Distinctive Top Banner for Ejercitación Google AI Studio + GitHub + Vercel */}
      {app.es_ejercitacion_pipeline && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white font-extrabold text-[11px] px-3.5 py-1.5 flex items-center justify-between shadow-xs border-b border-indigo-500/30">
          <span className="flex items-center gap-1.5 tracking-wide">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Studio ➔ GitHub ➔ Vercel</span>
          </span>
          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/25 px-2 py-0.5 rounded-full border border-indigo-400/30">
            Ejercitación
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {app.categoria_nombre}
              </span>
              {app.es_ejercitacion_pipeline && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-amber-300 border border-slate-700 shadow-2xs"
                  title="Ejercitación: Google AI Studio ➔ GitHub ➔ Vercel"
                >
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span>CI/CD Vercel</span>
                </span>
              )}
              {app.especificacion && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  title={`Especificación adjunta: ${app.especificacion.nombre_archivo}`}
                >
                  <FileText className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{fileExtension}</span>
                </span>
              )}
              {app.video_explicativo && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  title={
                    app.video_explicativo.herramienta_avatar
                      ? `Video / Avatar IA (${app.video_explicativo.herramienta_avatar})`
                      : 'Incluye Video / Avatar Explicativo con IA'
                  }
                >
                  <Video className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Video IA</span>
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {app.nombre}
            </h3>

            {/* Author */}
            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Por:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAuthor(app.autor_id);
                }}
                className="font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
              >
                {app.autor_nombre} {app.autor_apellido}
              </button>
            </div>
          </div>
        </div>

        {/* Description excerpt */}
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 flex-1">
          {app.descripcion}
        </p>

        {/* Specification & Instructions Row for each published work */}
        <div
          className="mb-3.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {app.especificacion ? (
            <div className="flex items-center justify-between w-full gap-2">
              <a
                href={app.especificacion.url}
                target="_blank"
                rel="noopener noreferrer"
                download={app.especificacion.nombre_archivo}
                className="inline-flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 truncate"
                title={`Descargar instrucciones: ${app.especificacion.nombre_archivo}`}
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Instrucciones ({fileExtension})</span>
              </a>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={app.especificacion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={app.especificacion.nombre_archivo}
                  className="p-1 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition"
                  title="Descargar archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {onUploadSpec && (
                  <button
                    type="button"
                    onClick={() => onUploadSpec(app)}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 rounded transition cursor-pointer"
                    title="Subir nuevo archivo para reemplazar el actual"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">Instrucciones no adjuntas</span>
              </span>

              {onUploadSpec && (
                <button
                  type="button"
                  onClick={() => onUploadSpec(app)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-blue-300 dark:border-blue-700/60 rounded-lg shadow-2xs transition cursor-pointer shrink-0"
                  title="Subir archivo Word, PDF o Texto con las instrucciones utilizadas"
                >
                  <Paperclip className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Subir archivo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rating and Actions footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-auto">
          <StarRating
            rating={app.promedio_calificacion}
            totalVotes={app.cantidad_votos}
            size="sm"
          />

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {app.repositorio_github && (
              <a
                href={app.repositorio_github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700"
                title="Ver repositorio de código fuente en GitHub"
              >
                <Github className="w-3 h-3 text-slate-800 dark:text-slate-200" />
                <span>GitHub</span>
              </a>
            )}
            <a
              href={app.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                app.es_ejercitacion_pipeline
                  ? 'text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border-slate-800 dark:border-slate-700 shadow-2xs'
                  : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200/60 dark:border-blue-800/60'
              }`}
              title="Abrir aplicación en una nueva pestaña"
            >
              <span>{app.es_ejercitacion_pipeline ? 'Vercel / Web' : 'Abrir'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
