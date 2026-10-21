import React, { useState, useRef } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Tag,
  Wrench,
  User as UserIcon,
  MessageSquare,
  Lock,
  Edit3,
  Trash2,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Award,
  FileText,
  Download,
  HardDrive,
  Upload,
  Paperclip,
  FileDown,
} from 'lucide-react';
import { Application } from '../types';
import { AppLogo } from './AppLogo';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AppDetailModalProps {
  app: Application | null;
  onClose: () => void;
  onSelectAuthor: (authorId: string) => void;
  onEdit: (app: Application) => void;
  onDelete: (app: Application) => void;
  onRequireLogin: () => void;
  onAppUpdated: (updatedApp: Application) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  onClose,
  onSelectAuthor,
  onEdit,
  onDelete,
  onRequireLogin,
  onAppUpdated,
}) => {
  const { user, isVisitor, isAdmin } = useAuth();
  const specFileInputRef = useRef<HTMLInputElement>(null);

  const [ratingScore, setRatingScore] = useState<number>(app?.mi_calificacion?.puntuacion || 0);
  const [ratingComment, setRatingComment] = useState<string>(
    app?.mi_calificacion?.comentario || ''
  );
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isUploadingSpec, setIsUploadingSpec] = useState(false);
  const [specFeedback, setSpecFeedback] = useState<string | null>(null);

  if (!app) return null;

  const isAuthor = user && user.id === app.autor_id;
  const canManage = isAuthor || isAdmin;
  const hasExistingRating = Boolean(app.mi_calificacion);

  const handleSpecUploadDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('El archivo excede el tamaño máximo permitido de 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploadingSpec(true);
        setErrorMessage(null);
        const base64 = reader.result as string;
        const res = await api.uploadAppSpecification(app.id, base64, file.name, file.type);
        setSpecFeedback(res.message);
        onAppUpdated(res.app);
        setTimeout(() => setSpecFeedback(null), 4000);
      } catch (uploadErr: any) {
        setErrorMessage(uploadErr.message || 'Error al subir el archivo a Firebase Storage.');
      } finally {
        setIsUploadingSpec(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveSpecDirect = async () => {
    if (!window.confirm('¿Deseas quitar el archivo de especificación e instrucciones adjunto a este trabajo?')) return;
    try {
      setIsUploadingSpec(true);
      setErrorMessage(null);
      const res = await api.removeAppSpecification(app.id);
      setSpecFeedback('Archivo de especificación removido.');
      onAppUpdated(res.app);
      setTimeout(() => setSpecFeedback(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al remover el archivo.');
    } finally {
      setIsUploadingSpec(false);
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVisitor) {
      onRequireLogin();
      return;
    }
    if (isAuthor) {
      setErrorMessage('No puedes calificar tu propia aplicación.');
      return;
    }
    if (ratingScore < 1 || ratingScore > 5) {
      setErrorMessage('Selecciona entre 1 y 5 estrellas para calificar.');
      return;
    }

    try {
      setSubmittingRating(true);
      setErrorMessage(null);
      const res = await api.rateApp(app.id, {
        puntuacion: ratingScore,
        comentario: ratingComment.trim(),
      });

      setRatingFeedback(res.message);
      // Reload updated app data
      const refreshed = await api.getApp(app.id);
      onAppUpdated(refreshed);
      setTimeout(() => setRatingFeedback(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la calificación.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const formattedDate = new Date(app.fecha_publicacion).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Detalle del Trabajo Práctico
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Info Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <AppLogo logo={app.logo} name={app.nombre} size="xl" />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3" />
                  {app.herramienta}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {app.categoria_nombre}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-500 bg-slate-50 border border-slate-200">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formattedDate}
                </span>
                {app.es_trabajo_final && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Trabajo Final Oficial</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                {app.nombre}
              </h2>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Autor:</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectAuthor(app.autor_id);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {app.autor_nombre} {app.autor_apellido}
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats & action buttons */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-extrabold text-slate-900">
                {app.promedio_calificacion > 0 ? app.promedio_calificacion.toFixed(1) : '–'}
              </div>
              <div>
                <StarRating
                  rating={app.promedio_calificacion}
                  totalVotes={app.cantidad_votos}
                  size="md"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(app)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(app)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </>
              )}

              {/* Requirement: External link button opening in a NEW TAB */}
              <a
                href={app.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>Abrir aplicación</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Full description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Descripción del proyecto
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {app.descripcion}
            </div>
          </div>

          {/* Especificación e Instrucciones Utilizadas (Firebase Storage) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Especificación e Instrucciones de Desarrollo</span>
              </h4>
              {app.especificacion && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Archivo disponible
                </span>
              )}
            </div>

            {/* Hidden file input for direct uploads */}
            <input
              ref={specFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              disabled={isUploadingSpec}
              onChange={handleSpecUploadDirect}
              className="hidden"
            />

            {specFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{specFeedback}</span>
              </div>
            )}

            {isUploadingSpec && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-pulse">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent"></div>
                <span>Procesando y guardando archivo en Firebase Storage...</span>
              </div>
            )}

            {app.especificacion ? (
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white rounded-2xl border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate" title={app.especificacion.nombre_archivo}>
                        {app.especificacion.nombre_archivo}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-900 uppercase shrink-0">
                        {app.especificacion.nombre_archivo.split('.').pop() || 'DOC'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Documento con los requerimientos, prompts e instrucciones de Vibe Coding utilizadas por el alumno.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      <span>{(app.especificacion.tamano_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>Subido el {new Date(app.especificacion.fecha_subida).toLocaleDateString('es-AR')}</span>
                      {app.especificacion.almacenamiento === 'firebase_storage' && (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 font-semibold flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-amber-600" />
                            Firebase Storage
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-2">
                  <a
                    href={app.especificacion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={app.especificacion.nombre_archivo}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </a>

                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => specFileInputRef.current?.click()}
                        disabled={isUploadingSpec}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                        title="Subir un archivo nuevo para reemplazar el actual"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Cambiar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSpecDirect}
                        disabled={isUploadingSpec}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition cursor-pointer"
                        title="Eliminar archivo adjunto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 block">Sin archivo de especificación</span>
                    <span className="text-[11px] text-slate-500">Este proyecto aún no tiene consignas o instrucciones adjuntas.</span>
                  </div>
                </div>

                {canManage ? (
                  <button
                    type="button"
                    onClick={() => specFileInputRef.current?.click()}
                    disabled={isUploadingSpec}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>Subir archivo de instrucciones</span>
                  </button>
                ) : isVisitor ? (
                  <button
                    type="button"
                    onClick={onRequireLogin}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer shrink-0"
                  >
                    Iniciar sesión para adjuntar
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* Rating Section */}
          <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-200/70">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span>Calificar este trabajo práctico</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Tu valoración promueve el aprendizaje colaborativo. Los comentarios son privados y
              solo los ve el autor del proyecto y el docente.
            </p>

            {isVisitor ? (
              <div className="p-3.5 bg-white/90 border border-amber-300 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Debes iniciar sesión para calificar</span>
                </div>
                <button
                  type="button"
                  onClick={onRequireLogin}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition cursor-pointer shrink-0"
                >
                  Iniciar sesión
                </button>
              </div>
            ) : isAuthor ? (
              <div className="p-3 bg-white/80 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>No puedes calificar tu propia aplicación.</span>
              </div>
            ) : (
              <form onSubmit={handleRateSubmit} className="space-y-3">
                {ratingFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {ratingFeedback}
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Tu puntuación:</span>
                  <StarRating
                    rating={ratingScore}
                    interactive={true}
                    onRate={(score) => setRatingScore(score)}
                    size="lg"
                    showNumber={false}
                  />
                  <span className="text-xs font-semibold text-slate-500">
                    {ratingScore > 0 ? `${ratingScore} de 5 estrellas` : 'Haz clic para elegir estrellas'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Comentario constructivo (opcional, privado para el autor)
                  </label>
                  <textarea
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Escribe sugerencias o aspectos destacados que quieras compartir con el autor..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submittingRating || ratingScore === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingRating
                      ? 'Guardando...'
                      : hasExistingRating
                      ? 'Actualizar calificación'
                      : 'Enviar calificación'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Private Comments Section: ONLY visible if isAuthor or isAdmin */}
          {app.puede_ver_comentarios && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Comentarios y feedback privado recibido
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3" />
                  Visible solo para ti y el docente
                </span>
              </div>

              {app.comentarios && app.comentarios.length > 0 ? (
                <div className="space-y-2.5">
                  {app.comentarios.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-slate-800">
                          {c.usuario_nombre} {c.usuario_apellido}
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={c.puntuacion} size="sm" showNumber={false} />
                          <span className="text-[11px] text-slate-400">
                            {new Date(c.fecha_calificacion).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{c.comentario}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2 text-center">
                  Aún no se han recibido comentarios escritos para este proyecto.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
