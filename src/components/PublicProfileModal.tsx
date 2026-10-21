import React, { useEffect, useState } from 'react';
import { X, User as UserIcon, FolderGit2 } from 'lucide-react';
import { Application } from '../types';
import { api } from '../services/api';
import { AppCard } from './AppCard';

interface PublicProfileModalProps {
  authorId: string | null;
  onClose: () => void;
  onSelectApp: (app: Application) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  authorId,
  onClose,
  onSelectApp,
}) => {
  const [profile, setProfile] = useState<{
    nombre: string;
    apellido: string;
    aplicaciones: Application[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authorId) {
      loadProfile(authorId);
    }
  }, [authorId]);

  const loadProfile = async (id: string) => {
    try {
      setLoading(true);
      const data = await api.getPublicProfile(id);
      setProfile(data);
    } catch (err) {
      console.error('Error fetching public profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!authorId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Perfil Público del Alumno</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
              <p>Cargando perfil...</p>
            </div>
          ) : profile ? (
            <>
              {/* Profile Card (strictly ONLY Nombre & Apellido) */}
              <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl text-white flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-amber-300 shadow-inner">
                  {profile.nombre[0]}
                  {profile.apellido[0]}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Estudiante Don Bosco
                  </span>
                  <h2 className="text-2xl font-black tracking-tight">
                    {profile.nombre} {profile.apellido}
                  </h2>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {profile.aplicaciones.length}{' '}
                    {profile.aplicaciones.length === 1
                      ? 'trabajo publicado'
                      : 'trabajos publicados'}
                  </p>
                </div>
              </div>

              {/* Published Apps Section */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-blue-600" />
                  Trabajos Prácticos Publicados
                </h4>

                {profile.aplicaciones.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    Este alumno aún no ha publicado ningún trabajo práctico.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.aplicaciones.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        onSelect={(a) => {
                          onClose();
                          onSelectApp(a);
                        }}
                        onSelectAuthor={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              No se encontró la información del alumno.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
