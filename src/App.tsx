import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Application, Category, VideoExplicativo } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FilterBar, FilterState } from './components/FilterBar';
import { AppCard } from './components/AppCard';
import { AppDetailModal } from './components/AppDetailModal';
import { AppFormModal } from './components/AppFormModal';
import { CategoryModal } from './components/CategoryModal';
import { RankingView } from './components/RankingView';
import { MyAppsView } from './components/MyAppsView';
import { AdminPanelView } from './components/AdminPanelView';
import { PublicProfileModal } from './components/PublicProfileModal';
import { AuthModals } from './components/AuthModals';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UploadSpecModal } from './components/UploadSpecModal';
import { IntroVideoModal } from './components/IntroVideoModal';
import { ChevronDown, Sparkles, Award, Zap } from 'lucide-react';

const PAGE_SIZE = 6;

function MainApp() {
  const { isVisitor, isAdmin } = useAuth();

  // Navigation
  const [currentView, setCurrentView] = useState<'home' | 'ranking' | 'my-apps' | 'admin'>('home');
  const [vidrieraTab, setVidrieraTab] = useState<'todos' | 'finales' | 'pipeline'>('todos');

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    autor: '',
    categoria_id: 'todas',
    herramienta: 'todas',
    calificacion_minima: '0',
    fecha_desde: 'todas',
  });

  // Data
  const [apps, setApps] = useState<Application[]>([]);
  const [totalApps, setTotalApps] = useState<number>(0);
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE);
  const [loadingApps, setLoadingApps] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tools, setTools] = useState<string[]>([]);

  // Modals
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appFormModalOpen, setAppFormModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [myAppsRefreshKey, setMyAppsRefreshKey] = useState<number>(0);
  const [uploadSpecApp, setUploadSpecApp] = useState<Application | null>(null);
  const [introVideo, setIntroVideo] = useState<VideoExplicativo | null>(null);
  const [introVideoModalOpen, setIntroVideoModalOpen] = useState(false);

  // Helper to refresh both the main catalog and MyAppsView
  const refreshAllViews = () => {
    fetchApps();
    setMyAppsRefreshKey((prev) => prev + 1);
  };

  // Load categories, tools & dashboard intro video on mount
  const loadInitialOptions = async () => {
    try {
      const [cats, toolList, introRes] = await Promise.all([
        api.getCategories(false),
        api.getTools(),
        api.getIntroVideo().catch(() => ({ intro_video: null })),
      ]);
      setCategories(cats);
      setTools(toolList);
      setIntroVideo(introRes.intro_video || null);
    } catch (err) {
      console.error('Error fetching categories or tools:', err);
    }
  };

  useEffect(() => {
    loadInitialOptions();
  }, []);

  // Fetch apps based on filters and visibleLimit
  const fetchApps = useCallback(async () => {
    try {
      setLoadingApps(true);
      const res = await api.getApps({
        search: filters.search,
        autor: filters.autor,
        categoria_id: filters.categoria_id,
        herramienta: filters.herramienta,
        calificacion_minima: filters.calificacion_minima,
        fecha_desde: filters.fecha_desde,
        solo_finales: vidrieraTab === 'finales',
        solo_pipeline: vidrieraTab === 'pipeline',
        limit: visibleLimit,
        offset: 0,
      });
      setApps(res.apps);
      setTotalApps(res.total);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoadingApps(false);
    }
  }, [filters, visibleLimit, vidrieraTab]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // When filter changes, reset visible limit back to initial 6
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setVisibleLimit(PAGE_SIZE);
  };

  const handleLoadMore = () => {
    setVisibleLimit((prev) => prev + PAGE_SIZE);
  };

  // Open App Form for creating
  const handleOpenCreate = () => {
    if (isVisitor) {
      setAuthModalMode('login');
      return;
    }
    setEditingApp(null);
    setAppFormModalOpen(true);
  };

  // Open App Form for editing
  const handleOpenEdit = (app: Application) => {
    setEditingApp(app);
    setSelectedApp(null);
    setAppFormModalOpen(true);
  };

  // Open Delete confirmation
  const handleOpenDelete = (app: Application) => {
    setDeletingApp(app);
  };

  const handleConfirmDelete = async () => {
    if (!deletingApp) return;
    try {
      setIsDeleting(true);
      await api.deleteApp(deletingApp.id);
      setDeletingApp(null);
      setSelectedApp(null);
      refreshAllViews();
    } catch (err) {
      console.error('Error deleting application:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAppSaved = () => {
    setEditingApp(null);
    refreshAllViews();
  };

  const handleAppUpdatedInModal = (updated: Application) => {
    setSelectedApp(updated);
    refreshAllViews();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
      {/* Top navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenCreate={handleOpenCreate}
        onOpenProposeCategory={() => setCategoryModalOpen(true)}
        onOpenLogin={() => setAuthModalMode('login')}
        onOpenRegister={() => setAuthModalMode('register')}
      />

      {/* Main container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW 1: HOME CATALOG */}
        {currentView === 'home' && (
          <div>
            <HeroSection
              onOpenRanking={() => setCurrentView('ranking')}
              onOpenCreate={handleOpenCreate}
              isVisitor={isVisitor}
              isAdmin={isAdmin}
              introVideo={introVideo}
              onManageIntroVideo={() => setIntroVideoModalOpen(true)}
            />

            {/* Vidriera Tabs: Todos los Trabajos vs Trabajos Finales vs Ejercitación Pipeline */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs max-w-fit flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setVidrieraTab('todos');
                    setVisibleLimit(PAGE_SIZE);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    vidrieraTab === 'todos'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Todos los Trabajos</span>
                  {vidrieraTab === 'todos' && (
                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                      {totalApps}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVidrieraTab('finales');
                    setVisibleLimit(PAGE_SIZE);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    vidrieraTab === 'finales'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-xs font-black ring-1 ring-amber-400'
                      : 'text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-950" />
                  <span>🌟 Trabajos Finales</span>
                  {vidrieraTab === 'finales' && (
                    <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-full">
                      {totalApps}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVidrieraTab('pipeline');
                    setVisibleLimit(PAGE_SIZE);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    vidrieraTab === 'pipeline'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-black ring-1 ring-violet-400'
                      : 'text-violet-700 dark:text-violet-400 hover:text-violet-950 dark:hover:text-violet-300 hover:bg-violet-100/60 dark:hover:bg-violet-950/40'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>⚡ AI Studio ➔ GitHub ➔ Vercel</span>
                  {vidrieraTab === 'pipeline' && (
                    <span className="text-[10px] font-black bg-white/25 text-white px-1.5 py-0.5 rounded-full">
                      {totalApps}
                    </span>
                  )}
                </button>
              </div>

              {vidrieraTab === 'finales' && (
                <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-3.5 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Exhibición de proyectos de graduación oficiales (1 por alumno)</span>
                </div>
              )}

              {vidrieraTab === 'pipeline' && (
                <div className="text-xs font-semibold text-violet-950 dark:text-violet-200 bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800/60 px-3.5 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
                  <Zap className="w-4 h-4 text-violet-600 fill-violet-600 shrink-0" />
                  <span>Ejercitación específica: Ciclo Google AI Studio + GitHub + Vercel</span>
                </div>
              )}
            </div>

            {/* Filters Bar */}
            <FilterBar
              filters={filters}
              onChange={handleFilterChange}
              categories={categories}
              tools={tools}
              totalResults={totalApps}
            />

            {/* Applications Grid */}
            {loadingApps && apps.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargando aplicaciones...</p>
              </div>
            ) : apps.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  No se encontraron aplicaciones con los filtros seleccionados
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Prueba modificando la búsqueda, seleccionando otra categoría o limpiando los
                  filtros aplicados.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange({
                        search: '',
                        autor: '',
                        categoria_id: 'todas',
                        herramienta: 'todas',
                        calificacion_minima: '0',
                        fecha_desde: 'todas',
                      })
                    }
                    className="px-4 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 rounded-xl transition cursor-pointer"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {apps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      onSelect={(a) => setSelectedApp(a)}
                      onSelectAuthor={(authorId) => setSelectedAuthorId(authorId)}
                      onUploadSpec={(a) => setUploadSpecApp(a)}
                    />
                  ))}
                </div>

                {/* Requirement: "Ver más" button to progressively load more applications */}
                {apps.length < totalApps && (
                  <div className="pt-8 text-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingApps}
                      className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl shadow-xs transition hover:shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {loadingApps
                          ? 'Cargando más...'
                          : `Ver más trabajos (${totalApps - apps.length} restantes)`}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: RANKING */}
        {currentView === 'ranking' && (
          <RankingView
            onSelectApp={(app) => setSelectedApp(app)}
            onSelectAuthor={(authorId) => setSelectedAuthorId(authorId)}
          />
        )}

        {/* VIEW 3: MIS TRABAJOS (ALUMNOS) */}
        {currentView === 'my-apps' && (
          <MyAppsView
            key={`my-apps-${myAppsRefreshKey}`}
            refreshTrigger={myAppsRefreshKey}
            onOpenCreate={handleOpenCreate}
            onEditApp={handleOpenEdit}
            onDeleteApp={handleOpenDelete}
            onSelectApp={(app) => setSelectedApp(app)}
            onUploadSpec={(a) => setUploadSpecApp(a)}
          />
        )}

        {/* VIEW 4: ADMIN PANEL */}
        {currentView === 'admin' && isAdmin && (
          <AdminPanelView
            onSelectApp={(app) => setSelectedApp(app)}
            onSelectAuthor={(authorId) => setSelectedAuthorId(authorId)}
            onRefreshAll={() => {
              loadInitialOptions();
              fetchApps();
            }}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            Escuela de Formación Profesional Don Bosco
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Curso Habilidades Digitales + IA 2026 • Catálogo Institucional de Proyectos Vibe Coding
          </p>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Google AI Studio • Lovable • Replit • Bolt • Base44
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. App Detail Modal */}
      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSelectAuthor={(authorId) => setSelectedAuthorId(authorId)}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onRequireLogin={() => setAuthModalMode('login')}
          onAppUpdated={handleAppUpdatedInModal}
        />
      )}

      {/* 2. App Create/Edit Form Modal */}
      <AppFormModal
        key={appFormModalOpen ? (editingApp ? `edit-${editingApp.id}` : 'create-new') : 'closed'}
        isOpen={appFormModalOpen}
        onClose={() => {
          setEditingApp(null);
          setAppFormModalOpen(false);
        }}
        onSuccess={handleAppSaved}
        initialApp={editingApp}
        categories={categories}
        tools={tools}
      />

      {/* 3. Propose Category Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={loadInitialOptions}
      />

      {/* 4. Public Profile Modal */}
      <PublicProfileModal
        authorId={selectedAuthorId}
        onClose={() => setSelectedAuthorId(null)}
        onSelectApp={(app) => setSelectedApp(app)}
      />

      {/* 5. Auth Modals (Login, Register, Forgot Password) */}
      <AuthModals
        mode={authModalMode}
        onClose={() => setAuthModalMode(null)}
        onSwitchMode={(mode) => setAuthModalMode(mode)}
      />

      {/* 6. Delete Confirmation Modal */}
      <DeleteConfirmModal
        app={deletingApp}
        onClose={() => setDeletingApp(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* 7. Upload Specification & Instructions Modal */}
      <UploadSpecModal
        isOpen={Boolean(uploadSpecApp)}
        app={uploadSpecApp}
        onClose={() => setUploadSpecApp(null)}
        onSuccess={(updated) => {
          handleAppUpdatedInModal(updated);
        }}
        onRequireLogin={() => setAuthModalMode('login')}
      />

      {/* 8. Teacher Intro Video Modal */}
      <IntroVideoModal
        isOpen={introVideoModalOpen}
        onClose={() => setIntroVideoModalOpen(false)}
        currentVideo={introVideo}
        onSaved={(video) => setIntroVideo(video)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
