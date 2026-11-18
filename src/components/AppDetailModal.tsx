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
  Github,
  Zap,
  Workflow,
  GitBranch,
  Video,
  Link as LinkIcon,
  PlayCircle,
} from 'lucide-react';
import { Application } from '../types';
import { AppLogo } from './AppLogo';
import { StarRating } from './StarRating';
import { VideoPlayer } from './VideoPlayer';
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
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const [ratingScore, setRatingScore] = useState<number>(app?.mi_calificacion?.puntuacion || 0);
  const [ratingComment, setRatingComment] = useState<string>(
    app?.mi_calificacion?.comentario || ''
  );
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isUploadingSpec, setIsUploadingSpec] = useState(false);
  const [specFeedback, setSpecFeedback] = useState<string | null>(null);

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoFeedback, setVideoFeedback] = useState<string | null>(null);
  const [showVideoLinkBox, setShowVideoLinkBox] = useState(false);
  const [videoLinkInput, setVideoLinkInput] = useState('');

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

  const handleVideoUploadDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage('El video supera el tamaño máximo de 30 MB para subida directa. Puedes subirlo a YouTube/Drive y pegar el enlace.');
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingVideo(true);
      setErrorMessage(null);
      const res = await api.uploadAppVideoFile(app.id, file);
      setVideoFeedback(res.message);
      onAppUpdated(res.app);
      setTimeout(() => setVideoFeedback(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al subir el video explicativo.');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSaveVideoLinkDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoLinkInput.trim()) return;
    try {
      setIsUploadingVideo(true);
      setErrorMessage(null);
      const res = await api.setAppVideoLink(app.id, videoLinkInput.trim());
      setVideoFeedback(res.message);
      setShowVideoLinkBox(false);
      setVideoLinkInput('');
      onAppUpdated(res.app);
      setTimeout(() => setVideoFeedback(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el enlace del video.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveVideoDirect = async () => {
    if (!window.confirm('¿Deseas quitar el video explicativo adjunto a este trabajo?')) return;
    try {
      setIsUploadingVideo(true);
      setErrorMessage(null);
      const res = await api.removeAppVideo(app.id);
      setVideoFeedback('Video explicativo removido.');
      onAppUpdated(res.app);
      setTimeout(() => setVideoFeedback(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al remover el video.');
    } finally {
      setIsUploadingVideo(false);
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
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Detalle del Trabajo Práctico
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
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
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-3 h-3" />
                  {app.herramienta}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {app.categoria_nombre}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formattedDate}
                </span>
                {app.es_trabajo_final && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs">
                    <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Trabajo Final Oficial</span>
                  </span>
                )}
                {app.es_ejercitacion_pipeline && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-violet-100 dark:bg-violet-950/70 text-violet-900 dark:text-violet-300 border border-violet-300 dark:border-violet-700 shadow-xs">
                    <Zap className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 fill-violet-600 dark:fill-violet-400" />
                    <span>Ejercitación AI Studio ➔ GitHub ➔ Vercel</span>
                  </span>
                )}
                {app.video_explicativo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 shadow-xs">
                    <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Video / Avatar IA</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {app.nombre}
              </h2>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Autor:</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectAuthor(app.autor_id);
                  }}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                >
                  {app.autor_nombre} {app.autor_apellido}
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats & action buttons */}
          {/* Quick stats & action buttons */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(app)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </>
              )}

              {app.repositorio_github && (
                <a
                  href={app.repositorio_github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl transition cursor-pointer shadow-xs"
                  title="Ver código fuente en GitHub"
                >
                  <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                  <span>Ver en GitHub</span>
                </a>
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

          {/* Educational pipeline card if applicable */}
          {app.es_ejercitacion_pipeline && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-violet-200 dark:border-violet-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-violet-600 text-white shadow-xs">
                    <Workflow className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Ejercitación Especial: Google AI Studio ➔ GitHub ➔ Vercel
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Flujo completo de ingeniería: Prototipado con IA, control de versiones y despliegue continuo en la nube.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-200 dark:bg-violet-900/80 text-violet-900 dark:text-violet-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-violet-700 dark:text-violet-400 fill-violet-700 dark:fill-violet-400" />
                  CI/CD Automatizado
                </span>
              </div>

              {/* Steps diagram */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-violet-100 dark:border-violet-900/60 flex items-center gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Google AI Studio</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Diseño y desarrollo con IA</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-violet-100 dark:border-violet-900/60 flex items-center gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">GitHub</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Repositorio y versionado</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-violet-100 dark:border-violet-900/60 flex items-center gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-black dark:bg-slate-950 text-white font-black flex items-center justify-center shrink-0 border dark:border-slate-700">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Vercel</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Deploy continuo a producción</div>
                  </div>
                </div>
              </div>

              {app.repositorio_github && (
                <div className="pt-1 flex items-center justify-between text-xs bg-white/95 dark:bg-slate-800/90 p-2.5 rounded-xl border border-violet-200 dark:border-violet-800/70">
                  <div className="flex items-center gap-2 truncate">
                    <Github className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span className="font-medium text-slate-600 dark:text-slate-400 shrink-0">Repositorio:</span>
                    <a
                      href={app.repositorio_github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-700 dark:text-violet-300 font-bold hover:underline truncate"
                    >
                      {app.repositorio_github}
                    </a>
                  </div>
                  <a
                    href={app.repositorio_github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-200"
                  >
                    <span>Explorar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Full description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Descripción del proyecto
            </h4>
            <div className="p-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line">
              {app.descripcion}
            </div>
          </div>

          {/* Video / Avatar Explicativo de Presentación */}
          {(app.video_explicativo || canManage) && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Avatar / Video Explicativo con IA</span>
                </h4>

                {app.video_explicativo && canManage && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      disabled={isUploadingVideo}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Cambiar archivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVideoLinkBox((prev) => !prev)}
                      disabled={isUploadingVideo}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Cambiar enlace</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveVideoDirect}
                      disabled={isUploadingVideo}
                      className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      title="Eliminar video explicativo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                disabled={isUploadingVideo}
                onChange={handleVideoUploadDirect}
                className="hidden"
              />

              {videoFeedback && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{videoFeedback}</span>
                </div>
              )}

              {isUploadingVideo && (
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-pulse">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-indigo-700 dark:border-indigo-400 border-t-transparent"></div>
                  <span>Subiendo y procesando video explicativo...</span>
                </div>
              )}

              {showVideoLinkBox && canManage && (
                <form onSubmit={handleSaveVideoLinkDirect} className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={videoLinkInput}
                    onChange={(e) => setVideoLinkInput(e.target.value)}
                    placeholder="https://youtu.be/... o https://app.heygen.com/share/..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isUploadingVideo}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer shrink-0"
                  >
                    Guardar enlace
                  </button>
                </form>
              )}

              {app.video_explicativo ? (
                <VideoPlayer video={app.video_explicativo} />
              ) : (
                canManage && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                      <PlayCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Aún no agregaste tu video / avatar IA
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Sube un video corto explicando en qué consiste tu trabajo práctico.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        disabled={isUploadingVideo}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowVideoLinkBox((prev) => !prev)}
                        disabled={isUploadingVideo}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-700 rounded-xl transition cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Pegar enlace</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Especificación e Instrucciones Utilizadas (Firebase Storage) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Especificación e Instrucciones de Desarrollo</span>
              </h4>
              {app.especificacion && (
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{specFeedback}</span>
              </div>
            )}

            {isUploadingSpec && (
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-pulse">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-700 dark:border-blue-400 border-t-transparent"></div>
                <span>Procesando y guardando archivo en Firebase Storage...</span>
              </div>
            )}

            {app.especificacion ? (
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white dark:from-blue-950/40 dark:via-slate-800/80 dark:to-slate-850 rounded-2xl border border-blue-200 dark:border-blue-900/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate" title={app.especificacion.nombre_archivo}>
                        {app.especificacion.nombre_archivo}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200 uppercase shrink-0">
                        {app.especificacion.nombre_archivo.split('.').pop() || 'DOC'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      Documento con los requerimientos, prompts e instrucciones de Vibe Coding utilizadas por el alumno.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>{(app.especificacion.tamano_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>Subido el {new Date(app.especificacion.fecha_subida).toLocaleDateString('es-AR')}</span>
                      {app.especificacion.almacenamiento === 'firebase_storage' && (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-amber-600 dark:text-amber-400" />
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                        title="Subir un archivo nuevo para reemplazar el actual"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Cambiar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSpecDirect}
                        disabled={isUploadingSpec}
                        className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 rounded-xl transition cursor-pointer"
                        title="Eliminar archivo adjunto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Sin archivo de especificación</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Este proyecto aún no tiene consignas o instrucciones adjuntas.</span>
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
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                  >
                    Iniciar sesión para adjuntar
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* Rating Section */}
          <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-slate-800/80 rounded-2xl border border-amber-200/70 dark:border-amber-900/50">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <span>Calificar este trabajo práctico</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Tu valoración promueve el aprendizaje colaborativo. Los comentarios son privados y
              solo los ve el autor del proyecto y el docente.
            </p>

            {isVisitor ? (
              <div className="p-3.5 bg-white/90 dark:bg-slate-850 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
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
              <div className="p-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>No puedes calificar tu propia aplicación.</span>
              </div>
            ) : (
              <form onSubmit={handleRateSubmit} className="space-y-3">
                {ratingFeedback && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{ratingFeedback}</span>
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tu puntuación:</span>
                  <StarRating
                    rating={ratingScore}
                    interactive={true}
                    onRate={(score) => setRatingScore(score)}
                    size="lg"
                    showNumber={false}
                  />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {ratingScore > 0 ? `${ratingScore} de 5 estrellas` : 'Haz clic para elegir estrellas'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Comentario constructivo (opcional, privado para el autor)
                  </label>
                  <textarea
                    rows={2}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Escribe sugerencias o aspectos destacados que quieras compartir con el autor..."
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Comentarios y feedback privado recibido
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-800">
                  <Lock className="w-3 h-3" />
                  Visible solo para ti y el docente
                </span>
              </div>

              {app.comentarios && app.comentarios.length > 0 ? (
                <div className="space-y-2.5">
                  {app.comentarios.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {c.usuario_nombre} {c.usuario_apellido}
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={c.puntuacion} size="sm" showNumber={false} />
                          <span className="text-[11px] text-slate-400">
                            {new Date(c.fecha_calificacion).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{c.comentario}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2 text-center">
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
