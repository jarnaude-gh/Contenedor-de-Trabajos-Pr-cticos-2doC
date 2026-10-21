import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from './firebase';

// Retry helper for transient network stream resets (e.g. Code 14 UNAVAILABLE: read ECONNRESET)
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isNetworkError =
      err?.message?.includes('ECONNRESET') ||
      err?.code === 14 ||
      err?.code === 'unavailable' ||
      err?.message?.includes('UNAVAILABLE') ||
      err?.message?.includes('failed to connect');

    if (retries > 0 && isNetworkError) {
      console.warn(`[Firestore] Transient network reset (${err?.message || err?.code}), reintentando en ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  email: string;
  password_hash: string;
  rol: 'ALUMNO' | 'ADMINISTRADOR';
  fecha_creacion: string;
  reset_token?: string;
  reset_token_expires?: number;
}

export interface Category {
  id: string;
  nombre: string;
  estado: 'ACTIVA' | 'PENDIENTE';
  usuario_proponente_id?: string;
  usuario_proponente_nombre?: string;
  fecha_creacion: string;
}

export interface SpecificationFile {
  nombre_archivo: string;
  url: string;
  tamano_bytes: number;
  tipo_mime: string;
  fecha_subida: string;
  almacenamiento?: 'firebase_storage' | 'local';
}

export interface Application {
  id: string;
  nombre: string;
  logo: string;
  descripcion: string;
  enlace: string;
  autor_id: string;
  categoria_id: string;
  herramienta: string;
  es_trabajo_final?: boolean;
  especificacion?: SpecificationFile | null;
  fecha_publicacion: string;
  fecha_ultima_modificacion: string;
}

export interface Rating {
  id: string;
  aplicacion_id: string;
  usuario_id: string;
  puntuacion: number; // 1 to 5
  comentario: string;
  fecha_calificacion: string;
  fecha_ultima_modificacion: string;
}

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  applications: Application[];
  ratings: Rating[];
}

export interface BackupSnapshot {
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
  data: DatabaseSchema;
}

export const INITIAL_CATEGORIES = [
  'Educación',
  'Salud',
  'Contable / Finanzas',
  'Entretenimiento',
  'Productividad',
  'Compras',
  'Uso personal',
  'Cosmética / Belleza',
  'Organización',
  'Servicios',
  'General',
  'Otros',
];

export const INITIAL_TOOLS = [
  'Google AI Studio',
  'Lovable',
  'Replit',
  'Bolt',
  'Base44',
  'Otra',
];

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

class Database {
  private data: DatabaseSchema;
  private isFirestoreReady: boolean = false;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
    this.data = this.load();
    this.initializeDefaults();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, creating fresh store', err);
      }
    }
    return {
      users: [],
      categories: [],
      applications: [],
      ratings: [],
    };
  }

  public save(): void {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error saving local database backup:', err);
    }
  }

  // Connects and synchronizes with Google Cloud Firestore
  public async initFirestore(): Promise<void> {
    try {
      console.log('[Firestore] Conectando a Google Cloud Firestore...');
      const [usersSnap, catsSnap, appsSnap, ratingsSnap] = await Promise.all([
        withRetry(() => getDocs(collection(firestore, 'users'))),
        withRetry(() => getDocs(collection(firestore, 'categories'))),
        withRetry(() => getDocs(collection(firestore, 'applications'))),
        withRetry(() => getDocs(collection(firestore, 'ratings'))),
      ]);

      if (appsSnap.docs.length > 0 || usersSnap.docs.length > 0) {
        // Cloud Firestore already has production data! Hydrate from Firestore.
        this.data = {
          users: usersSnap.docs.map((d) => d.data() as User),
          categories: catsSnap.docs.map((d) => d.data() as Category),
          applications: appsSnap.docs.map((d) => d.data() as Application),
          ratings: ratingsSnap.docs.map((d) => d.data() as Rating),
        };
        console.log(
          `[Firestore] Datos cargados exitosamente de la nube: ${this.data.applications.length} aplicaciones, ${this.data.users.length} usuarios, ${this.data.ratings.length} calificaciones.`
        );
        this.save();
      } else {
        // Cloud Firestore is empty: push initial seed into Firestore
        console.log('[Firestore] Base de datos en la nube inicializada vacía. Sincronizando datos iniciales a Firestore...');
        await this.syncAllToFirestore();
      }
      this.isFirestoreReady = true;
    } catch (err) {
      console.error('[Firestore] Error al sincronizar con Firestore, operando con respaldo local:', err);
    }
  }

  // Writes all local records into Cloud Firestore
  public async syncAllToFirestore(): Promise<void> {
    try {
      const promises: Promise<any>[] = [];

      for (const user of this.data.users) {
        promises.push(withRetry(() => setDoc(doc(firestore, 'users', user.id), user)));
      }
      for (const cat of this.data.categories) {
        promises.push(withRetry(() => setDoc(doc(firestore, 'categories', cat.id), cat)));
      }
      for (const app of this.data.applications) {
        promises.push(withRetry(() => setDoc(doc(firestore, 'applications', app.id), app)));
      }
      for (const rating of this.data.ratings) {
        promises.push(withRetry(() => setDoc(doc(firestore, 'ratings', rating.id), rating)));
      }

      await Promise.all(promises);
      console.log('[Firestore] Todos los datos fueron sincronizados exitosamente con Google Cloud Firestore.');
    } catch (err) {
      console.error('[Firestore] Error sincronizando registros con Firestore:', err);
    }
  }

  private initializeDefaults() {
    let changed = false;

    // Check categories
    if (this.data.categories.length === 0) {
      INITIAL_CATEGORIES.forEach((name, idx) => {
        this.data.categories.push({
          id: `cat-${idx + 1}`,
          nombre: name,
          estado: 'ACTIVA',
          fecha_creacion: new Date('2026-03-01T08:00:00Z').toISOString(),
        });
      });
      changed = true;
    }

    // Check preconfigured admin
    const adminExists = this.data.users.some((u) => u.rol === 'ADMINISTRADOR');
    if (!adminExists) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('DonBosco2026!', salt);
      this.data.users.push({
        id: 'user-admin-1',
        nombre: 'Profesor',
        apellido: 'Don Bosco',
        nombre_usuario: 'profesor_donbosco',
        email: 'profesor@donbosco.edu.ar',
        password_hash: hash,
        rol: 'ADMINISTRADOR',
        fecha_creacion: new Date('2026-03-01T08:00:00Z').toISOString(),
      });
      changed = true;
    }

    if (changed) {
      this.save();
    }
  }

  public seedInitialTestData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Alumno2026!', salt);

    const testStudents: Omit<User, 'id' | 'password_hash' | 'rol' | 'fecha_creacion'>[] = [
      {
        nombre: 'Mateo',
        apellido: 'Gómez',
        nombre_usuario: 'mateo_gomez',
        email: 'mateo.gomez@donbosco.edu.ar',
      },
      {
        nombre: 'Sofía',
        apellido: 'Rodríguez',
        nombre_usuario: 'sofia_rodriguez',
        email: 'sofia.rodriguez@donbosco.edu.ar',
      },
      {
        nombre: 'Lucas',
        apellido: 'Benítez',
        nombre_usuario: 'lucas_benitez',
        email: 'lucas.benitez@donbosco.edu.ar',
      },
      {
        nombre: 'Camila',
        apellido: 'Herrera',
        nombre_usuario: 'camila_herrera',
        email: 'camila.herrera@donbosco.edu.ar',
      },
      {
        nombre: 'Joaquín',
        apellido: 'Martínez',
        nombre_usuario: 'joaquin_martinez',
        email: 'joaquin.martinez@donbosco.edu.ar',
      },
    ];

    const studentIds: string[] = [];

    testStudents.forEach((student, idx) => {
      let existing = this.data.users.find(
        (u) => u.email === student.email || u.nombre_usuario === student.nombre_usuario
      );
      if (!existing) {
        existing = {
          id: `student-${idx + 1}`,
          ...student,
          password_hash: defaultPasswordHash,
          rol: 'ALUMNO',
          fecha_creacion: new Date(Date.now() - (30 - idx * 5) * 86400000).toISOString(),
        };
        this.data.users.push(existing);
      }
      studentIds.push(existing.id);
    });

    const getCatId = (name: string) => {
      const cat = this.data.categories.find((c) => c.nombre.toLowerCase() === name.toLowerCase());
      return cat ? cat.id : this.data.categories[0].id;
    };

    const testApps: Array<{
      id: string;
      nombre: string;
      logo: string;
      descripcion: string;
      enlace: string;
      autor_id: string;
      categoria_id: string;
      herramienta: string;
      fecha_publicacion: string;
      fecha_ultima_modificacion: string;
    }> = [
      {
        id: 'app-1',
        nombre: 'EduBot Tutor Inteligente',
        logo: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Asistente pedagógico interactivo para nivel secundario que responde dudas curriculares con explicaciones paso a paso. Diseñado para nivelación de conceptos matemáticos y comprensión lectora con actividades adaptativas según el ritmo del estudiante.',
        enlace: 'https://edubot-tutor-donbosco.web.app',
        autor_id: studentIds[0],
        categoria_id: getCatId('Educación'),
        herramienta: 'Google AI Studio',
        fecha_publicacion: new Date(Date.now() - 14 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: 'app-2',
        nombre: 'BalancePro Finanzas Personales',
        logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Herramienta de control y presupuesto familiar que analiza tickets de compra y genera alertas de sobregiro. Cuenta con gráficos claros de flujo de caja y proyecciones de ahorro mensuales orientadas a emprendedores y hogares.',
        enlace: 'https://balancepro-app.lovable.app',
        autor_id: studentIds[1],
        categoria_id: getCatId('Contable / Finanzas'),
        herramienta: 'Lovable',
        fecha_publicacion: new Date(Date.now() - 12 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: 'app-3',
        nombre: 'NutriPlan Salud y Hábitos',
        logo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Planificador nutricional inteligente que propone menús saludables basados en ingredientes accesibles de temporada. Incluye calculadora de hidratación diaria y recordatorios amigables de pausas activas para trabajadores frente a pantallas.',
        enlace: 'https://nutriplan-salud.replit.app',
        autor_id: studentIds[2],
        categoria_id: getCatId('Salud'),
        herramienta: 'Replit',
        fecha_publicacion: new Date(Date.now() - 10 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'app-4',
        nombre: 'FocusFlow Tareas Ágiles',
        logo: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Gestor de productividad personal basado en técnica Pomodoro y matriz Eisenhower con priorización automática. Organiza tareas académicas y laborales mediante tableros kanban minimalistas y temporizadores con sonidos ambientales.',
        enlace: 'https://focusflow-donbosco.bolt.app',
        autor_id: studentIds[3],
        categoria_id: getCatId('Productividad'),
        herramienta: 'Bolt',
        fecha_publicacion: new Date(Date.now() - 8 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'app-5',
        nombre: 'TriviaGenius Desafíos Don Bosco',
        logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Juego de preguntas y respuestas multijugador sobre cultura general, programación y ciencias naturales. Permite a los docentes crear salas de competencia en vivo con tabla de líderes en tiempo real y recompensas de medallas.',
        enlace: 'https://triviagenius-live.web.app',
        autor_id: studentIds[0],
        categoria_id: getCatId('Entretenimiento'),
        herramienta: 'Base44',
        fecha_publicacion: new Date(Date.now() - 6 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        id: 'app-6',
        nombre: 'GlamStock Gestor de Salón',
        logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Aplicación de gestión de turnos e inventario de productos de estética para peluquerías y centros de belleza barriales. Automatiza recordatorios de citas por mensajería y alerta cuando el stock de tinturas o cremas está por agotarse.',
        enlace: 'https://glamstock-gestion.lovable.app',
        autor_id: studentIds[4],
        categoria_id: getCatId('Cosmética / Belleza'),
        herramienta: 'Lovable',
        fecha_publicacion: new Date(Date.now() - 4 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'app-7',
        nombre: 'FeriaVecina Catálogo Barrial',
        logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Directorio digital para conectar emprendedores de la comunidad con vecinos para compra y venta de productos locales. Facilita la publicación de catálogos sencillos con enlaces directos para consultas y pedidos sin comisiones intermedias.',
        enlace: 'https://feriavecina.donbosco.app',
        autor_id: studentIds[1],
        categoria_id: getCatId('Compras'),
        herramienta: 'Google AI Studio',
        fecha_publicacion: new Date(Date.now() - 2 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'app-8',
        nombre: 'EcoTurnos Servicios Municipales',
        logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&auto=format&fit=crop&q=80',
        descripcion:
          'Prototipo de ventanilla única para reserva de turnos ciudadanos y trámites comunitarios simplificados. Integra guía de requisitos documentales paso a paso para evitar filas innecesarias y agilizar la atención en sedes vecinales.',
        enlace: 'https://ecoturnos-servicios.bolt.app',
        autor_id: studentIds[3],
        categoria_id: getCatId('Servicios'),
        herramienta: 'Bolt',
        fecha_publicacion: new Date(Date.now() - 1 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'app-9',
        nombre: 'HabitZen Tracker Minimalista',
        logo: '',
        descripcion:
          'Registro diario de rutinas y metas de lectura, meditación y estudio con visualización de rachas y estadísticas semanales. Enfocado en la simplicidad extrema sin notificaciones invasivas para fomentar la constancia sostenida.',
        enlace: 'https://habitzen-tracker.web.app',
        autor_id: studentIds[2],
        categoria_id: getCatId('Uso personal'),
        herramienta: 'Google AI Studio',
        fecha_publicacion: new Date(Date.now() - 12 * 3600000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
    ];

    testApps.forEach((app) => {
      if (!this.data.applications.some((a) => a.id === app.id)) {
        this.data.applications.push(app);
      }
    });

    const testRatings: Rating[] = [
      {
        id: 'rate-1',
        aplicacion_id: 'app-1',
        usuario_id: studentIds[1],
        puntuacion: 5,
        comentario: 'Excelente interfaz y muy clara la explicación de los temas. ¡Felicitaciones Mateo!',
        fecha_calificacion: new Date(Date.now() - 10 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'rate-2',
        aplicacion_id: 'app-1',
        usuario_id: studentIds[2],
        puntuacion: 5,
        comentario: 'Muy fluido con Google AI Studio, las respuestas pedagógicas son súper acertadas.',
        fecha_calificacion: new Date(Date.now() - 9 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
      {
        id: 'rate-3',
        aplicacion_id: 'app-1',
        usuario_id: studentIds[3],
        puntuacion: 5,
        comentario: 'Gran trabajo visual y de usabilidad para estudiantes secundarios.',
        fecha_calificacion: new Date(Date.now() - 8 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'rate-4',
        aplicacion_id: 'app-2',
        usuario_id: studentIds[0],
        puntuacion: 5,
        comentario: 'Los gráficos de balance están impecables y es muy fácil cargar los gastos.',
        fecha_calificacion: new Date(Date.now() - 8 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'rate-5',
        aplicacion_id: 'app-2',
        usuario_id: studentIds[2],
        puntuacion: 4,
        comentario: 'Muy completa, solo agregaría soporte para exportar en PDF.',
        fecha_calificacion: new Date(Date.now() - 7 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'rate-6',
        aplicacion_id: 'app-2',
        usuario_id: studentIds[4],
        puntuacion: 5,
        comentario: 'Me encantó el diseño en Lovable. Muy profesional.',
        fecha_calificacion: new Date(Date.now() - 6 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        id: 'rate-7',
        aplicacion_id: 'app-3',
        usuario_id: studentIds[0],
        puntuacion: 4,
        comentario: 'Buenas sugerencias de recetas simples para cocinar rico y sano.',
        fecha_calificacion: new Date(Date.now() - 5 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'rate-8',
        aplicacion_id: 'app-3',
        usuario_id: studentIds[1],
        puntuacion: 4,
        comentario: 'El temporizador de hidratación es un gran detalle.',
        fecha_calificacion: new Date(Date.now() - 4 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'rate-9',
        aplicacion_id: 'app-4',
        usuario_id: studentIds[0],
        puntuacion: 5,
        comentario: 'El sonido de lluvia con el pomodoro es excelente para concentrarse.',
        fecha_calificacion: new Date(Date.now() - 3 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'rate-10',
        aplicacion_id: 'app-5',
        usuario_id: studentIds[2],
        puntuacion: 4,
        comentario: 'Muy divertido para jugar entre compañeros en el recreo.',
        fecha_calificacion: new Date(Date.now() - 3 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'rate-11',
        aplicacion_id: 'app-5',
        usuario_id: studentIds[3],
        puntuacion: 4,
        comentario: 'La tabla de líderes en tiempo real funciona perfecto.',
        fecha_calificacion: new Date(Date.now() - 2 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'rate-12',
        aplicacion_id: 'app-5',
        usuario_id: studentIds[4],
        puntuacion: 4,
        comentario: 'Preguntas muy buenas y desafiantes.',
        fecha_calificacion: new Date(Date.now() - 2 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'rate-13',
        aplicacion_id: 'app-6',
        usuario_id: studentIds[1],
        puntuacion: 3,
        comentario: 'Buena idea, aunque en pantallas pequeñas algunos botones se superponen.',
        fecha_calificacion: new Date(Date.now() - 1 * 86400000).toISOString(),
        fecha_ultima_modificacion: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    testRatings.forEach((rating) => {
      if (!this.data.ratings.some((r) => r.id === rating.id)) {
        this.data.ratings.push(rating);
      }
    });

    const pendingCatExists = this.data.categories.some((c) => c.estado === 'PENDIENTE');
    if (!pendingCatExists) {
      this.data.categories.push({
        id: 'cat-prop-1',
        nombre: 'Ciberseguridad y Redes',
        estado: 'PENDIENTE',
        usuario_proponente_id: studentIds[0],
        usuario_proponente_nombre: 'Mateo Gómez',
        fecha_creacion: new Date(Date.now() - 2 * 86400000).toISOString(),
      });
    }

    this.save();
  }

  public async clearTestData() {
    const adminUsers = this.data.users.filter((u) => u.rol === 'ADMINISTRADOR');

    const initialCats: Category[] = INITIAL_CATEGORIES.map((name, idx) => ({
      id: `cat-${idx + 1}`,
      nombre: name,
      estado: 'ACTIVA',
      fecha_creacion: new Date('2026-03-01T08:00:00Z').toISOString(),
    }));

    // Delete apps and ratings from Firestore
    try {
      const deletePromises: Promise<any>[] = [];
      for (const app of this.data.applications) {
        deletePromises.push(deleteDoc(doc(firestore, 'applications', app.id)));
      }
      for (const rating of this.data.ratings) {
        deletePromises.push(deleteDoc(doc(firestore, 'ratings', rating.id)));
      }
      for (const u of this.data.users) {
        if (u.rol !== 'ADMINISTRADOR') {
          deletePromises.push(deleteDoc(doc(firestore, 'users', u.id)));
        }
      }
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('[Firestore] Error clearing cloud records:', err);
    }

    this.data = {
      users: adminUsers,
      categories: initialCats,
      applications: [],
      ratings: [],
    };

    this.save();
    await this.syncAllToFirestore();
  }

  // =============================================================
  // BACKUP, RESTORE & DATA MANAGEMENT
  // =============================================================

  public createBackup(creator: string = 'Profesor Administrador'): BackupSnapshot {
    const timestamp = new Date().toISOString();
    const dateFormatted = timestamp.replace(/[:.]/g, '-').slice(0, 19);
    const id = `backup-${dateFormatted}`;
    const filename = `backup-donbosco-${dateFormatted}.json`;

    const summary = {
      total_users: this.data.users.length,
      total_applications: this.data.applications.length,
      total_categories: this.data.categories.length,
      total_ratings: this.data.ratings.length,
      total_finales: this.data.applications.filter((a) => a.es_trabajo_final).length,
    };

    const snapshot: BackupSnapshot = {
      id,
      filename,
      timestamp,
      creator,
      summary,
      data: JSON.parse(JSON.stringify(this.data)),
    };

    try {
      const filePath = path.join(BACKUPS_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
      console.log(`[Backup] Copia de seguridad guardada con éxito: ${filename}`);
    } catch (err) {
      console.error('[Backup] Error guardando archivo de snapshot:', err);
    }

    return snapshot;
  }

  public listBackups(): Array<{
    id: string;
    filename: string;
    timestamp: string;
    creator: string;
    summary: BackupSnapshot['summary'];
    sizeBytes: number;
  }> {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) return [];
      const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));

      const backups = files.map((file) => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          return {
            id: parsed.id || file.replace('.json', ''),
            filename: file,
            timestamp: parsed.timestamp || stats.mtime.toISOString(),
            creator: parsed.creator || 'Sistema',
            summary: parsed.summary || {
              total_users: parsed.data?.users?.length || 0,
              total_applications: parsed.data?.applications?.length || 0,
              total_categories: parsed.data?.categories?.length || 0,
              total_ratings: parsed.data?.ratings?.length || 0,
              total_finales: 0,
            },
            sizeBytes: stats.size,
          };
        } catch {
          return {
            id: file.replace('.json', ''),
            filename: file,
            timestamp: stats.mtime.toISOString(),
            creator: 'Sistema',
            summary: {
              total_users: 0,
              total_applications: 0,
              total_categories: 0,
              total_ratings: 0,
              total_finales: 0,
            },
            sizeBytes: stats.size,
          };
        }
      });

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error('[Backup] Error listando copias de seguridad:', err);
      return [];
    }
  }

  public getBackupById(id: string): BackupSnapshot | null {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) return null;
      const files = fs.readdirSync(BACKUPS_DIR);
      const targetFile = files.find((f) => f === `${id}.json` || f === id || f.includes(id));
      if (!targetFile) return null;
      const raw = fs.readFileSync(path.join(BACKUPS_DIR, targetFile), 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[Backup] Error leyendo backup por ID:', err);
      return null;
    }
  }

  public async cleanAllData(creator: string = 'Profesor Administrador'): Promise<{
    message: string;
    preWipeBackupId: string;
    clearedCount: {
      applications: number;
      ratings: number;
      students: number;
      pendingCategories: number;
    };
  }> {
    // 1. Guardar resguardo de seguridad previo automáticamente
    const preWipeSnapshot = this.createBackup(`Auto-resguardo previo a Limpieza Total (${creator})`);

    const appsCount = this.data.applications.length;
    const ratingsCount = this.data.ratings.length;
    const studentsCount = this.data.users.filter((u) => u.rol !== 'ADMINISTRADOR').length;
    const pendingCatCount = this.data.categories.filter((c) => c.estado === 'PENDIENTE').length;

    // 2. Eliminar todas las aplicaciones y calificaciones de Firestore
    try {
      const deletePromises: Promise<any>[] = [];
      const [appsSnap, ratingsSnap, usersSnap, catsSnap] = await Promise.all([
        withRetry(() => getDocs(collection(firestore, 'applications'))).catch(() => ({ docs: [] })),
        withRetry(() => getDocs(collection(firestore, 'ratings'))).catch(() => ({ docs: [] })),
        withRetry(() => getDocs(collection(firestore, 'users'))).catch(() => ({ docs: [] })),
        withRetry(() => getDocs(collection(firestore, 'categories'))).catch(() => ({ docs: [] })),
      ]);

      appsSnap.docs.forEach((d) => {
        deletePromises.push(withRetry(() => deleteDoc(d.ref)));
      });
      ratingsSnap.docs.forEach((d) => {
        deletePromises.push(withRetry(() => deleteDoc(d.ref)));
      });
      usersSnap.docs.forEach((d) => {
        const data = d.data() as User;
        if (data.rol !== 'ADMINISTRADOR') {
          deletePromises.push(withRetry(() => deleteDoc(d.ref)));
        }
      });
      catsSnap.docs.forEach((d) => {
        const data = d.data() as Category;
        if (data.estado === 'PENDIENTE' || !INITIAL_CATEGORIES.includes(data.nombre)) {
          deletePromises.push(withRetry(() => deleteDoc(d.ref)));
        }
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('[Firestore] Error eliminando registros de Firestore en Limpiar Todo:', err);
    }

    // 3. Preservar o restaurar cuenta administrador inicial
    const adminUsers = this.data.users.filter((u) => u.rol === 'ADMINISTRADOR');
    if (adminUsers.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      adminUsers.push({
        id: 'user-admin-1',
        nombre: 'Profesor',
        apellido: 'Don Bosco',
        nombre_usuario: 'profesor_donbosco',
        email: 'profesor@donbosco.edu.ar',
        password_hash: bcrypt.hashSync('DonBosco2026!', salt),
        rol: 'ADMINISTRADOR',
        fecha_creacion: new Date().toISOString(),
      });
    }

    const initialCats: Category[] = INITIAL_CATEGORIES.map((name, idx) => ({
      id: `cat-${idx + 1}`,
      nombre: name,
      estado: 'ACTIVA',
      fecha_creacion: new Date('2026-03-01T08:00:00Z').toISOString(),
    }));

    this.data = {
      users: adminUsers,
      categories: initialCats,
      applications: [],
      ratings: [],
    };

    // 4. Guardar archivo local y sincronizar categorías y admin con Firestore
    this.save();
    await this.syncAllToFirestore();

    return {
      message: 'Se ha eliminado toda la información de la aplicación de forma segura. La base de datos ha quedado limpia.',
      preWipeBackupId: preWipeSnapshot.id,
      clearedCount: {
        applications: appsCount,
        ratings: ratingsCount,
        students: studentsCount,
        pendingCategories: pendingCatCount,
      },
    };
  }

  public async restoreBackup(payload: any, creator: string = 'Profesor Administrador'): Promise<{
    message: string;
    restoredSummary: {
      users: number;
      applications: number;
      categories: number;
      ratings: number;
      finales: number;
    };
    preRestoreBackupId: string;
  }> {
    if (!payload || typeof payload !== 'object') {
      throw new Error('El archivo de copia de seguridad no contiene un formato JSON válido.');
    }

    const incomingData: DatabaseSchema = payload.data && typeof payload.data === 'object' ? payload.data : payload;

    if (!Array.isArray(incomingData.applications) || !Array.isArray(incomingData.users)) {
      throw new Error('El archivo no contiene una estructura válida de base de datos (faltan colecciones de aplicaciones o usuarios).');
    }

    // 1. Resguardo de seguridad previo automático
    const preRestoreSnapshot = this.createBackup(`Auto-resguardo previo a Restauración (${creator})`);

    // 2. Limpiar registros previos de Cloud Firestore para que no queden datos huérfanos
    try {
      const deletePromises: Promise<any>[] = [];
      const [appsSnap, ratingsSnap, usersSnap, catsSnap] = await Promise.all([
        withRetry(() => getDocs(collection(firestore, 'applications'))).catch(() => ({ docs: [] })),
        withRetry(() => getDocs(collection(firestore, 'ratings'))).catch(() => ({ docs: [] })),
        withRetry(() => getDocs(collection(firestore, 'users'))).catch(() => ({ docs: [] })),
        withRetry(() => getDocs(collection(firestore, 'categories'))).catch(() => ({ docs: [] })),
      ]);

      appsSnap.docs.forEach((d) => {
        deletePromises.push(withRetry(() => deleteDoc(d.ref)));
      });
      ratingsSnap.docs.forEach((d) => {
        deletePromises.push(withRetry(() => deleteDoc(d.ref)));
      });
      usersSnap.docs.forEach((d) => {
        const data = d.data() as User;
        if (data.rol !== 'ADMINISTRADOR') {
          deletePromises.push(withRetry(() => deleteDoc(d.ref)));
        }
      });
      catsSnap.docs.forEach((d) => {
        deletePromises.push(withRetry(() => deleteDoc(d.ref)));
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn('[Firestore] Advertencia al limpiar registros anteriores antes de restaurar:', err);
    }

    // 3. Normalizar y verificar datos recuperados
    const restoredUsers: User[] = Array.isArray(incomingData.users) ? [...incomingData.users] : [];
    const hasAdmin = restoredUsers.some((u) => u.rol === 'ADMINISTRADOR');
    if (!hasAdmin) {
      const existingAdmin = this.data.users.find((u) => u.rol === 'ADMINISTRADOR');
      if (existingAdmin) {
        restoredUsers.push(existingAdmin);
      } else {
        const salt = bcrypt.genSaltSync(10);
        restoredUsers.push({
          id: 'user-admin-1',
          nombre: 'Profesor',
          apellido: 'Don Bosco',
          nombre_usuario: 'profesor_donbosco',
          email: 'profesor@donbosco.edu.ar',
          password_hash: bcrypt.hashSync('DonBosco2026!', salt),
          rol: 'ADMINISTRADOR',
          fecha_creacion: new Date().toISOString(),
        });
      }
    }

    const restoredCategories: Category[] = Array.isArray(incomingData.categories) && incomingData.categories.length > 0
      ? [...incomingData.categories]
      : INITIAL_CATEGORIES.map((name, idx) => ({
          id: `cat-${idx + 1}`,
          nombre: name,
          estado: 'ACTIVA',
          fecha_creacion: new Date('2026-03-01T08:00:00Z').toISOString(),
        }));

    const restoredApps: Application[] = Array.isArray(incomingData.applications) ? [...incomingData.applications] : [];
    const restoredRatings: Rating[] = Array.isArray(incomingData.ratings) ? [...incomingData.ratings] : [];

    this.data = {
      users: restoredUsers,
      categories: restoredCategories,
      applications: restoredApps,
      ratings: restoredRatings,
    };

    // 4. Guardar archivo local y sincronizar todos los registros con Firestore
    this.save();
    await this.syncAllToFirestore();

    const restoredSummary = {
      users: restoredUsers.length,
      applications: restoredApps.length,
      categories: restoredCategories.length,
      ratings: restoredRatings.length,
      finales: restoredApps.filter((a) => a.es_trabajo_final).length,
    };

    return {
      message: 'Copia de seguridad restaurada exitosamente. Todos los datos fueron sincronizados con Google Cloud Firestore.',
      restoredSummary,
      preRestoreBackupId: preRestoreSnapshot.id,
    };
  }

  // Users
  public getUsers(): User[] {
    return [...this.data.users];
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.nombre_usuario.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    withRetry(() => setDoc(doc(firestore, 'users', user.id), user)).catch((err) =>
      console.error('[Firestore] Error saving user:', err)
    );
    return user;
  }

  public updateUser(user: User): void {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.save();
      withRetry(() => setDoc(doc(firestore, 'users', user.id), user)).catch((err) =>
        console.error('[Firestore] Error updating user:', err)
      );
    }
  }

  // Categories
  public getCategories(includePending = false): Category[] {
    if (includePending) {
      return [...this.data.categories];
    }
    return this.data.categories.filter((c) => c.estado === 'ACTIVA');
  }

  public findCategoryById(id: string): Category | undefined {
    return this.data.categories.find((c) => c.id === id);
  }

  public findCategoryByName(name: string): Category | undefined {
    return this.data.categories.find(
      (c) => c.nombre.trim().toLowerCase() === name.trim().toLowerCase()
    );
  }

  public createCategory(cat: Category): Category {
    this.data.categories.push(cat);
    this.save();
    withRetry(() => setDoc(doc(firestore, 'categories', cat.id), cat)).catch((err) =>
      console.error('[Firestore] Error creating category:', err)
    );
    return cat;
  }

  public approveCategory(id: string): boolean {
    const cat = this.data.categories.find((c) => c.id === id);
    if (cat && cat.estado === 'PENDIENTE') {
      cat.estado = 'ACTIVA';
      this.save();
      withRetry(() => setDoc(doc(firestore, 'categories', cat.id), cat)).catch((err) =>
        console.error('[Firestore] Error approving category:', err)
      );
      return true;
    }
    return false;
  }

  public rejectCategory(id: string): boolean {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx !== -1 && this.data.categories[idx].estado === 'PENDIENTE') {
      const removedId = this.data.categories[idx].id;
      this.data.categories.splice(idx, 1);
      this.save();
      withRetry(() => deleteDoc(doc(firestore, 'categories', removedId))).catch((err) =>
        console.error('[Firestore] Error deleting category:', err)
      );
      return true;
    }
    return false;
  }

  // Applications
  public getApplications(): Application[] {
    return [...this.data.applications];
  }

  public findApplicationById(id: string): Application | undefined {
    return this.data.applications.find((a) => a.id === id);
  }

  public createApplication(app: Application): Application {
    if (app.es_trabajo_final) {
      // Unmark any previous final application by the same author
      this.data.applications.forEach((otherApp) => {
        if (otherApp.autor_id === app.autor_id && otherApp.id !== app.id && otherApp.es_trabajo_final) {
          otherApp.es_trabajo_final = false;
          withRetry(() => setDoc(doc(firestore, 'applications', otherApp.id), otherApp)).catch((err) =>
            console.error('[Firestore] Error unmarking previous final application:', err)
          );
        }
      });
    }

    this.data.applications.push(app);
    this.save();
    withRetry(() => setDoc(doc(firestore, 'applications', app.id), app)).catch((err) =>
      console.error('[Firestore] Error saving application:', err)
    );
    return app;
  }

  public updateApplication(app: Application): void {
    const idx = this.data.applications.findIndex((a) => a.id === app.id);
    if (idx !== -1) {
      if (app.es_trabajo_final) {
        // Unmark any previous final application by the same author
        this.data.applications.forEach((otherApp) => {
          if (otherApp.autor_id === app.autor_id && otherApp.id !== app.id && otherApp.es_trabajo_final) {
            otherApp.es_trabajo_final = false;
            withRetry(() => setDoc(doc(firestore, 'applications', otherApp.id), otherApp)).catch((err) =>
              console.error('[Firestore] Error unmarking previous final application:', err)
            );
          }
        });
      }

      this.data.applications[idx] = app;
      this.save();
      withRetry(() => setDoc(doc(firestore, 'applications', app.id), app)).catch((err) =>
        console.error('[Firestore] Error updating application:', err)
      );
    }
  }

  public deleteApplication(id: string): boolean {
    const idx = this.data.applications.findIndex((a) => a.id === id);
    if (idx === -1) return false;

    // Referential Integrity: Cascading delete ratings & comments associated with this app
    const ratingsToDelete = this.data.ratings.filter((r) => r.aplicacion_id === id);
    this.data.ratings = this.data.ratings.filter((r) => r.aplicacion_id !== id);
    this.data.applications.splice(idx, 1);
    this.save();

    withRetry(() => deleteDoc(doc(firestore, 'applications', id))).catch((err) =>
      console.error('[Firestore] Error deleting application:', err)
    );
    ratingsToDelete.forEach((r) => {
      withRetry(() => deleteDoc(doc(firestore, 'ratings', r.id))).catch((err) =>
        console.error('[Firestore] Error deleting rating:', err)
      );
    });

    return true;
  }

  // Ratings
  public getRatings(appId?: string): Rating[] {
    if (appId) {
      return this.data.ratings.filter((r) => r.aplicacion_id === appId);
    }
    return [...this.data.ratings];
  }

  public findRating(appId: string, userId: string): Rating | undefined {
    return this.data.ratings.find((r) => r.aplicacion_id === appId && r.usuario_id === userId);
  }

  public upsertRating(rating: Rating): Rating {
    const idx = this.data.ratings.findIndex(
      (r) => r.aplicacion_id === rating.aplicacion_id && r.usuario_id === rating.usuario_id
    );
    if (idx !== -1) {
      this.data.ratings[idx] = {
        ...this.data.ratings[idx],
        puntuacion: rating.puntuacion,
        comentario: rating.comentario,
        fecha_ultima_modificacion: rating.fecha_ultima_modificacion,
      };
    } else {
      this.data.ratings.push(rating);
    }
    this.save();

    withRetry(() => setDoc(doc(firestore, 'ratings', rating.id), rating)).catch((err) =>
      console.error('[Firestore] Error saving rating:', err)
    );

    return rating;
  }

  public getAppStats(appId: string): { promedio: number; votos: number } {
    const appRatings = this.data.ratings.filter((r) => r.aplicacion_id === appId);
    if (appRatings.length === 0) {
      return { promedio: 0, votos: 0 };
    }
    const sum = appRatings.reduce((acc, r) => acc + r.puntuacion, 0);
    const avg = Number((sum / appRatings.length).toFixed(1));
    return { promedio: avg, votos: appRatings.length };
  }
}

export const db = new Database();
