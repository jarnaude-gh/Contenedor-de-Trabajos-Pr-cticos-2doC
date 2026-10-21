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
} from 'lucide-react';
import { Application, Category, SpecificationFile } from '../types';
import { api } from '../services/api';
import { AppLogo } from './AppLogo';

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
  const [especificacion, setEspecificacion] = useState<SpecificationFile | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingSpec, setIsUploadingSpec] = useState(false);
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
        setEspecificacion(initialApp.especificacion || null);
      } else {
        // Creating a new app: strictly reset all fields to empty
        setNombre('');
        setLogo('');
        setDescripcion('');
        setEnlace('');
        setCategoriaId(categories.length > 0 ? categories[0].id : '');
        setHerramienta(tools.length > 0 ? tools[0] : 'Google AI Studio');
        setEsTrabajoFinal(false);
        setEspecificacion(null);
      }
      setErrorMessage(null);
      setIsUploading(false);
      setIsUploadingSpec(false);
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
          especificacion: especificacion,
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
          especificacion: especificacion,
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
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Modificar Trabajo Práctico' : 'Publicar Nuevo Trabajo Práctico'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre de la aplicación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: EduBot Tutor Inteligente"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>

          {/* Logo / Image (Optional) with preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Logo o imagen del proyecto <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
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
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition">
                    <Upload className="w-3 h-3 text-slate-600" />
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
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descripción <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-100 mb-2">
              💡 Describe brevemente qué hace la aplicación y para qué sirve. Recomendación: aproximadamente 5 o 6 líneas.
            </p>
            <textarea
              required
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explica el propósito de la app, a quién está dirigida y sus funciones principales..."
              className="w-full p-3 text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Enlace externo de la aplicación <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="https://tu-proyecto.web.app"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>

          {/* Category & Vibe Tool Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoría <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Herramienta Vibe Coding <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={herramienta}
                onChange={(e) => setHerramienta(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              >
                {tools.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subir archivo de especificación e instrucciones (Firebase Storage) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Especificación e Instrucciones de Desarrollo</span>
                  <span className="text-[10px] font-semibold text-slate-400 lowercase">(opcional)</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Adjunta el archivo (Word, PDF, Texto, etc.) con los prompts, reglas y especificaciones que utilizaste para construir la app. Se guardará en Firebase Storage para que docentes y compañeros puedan consultarlo.
                </p>
              </div>

              {especificacion?.almacenamiento === 'firebase_storage' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-amber-700" />
                  Firebase Storage
                </span>
              )}
            </div>

            {especificacion ? (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200 shadow-2xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate" title={especificacion.nombre_archivo}>
                      {especificacion.nombre_archivo}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{(especificacion.tamano_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
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
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                    title="Descargar para verificar"
                  >
                    <FileDown className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setEspecificacion(null)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
                    ? 'bg-blue-50/50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 text-slate-700'
                }`}>
                  <Paperclip className={`w-4 h-4 ${isUploadingSpec ? 'animate-bounce text-blue-600' : 'text-slate-400'}`} />
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Formatos admitidos: Word (.docx, .doc), PDF (.pdf), Texto (.txt, .md), .zip (máx. 25MB)
                </p>
              </div>
            )}
          </div>

          {/* Designar como Trabajo Final */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={esTrabajoFinal}
                onChange={(e) => setEsTrabajoFinal(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 bg-white border-amber-300 rounded focus:ring-amber-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                  <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Designar este proyecto como mi Trabajo Final oficial</span>
                </div>
                <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">
                  Cada alumno puede tener como máximo un único Trabajo Final. Si marcas esta casilla, este proyecto se destacará con insignia dorada en la vidriera principal y reemplazará automáticamente a cualquier otro que hayas designado antes.
                </p>
              </div>
            </label>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
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
