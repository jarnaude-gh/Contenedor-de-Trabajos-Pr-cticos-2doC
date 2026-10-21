import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Star, ExternalLink, ArrowRight } from 'lucide-react';
import { Application } from '../types';
import { api } from '../services/api';
import { AppLogo } from './AppLogo';
import { StarRating } from './StarRating';

interface RankingViewProps {
  onSelectApp: (app: Application) => void;
  onSelectAuthor: (authorId: string) => void;
}

export const RankingView: React.FC<RankingViewProps> = ({ onSelectApp, onSelectAuthor }) => {
  const [rankedApps, setRankedApps] = useState<Array<Application & { posicion: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const data = await api.getRanking();
      setRankedApps(data);
    } catch (err) {
      console.error('Error fetching ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/20 ring-2 ring-amber-400">
          <Trophy className="w-5 h-5 text-amber-900 fill-amber-300" />
        </div>
      );
    }
    if (pos === 2) {
      return (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 font-black text-sm flex items-center justify-center shadow-xs ring-2 ring-slate-300">
          <Medal className="w-5 h-5 text-slate-600 fill-slate-200" />
        </div>
      );
    }
    if (pos === 3) {
      return (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs ring-2 ring-amber-600">
          <Award className="w-5 h-5 text-amber-100 fill-amber-600" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
        #{pos}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Cargando tabla de posiciones...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-3">
            <Trophy className="w-3.5 h-3.5" />
            Tabla de Honor y Reconocimiento
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Ranking de Trabajos Prácticos
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Ordenado por mayor promedio de calificación (1 a 5 estrellas) y desempatado por mayor
            cantidad de votos. Participan únicamente aquellos proyectos que hayan recibido al menos un voto.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none text-white">
          <Trophy className="w-64 h-64" />
        </div>
      </div>

      {rankedApps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Aún no hay proyectos en el ranking</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Para figurar en el ranking, las aplicaciones deben recibir al menos una calificación por
            parte de los compañeros o docentes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {rankedApps.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectApp(app)}
                className="p-4 sm:p-5 flex items-center gap-4 hover:bg-blue-50/40 transition cursor-pointer group"
              >
                {/* Position Badge */}
                <div className="shrink-0 flex items-center justify-center w-10">
                  {getPositionBadge(app.posicion)}
                </div>

                {/* App Logo */}
                <AppLogo logo={app.logo} name={app.nombre} size="md" />

                {/* App Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {app.herramienta}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {app.categoria_nombre}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                    {app.nombre}
                  </h3>

                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <span>Autor:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAuthor(app.autor_id);
                      }}
                      className="font-semibold text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                    >
                      {app.autor_nombre} {app.autor_apellido}
                    </button>
                  </div>
                </div>

                {/* Score & Votes */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span className="text-base font-extrabold text-slate-900">
                      {app.promedio_calificacion.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {app.cantidad_votos} {app.cantidad_votos === 1 ? 'voto' : 'votos'}
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 pl-2 text-slate-300 group-hover:text-blue-600 transition">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
