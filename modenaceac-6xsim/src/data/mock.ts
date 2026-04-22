export const NAV = [
  { id: 'dash', lbl: 'Dashboard', sec: 'Operaciones' },
  { id: 'res', lbl: 'Reservas', sec: 'Operaciones' },
  { id: 'ses', lbl: 'Sesión activa', sec: 'Operaciones' },
  { id: 'rep', lbl: 'Reporte final', sec: 'Operaciones' },
  { id: 'log', lbl: 'Log técnico', sec: 'Técnico' },
  { id: 'pil', lbl: 'Pilotos', sec: 'Gestión' },
  { id: 'cur', lbl: 'Cursos', sec: 'Gestión' },
  { id: 'anac', lbl: 'Export ANAC', sec: 'Cumplimiento' },
  { id: 'mant', lbl: 'Mantenimiento', sec: 'Cumplimiento' },
  { id: 'stats', lbl: 'Estadísticas', sec: 'Análisis' }
];

export const RES = [
  { id: 1, sim: 'AW109', tipo: 'VUELO', pil: 'Cnel. Marcos Alvarez', lic: 'PPL-H-0741', ins: 'May. Laura Rivas', ini: '09:00', dur: 120, est: 'COMPLETADA', day: 0, tema: 'OEI en crucero + ILS con falla AFCS' },
  { id: 2, sim: 'AW109', tipo: 'DEMO', pil: 'Ing. Roberto Sosa', lic: '—', ins: 'May. Laura Rivas', ini: '11:30', dur: 60, est: 'CONFIRMADA', day: 0, tema: 'Demostración autoridades ANAC' },
  { id: 3, sim: 'AW109', tipo: 'VUELO', pil: 'Cap. Diego Ferreira', lic: 'PPL-H-0892', ins: 'May. Laura Rivas', ini: '14:00', dur: 120, est: 'EN_CURSO', day: 0, tema: 'Procedimientos AFCS en IMC' },
  { id: 4, sim: 'R44', tipo: 'VUELO', pil: 'Tte. Ana Suárez', lic: 'PPL-H-1103', ins: 'Cap. Pablo Torres', ini: '09:00', dur: 120, est: 'COMPLETADA', day: 0, tema: 'Autorrotación y falla de motor' },
  { id: 5, sim: 'R44', tipo: 'MANT', pil: null, lic: '—', ins: 'Téc. R. Nuñez', ini: '14:00', dur: 90, est: 'CONFIRMADA', day: 0, tema: 'Verificación UDP y calibración' },
  { id: 6, sim: 'AW109', tipo: 'VUELO', pil: 'Alf. Bruno Méndez', lic: 'PPL-H-0523', ins: 'May. Laura Rivas', ini: '09:00', dur: 120, est: 'CONFIRMADA', day: 1, tema: 'Hover IGE y despegues vertical' },
  { id: 7, sim: 'R44', tipo: 'VUELO', pil: 'Cap. Diego Ferreira', lic: 'PPL-H-0892', ins: 'Cap. Pablo Torres', ini: '09:00', dur: 120, est: 'PENDIENTE', day: 1, tema: 'Governor failure y carb ice' },
  { id: 8, sim: 'R44', tipo: 'DEMO', pil: 'Sra. Claudia Vidal', lic: '—', ins: 'Cap. Pablo Torres', ini: '11:30', dur: 60, est: 'PENDIENTE', day: 1, tema: 'Demostración institucional' },
  { id: 9, sim: 'AW109', tipo: 'VUELO', pil: 'Cnel. Marcos Alvarez', lic: 'PPL-H-0741', ins: 'May. Laura Rivas', ini: '14:00', dur: 120, est: 'PENDIENTE', day: 2, tema: 'Falla hidráulica N.1 y TR' },
  { id: 10, sim: 'R44', tipo: 'VUELO', pil: 'Tte. Ana Suárez', lic: 'PPL-H-1103', ins: 'Cap. Pablo Torres', ini: '09:00', dur: 120, est: 'PENDIENTE', day: 2, tema: 'Falla motor + autorrotación contacto' },
  { id: 11, sim: 'AW109', tipo: 'MANT', pil: null, lic: '—', ins: 'Téc. R. Nuñez', ini: '09:00', dur: 120, est: 'PENDIENTE', day: 3, tema: 'Calibración IDS EDU1/EDU2' },
  { id: 12, sim: 'R44', tipo: 'VUELO', pil: 'Alf. Bruno Méndez', lic: 'PPL-H-0523', ins: 'Cap. Pablo Torres', ini: '14:00', dur: 120, est: 'PENDIENTE', day: 3, tema: 'Hover y maniobras de área' },
  { id: 13, sim: 'AW109', tipo: 'VUELO', pil: 'Cap. Diego Ferreira', lic: 'PPL-H-0892', ins: 'May. Laura Rivas', ini: '09:00', dur: 120, est: 'PENDIENTE', day: 4, tema: 'Repaso general · evaluación ANAC' },
  { id: 14, sim: 'R44', tipo: 'CAPAC', pil: 'Tte. Ana Suárez', lic: 'PPL-H-1103', ins: 'May. Laura Rivas', ini: '14:00', dur: 120, est: 'PENDIENTE', day: 4, tema: 'Capacitación doctrina de vuelo' }
];

export const PIL = [
  { n: 'Cnel. Marcos Alvarez', lic: 'PPL-H-0741', hab: ['AW109', 'IFR'], ps: 'VIGENTE', vc: '2027-01-15', hv: 124, hs: 48, td: 'MEJORA' },
  { n: 'Cap. Diego Ferreira', lic: 'PPL-H-0892', hab: ['AW109', 'R44'], ps: 'VIGENTE', vc: '2026-09-20', hv: 98, hs: 32, td: 'ESTABLE' },
  { n: 'Tte. Ana Suárez', lic: 'PPL-H-1103', hab: ['R44'], ps: 'VIGENTE', vc: '2026-07-10', hv: 56, hs: 18, td: 'ESTABLE' },
  { n: 'Alf. Bruno Méndez', lic: 'PPL-H-1241', hab: ['R44'], ps: 'POR_VENCER', vc: '2026-06-01', hv: 28, hs: 10, td: 'DETERIORO' },
  { n: 'Tte. Cnel. Héctor Vega', lic: 'PPL-H-0847', hab: ['AW109'], ps: 'VENCIDO', vc: '2026-03-28', hv: 210, hs: 64, td: 'ESTABLE' },
  { n: 'Cap. Marcela Díaz', lic: 'PPL-H-1203', hab: ['AW109'], ps: 'POR_VENCER', vc: '2026-04-28', hv: 88, hs: 26, td: 'MEJORA' }
];

export const MAN = [
  { id: 'm1', n: 'Hover estacionario', c: 'Control básico' },
  { id: 'm2', n: 'Despegue vertical', c: 'Control básico' },
  { id: 'm3', n: 'Autorrotación completa', c: 'Emergencias' },
  { id: 'm4', n: 'Falla de motor en vuelo', c: 'Emergencias' },
  { id: 'm5', n: 'Aproximación ILS', c: 'IFR' }
];

export const LOGS = [
  {
    id: 1, sim: 'AW109', tipo: 'Visual', desc: 'Pantalla izquierda con artefactos gráficos en IMC', op: 'Téc. R. Nuñez', fecha: '2026-04-09', dur: 25, est: 'PENDIENTE_MANT',
    tl: [{ t: '08:42', txt: 'Falla detectada durante sesión', c: '#E24B4A' }, { t: '08:45', txt: 'Sesión pausada 25 min', c: '#EF9F27' }, { t: '09:12', txt: 'Problema persiste', c: '#EF9F27' }]
  },
  {
    id: 2, sim: 'R44', tipo: 'Movimiento', desc: 'Vibración anormal en plataforma al pitch >15°', op: 'Téc. R. Nuñez', fecha: '2026-04-08', dur: 120, est: 'EN_PROGRESO',
    tl: [{ t: '14:20', txt: 'Vibración detectada', c: '#E24B4A' }, { t: '14:22', txt: 'Sesión abortada por seguridad', c: '#E24B4A' }, { t: '14:30', txt: 'MANT programado · actuador #3', c: '#7F77DD' }]
  },
  {
    id: 3, sim: 'AW109', tipo: 'MANT programado', desc: 'Verificación post-actualización X-Plane 11.55r2', op: 'Téc. R. Nuñez', fecha: '2026-04-07', dur: 90, est: 'RESUELTO',
    tl: [{ t: '09:00', txt: 'Inicio verificación', c: '#7F77DD' }, { t: '10:30', txt: 'Verificación OK · todos nominal', c: '#27500A' }]
  }
];

export const CUR = [
  { n: 'Habilitación inicial AW109', a: 'AW109', nv: 'INICIAL', h: 20, m: 12 },
  { n: 'Recurrente anual AW109', a: 'AW109', nv: 'RECURRENTE', h: 8, m: 6 },
  { n: 'Habilitación IFR AW109', a: 'AW109', nv: 'IFR', h: 16, m: 8 },
  { n: 'Habilitación inicial R44', a: 'R44', nv: 'INICIAL', h: 12, m: 10 },
  { n: 'Recurrente anual R44', a: 'R44', nv: 'RECURRENTE', h: 6, m: 5 },
  { n: 'Emergencias avanzadas AW109', a: 'AW109', nv: 'EMERGENCIAS', h: 8, m: 7 },
  { n: 'Demo institucional', a: 'AMBAS', nv: 'DEMO', h: 1, m: 2 }
];

export const EB: Record<string, string> = { PENDIENTE: 'bp', CONFIRMADA: 'bc', EN_CURSO: 'be', COMPLETADA: 'bco', CANCELADA: 'bvn' };
export const RC: Record<string, any> = { AS: { bg: '#EAF3DE', c: '#173404' }, S: { bg: '#E6F1FB', c: '#042C53' }, SB: { bg: '#FAEEDA', c: '#412402' }, NA: { bg: '#F1EFE8', c: '#2C2C2A' } };
export const TD: Record<string, any> = { MEJORA: { c: '#27500A', i: '↑ MEJORA' }, ESTABLE: { c: '#5F5E5A', i: '→ ESTABLE' }, DETERIORO: { c: '#791F1F', i: '↓ DETERIORO' } };
export const PB: Record<string, string> = { VIGENTE: 'bo', POR_VENCER: 'bpv', VENCIDO: 'bvn' };
export const NB: Record<string, string> = { INICIAL: 'bv', RECURRENTE: 'bc', IFR: 'bm', EMERGENCIAS: 'bvn', DEMO: 'bd' };
export const SB_COLORS: Record<string, string> = { PENDIENTE_MANT: 'bp', EN_PROGRESO: 'bc', RESUELTO: 'bo', SIN_RESOLVER: 'bvn' };
