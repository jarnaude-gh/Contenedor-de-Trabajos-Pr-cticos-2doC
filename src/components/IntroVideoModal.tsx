import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  HardDrive,
} from 'lucide-react';
import { VideoExplicativo } from '../types';
import { api } from '../services/api';
import { VideoPlayer } from './VideoPlayer';

interface IntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo: VideoExplicativo | null;
  onSaved: (video: VideoExplicativo | null) => void;
}

const VIDEO_TOOLS = [
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

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({
  isOpen,
  onClose,
  currentVideo,
  onSaved,
}) => {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [titulo, setTitulo] = useState('¿De qué se trata este Contenedor de Trabajos Prácticos?');
  const [descripcion, setDescripcion] = useState('');
  const [herramientaAvatar, setHerramientaAvatar] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitulo(
        currentVideo?.titulo || '¿De qué se trata este Contenedor de Trabajos Prácticos?'
      );
      setDescripcion(currentVideo?.descripcion || '');
      setHerramientaAvatar(currentVideo?.herramienta_avatar || '');
      setVideoUrl(currentVideo?.tipo === 'enlace' ? currentVideo.url : '');
      setMode(currentVideo?.tipo === 'enlace' ? 'link' : 'upload');
      setSelectedFile(null);
      setErrorMessage(null);
      setIsSaving(false);
    }
  }, [isOpen, currentVideo]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage(
        'El video supera el límite de 30 MB para subida directa. Puedes subirlo a YouTube o Google Drive y pegar el enlace en la pestaña "Pegar enlace".'
      );
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      setIsSaving(true);

      if (mode === 'upload') {
        if (selectedFile) {
          const res = await api.uploadIntroVideoFile(selectedFile, {
            titulo: titulo.trim() || '¿De qué se trata este Contenedor de Trabajos Prácticos?',
            descripcion: descripcion.trim(),
            herramienta_avatar: herramientaAvatar.trim() || undefined,
          });
          onSaved(res.intro_video);
          onClose();
          return;
        } else if (currentVideo && currentVideo.tipo === 'archivo') {
          // Updating metadata of already uploaded file
          const res = await api.setIntroVideoLink({
            url: currentVideo.url,
            titulo: titulo.trim() || '¿De qué se trata este Contenedor de Trabajos Prácticos?',
            descripcion: descripcion.trim(),
            herramienta_avatar: herramientaAvatar.trim() || undefined,
            ...({
              tipo: 'archivo',
              nombre_archivo: currentVideo.nombre_archivo,
              tamano_bytes: currentVideo.tamano_bytes,
              tipo_mime: currentVideo.tipo_mime,
              poster_url: currentVideo.poster_url,
              almacenamiento: currentVideo.almacenamiento,
            } as any),
          });
          onSaved(res.intro_video);
          onClose();
          return;
        } else {
          setErrorMessage('Selecciona un archivo de video (MP4, WebM o MOV) para subir.');
          return;
        }
      } else {
        if (!videoUrl.trim()) {
          setErrorMessage('Ingresa el enlace del video explicativo (YouTube, HeyGen, Drive, etc.).');
          return;
        }
        try {
          new URL(videoUrl.trim());
        } catch {
          setErrorMessage('El enlace debe ser una URL válida (ej: https://youtu.be/...).');
          return;
        }

        const res = await api.setIntroVideoLink({
          url: videoUrl.trim(),
          titulo: titulo.trim() || '¿De qué se trata este Contenedor de Trabajos Prácticos?',
          descripcion: descripcion.trim(),
          herramienta_avatar: herramientaAvatar.trim() || undefined,
        });
        onSaved(res.intro_video);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el video explicativo del dashboard.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('¿Deseas quitar el video explicativo del dashboard principal?')) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await api.removeIntroVideo();
      onSaved(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar el video.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Video Explicativo del Dashboard Principal
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Exclusivo Docente • Visible en la portada para alumnos y visitantes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {currentVideo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Video actualmente publicado en portada
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar video</span>
                </button>
              </div>
              <VideoPlayer video={currentVideo} compact={true} />
            </div>
          )}

          {/* Title & Description */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Título del video de bienvenida
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="¿De qué se trata este Contenedor de Trabajos Prácticos?"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Breve reseña / aclaración docente{' '}
                <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: En este video introductorio les explico cómo funciona la vidriera, cómo subir sus proyectos y el rol del avatar IA..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Herramienta de Video / Avatar IA{' '}
                <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(opcional)</span>
              </label>
              <select
                value={herramientaAvatar}
                onChange={(e) => setHerramientaAvatar(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                <option value="">-- Seleccionar herramienta (opcional) --</option>
                {VIDEO_TOOLS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Tabs: Upload File vs Paste URL */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir archivo de video</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('link')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === 'link'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Pegar enlace de video</span>
              </button>
            </div>

            {mode === 'upload' ? (
              <div className="space-y-2">
                <label className="w-full flex flex-col items-center justify-center gap-2 p-5 text-xs font-semibold rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 hover:border-indigo-500 dark:hover:border-indigo-400 transition cursor-pointer text-center">
                  <PlayCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  {selectedFile ? (
                    <div className="space-y-0.5">
                      <span className="text-slate-900 dark:text-white font-bold block">
                        {selectedFile.name}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para subir a Firebase Storage
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-slate-700 dark:text-slate-200 block">
                        Haz clic para seleccionar el video desde tu dispositivo
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-normal">
                        Formatos: MP4, WebM, MOV (máximo 30 MB)
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Se almacenará en Firebase Storage con respaldo en el servidor.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o https://app.heygen.com/share/..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Compatible con enlaces de <strong>Synthesia</strong>, <strong>HeyGen</strong>,{' '}
                  <strong>YouTube</strong>, <strong>Google Drive</strong>, <strong>Vimeo</strong>, <strong>Loom</strong> o URL directa de archivo <code>.mp4</code>.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Subiendo y guardando...' : 'Publicar video en Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
