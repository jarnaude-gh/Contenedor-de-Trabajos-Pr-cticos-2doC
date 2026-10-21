import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Application } from '../types';

interface DeleteConfirmModalProps {
  app: Application | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  app,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!app) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="text-center">
          <h4 className="text-lg font-black text-slate-900">¿Eliminar este trabajo práctico?</h4>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Estás a punto de eliminar <strong>"{app.nombre}"</strong>. Esta acción es definitiva: se
            eliminarán también todas sus calificaciones y comentarios asociados de la base de datos.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition cursor-pointer"
          >
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
};
