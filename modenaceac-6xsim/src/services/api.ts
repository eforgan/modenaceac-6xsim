// src/services/api.ts — Capa de comunicación con el backend
// Maneja auth JWT, errores y base URL configurable

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = '6xsim_token';

// ── Auth token ─────────────────────────────────────────────────────────────
export const auth = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string)   => localStorage.setItem(TOKEN_KEY, token),
  clear:    ()                => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: ()              => !!localStorage.getItem(TOKEN_KEY),
};

// ── Fetch wrapper ──────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    auth.clear();
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; usuario: { id: string; nombre: string; apellido: string; rol: string } }>(
      '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  me: () =>
    apiFetch<{ id: string; nombre: string; apellido: string; email: string; rol: string }>('/api/auth/me'),
};

// ── Dashboard ──────────────────────────────────────────────────────────────
export interface DashboardData {
  kpis: {
    sesionesHoy: number;
    sesionesEnCurso: number;
    reservasHoy: number;
    reservasMañana: number;
    totalPilotos: number;
    pilotosPsicofisicoAlerta: number;
    tareasVencidas: number;
    tareasProximas: number;
    sesionsMes: number;
    horasMes: number;
    promedioMinSesion: number;
    logsNoResueltos: number;
  };
  simuladores: Array<{ id: string; nombre: string; aeronave: string; operativo: boolean; enSesion: boolean }>;
  proximasReservas: ProximaReserva[];
  alertas: Array<{ tipo: string; nivel: string; msg: string }>;
}

export interface ProximaReserva {
  id: string;
  horaInicio: string;
  horaFin: string;
  tema: string | null;
  simulador: { nombre: string; aeronave: string };
  piloto: { nombre: string; apellido: string } | null;
  instructor: { nombre: string; apellido: string } | null;
}

export const dashboardApi = {
  get: () => apiFetch<DashboardData>('/api/dashboard'),
};

// ── Pilotos ────────────────────────────────────────────────────────────────
export interface Piloto {
  id: string;
  nombre: string;
  apellido: string;
  licencia: string;
  habilitaciones: string[];
  psicofisicoVto: string | null;
  totalHoras: number;
  totalSesiones: number;
  activo: boolean;
}

export const pilotosApi = {
  listar: (params?: { activo?: boolean; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.activo !== undefined) qs.set('activo', String(params.activo));
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiFetch<{ data: Piloto[]; meta: { total: number; page: number } }>(`/api/pilotos?${qs}`);
  },
  crear: (data: Partial<Piloto>) =>
    apiFetch<Piloto>('/api/pilotos', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id: string, data: Partial<Piloto>) =>
    apiFetch<Piloto>(`/api/pilotos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  estadisticas: (id: string) =>
    apiFetch<{ sesiones: number; horas: number; evaluaciones: Record<string, number> }>(`/api/pilotos/${id}/estadisticas`),
};

// ── Reservas ───────────────────────────────────────────────────────────────
export interface Reserva {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: 'VUELO' | 'DEMO' | 'MANT' | 'CAPACITACION';
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
  tema: string | null;
  simulador: { id: string; nombre: string; aeronave: string };
  piloto: { id: string; nombre: string; apellido: string; licencia: string } | null;
  instructor: { id: string; nombre: string; apellido: string } | null;
}

export const reservasApi = {
  listar: (params?: { desde?: string; hasta?: string; simuladorId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.desde)       qs.set('desde', params.desde);
    if (params?.hasta)       qs.set('hasta', params.hasta);
    if (params?.simuladorId) qs.set('simuladorId', params.simuladorId);
    return apiFetch<{ data: Reserva[]; meta: { total: number } }>(`/api/reservas?${qs}`);
  },
  semana: () => apiFetch<Reserva[]>('/api/reservas/semana'),
  crear: (data: Partial<Reserva> & { simuladorId: string; pilotoId?: string; instructorId?: string }) =>
    apiFetch<Reserva>('/api/reservas', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id: string, data: Partial<Reserva>) =>
    apiFetch<Reserva>(`/api/reservas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelar: (id: string) =>
    apiFetch<Reserva>(`/api/reservas/${id}/cancelar`, { method: 'PATCH' }),
};

// ── Log técnico ────────────────────────────────────────────────────────────
export interface LogEntry {
  id: string;
  simuladorId: string | null;
  tipo: 'INCIDENTE' | 'FALLA' | 'ALERTA' | 'INFO';
  descripcion: string;
  operador: string;
  resolucion: string | null;
  resueltoEn: string | null;
  createdAt: string;
}

export const logApi = {
  listar: (params?: { simuladorId?: string; tipo?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.simuladorId) qs.set('simuladorId', params.simuladorId);
    if (params?.tipo)        qs.set('tipo', params.tipo);
    if (params?.page)        qs.set('page', String(params.page));
    return apiFetch<{ data: LogEntry[]; meta: { total: number; page: number } }>(`/api/log?${qs}`);
  },
  crear: (data: { simuladorId?: string; tipo: string; descripcion: string; operador: string }) =>
    apiFetch<LogEntry>('/api/log', { method: 'POST', body: JSON.stringify(data) }),
  resolver: (id: string, resolucion: string) =>
    apiFetch<LogEntry>(`/api/log/${id}/resolver`, { method: 'PATCH', body: JSON.stringify({ resolucion }) }),
};

// ── Mantenimiento ──────────────────────────────────────────────────────────
export interface TareaMantenimiento {
  id: string;
  simuladorId: string | null;
  titulo: string;
  descripcion: string;
  frecuencia: string;
  critica: boolean;
  proximaFecha: string | null;
  ultimaFecha: string | null;
  ultimoResponsable: string | null;
  estado: string;
  diasRestantes: number | null;
  vencida: boolean;
  simulador?: { nombre: string; aeronave: string };
  _count?: { historial: number };
}

export const mantenimientoApi = {
  listar: (params?: { simuladorId?: string; critica?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.simuladorId)         qs.set('simuladorId', params.simuladorId);
    if (params?.critica !== undefined) qs.set('critica', String(params.critica));
    return apiFetch<TareaMantenimiento[]>(`/api/mantenimiento?${qs}`);
  },
  alertas: () => apiFetch<{ vencidas: number; proximas7dias: number; tareasVencidas: TareaMantenimiento[]; tareasProximas: TareaMantenimiento[] }>('/api/mantenimiento/alertas'),
  crear: (data: Partial<TareaMantenimiento>) =>
    apiFetch<TareaMantenimiento>('/api/mantenimiento', { method: 'POST', body: JSON.stringify(data) }),
  completar: (id: string, data: { responsable: string; descripcion: string; horasMaquina?: number }) =>
    apiFetch<TareaMantenimiento>(`/api/mantenimiento/${id}/completar`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── ANAC ───────────────────────────────────────────────────────────────────
export const anacApi = {
  sesionesParaExportar: (params?: { desde?: string; hasta?: string; aeronave?: string }) => {
    const qs = new URLSearchParams();
    if (params?.desde)    qs.set('desde', params.desde);
    if (params?.hasta)    qs.set('hasta', params.hasta);
    if (params?.aeronave) qs.set('aeronave', params.aeronave);
    return apiFetch<{ total: number; sesiones: any[] }>(`/api/anac/sesiones?${qs}`);
  },
  estadisticas: (params?: { desde?: string; hasta?: string }) => {
    const qs = new URLSearchParams();
    if (params?.desde) qs.set('desde', params.desde);
    if (params?.hasta) qs.set('hasta', params.hasta);
    return apiFetch<any>(`/api/anac/estadisticas?${qs}`);
  },
  exportar: (data: { desde: string; hasta: string; aeronave?: string; formato: 'PDF' | 'CSV' | 'AMBOS' }) =>
    apiFetch<{ total: number; pdfUrl?: string; csvUrl?: string }>('/api/anac/exportar', {
      method: 'POST', body: JSON.stringify(data),
    }),
};

// ── Simuladores ────────────────────────────────────────────────────────────
export const simuladoresApi = {
  listar: () => apiFetch<any[]>('/api/simuladores'),
  obtener: (id: string) => apiFetch<any>(`/api/simuladores/${id}`),
  actualizarEstado: (id: string, operativo: boolean) =>
    apiFetch<any>(`/api/simuladores/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ operativo }) }),
};
