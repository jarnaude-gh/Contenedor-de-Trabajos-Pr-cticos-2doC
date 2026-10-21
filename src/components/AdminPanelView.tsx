import React, { useEffect, useState } from 'react';
import {
  Users,
  FolderGit2,
  Star,
  Flame,
  Trophy,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Database,
  BarChart3,
  ShieldCheck,
  Check,
  X,
  Download,
  Upload,
  HardDrive,
  FileJson,
  Trash2,
  Clock,
  RefreshCw,
  FileDown,
  Info,
  Calendar,
} from 'lucide-react';
import { AdminStats, Category, User, Application } from '../types';
import { api } from '../services/api';
import { StarRating } from './StarRating';
import { AppLogo } from './AppLogo';

interface AdminPanelViewProps {
  onSelectApp: (app: Application) => void;
  onSelectAuthor: (authorId: string) => void;
  onRefreshAll: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  onSelectApp,
  onSelectAuthor,
  onRefreshAll,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'categories' | 'maintenance'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingCategories, setPendingCategories] = useState<Category[]>([]);
  const [snapshots, setSnapshots] = useState<
    Array<{
      id: string;
      filename: string;
      timestamp: string;
      creator: string;
      summary: {
        total_users: number;
        total_applications: number;
        total_categories: number;
        total_ratings: number;
        total_finales: number;
      };
      sizeBytes: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmCleanAllOpen, setConfirmCleanAllOpen] = useState(false);
  const [hasBackedUpChecked, setHasBackedUpChecked] = useState(false);
  const [modalBackupDownloaded, setModalBackupDownloaded] = useState(false);
  const [selectedSnapshotToRestore, setSelectedSnapshotToRestore] = useState<{
    id: string;
    filename: string;
    timestamp: string;
    summary: any;
  } | null>(null);
  const [fileRestorePreview, setFileRestorePreview] = useState<{
    filename: string;
    summary: {
      total_users: number;
      total_applications: number;
      total_categories: number;
      total_ratings: number;
      total_finales: number;
    };
    data: any;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, allCats, snapshotsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getCategories(true),
        api.listBackupSnapshots().catch(() => []),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setPendingCategories(allCats.filter((c) => c.estado === 'PENDIENTE'));
      setSnapshots(snapshotsData || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCategory = async (id: string) => {
    try {
      setProcessing(true);
      const res = await api.approveCategory(id);
      setActionFeedback(res.message);
      await loadAdminData();
      onRefreshAll();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al aprobar categoría.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectCategory = async (id: string) => {
    try {
      setProcessing(true);
      const res = await api.rejectCategory(id);
      setActionFeedback(res.message);
      await loadAdminData();
      onRefreshAll();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al rechazar categoría.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSeedTestData = async () => {
    try {
      setProcessing(true);
      const res = await api.seedTestData();
      setActionFeedback(res.message);
      await loadAdminData();
      onRefreshAll();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al cargar datos de prueba.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearTestData = async () => {
    try {
      setProcessing(true);
      const res = await api.clearTestData();
      setActionFeedback(res.message);
      setConfirmClearOpen(false);
      await loadAdminData();
      onRefreshAll();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al limpiar datos.');
    } finally {
      setProcessing(false);
    }
  };

  // Backup & Restore Handlers
  const handleDownloadBackup = async () => {
    try {
      setProcessing(true);
      const snapshot = await api.exportBackup();

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = snapshot.filename || `backup-donbosco-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionFeedback('Copia de seguridad (.json) generada y descargada exitosamente en tu equipo.');
      const updatedSnapshots = await api.listBackupSnapshots().catch(() => []);
      setSnapshots(updatedSnapshots);
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al generar la copia de seguridad.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateServerSnapshot = async () => {
    try {
      setProcessing(true);
      const snapshot = await api.exportBackup();
      setActionFeedback(`Punto de restauración guardado en el servidor: ${snapshot.filename}`);
      const updatedSnapshots = await api.listBackupSnapshots().catch(() => []);
      setSnapshots(updatedSnapshots);
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al registrar el punto de restauración.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setActionFeedback('Por favor selecciona un archivo con extensión .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

        if (!Array.isArray(data.applications) || !Array.isArray(data.users)) {
          throw new Error('El archivo no contiene la estructura esperada (faltan listas de aplicaciones o usuarios).');
        }

        setFileRestorePreview({
          filename: file.name,
          summary: {
            total_users: data.users.length,
            total_applications: data.applications.length,
            total_categories: data.categories?.length || 0,
            total_ratings: data.ratings?.length || 0,
            total_finales: data.applications.filter((a: any) => a.es_trabajo_final).length,
          },
          data: parsed,
        });
      } catch (err: any) {
        setActionFeedback(`Error al leer archivo de backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestoreFromFile = async () => {
    if (!fileRestorePreview) return;
    try {
      setProcessing(true);
      const res = await api.restoreBackup(fileRestorePreview.data);
      setActionFeedback(res.message);
      setFileRestorePreview(null);
      await loadAdminData();
      onRefreshAll();
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al restaurar la copia de seguridad.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmRestoreFromSnapshot = async () => {
    if (!selectedSnapshotToRestore) return;
    try {
      setProcessing(true);
      const res = await api.restoreBackupSnapshot(selectedSnapshotToRestore.id);
      setActionFeedback(res.message);
      setSelectedSnapshotToRestore(null);
      await loadAdminData();
      onRefreshAll();
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al restaurar el punto de restauración.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenCleanAllModal = () => {
    setHasBackedUpChecked(false);
    setModalBackupDownloaded(false);
    setConfirmCleanAllOpen(true);
  };

  const handleDownloadBackupFromCleanModal = async () => {
    await handleDownloadBackup();
    setModalBackupDownloaded(true);
    setHasBackedUpChecked(true);
  };

  const handleConfirmCleanAll = async () => {
    if (!hasBackedUpChecked) return;
    try {
      setProcessing(true);
      const res = await api.cleanAllData();
      setActionFeedback(res.message);
      setConfirmCleanAllOpen(false);
      setHasBackedUpChecked(false);
      setModalBackupDownloaded(false);
      await loadAdminData();
      onRefreshAll();
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Error al limpiar la base de datos.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            Acceso Docente Exclusivo
          </div>
          <h2 className="text-2xl font-black tracking-tight">Panel del Profesor / Administrador</h2>
          <p className="text-xs text-blue-200">
            Escuela de Formación Profesional Don Bosco • Habilidades Digitales + IA 2026
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'stats' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Estadísticas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer relative ${
              activeTab === 'categories'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Categorías pendientes
            {pendingCategories.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-bold">
                {pendingCategories.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Usuarios ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'maintenance'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Backups y Datos</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* TAB 1: ESTADÍSTICAS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Key metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Alumnos Registrados
                </span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.total_alumnos}</div>
              <span className="text-[11px] text-slate-500">Cuentas activas en la plataforma</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Trabajos Publicados
                </span>
                <FolderGit2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.total_trabajos}</div>
              <span className="text-[11px] text-slate-500">Proyectos Vibe Coding activos</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Calificaciones
                </span>
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.total_calificaciones}</div>
              <span className="text-[11px] text-slate-500">Votos emitidos por alumnos</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Promedio General
                </span>
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {stats.promedio_general.toFixed(1)}
              </div>
              <span className="text-[11px] text-slate-500">Puntaje global del curso (1-5)</span>
            </div>
          </div>

          {/* Differentiated Rankings: Mejor Calificado vs Más Votado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trabajos Mejor Calificados (ordenados por promedio DESC) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Trabajos Mejor Calificados
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Ordenados estrictamente por mayor promedio de estrellas
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  Top Promedios
                </span>
              </div>

              {stats.trabajos_mejor_calificados.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Aún no hay calificaciones registradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.trabajos_mejor_calificados.map((app, idx) => (
                    <div
                      key={app.id}
                      onClick={() => onSelectApp(app)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                        <AppLogo logo={app.logo} name={app.nombre} size="sm" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {app.nombre}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {app.autor_nombre} {app.autor_apellido}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 font-extrabold text-xs text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{app.promedio_calificacion.toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {app.cantidad_votos} {app.cantidad_votos === 1 ? 'voto' : 'votos'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trabajos Más Votados (ordenados por cantidad de votos DESC) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Trabajos Más Votados</h3>
                    <p className="text-[11px] text-slate-400">
                      Ordenados estrictamente por mayor volumen de participación
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Top Participación
                </span>
              </div>

              {stats.trabajos_mas_votados.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Aún no hay calificaciones registradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.trabajos_mas_votados.map((app, idx) => (
                    <div
                      key={app.id}
                      onClick={() => onSelectApp(app)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                        <AppLogo logo={app.logo} name={app.nombre} size="sm" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {app.nombre}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {app.autor_nombre} {app.autor_apellido}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-xs text-blue-700">
                          {app.cantidad_votos} {app.cantidad_votos === 1 ? 'voto' : 'votos'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Promedio: ★ {app.promedio_calificacion.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secondary stats: Categorías más utilizadas y Alumnos con más publicaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categorías más utilizadas */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Categorías Más Utilizadas
              </h3>
              <div className="space-y-2">
                {stats.categorias_mas_utilizadas.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700 font-medium">{cat.nombre}</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {cat.cantidad} {cat.cantidad === 1 ? 'proyecto' : 'proyectos'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alumnos con mayor cantidad de publicaciones */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Alumnos con Más Publicaciones
              </h3>
              <div className="space-y-2">
                {stats.alumnos_con_mas_publicaciones.map((al) => (
                  <div
                    key={al.id}
                    onClick={() => onSelectAuthor(al.id)}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span className="text-blue-700 font-semibold hover:underline">
                      {al.nombre}
                    </span>
                    <span className="font-bold text-slate-900 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md">
                      {al.cantidad} {al.cantidad === 1 ? 'trabajo' : 'trabajos'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORÍAS PENDIENTES */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">Categorías Propuestas por Alumnos</h3>
            <p className="text-xs text-slate-500">
              Evalúa las solicitudes de nuevas categorías. Al aprobar una propuesta, pasa a estar
              disponible para todos de forma inmediata. Al rechazarla, se elimina definitivamente.
            </p>
          </div>

          {pendingCategories.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs italic bg-slate-50 rounded-2xl border border-slate-200">
              No hay solicitudes de categorías pendientes de revisión en este momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {pendingCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cat.nombre}</h4>
                    <p className="text-xs text-slate-500">
                      Propuesta por: <strong>{cat.usuario_proponente_nombre || 'Alumno'}</strong> •{' '}
                      {new Date(cat.fecha_creacion).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleApproveCategory(cat.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleRejectCategory(cat.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USUARIOS REGISTRADOS (SOLO CONSULTA) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">Listado de Usuarios Registrados</h3>
            <p className="text-xs text-slate-500">
              Vista informativa y de consulta de los estudiantes y el docente preconfigurado. Por
              especificación de seguridad, no se permite modificar roles ni eliminar usuarios desde
              esta interfaz.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Nombre y Apellido</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Trabajos</th>
                  <th className="p-3">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="p-3 font-mono text-slate-500">@{u.nombre_usuario}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.rol === 'ADMINISTRADOR'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{u.cantidad_aplicaciones || 0}</td>
                    <td className="p-3 text-slate-400">
                      {u.fecha_creacion
                        ? new Date(u.fecha_creacion).toLocaleDateString('es-AR')
                        : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUPS, RESTAURACIÓN Y GESTIÓN DE DATOS */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-700" />
                  <span>Copias de Seguridad (Backup) y Administración de Datos</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Herramientas directas para exportar copias de seguridad de toda la información (alumnos, trabajos, calificaciones y categorías), recuperar copias guardadas y realizar limpiezas seguras con sincronización en Google Cloud Firestore.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAdminData}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
                title="Actualizar estado"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${processing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Live Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Alumnos Activos</span>
                <span className="text-lg font-black text-slate-900">{stats?.total_alumnos || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Trabajos Totales</span>
                <span className="text-lg font-black text-blue-700">{stats?.total_trabajos || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Calificaciones</span>
                <span className="text-lg font-black text-amber-600">{stats?.total_calificaciones || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Puntos de Resguardo</span>
                <span className="text-lg font-black text-emerald-700">{snapshots.length}</span>
              </div>
            </div>
          </div>

          {/* 3 Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Hacer Backup */}
            <div className="bg-white rounded-3xl border border-blue-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                    Exportar Copia
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">1. Hacer Backup de Toda la Información</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exporta una copia de seguridad íntegra con todos los trabajos subidos (incluidos trabajos finales), calificaciones, comentarios, cuentas de alumnos y categorías. Se descarga en formato <strong>.json</strong> y se resguarda una copia en el servidor.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleDownloadBackup}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{processing ? 'Generando backup...' : 'Descargar Backup (.json)'}</span>
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleCreateServerSnapshot}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200/80 rounded-xl transition cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Guardar punto en servidor sin descargar</span>
                </button>
              </div>
            </div>

            {/* Card 2: Recuperar Backup */}
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Restaurar Copia
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">2. Recuperar Información de Backup</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Restaura el estado íntegro de la aplicación desde un archivo <strong>.json</strong> de backup guardado previamente. El sistema validará el contenido, mostrará un resumen previo y sincronizará todo automáticamente con Google Cloud Firestore.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition cursor-pointer shadow-xs">
                  <FileJson className="w-4 h-4" />
                  <span>Subir y Recuperar archivo (.json)</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 text-center">
                  O usa el botón "Restaurar" en la lista de puntos históricos abajo.
                </p>
              </div>
            </div>

            {/* Card 3: Limpiar Todo */}
            <div className="bg-white rounded-3xl border border-rose-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                    Reinicio Seguro
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">3. Eliminar Toda la Información (Limpiar Todo)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Elimina todas las aplicaciones publicadas, calificaciones y cuentas de alumnos para iniciar un ciclo nuevo con la base de datos limpia.
                  <span className="block mt-1 font-semibold text-rose-950">
                    Tu usuario Administrador y las categorías Don Bosco se conservarán intactas.
                  </span>
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleOpenCleanAllModal}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Eliminar toda la información existente</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Crea un resguardo automático previo antes de limpiar.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Server Snapshots History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Puntos de Restauración Automáticos en el Servidor</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cada vez que descargas un backup o realizas cambios mayores, se resguarda una copia histórica aquí.
                </p>
              </div>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                <HardDrive className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No hay puntos de restauración guardados aún.</p>
                <p className="text-[11px] text-slate-400">
                  Haz clic en "Descargar Copia de Seguridad" arriba para crear el primero.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {snapshots.slice(0, 8).map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{snap.filename}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {(snap.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{new Date(snap.timestamp).toLocaleString('es-AR')}</span>
                        <span>•</span>
                        <span>Creador: {snap.creator}</span>
                        <span>•</span>
                        <span className="font-semibold text-blue-700">
                          {snap.summary.total_applications} trabajos ({snap.summary.total_finales || 0} finales)
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {snap.summary.total_users} usuarios
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedSnapshotToRestore(snap)}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
                        title="Restaurar toda la información de este punto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>

                      <a
                        href={`/api/admin/backup/download/${snap.id}`}
                        download={snap.filename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
                        title="Descargar este archivo JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secondary helper: Cargar Datos de Prueba */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Cargar Datos de Prueba para Demostración
              </span>
              <p className="text-[11px] text-slate-500">
                Puebla la plataforma con proyectos de ejemplo variados para verificar filtros y criterios de evaluación.
              </p>
            </div>
            <button
              type="button"
              disabled={processing}
              onClick={handleSeedTestData}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition cursor-pointer shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sembrar datos de prueba</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Test Data */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="text-lg font-black text-slate-900">¿Confirmar limpieza de datos de prueba?</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Esta acción eliminará las aplicaciones y calificaciones de prueba. Se conservarán las categorías iniciales y tu usuario Administrador.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleClearTestData}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
              >
                {processing ? 'Limpiando...' : 'Sí, limpiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Confirmation for Clean All Data (Eliminar Toda la Información) */}
      {confirmCleanAllOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-4 my-8">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center relative shadow-sm">
                <Trash2 className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black ring-2 ring-white">
                  !
                </span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-xl font-black text-slate-900">
                ¿Eliminar toda la información existente?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Esta acción vaciará el catálogo para iniciar un nuevo ciclo lectivo. Se eliminarán de forma permanente todas las aplicaciones subidas, calificaciones y cuentas de alumnos.
              </p>
            </div>

            {/* ADVERTENCIA PRINCIPAL Y PREGUNTA DE BACKUP */}
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Advertencia y Pregunta de Seguridad
                  </h5>
                  <p className="text-xs text-amber-950 leading-relaxed font-bold">
                    ¿Has realizado un backup de toda la información antes de eliminar o limpiar todo?
                  </p>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Si continúas sin haber realizado un backup, todos los trabajos prácticos desarrollados por los estudiantes y sus notas se perderán y no podrás recuperarlos.
                  </p>
                </div>
              </div>

              {/* Estado del último backup registrado en el servidor */}
              <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-[11px] text-slate-700 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="truncate">
                  {snapshots.length > 0 ? (
                    <span>
                      Último backup en servidor:{' '}
                      <strong className="text-slate-900">
                        {new Date(snapshots[0].timestamp).toLocaleDateString('es-AR')}{' '}
                        {new Date(snapshots[0].timestamp).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>{' '}
                      <span className="text-slate-500">
                        ({snapshots[0].summary.total_applications} trab., {snapshots[0].summary.total_users} alum.)
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold">
                      Aún no has generado ninguna copia de seguridad en esta sesión.
                    </span>
                  )}
                </div>
              </div>

              {/* Botón rápido para hacer backup en el acto antes de eliminar */}
              {modalBackupDownloaded ? (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-300 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Copia de seguridad (.json) descargada exitosamente justo ahora!</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleDownloadBackupFromCleanModal}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4 text-blue-700" />
                  <span>Descargar Backup ahora antes de eliminar (Recomendado)</span>
                </button>
              )}
            </div>

            {/* Garantía de Seguridad Institucional */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Garantías de seguridad de la plataforma:
              </span>
              <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
                <li>Tu usuario Administrador y las categorías Don Bosco se conservarán intactas.</li>
                <li>El sistema creará un punto de resguardo previo automático en el servidor.</li>
              </ul>
            </div>

            {/* Checkbox de confirmación expresa de haber realizado backup */}
            <label className="flex items-start gap-3 p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl cursor-pointer hover:bg-rose-50 transition select-none">
              <input
                type="checkbox"
                checked={hasBackedUpChecked}
                onChange={(e) => setHasBackedUpChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs text-slate-800 leading-snug">
                <strong className="text-rose-950 block font-bold mb-0.5">
                  Confirmo que ya realicé el backup de la información (o asumo la eliminación).
                </strong>
                He verificado el resguardo de los trabajos de mis alumnos y deseo limpiar la base de datos por completo.
              </span>
            </label>

            {/* Botones del modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmCleanAllOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processing || !hasBackedUpChecked}
                onClick={handleConfirmCleanAll}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition shadow-xs ${
                  hasBackedUpChecked && !processing
                    ? 'text-white bg-rose-600 hover:bg-rose-700 cursor-pointer'
                    : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title={
                  !hasBackedUpChecked
                    ? 'Marca la casilla confirmando que realizaste el backup para habilitar'
                    : 'Eliminar toda la información'
                }
              >
                <Trash2 className="w-4 h-4" />
                <span>{processing ? 'Eliminando todo...' : 'Sí, eliminar toda la información'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Preview & Confirm Restore from Uploaded JSON File */}
      {fileRestorePreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <FileJson className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-slate-900">
                Confirmar Restauración de Copia de Seguridad
              </h4>
              <p className="text-xs text-slate-600">
                Archivo analizado con éxito: <strong className="text-slate-800">{fileRestorePreview.filename}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Trabajos a restaurar</span>
                <span className="font-bold text-slate-900 text-sm">
                  {fileRestorePreview.summary.total_applications}{' '}
                  <span className="text-[10px] font-normal text-amber-700">
                    ({fileRestorePreview.summary.total_finales} finales)
                  </span>
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Alumnos a restaurar</span>
                <span className="font-bold text-slate-900 text-sm">
                  {fileRestorePreview.summary.total_users}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Calificaciones</span>
                <span className="font-bold text-slate-900 text-sm">
                  {fileRestorePreview.summary.total_ratings}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Categorías</span>
                <span className="font-bold text-slate-900 text-sm">
                  {fileRestorePreview.summary.total_categories}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50 border border-blue-200/70 p-3 rounded-xl">
              Al confirmar, se sincronizarán todos los registros en Google Cloud Firestore y la base de datos local.
              Se resguardará una copia de seguridad previa de manera automática.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFileRestorePreview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmRestoreFromFile}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
              >
                {processing ? 'Restaurando...' : 'Sí, restaurar base de datos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Restore from Server Snapshot */}
      {selectedSnapshotToRestore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-slate-900">
                ¿Restaurar punto guardado en el servidor?
              </h4>
              <p className="text-xs text-slate-600">
                Archivo: <strong className="text-slate-800">{selectedSnapshotToRestore.filename}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Fecha del punto: {new Date(selectedSnapshotToRestore.timestamp).toLocaleString('es-AR')}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="font-semibold text-slate-700 block">Contenido del punto:</span>
              <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                <span>• {selectedSnapshotToRestore.summary.total_applications} aplicaciones</span>
                <span>• {selectedSnapshotToRestore.summary.total_users} usuarios</span>
                <span>• {selectedSnapshotToRestore.summary.total_ratings} calificaciones</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSnapshotToRestore(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmRestoreFromSnapshot}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
              >
                {processing ? 'Restaurando...' : 'Confirmar Restauración'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
