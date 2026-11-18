import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Award,
  FileText,
  FileDown,
  Trash2,
  Paperclip,
  CheckCircle2,
  HardDrive,
  Github,
  GitBranch,
  Workflow,
  Zap,
  Video,
  Link as LinkIcon,
  PlayCircle,
} from 'lucide-react';
import { Application, Category, SpecificationFile, VideoExplicativo } from '../types';
import { api } from '../services/api';
import { AppLogo } from './AppLogo';
import { VideoPlayer } from './VideoPlayer';

const VIDEO_AVATAR_TOOLS = [
  'HeyGen',
  'D-ID',
  'Synthesia',
  'Vidnoz AI',
  'CapCut',
  'Canva',
  'Google Veo / Gemini',
  'Runway',
  'Grabación propia',
  'Otra',
];

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (app: Application) => void;
  initialApp?: Application | null;
  categories: Category[];
  tools: string[];
}

export const AppFormModal: React.FC<AppFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialApp,
  categories,
  tools,
}) => {
  const isEditing = Boolean(initialApp);

  const [nombre, setNombre] = useState('');
  const [logo, setLogo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enlace, setEnlace] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [herramienta, setHerramienta] = useState('Google AI Studio');
  const [esTrabajoFinal, setEsTrabajoFinal] = useState(false);
  const [esEjercitacionPipeline, setEsEjercitacionPipeline] = useState(false);
  const [repositorioGithub, setRepositorioGithub] = useState('');
  const [especificacion, setEspecificacion] = useState<SpecificationFile | null>(null);
  const [videoExplicativo, setVideoExplicativo] = useState<VideoExplicativo | null>(null);
  const [videoInputMode, setVideoInputMode] = useState<'upload' | 'link'>('upload');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoAvatarTool, setVideoAvatarTool] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingSpec, setIsUploadingSpec] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or load initial values whenever the modal opens or initialApp changes
  useEffect(() => {
    if (isOpen) {
      if (initialApp) {
        // Editing existing app
        setNombre(initialApp.nombre || '');
        setLogo(initialApp.logo || '');
        setDescripcion(initialApp.descripcion || '');
        setEnlace(initialApp.enlace || '');
        setCategoriaId(
          initialApp.categoria_id || (categories.length > 0 ? categories[0].id : '')
        );
        setHerramienta(
          initialApp.herramienta || (tools.length > 0 ? tools[0] : 'Google AI Studio')
        );
        setEsTrabajoFinal(Boolean(initialApp.es_trabajo_final));
        setEsEjercitacionPipeline(Boolean(initialApp.es_ejercitacion_pipeline));
        setRepositorioGithub(initialApp.repositorio_github || '');
        setEspecificacion(initialApp.especificacion || null);
        setVideoExplicativo(initialApp.video_explicativo || null);
        setVideoInputMode(initialApp.video_explicativo?.tipo === 'enlace' ? 'link' : 'upload');
        setVideoUrlInput(initialApp.video_explicativo?.tipo === 'enlace' ? initialApp.video_explicativo.url : '');
        setVideoAvatarTool(initialApp.video_explicativo?.herramienta_avatar || '');
      } else {
        // Creating a new app: strictly reset all fields to empty
        setNombre('');
        setLogo('');
        setDescripcion('');
        setEnlace('');
        setCategoriaId(categories.length > 0 ? categories[0].id : '');
        setHerramienta(tools.length > 0 ? tools[0] : 'Google AI Studio');
        setEsTrabajoFinal(false);
        setEsEjercitacionPipeline(false);
        setRepositorioGithub('');
        setEspecificacion(null);
        setVideoExplicativo(null);
        setVideoInputMode('upload');
        setVideoUrlInput('');
        setVideoAvatarTool('');
      }
      setErrorMessage(null);
      setIsUploading(false);
      setIsUploadingSpec(false);
      setIsUploadingVideo(false);
      setIsSubmitting(false);
    }
  }, [isOpen, initialApp, categories, tools]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La imagen no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploading(true);
        setErrorMessage(null);
        const base64 = reader.result as string;
        const uploadRes = await api.uploadImage(base64, file.name);
        setLogo(uploadRes.url);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al subir la imagen.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSpecUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('El archivo de especificación no debe superar los 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploadingSpec(true);
        setErrorMessage(null);
        const base64 = reader.result as string;
        const uploadRes = await api.uploadSpecification(base64, file.name, file.type);
        setEspecificacion(uploadRes.file);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al subir el archivo de especificación a Firebase Storage.');
      } finally {
        setIsUploadingSpec(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage(
        'El video supera los 30 MB para subida directa. Puedes subirlo a YouTube o Google Drive y pegar el enlace.'
      );
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingVideo(true);
      setErrorMessage(null);
      const res = await api.uploadVideoFile(file, videoAvatarTool || undefined);
      setVideoExplicativo(res.video);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al subir el video explicativo.');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleApplyVideoLink = () => {
    setErrorMessage(null);
    const trimmed = videoUrlInput.trim();
    if (!trimmed) {
      setErrorMessage('Ingresa un enlace válido para el video o avatar.');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setErrorMessage('El enlace del video debe ser una URL válida (ej: https://youtu.be/...).');
      return;
    }

    setVideoExplicativo({
      tipo: 'enlace',
      url: trimmed,
      herramienta_avatar: videoAvatarTool.trim() || undefined,
      fecha_subida: new Date().toISOString(),
      almacenamiento: 'externo',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nombre.trim()) {
      setErrorMessage('El nombre de la aplicación es obligatorio.');
      return;
    }
    if (!descripcion.trim()) {
      setErrorMessage('La descripción es obligatoria.');
      return;
    }
    if (!enlace.trim()) {
      setErrorMessage('El enlace externo es obligatorio.');
      return;
    }

    try {
      new URL(enlace.trim());
    } catch {
      setErrorMessage('El enlace externo debe ser una URL válida (ej: https://miapp.web.app).');
      return;
    }

    if (!categoriaId) {
      setErrorMessage('Debes seleccionar una categoría.');
      return;
    }
    if (!herramienta) {
      setErrorMessage('Debes seleccionar la herramienta de Vibe Coding.');
      return;
    }

    if (repositorioGithub.trim()) {
      try {
        new URL(repositorioGithub.trim());
      } catch {
        setErrorMessage('El enlace al repositorio de GitHub debe ser una URL válida (ej: https://github.com/usuario/repo).');
        return;
      }
    }

    // If user typed a URL in the link box without clicking "Aplicar", apply it automatically
    let finalVideo = videoExplicativo;
    if (!finalVideo && videoInputMode === 'link' && videoUrlInput.trim()) {
      try {
        new URL(videoUrlInput.trim());
        finalVideo = {
          tipo: 'enlace',
          url: videoUrlInput.trim(),
          herramienta_avatar: videoAvatarTool.trim() || undefined,
          fecha_subida: new Date().toISOString(),
          almacenamiento: 'externo',
        };
      } catch {
        setErrorMessage('El enlace del video explicativo debe ser una URL válida.');
        return;
      }
    } else if (finalVideo && videoAvatarTool.trim() !== (finalVideo.herramienta_avatar || '')) {
      finalVideo = {
        ...finalVideo,
        herramienta_avatar: videoAvatarTool.trim() || undefined,
      };
    }

    try {
      setIsSubmitting(true);
      if (isEditing && initialApp) {
        const res = await api.updateApp(initialApp.id, {
          nombre: nombre.trim(),
          logo: logo.trim(),
          descripcion: descripcion.trim(),
          enlace: enlace.trim(),
          categoria_id: categoriaId,
          herramienta: herramienta.trim(),
          es_trabajo_final: esTrabajoFinal,
          es_ejercitacion_pipeline: esEjercitacionPipeline,
          repositorio_github: repositorioGithub.trim(),
          especificacion: especificacion,
          video_explicativo: finalVideo,
        });
        onSuccess(res.app);
      } else {
        const res = await api.createApp({
          nombre: nombre.trim(),
          logo: logo.trim(),
          descripcion: descripcion.trim(),
          enlace: enlace.trim(),
          categoria_id: categoriaId,
          herramienta: herramienta.trim(),
          es_trabajo_final: esTrabajoFinal,
          es_ejercitacion_pipeline: esEjercitacionPipeline,
          repositorio_github: repositorioGithub.trim(),
          especificacion: especificacion,
          video_explicativo: finalVideo,
        });
        onSuccess(res.app);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la aplicación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Modificar Trabajo Práctico' : 'Publicar Nuevo Trabajo Práctico'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nombre de la aplicación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: EduBot Tutor Inteligente"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>

          {/* Logo / Image (Optional) with preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Logo o imagen del proyecto <span className="text-slate-400 dark:text-slate-500 font-normal">(Opcional)</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Puedes subir una imagen, indicar una URL, o dejarlo vacío para generar automáticamente el logo institucional.
            </p>

            <div className="flex items-center gap-3">
              <AppLogo logo={logo} name={nombre || 'App'} size="md" />

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="URL de imagen (https://...)"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition">
                    <Upload className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                    <span>{isUploading ? 'Subiendo...' : 'Subir archivo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Quitar logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Descripción <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-100 dark:border-blue-900/60 mb-2">
              💡 Describe brevemente qué hace la aplicación y para qué sirve. Recomendación: aproximadamente 5 o 6 líneas.
            </p>
            <textarea
              required
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explica el propósito de la app, a quién está dirigida y sus funciones principales..."
              className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Enlace externo de la aplicación <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="https://tu-proyecto.web.app"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>

          {/* Category & Vibe Tool Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Categoría <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-800 dark:text-white">
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Herramienta Vibe Coding <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={herramienta}
                onChange={(e) => setHerramienta(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              >
                {tools.map((t) => (
                  <option key={t} value={t} className="dark:bg-slate-800 dark:text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subir archivo de especificación e instrucciones (Firebase Storage) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Especificación e Instrucciones de Desarrollo</span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 lowercase">(opcional)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Adjunta el archivo (Word, PDF, Texto, etc.) con los prompts, reglas y especificaciones que utilizaste para construir la app. Se guardará en Firebase Storage para que docentes y compañeros puedan consultarlo.
                </p>
              </div>

              {especificacion?.almacenamiento === 'firebase_storage' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                  Firebase Storage
                </span>
              )}
            </div>

            {especificacion ? (
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={especificacion.nombre_archivo}>
                      {especificacion.nombre_archivo}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{(especificacion.tamano_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Archivo adjunto listo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={especificacion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={especificacion.nombre_archivo}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                    title="Descargar para verificar"
                  >
                    <FileDown className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setEspecificacion(null)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                    title="Quitar archivo adjunto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className={`w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl border border-dashed transition cursor-pointer ${
                  isUploadingSpec
                    ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-slate-700 dark:text-slate-300'
                }`}>
                  <Paperclip className={`w-4 h-4 ${isUploadingSpec ? 'animate-bounce text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>
                    {isUploadingSpec
                      ? 'Subiendo a Firebase Storage...'
                      : 'Seleccionar archivo de instrucciones (Word, PDF, TXT, MD, ZIP)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    disabled={isUploadingSpec}
                    onChange={handleSpecUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Formatos admitidos: Word (.docx, .doc), PDF (.pdf), Texto (.txt, .md), .zip (máx. 25MB)
                </p>
              </div>
            )}
          </div>

          {/* Avatar o Video Explicativo con IA */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Avatar o Video Explicativo con IA</span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 lowercase">(opcional)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Agrega el video o avatar creado con IA donde explicas brevemente en qué consiste tu trabajo para que el docente y tus compañeros puedan verlo al revisar la app.
                </p>
              </div>
              {videoExplicativo?.almacenamiento === 'firebase_storage' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                  Firebase Storage
                </span>
              )}
            </div>

            {/* Optional AI Video Tool selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Herramienta de Video / Avatar IA utilizada (opcional)
              </label>
              <select
                value={videoAvatarTool}
                onChange={(e) => setVideoAvatarTool(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">-- Seleccionar herramienta (HeyGen, D-ID, Synthesia...) --</option>
                {VIDEO_AVATAR_TOOLS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {videoExplicativo ? (
              <div className="space-y-2.5">
                <VideoPlayer
                  video={{
                    ...videoExplicativo,
                    herramienta_avatar: videoAvatarTool.trim() || videoExplicativo.herramienta_avatar,
                  }}
                  compact={true}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Video explicativo listo para publicar
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoExplicativo(null);
                      setVideoUrlInput('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar video</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('upload')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      videoInputMode === 'upload'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir video (MP4/WebM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoInputMode('link')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      videoInputMode === 'link'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Pegar enlace</span>
                  </button>
                </div>

                {videoInputMode === 'upload' ? (
                  <div>
                    <label
                      className={`w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl border border-dashed transition cursor-pointer ${
                        isUploadingVideo
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <PlayCircle
                        className={`w-4 h-4 ${
                          isUploadingVideo
                            ? 'animate-pulse text-indigo-600 dark:text-indigo-400'
                            : 'text-indigo-500 dark:text-indigo-400'
                        }`}
                      />
                      <span>
                        {isUploadingVideo
                          ? 'Subiendo video a Firebase Storage...'
                          : 'Seleccionar video / avatar desde tu dispositivo (MP4, WebM, MOV)'}
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        disabled={isUploadingVideo}
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Máximo 30 MB para subida directa (o usa "Pegar enlace" para videos en YouTube, HeyGen o Drive).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://youtu.be/... o https://app.heygen.com/share/..."
                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVideoLink}
                        className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shrink-0"
                      >
                        Previsualizar
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Compatible con Synthesia, HeyGen, YouTube, Google Drive, Vimeo, Loom o enlace directo MP4.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opción Ejercitación Google AI Studio + GitHub + Vercel */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              esEjercitacionPipeline
                ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-700 shadow-md ring-1 ring-indigo-500/30'
                : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={esEjercitacionPipeline}
                onChange={(e) => {
                  const val = e.target.checked;
                  setEsEjercitacionPipeline(val);
                  if (val && (!herramienta || herramienta === 'Otra')) {
                    setHerramienta('Google AI Studio');
                  }
                }}
                className={`mt-1 w-4 h-4 rounded cursor-pointer ${
                  esEjercitacionPipeline
                    ? 'text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-400'
                    : 'text-indigo-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-indigo-500'
                }`}
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      esEjercitacionPipeline ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${esEjercitacionPipeline ? 'text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                    <span>Ejercitación: Google AI Studio + GitHub + Vercel</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      esEjercitacionPipeline
                        ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/40'
                        : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    Práctica CI/CD
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1 leading-snug ${
                    esEjercitacionPipeline ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Marca esta opción si esta aplicación fue creada como parte de la ejercitación para aprender el flujo de integración continua: prototipado asistido con <strong>Google AI Studio</strong>, control de versiones en <strong>GitHub</strong> y despliegue automático en <strong>Vercel</strong>.
                </p>

                {/* Pipeline visual diagram */}
                <div
                  className={`mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center ${
                    esEjercitacionPipeline
                      ? 'border-slate-800 text-slate-300'
                      : 'border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl text-[10px] flex flex-col items-center gap-1 ${
                      esEjercitacionPipeline
                        ? 'bg-slate-800/80 border border-slate-700/60'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">1. AI Studio</span>
                    <span className="text-[9px] opacity-75">Vibe Coding</span>
                  </div>
                  <div
                    className={`p-2 rounded-xl text-[10px] flex flex-col items-center gap-1 ${
                      esEjercitacionPipeline
                        ? 'bg-slate-800/80 border border-slate-700/60'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Github className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">2. GitHub</span>
                    <span className="text-[9px] opacity-75">Repositorio</span>
                  </div>
                  <div
                    className={`p-2 rounded-xl text-[10px] flex flex-col items-center gap-1 ${
                      esEjercitacionPipeline
                        ? 'bg-slate-800/80 border border-slate-700/60'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">3. Vercel</span>
                    <span className="text-[9px] opacity-75">Deploy Web</span>
                  </div>
                </div>
              </div>
            </label>

            {/* Extra fields shown when checked */}
            {esEjercitacionPipeline && (
              <div className="mt-3.5 pt-3.5 border-t border-slate-800 space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-300" />
                    <span>Enlace al Repositorio de GitHub (opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={repositorioGithub}
                    onChange={(e) => setRepositorioGithub(e.target.value)}
                    placeholder="https://github.com/tu-usuario/nombre-del-repo"
                    className="w-full px-3 py-2 text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl placeholder:text-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Permite a los docentes y compañeros revisar el código fuente, ramas y commits del proyecto en GitHub.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-2">
                  <Workflow className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Consejo:</strong> En el campo <em>"Enlace a la aplicación"</em> (arriba), asegúrate de colocar la URL de tu proyecto desplegado en Vercel (ej: <code>https://mi-proyecto.vercel.app</code>).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Designar como Trabajo Final */}
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={esTrabajoFinal}
                onChange={(e) => setEsTrabajoFinal(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 rounded focus:ring-amber-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                  <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Designar este proyecto como mi Trabajo Final oficial</span>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5 leading-snug">
                  Cada alumno puede tener como máximo un único Trabajo Final. Si marcas esta casilla, este proyecto se destacará con insignia dorada en la vidriera principal y reemplazará automáticamente a cualquier otro que hayas designado antes.
                </p>
              </div>
            </label>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar modificaciones'
                : 'Publicar aplicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
