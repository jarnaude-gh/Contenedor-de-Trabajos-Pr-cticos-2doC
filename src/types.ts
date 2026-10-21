export interface User {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  email: string;
  rol: 'ALUMNO' | 'ADMINISTRADOR';
  fecha_creacion?: string;
  cantidad_aplicaciones?: number;
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
  autor_nombre: string;
  autor_apellido: string;
  categoria_id: string;
  categoria_nombre: string;
  herramienta: string;
  fecha_publicacion: string;
  fecha_ultima_modificacion: string;
  promedio_calificacion: number;
  cantidad_votos: number;
  es_trabajo_final?: boolean;
  especificacion?: SpecificationFile | null;
  comentarios?: Comment[];
  puede_ver_comentarios?: boolean;
  mi_calificacion?: {
    puntuacion: number;
    comentario: string;
    fecha_calificacion: string;
  } | null;
}

export interface Comment {
  id: string;
  puntuacion: number;
  comentario: string;
  usuario_nombre: string;
  usuario_apellido: string;
  fecha_calificacion: string;
}

export interface Category {
  id: string;
  nombre: string;
  estado: 'ACTIVA' | 'PENDIENTE';
  usuario_proponente_id?: string;
  usuario_proponente_nombre?: string;
  fecha_creacion: string;
}

export interface AdminStats {
  total_alumnos: number;
  total_trabajos: number;
  total_calificaciones: number;
  promedio_general: number;
  categorias_mas_utilizadas: Array<{
    id: string;
    nombre: string;
    cantidad: number;
  }>;
  alumnos_con_mas_publicaciones: Array<{
    id: string;
    nombre: string;
    cantidad: number;
  }>;
  trabajos_mejor_calificados: Application[];
  trabajos_mas_votados: Application[];
}
