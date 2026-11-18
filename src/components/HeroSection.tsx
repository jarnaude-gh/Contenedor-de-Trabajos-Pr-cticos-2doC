import React from 'react';
import { Sparkles, Code2, Rocket, Trophy, Video, Edit3, Plus } from 'lucide-react';
import { VideoExplicativo } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface HeroSectionProps {
  onOpenRanking: () => void;
  onOpenCreate: () => void;
  isVisitor: boolean;
  isAdmin?: boolean;
  introVideo?: VideoExplicativo | null;
  onManageIntroVideo?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenRanking,
  onOpenCreate,
  isVisitor,
  isAdmin = false,
  introVideo = null,
  onManageIntroVideo,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 border border-blue-900/40">
      <div
        className={`relative z-10 grid gap-6 items-center ${
          introVideo ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* Left Column: Title, Copy & CTAs */}
        <div className={introVideo ? 'lg:col-span-7' : 'max-w-3xl'}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escuela de Formación Profesional Don Bosco • Ciclo Lectivo 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
            Vidriera Digital de Trabajos Prácticos
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-amber-200">
              Habilidades Digitales + Inteligencia Artificial
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-2xl">
            Explora los proyectos finales construidos por los alumnos mediante herramientas de{' '}
            <strong className="text-white">Vibe Coding</strong>. Prueba cada prototipo en vivo,
            mira sus videos de presentación con avatares IA, evalúa con estrellas y conoce el
            talento digital de nuestra comunidad.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenRanking}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md shadow-amber-400/20 transition cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-950" />
              <span>Ver Tabla de Ranking</span>
            </button>

            {!isVisitor && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 rounded-xl transition cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-blue-200" />
                <span>Publicar mi proyecto</span>
              </button>
            )}

            {isAdmin && onManageIntroVideo && !introVideo && (
              <button
                type="button"
                onClick={onManageIntroVideo}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-100 bg-indigo-600/70 hover:bg-indigo-600 border border-indigo-400/40 rounded-xl transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Subir video explicativo del contenedor</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Teacher's Dashboard Explanatory Video */}
        {introVideo && (
          <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-md border border-indigo-400/30 rounded-2xl p-3.5 shadow-2xl space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-0.5">
                  <Video className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Presentación Docente del Contenedor</span>
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                  {introVideo.titulo || '¿De qué se trata este Contenedor de Trabajos Prácticos?'}
                </h2>
              </div>

              {isAdmin && onManageIntroVideo && (
                <button
                  type="button"
                  onClick={onManageIntroVideo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/30 rounded-lg transition cursor-pointer shrink-0"
                  title="Cambiar o quitar video explicativo del dashboard"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Cambiar</span>
                </button>
              )}
            </div>

            {introVideo.descripcion && (
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                {introVideo.descripcion}
              </p>
            )}

            <VideoPlayer video={introVideo} compact={true} className="border-slate-700/80" />
          </div>
        )}
      </div>

      {/* Decorative background grid and icons */}
      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
        <Code2 className="w-80 h-80 text-blue-300" />
      </div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

