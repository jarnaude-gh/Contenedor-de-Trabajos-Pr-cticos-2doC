import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'don-bosco-habilidades-digitales-ia-2026-secret-key-388271';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre_usuario: user.nombre_usuario,
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authenticate(required = true) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      if (required) {
        res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción.' });
        return;
      }
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = db.findUserById(decoded.id);
      if (!user) {
        if (required) {
          res.status(401).json({ error: 'Usuario no encontrado o sesión inválida.' });
          return;
        }
        return next();
      }
      req.user = user;
      next();
    } catch {
      if (required) {
        res.status(401).json({ error: 'Sesión expirada o token no válido. Inicia sesión nuevamente.' });
        return;
      }
      next();
    }
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.rol !== 'ADMINISTRADOR') {
    res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de Profesor / Administrador.' });
    return;
  }
  next();
}

export function requireAlumnoOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción.' });
    return;
  }
  next();
}
