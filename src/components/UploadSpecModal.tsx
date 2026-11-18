import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Trash2,
  HardDrive,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { Application, SpecificationFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AppLogo } from './AppLogo';

interface UploadSpecModalProps {
  isOpen: boolean;
  app: Application | null;
  onClose: () => void;
  onSuccess: (updatedApp: Application) => void;
  onRequireLogin: () => void;
}

export const UploadSpecModal: React.FC<UploadSpecModalProps> = ({
  isOpen,
  app,
  onClose,
  onSuccess,
  onRequireLogin,
}) => {
  const { user, isVisitor, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !app) return null;

  const isAuthor = user && user.id === app.autor_id;
  const canUpload = Boolean(isAdmin || isAuthor);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('El archivo excede el tamaño máximo permitido de 25MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Selecciona un archivo (Word, PDF, Texto, etc.) para subir.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await api.uploadAppSpecification(
            app.id,
            base64,
            selectedFile.name,
            selectedFile.type
          );

          setSuccessMessage(res.message);
          setSelectedFile(null);
          setTimeout(() => {
            onSuccess(res.app);
            onClose();
          }, 1200);
        } catch (uploadErr: any) {
          setErrorMessage(
            uploadErr.message || 'Error al subir el archivo de especificación a Firebase Storage.'
          );
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el archivo.');
      setIsUploading(false);
    }
  };

  const handleRemoveExisting = async () => {
    if (!app.especificacion) return;
    const confirmRemove = window.confirm(
      '¿Deseas quitar el archivo de especificación e instrucciones adjunto a este trabajo?'
    );
    if (!confirmRemove) return;

    try {
      setIsRemoving(true);
      setErrorMessage(null);
      const res = await api.removeAppSpecification(app.id);
      setSuccessMessage('Archivo eliminado exitosamente.');
      setTimeout(() => {
        onSuccess(res.app);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar el archivo.');
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Instrucciones y Especificación del Trabajo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Almacenamiento en Firebase Storage
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
        <div className="p-6 space-y-5">
          {/* Work Summary Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/90 dark:border-slate-700 flex items-center gap-3">
            <AppLogo logo={app.logo} name={app.nombre} size="sm" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.nombre}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Por: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.autor_nombre} {app.autor_apellido}</span> • {app.herramienta}
              </p>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Permissions gate */}
          {isVisitor ? (
            <div className="p-5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">Se requiere inicio de sesión</h4>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 max-w-sm mx-auto leading-relaxed">
                Para subir o actualizar las especificaciones e instrucciones de este trabajo, debes iniciar sesión como el alumno autor o como profesor administrador.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequireLogin();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          ) : !canUpload ? (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Permisos restringidos</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Únicamente el autor de este proyecto ({app.autor_nombre} {app.autor_apellido}) o el docente administrador pueden adjuntar o modificar las instrucciones.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Existing file view if present */}
              {app.especificacion && (
                <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/40 dark:via-slate-800/80 dark:to-slate-850 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Archivo adjunto actual
                    </span>
                    {app.especificacion.almacenamiento === 'firebase_storage' && (
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                        Firebase Storage
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={app.especificacion.nombre_archivo}>
                          {app.especificacion.nombre_archivo}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {(app.especificacion.tamano_bytes / 1024).toFixed(1)} KB • Subido el {new Date(app.especificacion.fecha_subida).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={app.especificacion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={app.especificacion.nombre_archivo}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                        title="Descargar archivo"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveExisting}
                        disabled={isRemoving || isUploading}
                        className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer disabled:opacity-50"
                        title="Eliminar archivo adjunto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {app.especificacion
                    ? 'Subir nuevo archivo (reemplazará al actual)'
                    : 'Seleccionar archivo de instrucciones y especificación'}
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    selectedFile
                      ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/30'
                      : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white break-all">
                        {selectedFile.name}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Listo para subir
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer pt-1"
                      >
                        Cambiar archivo seleccionado
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Haz clic o arrastra un archivo aquí
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                        Admite documentos Word (.docx, .doc), PDF (.pdf), Texto plano (.txt, .md), .zip (máx. 25MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanatory note */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                💡 <strong>¿Qué debe contener este archivo?</strong> Los requerimientos técnicos, la consigna del trabajo práctico, o los prompts e instrucciones de Vibe Coding utilizados para generar el código de la aplicación.
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isUploading ? 'Subiendo a Firebase Storage...' : 'Subir y Adjuntar'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
