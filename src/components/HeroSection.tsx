import React from 'react';
import { Sparkles, Code2, Users, Rocket, Trophy } from 'lucide-react';

interface HeroSectionProps {
  onOpenRanking: () => void;
  onOpenCreate: () => void;
  isVisitor: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenRanking,
  onOpenCreate,
  isVisitor,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 border border-blue-900/40">
      <div className="relative z-10 max-w-3xl">
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
          evalúa con estrellas, comparte devoluciones constructivas y conoce el talento digital de
          nuestra comunidad.
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
        </div>
      </div>

      {/* Decorative background grid and icons */}
      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
        <Code2 className="w-80 h-80 text-blue-300" />
      </div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};
