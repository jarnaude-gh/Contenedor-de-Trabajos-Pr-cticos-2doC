import React, { useEffect, useState } from 'react';
import {
  Plus,
  ExternalLink,
  Edit3,
  Trash2,
  MessageSquare,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  FileText,
  Download,
  Upload,
  Paperclip,
} from 'lucide-react';
import { Application } from '../types';
import { api } from '../services/api';
import { AppLogo } from './AppLogo';
import { StarRating } from './StarRating';

interface MyAppsViewProps {
  onOpenCreate: () => void;
  onEditApp: (app: Application) => void;
  onDeleteApp: (app: Application) => void;
  onSelectApp: (app: Application) => void;
  onUploadSpec?: (app: Application) => void;
  refreshTrigger?: number;
}

export const MyAppsView: React.FC<MyAppsViewProps> = ({
  onOpenCreate,
  onEditApp,
  onDeleteApp,
  onSelectApp,
  onUploadSpec,
  refreshTrigger,
}) => {
  const [myApps, setMyApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadMyApps();
  }, [refreshTrigger]);

  const loadMyApps = async () => {
    try {
      setLoading(true);
      const data = await api.getMyApps();
      setMyApps(data);
    } catch (err) {
      console.error('Error fetching my apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = (appId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Cargando tus trabajos prácticos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Mis Trabajos Prácticos
          </h2>
          <p className="text-xs text-slate-500">
            Administra tus proyectos publicados, revisa calificaciones y consulta las devoluciones
            privadas de tus compañeros y docentes.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar nuevo trabajo</span>
        </button>
      </div>

      {myApps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Todavía no has publicado proyectos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Comparte tu aplicación construida con Google AI Studio, Lovable u otra herramienta de Vibe
            Coding para que la comunidad educativa pueda explorarla.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Publicar mi primer trabajo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {myApps.map((app) => {
            const commentsCount = app.comentarios ? app.comentarios.length : 0;
            const isCommentsOpen = Boolean(expandedComments[app.id]);

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Logo + Info */}
                  <div
                    className="flex items-start gap-4 flex-1 cursor-pointer"
                    onClick={() => onSelectApp(app)}
                  >
                    <AppLogo logo={app.logo} name={app.nombre} size="md" />

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {app.es_trabajo_final && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 shadow-xs">
                            <Award className="w-3 h-3 text-amber-600" />
                            Trabajo Final
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {app.herramienta}
                        </span>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {app.categoria_nombre}
                        </span>
                        {app.especificacion && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                            title={`Especificación adjunta: ${app.especificacion.nombre_archivo}`}
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>Instrucciones adjuntas</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 hover:text-blue-700 transition">
                        {app.nombre}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <StarRating
                          rating={app.promedio_calificacion}
                          totalVotes={app.cantidad_votos}
                          size="sm"
                        />
                        <span>•</span>
                        <span>
                          Publicado: {new Date(app.fecha_publicacion).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Specification file actions */}
                    {app.especificacion ? (
                      <div className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50/70 p-0.5">
                        <a
                          href={app.especificacion.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={app.especificacion.nombre_archivo}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-800 hover:text-indigo-950 transition"
                          title={`Descargar especificación (${app.especificacion.nombre_archivo})`}
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Instrucciones</span>
                        </a>
                        {onUploadSpec && (
                          <button
                            type="button"
                            onClick={() => onUploadSpec(app)}
                            className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100/60 rounded transition cursor-pointer"
                            title="Cambiar archivo de instrucciones"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : onUploadSpec ? (
                      <button
                        type="button"
                        onClick={() => onUploadSpec(app)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                        title="Subir archivo Word, PDF o Texto con las instrucciones y prompts"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Subir Instrucciones</span>
                      </button>
                    ) : null}

                    {/* Open link */}
                    <a
                      href={app.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      title="Abrir en pestaña nueva"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEditApp(app)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modificar</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteApp(app)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Comments / Feedback Bar */}
                <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {commentsCount === 0
                        ? 'Sin comentarios recibidos'
                        : `${commentsCount} comentario${commentsCount > 1 ? 's' : ''} privado${
                            commentsCount > 1 ? 's' : ''
                          }`}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> (Solo visible por ti y el docente)
                    </span>
                  </div>

                  {commentsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleComments(app.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <span>{isCommentsOpen ? 'Ocultar feedback' : 'Ver feedback'}</span>
                      {isCommentsOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded comments list */}
                {isCommentsOpen && app.comentarios && app.comentarios.length > 0 && (
                  <div className="p-5 bg-white border-t border-slate-100 space-y-2.5">
                    {app.comentarios.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {c.usuario_nombre} {c.usuario_apellido}
                          </span>
                          <div className="flex items-center gap-2">
                            <StarRating rating={c.puntuacion} size="sm" showNumber={false} />
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.fecha_calificacion).toLocaleDateString('es-AR')}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 italic">"{c.comentario}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
