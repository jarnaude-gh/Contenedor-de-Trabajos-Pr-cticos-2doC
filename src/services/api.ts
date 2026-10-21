import { Application, Category, User, AdminStats, SpecificationFile } from '../types';

const TOKEN_KEY = 'donbosco_auth_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en la solicitud.');
  }

  return data as T;
}

export const api = {
  // Auth
  async login(identificador: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identificador, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(params: {
    nombre: string;
    apellido: string;
    nombre_usuario: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setAuthToken(res.token);
    return res;
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  async forgotPassword(email: string): Promise<{ message: string; token?: string }> {
    return request<{ message: string; token?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  },

  // Categories
  async getCategories(includePending = false): Promise<Category[]> {
    return request<Category[]>(`/categories?include_pending=${includePending}`);
  },

  async proposeCategory(nombre: string): Promise<{ message: string; category: Category }> {
    return request<{ message: string; category: Category }>('/categories/propose', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    });
  },

  async approveCategory(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/categories/${id}/approve`, {
      method: 'PUT',
    });
  },

  async rejectCategory(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/categories/${id}/reject`, {
      method: 'DELETE',
    });
  },

  // Tools
  async getTools(): Promise<string[]> {
    return request<string[]>('/tools');
  },

  // Applications
  async getApps(params: {
    search?: string;
    autor?: string;
    categoria_id?: string;
    herramienta?: string;
    calificacion_minima?: string;
    fecha_desde?: string;
    solo_finales?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; apps: Application[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.autor) query.set('autor', params.autor);
    if (params.categoria_id && params.categoria_id !== 'todas') query.set('categoria_id', params.categoria_id);
    if (params.herramienta && params.herramienta !== 'todas') query.set('herramienta', params.herramienta);
    if (params.calificacion_minima && params.calificacion_minima !== '0') query.set('calificacion_minima', params.calificacion_minima);
    if (params.fecha_desde && params.fecha_desde !== 'todas') query.set('fecha_desde', params.fecha_desde);
    if (params.solo_finales) query.set('solo_finales', 'true');
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    return request<{ total: number; apps: Application[] }>(`/apps?${query.toString()}`);
  },

  async getApp(id: string): Promise<Application> {
    return request<Application>(`/apps/${id}`);
  },

  async createApp(data: {
    nombre: string;
    logo?: string;
    descripcion: string;
    enlace: string;
    categoria_id: string;
    herramienta: string;
    es_trabajo_final?: boolean;
    especificacion?: SpecificationFile | null;
  }): Promise<{ message: string; app: Application }> {
    return request<{ message: string; app: Application }>('/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApp(
    id: string,
    data: {
      nombre: string;
      logo?: string;
      descripcion: string;
      enlace: string;
      categoria_id: string;
      herramienta: string;
      es_trabajo_final?: boolean;
      especificacion?: SpecificationFile | null;
    }
  ): Promise<{ message: string; app: Application }> {
    return request<{ message: string; app: Application }>(`/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteApp(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/apps/${id}`, {
      method: 'DELETE',
    });
  },

  async rateApp(
    id: string,
    data: { puntuacion: number; comentario?: string }
  ): Promise<{ message: string; stats: { promedio: number; votos: number } }> {
    return request<{ message: string; stats: { promedio: number; votos: number } }>(
      `/apps/${id}/rate`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // Ranking
  async getRanking(): Promise<Array<Application & { posicion: number }>> {
    return request<Array<Application & { posicion: number }>>('/ranking');
  },

  // Mis Trabajos
  async getMyApps(): Promise<Application[]> {
    return request<Application[]>('/my-apps');
  },

  // Perfil público
  async getPublicProfile(
    userId: string
  ): Promise<{ nombre: string; apellido: string; aplicaciones: Application[] }> {
    return request<{ nombre: string; apellido: string; aplicaciones: Application[] }>(
      `/users/${userId}/profile`
    );
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/admin/stats');
  },

  async getAdminUsers(): Promise<User[]> {
    return request<User[]>('/admin/users');
  },

  async seedTestData(): Promise<{ message: string }> {
    return request<{ message: string }>('/admin/seed-test-data', {
      method: 'POST',
    });
  },

  async clearTestData(): Promise<{ message: string }> {
    return request<{ message: string }>('/admin/clear-test-data', {
      method: 'POST',
    });
  },

  // Admin Backups & Data Management
  async exportBackup(): Promise<any> {
    return request<any>('/admin/backup/export');
  },

  async listBackupSnapshots(): Promise<
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
  > {
    return request<any[]>('/admin/backup/snapshots');
  },

  async restoreBackup(data: any): Promise<{
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
    return request<any>('/admin/backup/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async restoreBackupSnapshot(id: string): Promise<{
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
    return request<any>(`/admin/backup/restore-snapshot/${id}`, {
      method: 'POST',
    });
  },

  async cleanAllData(): Promise<{
    message: string;
    preWipeBackupId: string;
    clearedCount: {
      applications: number;
      ratings: number;
      students: number;
      pendingCategories: number;
    };
  }> {
    return request<any>('/admin/clean-all', {
      method: 'POST',
    });
  },

  // Upload logo
  async uploadImage(base64: string, filename: string): Promise<{ url: string }> {
    return request<{ url: string }>('/upload', {
      method: 'POST',
      body: JSON.stringify({ base64, filename }),
    });
  },

  // Upload specification file (Word, PDF, Text, etc.)
  async uploadSpecification(
    base64: string,
    filename: string,
    mimeType?: string
  ): Promise<{ message: string; file: SpecificationFile }> {
    return request<{ message: string; file: SpecificationFile }>('/upload-specification', {
      method: 'POST',
      body: JSON.stringify({ base64, filename, mimeType }),
    });
  },

  // Directly attach specification file to a specific application
  async uploadAppSpecification(
    appId: string,
    base64: string,
    filename: string,
    mimeType?: string
  ): Promise<{ message: string; app: Application }> {
    return request<{ message: string; app: Application }>(`/apps/${appId}/specification`, {
      method: 'POST',
      body: JSON.stringify({ base64, filename, mimeType }),
    });
  },

  // Remove specification file from a specific application
  async removeAppSpecification(appId: string): Promise<{ message: string; app: Application }> {
    return request<{ message: string; app: Application }>(`/apps/${appId}/specification`, {
      method: 'DELETE',
    });
  },
};

