import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db, User, Application, Category, Rating, INITIAL_TOOLS, SpecificationFile } from './db';
import {
  authenticate,
  requireAdmin,
  requireAlumnoOrAdmin,
  generateToken,
  AuthRequest,
} from './auth';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const apiRouter = Router();

// Ensure uploads folders exist
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const SPECS_DIR = path.resolve(UPLOADS_DIR, 'specs');
if (!fs.existsSync(SPECS_DIR)) {
  fs.mkdirSync(SPECS_DIR, { recursive: true });
}

// -------------------------------------------------------------
// Helper: Map application with author and category details
// -------------------------------------------------------------
function enrichApplication(app: Application) {
  const author = db.findUserById(app.autor_id);
  const category = db.findCategoryById(app.categoria_id);
  const stats = db.getAppStats(app.id);

  return {
    ...app,
    autor_nombre: author ? author.nombre : 'Usuario',
    autor_apellido: author ? author.apellido : '',
    categoria_nombre: category ? category.nombre : 'General',
    promedio_calificacion: stats.promedio,
    cantidad_votos: stats.votos,
  };
}

// =============================================================
// AUTH ROUTES
// =============================================================

// Register student
apiRouter.post('/auth/register', (req, res: Response) => {
  const { nombre, apellido, nombre_usuario, email, password } = req.body;

  if (!nombre || !apellido || !nombre_usuario || !email || !password) {
    res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanUsername = String(nombre_usuario).trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ error: 'El formato de correo electrónico no es válido.' });
    return;
  }

  // Validate username length / characters
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  // Unique email check
  if (db.findUserByEmail(cleanEmail)) {
    res.status(400).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    return;
  }

  // Unique username check
  if (db.findUserByUsername(cleanUsername)) {
    res.status(400).json({ error: 'El nombre de usuario ya está en uso. Por favor elige otro.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    nombre: String(nombre).trim(),
    apellido: String(apellido).trim(),
    nombre_usuario: cleanUsername,
    email: cleanEmail,
    password_hash,
    rol: 'ALUMNO', // Always ALUMNO
    fecha_creacion: new Date().toISOString(),
  };

  db.createUser(newUser);

  const token = generateToken(newUser);

  res.status(201).json({
    message: 'Registro exitoso. Tu cuenta ha sido activada.',
    token,
    user: {
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      nombre_usuario: newUser.nombre_usuario,
      email: newUser.email,
      rol: newUser.rol,
    },
  });
});

// Login (email or username)
apiRouter.post('/auth/login', (req, res: Response) => {
  const { identificador, password } = req.body;

  if (!identificador || !password) {
    res.status(400).json({ error: 'Ingresa tu correo o usuario y tu contraseña.' });
    return;
  }

  const cleanIdent = String(identificador).trim().toLowerCase();
  const user = db.findUserByEmail(cleanIdent) || db.findUserByUsername(cleanIdent);

  if (!user) {
    res.status(401).json({ error: 'Credenciales inválidas. Revisa tu usuario/email y contraseña.' });
    return;
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    res.status(401).json({ error: 'Credenciales inválidas. Revisa tu usuario/email y contraseña.' });
    return;
  }

  const token = generateToken(user);

  res.json({
    message: 'Inicio de sesión correcto.',
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      nombre_usuario: user.nombre_usuario,
      email: user.email,
      rol: user.rol,
    },
  });
});

// Get current logged-in user
apiRouter.get('/auth/me', authenticate(true), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }
  res.json({
    id: req.user.id,
    nombre: req.user.nombre,
    apellido: req.user.apellido,
    nombre_usuario: req.user.nombre_usuario,
    email: req.user.email,
    rol: req.user.rol,
    fecha_creacion: req.user.fecha_creacion,
  });
});

// Forgot password
apiRouter.post('/auth/forgot-password', (req, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Ingresa tu correo electrónico.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.findUserByEmail(cleanEmail);

  if (!user) {
    // For privacy/security, return generic confirmation or notification
    res.status(404).json({
      error: 'No se encontró ninguna cuenta asociada a este correo electrónico.',
    });
    return;
  }

  // Generate 6-digit recovery code & reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.reset_token = resetToken;
  user.reset_token_expires = Date.now() + 3600000; // 1 hour
  db.updateUser(user);

  res.json({
    message: `Se ha generado la solicitud de recuperación para ${user.email}. Por motivos del entorno de prueba, utiliza el siguiente código para restablecerla.`,
    token: resetToken,
  });
});

// Reset password
apiRouter.post('/auth/reset-password', (req, res: Response) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    res.status(400).json({ error: 'El token y la nueva contraseña son obligatorios.' });
    return;
  }

  if (new_password.length < 6) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  const user = db.getUsers().find(
    (u) => u.reset_token === token && u.reset_token_expires && u.reset_token_expires > Date.now()
  );

  if (!user) {
    res.status(400).json({ error: 'El código de recuperación es inválido o ha expirado.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  user.password_hash = bcrypt.hashSync(new_password, salt);
  user.reset_token = undefined;
  user.reset_token_expires = undefined;
  db.updateUser(user);

  res.json({ message: 'Contraseña actualizada con éxito. Ahora puedes iniciar sesión.' });
});

// =============================================================
// CATEGORIES ROUTES
// =============================================================

// Get categories (active only, or all if admin requested)
apiRouter.get('/categories', authenticate(false), (req: AuthRequest, res: Response) => {
  const includePending = req.user?.rol === 'ADMINISTRADOR' && req.query.include_pending === 'true';
  const categories = db.getCategories(includePending);
  res.json(categories);
});

// Propose new category (Alumno)
apiRouter.post('/categories/propose', authenticate(true), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { nombre } = req.body;

  if (!nombre || !String(nombre).trim()) {
    res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
    return;
  }

  const cleanName = String(nombre).trim();

  // Check if category already exists (active or pending)
  const existing = db.findCategoryByName(cleanName);
  if (existing) {
    if (existing.estado === 'ACTIVA') {
      res.status(400).json({ error: 'Esta categoría ya existe y está disponible.' });
      return;
    } else {
      res.status(400).json({ error: 'Esta categoría ya ha sido propuesta y está pendiente de revisión.' });
      return;
    }
  }

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    nombre: cleanName,
    estado: 'PENDIENTE',
    usuario_proponente_id: req.user.id,
    usuario_proponente_nombre: `${req.user.nombre} ${req.user.apellido}`,
    fecha_creacion: new Date().toISOString(),
  };

  db.createCategory(newCat);

  res.status(201).json({
    message: 'Categoría propuesta con éxito. Quedará en estado pendiente de aprobación por el Profesor.',
    category: newCat,
  });
});

// Approve category (Admin only)
apiRouter.put(
  '/categories/:id/approve',
  authenticate(true),
  requireAdmin,
  (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const success = db.approveCategory(id);
    if (!success) {
      res.status(404).json({ error: 'Categoría no encontrada o ya se encuentra activa.' });
      return;
    }
    res.json({ message: 'Categoría aprobada exitosamente y ahora está disponible para todos.' });
  }
);

// Reject category (Admin only)
apiRouter.delete(
  '/categories/:id/reject',
  authenticate(true),
  requireAdmin,
  (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const success = db.rejectCategory(id);
    if (!success) {
      res.status(404).json({ error: 'Categoría pendiente no encontrada.' });
      return;
    }
    res.json({ message: 'Propuesta de categoría rechazada y eliminada.' });
  }
);

// =============================================================
// APPLICATIONS ROUTES
// =============================================================

// List applications with filtering, search & pagination
apiRouter.get('/apps', (req, res: Response) => {
  let apps = db.getApplications();

  const {
    search,
    autor,
    categoria_id,
    herramienta,
    calificacion_minima,
    fecha_desde,
    solo_finales,
    limit,
    offset,
  } = req.query;

  // Filter only final projects if requested
  if (solo_finales === 'true' || solo_finales === '1') {
    apps = apps.filter((a) => Boolean(a.es_trabajo_final));
  }

  // Search by app name
  if (search && typeof search === 'string' && search.trim() !== '') {
    const query = search.trim().toLowerCase();
    apps = apps.filter((a) => a.nombre.toLowerCase().includes(query));
  }

  // Filter by category
  if (categoria_id && typeof categoria_id === 'string' && categoria_id !== 'todas') {
    apps = apps.filter((a) => a.categoria_id === categoria_id);
  }

  // Filter by vibe coding tool
  if (herramienta && typeof herramienta === 'string' && herramienta !== 'todas') {
    apps = apps.filter((a) => a.herramienta.toLowerCase() === herramienta.toLowerCase());
  }

  // Filter by author name or author ID
  if (autor && typeof autor === 'string' && autor.trim() !== '') {
    const qAutor = autor.trim().toLowerCase();
    apps = apps.filter((a) => {
      if (a.autor_id === autor) return true;
      const user = db.findUserById(a.autor_id);
      if (!user) return false;
      const fullName = `${user.nombre} ${user.apellido}`.toLowerCase();
      return fullName.includes(qAutor);
    });
  }

  // Filter by publication date
  if (fecha_desde && typeof fecha_desde === 'string') {
    const now = Date.now();
    let threshold = 0;
    if (fecha_desde === '7d') threshold = now - 7 * 86400000;
    else if (fecha_desde === '30d') threshold = now - 30 * 86400000;
    else if (fecha_desde === 'year') threshold = now - 365 * 86400000;

    if (threshold > 0) {
      apps = apps.filter((a) => new Date(a.fecha_publicacion).getTime() >= threshold);
    }
  }

  // Enrich with author, category, ratings
  let enriched = apps.map(enrichApplication);

  // Filter by minimum rating (e.g. 4 means promedio >= 4)
  if (calificacion_minima && !isNaN(Number(calificacion_minima))) {
    const minRating = Number(calificacion_minima);
    if (minRating > 0) {
      enriched = enriched.filter((a) => a.promedio_calificacion >= minRating);
    }
  }

  // Initial order: newest first (fecha_publicacion DESC)
  enriched.sort(
    (a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
  );

  const total = enriched.length;

  // Pagination support
  const lim = limit ? parseInt(String(limit), 10) : undefined;
  const off = offset ? parseInt(String(offset), 10) : 0;

  if (lim && lim > 0) {
    enriched = enriched.slice(off, off + lim);
  }

  res.json({
    total,
    apps: enriched,
  });
});

// Get single application detail
apiRouter.get('/apps/:id', authenticate(false), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const app = db.findApplicationById(id);

  if (!app) {
    res.status(404).json({ error: 'Aplicación no encontrada.' });
    return;
  }

  const enriched = enrichApplication(app);
  const ratings = db.getRatings(app.id);

  // Check privacy of comments:
  // Comments can ONLY be viewed by the application's author and the Administrator!
  const isAuthor = req.user && req.user.id === app.autor_id;
  const isAdmin = req.user && req.user.rol === 'ADMINISTRADOR';

  let visibleComments: Array<{
    id: string;
    puntuacion: number;
    comentario: string;
    usuario_nombre: string;
    usuario_apellido: string;
    fecha_calificacion: string;
  }> = [];

  if (isAuthor || isAdmin) {
    visibleComments = ratings
      .filter((r) => r.comentario && r.comentario.trim().length > 0)
      .map((r) => {
        const user = db.findUserById(r.usuario_id);
        return {
          id: r.id,
          puntuacion: r.puntuacion,
          comentario: r.comentario,
          usuario_nombre: user ? user.nombre : 'Alumno',
          usuario_apellido: user ? user.apellido : '',
          fecha_calificacion: r.fecha_calificacion,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.fecha_calificacion).getTime() - new Date(a.fecha_calificacion).getTime()
      );
  }

  // Check if current user has already rated this app
  let userRating: Rating | null = null;
  if (req.user) {
    userRating = db.findRating(app.id, req.user.id) || null;
  }

  res.json({
    ...enriched,
    comentarios: visibleComments,
    puede_ver_comentarios: Boolean(isAuthor || isAdmin),
    mi_calificacion: userRating
      ? {
          puntuacion: userRating.puntuacion,
          comentario: userRating.comentario,
          fecha_calificacion: userRating.fecha_calificacion,
        }
      : null,
  });
});

// Create new application (Alumno or Admin)
apiRouter.post(
  '/apps',
  authenticate(true),
  requireAlumnoOrAdmin,
  (req: AuthRequest, res: Response) => {
    if (!req.user) return;
    const { nombre, logo, descripcion, enlace, categoria_id, herramienta, es_trabajo_final, especificacion } = req.body;

    if (!nombre || !String(nombre).trim()) {
      res.status(400).json({ error: 'El nombre de la aplicación es obligatorio.' });
      return;
    }
    if (!descripcion || !String(descripcion).trim()) {
      res.status(400).json({ error: 'La descripción de la aplicación es obligatoria.' });
      return;
    }
    if (!enlace || !String(enlace).trim()) {
      res.status(400).json({ error: 'El enlace externo es obligatorio.' });
      return;
    }
    if (!categoria_id) {
      res.status(400).json({ error: 'Debes seleccionar una categoría.' });
      return;
    }
    if (!herramienta) {
      res.status(400).json({ error: 'Debes seleccionar la herramienta de Vibe Coding.' });
      return;
    }

    // Validate URL format
    const cleanUrl = String(enlace).trim();
    try {
      new URL(cleanUrl);
    } catch {
      res.status(400).json({ error: 'El enlace externo debe tener un formato de URL válido (ej: https://miapp.web.app).' });
      return;
    }

    // Verify category exists
    const category = db.findCategoryById(categoria_id);
    if (!category) {
      res.status(400).json({ error: 'La categoría seleccionada no es válida.' });
      return;
    }

    const now = new Date().toISOString();
    const newApp: Application = {
      id: `app-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      nombre: String(nombre).trim(),
      logo: logo ? String(logo).trim() : '',
      descripcion: String(descripcion).trim(),
      enlace: cleanUrl,
      autor_id: req.user.id,
      categoria_id,
      herramienta: String(herramienta).trim(),
      es_trabajo_final: Boolean(es_trabajo_final),
      especificacion: especificacion || null,
      fecha_publicacion: now,
      fecha_ultima_modificacion: now,
    };

    db.createApplication(newApp);

    res.status(201).json({
      message: 'Aplicación publicada exitosamente.',
      app: enrichApplication(newApp),
    });
  }
);

// Edit application (Author or Admin only)
apiRouter.put(
  '/apps/:id',
  authenticate(true),
  requireAlumnoOrAdmin,
  (req: AuthRequest, res: Response) => {
    if (!req.user) return;
    const { id } = req.params;
    const existing = db.findApplicationById(id);

    if (!existing) {
      res.status(404).json({ error: 'Aplicación no encontrada.' });
      return;
    }

    // Check permissions: only author or admin can edit
    const isAuthor = existing.autor_id === req.user.id;
    const isAdmin = req.user.rol === 'ADMINISTRADOR';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'No tienes permiso para modificar esta aplicación.' });
      return;
    }

    const { nombre, logo, descripcion, enlace, categoria_id, herramienta, es_trabajo_final, especificacion } = req.body;

    if (!nombre || !String(nombre).trim()) {
      res.status(400).json({ error: 'El nombre es obligatorio.' });
      return;
    }
    if (!descripcion || !String(descripcion).trim()) {
      res.status(400).json({ error: 'La descripción es obligatoria.' });
      return;
    }
    if (!enlace || !String(enlace).trim()) {
      res.status(400).json({ error: 'El enlace externo es obligatorio.' });
      return;
    }

    try {
      new URL(String(enlace).trim());
    } catch {
      res.status(400).json({ error: 'El enlace externo debe tener un formato de URL válido.' });
      return;
    }

    if (categoria_id) {
      const cat = db.findCategoryById(categoria_id);
      if (!cat) {
        res.status(400).json({ error: 'Categoría no válida.' });
        return;
      }
      existing.categoria_id = categoria_id;
    }

    // Keep author and original fecha_publicacion untouched!
    existing.nombre = String(nombre).trim();
    if (logo !== undefined) existing.logo = String(logo).trim();
    existing.descripcion = String(descripcion).trim();
    existing.enlace = String(enlace).trim();
    if (herramienta) existing.herramienta = String(herramienta).trim();
    if (es_trabajo_final !== undefined) {
      existing.es_trabajo_final = Boolean(es_trabajo_final);
    }
    if (especificacion !== undefined) {
      existing.especificacion = especificacion || null;
    }
    existing.fecha_ultima_modificacion = new Date().toISOString();

    db.updateApplication(existing);

    res.json({
      message: 'Aplicación actualizada con éxito.',
      app: enrichApplication(existing),
    });
  }
);

// Delete application (Author or Admin only)
apiRouter.delete(
  '/apps/:id',
  authenticate(true),
  requireAlumnoOrAdmin,
  (req: AuthRequest, res: Response) => {
    if (!req.user) return;
    const { id } = req.params;
    const existing = db.findApplicationById(id);

    if (!existing) {
      res.status(404).json({ error: 'Aplicación no encontrada.' });
      return;
    }

    // Check permissions
    const isAuthor = existing.autor_id === req.user.id;
    const isAdmin = req.user.rol === 'ADMINISTRADOR';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'No tienes permiso para eliminar esta aplicación.' });
      return;
    }

    // Cascading delete handled inside db.deleteApplication
    db.deleteApplication(id);

    res.json({ message: 'Aplicación y sus calificaciones asociadas eliminadas definitivamente.' });
  }
);

// Rate application
apiRouter.post(
  '/apps/:id/rate',
  authenticate(true),
  requireAlumnoOrAdmin,
  (req: AuthRequest, res: Response) => {
    if (!req.user) return;
    const { id } = req.params;
    const app = db.findApplicationById(id);

    if (!app) {
      res.status(404).json({ error: 'Aplicación no encontrada.' });
      return;
    }

    // Rule 1: A user CANNOT rate their own application!
    if (app.autor_id === req.user.id) {
      res.status(400).json({ error: 'No puedes calificar tu propia aplicación.' });
      return;
    }

    const { puntuacion, comentario } = req.body;
    const score = parseInt(String(puntuacion), 10);

    if (isNaN(score) || score < 1 || score > 5) {
      res.status(400).json({ error: 'La puntuación debe ser un número entero entre 1 y 5 estrellas.' });
      return;
    }

    const now = new Date().toISOString();
    const existingRating = db.findRating(app.id, req.user.id);

    const ratingToSave: Rating = {
      id: existingRating ? existingRating.id : `rate-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      aplicacion_id: app.id,
      usuario_id: req.user.id,
      puntuacion: score,
      comentario: comentario ? String(comentario).trim() : '',
      fecha_calificacion: existingRating ? existingRating.fecha_calificacion : now,
      fecha_ultima_modificacion: now,
    };

    db.upsertRating(ratingToSave);

    const newStats = db.getAppStats(app.id);

    res.json({
      message: existingRating ? 'Calificación modificada exitosamente.' : 'Calificación guardada exitosamente.',
      rating: ratingToSave,
      stats: newStats,
    });
  }
);

// =============================================================
// RANKING ROUTE
// =============================================================

apiRouter.get('/ranking', (req, res: Response) => {
  const apps = db.getApplications();
  const enriched = apps.map(enrichApplication);

  // Requirement: Participan únicamente aplicaciones con al menos un voto (cantidad_votos >= 1)
  const ranked = enriched.filter((a) => a.cantidad_votos >= 1);

  // Order rule:
  // 1. Mayor promedio de calificación (DESC)
  // 2. En caso de empate, mayor cantidad de votos (DESC)
  ranked.sort((a, b) => {
    if (b.promedio_calificacion !== a.promedio_calificacion) {
      return b.promedio_calificacion - a.promedio_calificacion;
    }
    return b.cantidad_votos - a.cantidad_votos;
  });

  const listWithPositions = ranked.map((app, index) => ({
    posicion: index + 1,
    ...app,
  }));

  res.json(listWithPositions);
});

// =============================================================
// MIS TRABAJOS (ALUMNO)
// =============================================================

apiRouter.get('/my-apps', authenticate(true), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const allApps = db.getApplications();
  const myApps = allApps.filter((a) => a.autor_id === req.user!.id);

  const enrichedMyApps = myApps.map((app) => {
    const base = enrichApplication(app);
    const ratings = db.getRatings(app.id);

    // Private comments received on this app
    const comentarios = ratings
      .filter((r) => r.comentario && r.comentario.trim().length > 0)
      .map((r) => {
        const voter = db.findUserById(r.usuario_id);
        return {
          id: r.id,
          puntuacion: r.puntuacion,
          comentario: r.comentario,
          usuario_nombre: voter ? voter.nombre : 'Compañero',
          usuario_apellido: voter ? voter.apellido : '',
          fecha_calificacion: r.fecha_calificacion,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.fecha_calificacion).getTime() - new Date(a.fecha_calificacion).getTime()
      );

    return {
      ...base,
      comentarios,
    };
  });

  enrichedMyApps.sort(
    (a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
  );

  res.json(enrichedMyApps);
});

// =============================================================
// PUBLIC USER PROFILE
// =============================================================

apiRouter.get('/users/:id/profile', (req, res: Response) => {
  const { id } = req.params;
  const user = db.findUserById(id);

  if (!user) {
    res.status(404).json({ error: 'Alumno no encontrado.' });
    return;
  }

  // Strictly return only: Nombre, Apellido, and published applications!
  // NO email, NO username, NO credentials!
  const userApps = db.getApplications().filter((a) => a.autor_id === user.id);
  const enrichedApps = userApps.map(enrichApplication);
  enrichedApps.sort(
    (a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
  );

  res.json({
    nombre: user.nombre,
    apellido: user.apellido,
    aplicaciones: enrichedApps,
  });
});

// =============================================================
// ADMIN PANEL ROUTES
// =============================================================

// Statistics
apiRouter.get('/admin/stats', authenticate(true), requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  const apps = db.getApplications();
  const ratings = db.getRatings();
  const categories = db.getCategories(true);

  const totalAlumnos = users.filter((u) => u.rol === 'ALUMNO').length;
  const totalTrabajos = apps.length;
  const totalCalificaciones = ratings.length;

  const promedioGeneral =
    ratings.length > 0
      ? Number((ratings.reduce((sum, r) => sum + r.puntuacion, 0) / ratings.length).toFixed(1))
      : 0;

  // Categorías más utilizadas
  const catCountMap: Record<string, number> = {};
  apps.forEach((a) => {
    catCountMap[a.categoria_id] = (catCountMap[a.categoria_id] || 0) + 1;
  });

  const categoriasMasUtilizadas = Object.entries(catCountMap)
    .map(([catId, count]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        nombre: cat ? cat.nombre : 'Sin categoría',
        cantidad: count,
      };
    })
    .sort((a, b) => b.cantidad - a.cantidad);

  // Alumnos con mayor cantidad de publicaciones
  const studentAppMap: Record<string, number> = {};
  apps.forEach((a) => {
    studentAppMap[a.autor_id] = (studentAppMap[a.autor_id] || 0) + 1;
  });

  const alumnosConMasPublicaciones = Object.entries(studentAppMap)
    .map(([authorId, count]) => {
      const user = db.findUserById(authorId);
      return {
        id: authorId,
        nombre: user ? `${user.nombre} ${user.apellido}` : 'Alumno',
        cantidad: count,
      };
    })
    .sort((a, b) => b.cantidad - a.cantidad);

  // Trabajos mejor calificados (Diferenciado: ordenado por promedio DESC)
  const enrichedApps = apps.map(enrichApplication);

  const trabajosMejorCalificados = [...enrichedApps]
    .filter((a) => a.cantidad_votos > 0)
    .sort((a, b) => {
      if (b.promedio_calificacion !== a.promedio_calificacion) {
        return b.promedio_calificacion - a.promedio_calificacion;
      }
      return b.cantidad_votos - a.cantidad_votos;
    })
    .slice(0, 5);

  // Trabajos con mayor cantidad de votos (Diferenciado: ordenado por votos DESC)
  const trabajosMasVotados = [...enrichedApps]
    .filter((a) => a.cantidad_votos > 0)
    .sort((a, b) => {
      if (b.cantidad_votos !== a.cantidad_votos) {
        return b.cantidad_votos - a.cantidad_votos;
      }
      return b.promedio_calificacion - a.promedio_calificacion;
    })
    .slice(0, 5);

  res.json({
    total_alumnos: totalAlumnos,
    total_trabajos: totalTrabajos,
    total_calificaciones: totalCalificaciones,
    promedio_general: promedioGeneral,
    categorias_mas_utilizadas: categoriasMasUtilizadas,
    alumnos_con_mas_publicaciones: alumnosConMasPublicaciones,
    trabajos_mejor_calificados: trabajosMejorCalificados,
    trabajos_mas_votados: trabajosMasVotados,
  });
});

// Users list (Read-only for Admin, no modification/deletion/role editing)
apiRouter.get('/admin/users', authenticate(true), requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  const apps = db.getApplications();

  const userList = users.map((u) => {
    const userAppCount = apps.filter((a) => a.autor_id === u.id).length;
    return {
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      nombre_usuario: u.nombre_usuario,
      email: u.email,
      rol: u.rol,
      fecha_creacion: u.fecha_creacion,
      cantidad_aplicaciones: userAppCount,
    };
  });

  res.json(userList);
});

// Seed test data (Admin only)
apiRouter.post('/admin/seed-test-data', authenticate(true), requireAdmin, async (req: AuthRequest, res: Response) => {
  db.seedInitialTestData();
  await db.syncAllToFirestore();
  res.json({ message: 'Datos de prueba cargados correctamente con alumnos, trabajos y calificaciones.' });
});

// Clear test data (Admin only)
apiRouter.post('/admin/clear-test-data', authenticate(true), requireAdmin, async (req: AuthRequest, res: Response) => {
  await db.clearTestData();
  res.json({
    message: 'Base de datos restablecida. Se han limpiado los datos ficticios conservando el usuario Administrador y las categorías iniciales.',
  });
});

// =============================================================
// BACKUP & RESTORE ROUTES (ADMIN ONLY)
// =============================================================

// Export & generate backup
apiRouter.get('/admin/backup/export', authenticate(true), requireAdmin, (req: AuthRequest, res: Response) => {
  const creator = req.user ? `${req.user.nombre} ${req.user.apellido}` : 'Profesor Administrador';
  const snapshot = db.createBackup(creator);
  res.json(snapshot);
});

// Download backup JSON as a file attachment
apiRouter.get('/admin/backup/download/:id', authenticate(true), requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getBackupById(id);
  if (!snapshot) {
    res.status(404).json({ error: 'Copia de seguridad no encontrada.' });
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${snapshot.filename}"`);
  res.send(JSON.stringify(snapshot, null, 2));
});

// List server-side snapshots
apiRouter.get('/admin/backup/snapshots', authenticate(true), requireAdmin, (_req: AuthRequest, res: Response) => {
  const snapshots = db.listBackups();
  res.json(snapshots);
});

// Restore backup from JSON body
apiRouter.post('/admin/backup/restore', authenticate(true), requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const creator = req.user ? `${req.user.nombre} ${req.user.apellido}` : 'Profesor Administrador';
    const result = await db.restoreBackup(req.body, creator);
    res.json(result);
  } catch (err: any) {
    console.error('Error restaurando copia de seguridad:', err);
    res.status(400).json({ error: err.message || 'Error al restaurar la copia de seguridad.' });
  }
});

// Restore from a server snapshot by ID
apiRouter.post('/admin/backup/restore-snapshot/:id', authenticate(true), requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const snapshot = db.getBackupById(id);
    if (!snapshot) {
      res.status(404).json({ error: 'El punto de restauración solicitado no existe.' });
      return;
    }

    const creator = req.user ? `${req.user.nombre} ${req.user.apellido}` : 'Profesor Administrador';
    const result = await db.restoreBackup(snapshot, creator);
    res.json(result);
  } catch (err: any) {
    console.error('Error restaurando snapshot por ID:', err);
    res.status(400).json({ error: err.message || 'Error al restaurar la copia de seguridad.' });
  }
});

// Clean all existing information (Wipe total de datos, conservando Admin y categorías base)
apiRouter.post('/admin/clean-all', authenticate(true), requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const creator = req.user ? `${req.user.nombre} ${req.user.apellido}` : 'Profesor Administrador';
    const result = await db.cleanAllData(creator);
    res.json(result);
  } catch (err: any) {
    console.error('Error limpiando toda la base de datos:', err);
    res.status(500).json({ error: err.message || 'Error al limpiar la base de datos.' });
  }
});

// Predefined tools list endpoint
apiRouter.get('/tools', (req, res: Response) => {
  res.json(INITIAL_TOOLS);
});

// =============================================================
// IMAGE / LOGO UPLOAD (Persistent)
// =============================================================

apiRouter.post('/upload', authenticate(true), (req: AuthRequest, res: Response) => {
  try {
    const { filename, base64 } = req.body;
    if (!base64) {
      res.status(400).json({ error: 'No se envió contenido de imagen.' });
      return;
    }

    // Extract base64 data
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Formato de imagen inválido (debe ser base64).' });
      return;
    }

    const ext = matches[1].includes('png')
      ? 'png'
      : matches[1].includes('svg')
      ? 'svg'
      : matches[1].includes('webp')
      ? 'webp'
      : 'jpg';

    const safeFilename = `logo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, buffer);

    res.json({
      url: `/uploads/${safeFilename}`,
      filename: safeFilename,
    });
  } catch (err) {
    console.error('Error saving image upload:', err);
    res.status(500).json({ error: 'Error al procesar la imagen.' });
  }
});

// =============================================================
// SPECIFICATION FILE UPLOAD & DOWNLOAD (Firebase Storage + Local Backup)
// =============================================================

// Helper: Process and persist specification file (Local fallback + Firebase Storage)
async function processSpecificationUpload(filename: string, base64: string, mimeType?: string): Promise<SpecificationFile> {
  // Extract base64 payload
  let rawBase64 = base64;
  let detectedMime = mimeType || 'application/octet-stream';
  if (base64.includes(';base64,')) {
    const parts = base64.split(';base64,');
    rawBase64 = parts[1];
    const matchMime = parts[0].match(/data:(.+)/);
    if (matchMime) detectedMime = matchMime[1];
  }

  const buffer = Buffer.from(rawBase64, 'base64');
  const sizeBytes = buffer.length;

  // Check size limit: 25MB
  if (sizeBytes > 25 * 1024 * 1024) {
    throw new Error('El archivo excede el tamaño máximo permitido de 25MB.');
  }

  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeFilename = `spec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${cleanFilename}`;
  const localFilePath = path.join(SPECS_DIR, safeFilename);

  // 1. Guardar copia local persistente
  fs.writeFileSync(localFilePath, buffer);

  let finalUrl = `/uploads/specs/${safeFilename}`;
  let storageType: 'firebase_storage' | 'local' = 'local';

  // 2. Intentar subir a Firebase Storage
  try {
    const storagePath = `especificaciones/${safeFilename}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, buffer, {
      contentType: detectedMime,
    });
    finalUrl = await getDownloadURL(storageRef);
    storageType = 'firebase_storage';
    console.log(`[Firebase Storage] Archivo subido con éxito a Firebase Storage: ${finalUrl}`);
  } catch (storageErr: any) {
    console.warn(
      `[Firebase Storage] Aviso: No se pudo subir directamente a Firebase Storage (${storageErr?.message || storageErr?.code}). Utilizando almacenamiento persistente en servidor local.`
    );
  }

  return {
    nombre_archivo: filename,
    url: finalUrl,
    tamano_bytes: sizeBytes,
    tipo_mime: detectedMime,
    fecha_subida: new Date().toISOString(),
    almacenamiento: storageType,
  };
}

// Upload specification file directly (returns file metadata)
apiRouter.post('/upload-specification', authenticate(true), async (req: AuthRequest, res: Response) => {
  try {
    const { filename, base64, mimeType } = req.body;
    if (!base64 || !filename) {
      res.status(400).json({ error: 'Debes proporcionar un archivo con su nombre y contenido.' });
      return;
    }

    const specFile = await processSpecificationUpload(filename, base64, mimeType);

    res.json({
      message: 'Archivo de especificación cargado con éxito.',
      file: specFile,
    });
  } catch (err: any) {
    console.error('Error al subir archivo de especificación:', err);
    res.status(500).json({ error: err.message || 'Error al procesar el archivo de especificación.' });
  }
});

// Upload and attach specification directly to an existing application
apiRouter.post(
  '/apps/:id/specification',
  authenticate(true),
  requireAlumnoOrAdmin,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) return;
    const { id } = req.params;
    const existing = db.findApplicationById(id);

    if (!existing) {
      res.status(404).json({ error: 'Aplicación no encontrada.' });
      return;
    }

    const isAuthor = existing.autor_id === req.user.id;
    const isAdmin = req.user.rol === 'ADMINISTRADOR';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'No tienes permiso para modificar las instrucciones de esta aplicación.' });
      return;
    }

    const { filename, base64, mimeType } = req.body;
    if (!base64 || !filename) {
      res.status(400).json({ error: 'Debes proporcionar un archivo con su nombre y contenido.' });
      return;
    }

    try {
      const specFile = await processSpecificationUpload(filename, base64, mimeType);

      existing.especificacion = specFile;
      existing.fecha_ultima_modificacion = new Date().toISOString();

      db.updateApplication(existing);

      res.json({
        message: 'Archivo de especificación e instrucciones adjuntado exitosamente.',
        app: enrichApplication(existing),
      });
    } catch (err: any) {
      console.error('Error al adjuntar archivo a la aplicación:', err);
      res.status(500).json({ error: err.message || 'Error al procesar y adjuntar el archivo.' });
    }
  }
);

// Remove specification from an existing application
apiRouter.delete(
  '/apps/:id/specification',
  authenticate(true),
  requireAlumnoOrAdmin,
  (req: AuthRequest, res: Response) => {
    if (!req.user) return;
    const { id } = req.params;
    const existing = db.findApplicationById(id);

    if (!existing) {
      res.status(404).json({ error: 'Aplicación no encontrada.' });
      return;
    }

    const isAuthor = existing.autor_id === req.user.id;
    const isAdmin = req.user.rol === 'ADMINISTRADOR';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'No tienes permiso para modificar esta aplicación.' });
      return;
    }

    existing.especificacion = null;
    existing.fecha_ultima_modificacion = new Date().toISOString();

    db.updateApplication(existing);

    res.json({
      message: 'Archivo de especificación e instrucciones removido exitosamente.',
      app: enrichApplication(existing),
    });
  }
);

// Download application specification file
apiRouter.get('/apps/:id/specification/download', (req, res: Response) => {
  const { id } = req.params;
  const app = db.findApplicationById(id);
  if (!app || !app.especificacion) {
    res.status(404).json({ error: 'Este trabajo no cuenta con archivo de especificación adjunto.' });
    return;
  }

  const spec = app.especificacion;
  // If stored locally or url starts with /uploads/specs/
  if (spec.url.startsWith('/uploads/specs/')) {
    const filenameOnDisk = path.basename(spec.url);
    const diskPath = path.join(SPECS_DIR, filenameOnDisk);
    if (fs.existsSync(diskPath)) {
      res.download(diskPath, spec.nombre_archivo);
      return;
    }
  }

  // If Firebase Storage or external URL, redirect to download URL
  res.redirect(spec.url);
});


