import React, { useState } from 'react';
import {
  Compass,
  Trophy,
  FolderGit2,
  ShieldCheck,
  Plus,
  Tag,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: 'home' | 'ranking' | 'my-apps' | 'admin';
  onNavigate: (view: 'home' | 'ranking' | 'my-apps' | 'admin') => void;
  onOpenCreate: () => void;
  onOpenProposeCategory: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCreate,
  onOpenProposeCategory,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { user, isVisitor, isAdmin, isAlumno, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: 'home' | 'ranking' | 'my-apps' | 'admin') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand Logo & Title */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-950 via-blue-800 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-700 transition">
                  Don Bosco
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 uppercase tracking-wider">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Habilidades Digitales + IA • Contenedor de Trabajos Prácticos
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                currentView === 'home'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Catálogo</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('ranking')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                currentView === 'ranking'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Ranking</span>
            </button>

            {!isVisitor && (
              <button
                type="button"
                onClick={() => handleNav('my-apps')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                  currentView === 'my-apps'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-indigo-600" />
                <span>Mis Trabajos</span>
              </button>
            )}

            {isAlumno && (
              <button
                type="button"
                onClick={onOpenProposeCategory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition cursor-pointer"
                title="Proponer nueva categoría de proyectos"
              >
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Proponer Categoría</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Panel Docente</span>
              </button>
            )}
          </nav>

          {/* Desktop Right Actions: Publish button & User profile / Login */}
          <div className="hidden md:flex items-center gap-2.5">
            {!isVisitor && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publicar Trabajo</span>
              </button>
            )}

            {isVisitor ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Registrarse</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user?.nombre} {user?.apellido}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-end gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isAdmin ? 'bg-purple-600' : 'bg-emerald-500'
                      }`}
                    ></span>
                    <span>{isAdmin ? 'Profesor / Admin' : 'Alumno'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center gap-2">
            {!isVisitor && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="p-2 text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs"
                title="Publicar trabajo"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          {/* User info on mobile */}
          {!isVisitor && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {user?.nombre} {user?.apellido}
                </div>
                <div className="text-xs text-slate-500">
                  {isAdmin ? 'Profesor / Administrador' : 'Alumno'}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
              >
                Salir
              </button>
            </div>
          )}

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left ${
                currentView === 'home' ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Catálogo de Trabajos</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('ranking')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left ${
                currentView === 'ranking' ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Ranking y Posiciones</span>
            </button>

            {!isVisitor && (
              <button
                type="button"
                onClick={() => handleNav('my-apps')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left ${
                  currentView === 'my-apps' ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-indigo-600" />
                <span>Mis Trabajos Prácticos</span>
              </button>
            )}

            {isAlumno && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProposeCategory();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left text-slate-700 hover:bg-slate-50"
              >
                <Tag className="w-4 h-4 text-slate-400" />
                <span>Proponer Nueva Categoría</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('admin')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left ${
                  currentView === 'admin'
                    ? 'bg-purple-50 text-purple-900'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Panel Docente / Administrador</span>
              </button>
            )}
          </div>

          {/* Visitor buttons on mobile */}
          {isVisitor && (
            <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-center"
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister();
                }}
                className="w-full py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl text-center"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
