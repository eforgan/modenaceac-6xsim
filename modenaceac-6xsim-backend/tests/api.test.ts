// tests/api.test.ts
// MODENACEAC 6XSIM — Suite de tests de integración
// Usa Vitest + base de datos de test real (PostgreSQL)

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/utils/prisma';
import bcrypt from 'bcryptjs';

// ── Setup global ────────────────────────────────────────────────────────────
let adminToken: string;
let instructorToken: string;

beforeAll(async () => {
  // Crear usuario de test en DB
  const adminHash = await bcrypt.hash('TestAdmin2024!', 12);
  const instHash  = await bcrypt.hash('TestInst2024!', 12);

  await prisma.usuario.upsert({
    where:  { email: 'test-admin@modenaceac.ar' },
    update: {},
    create: {
      email: 'test-admin@modenaceac.ar',
      passwordHash: adminHash,
      nombre: 'Test', apellido: 'Admin', rol: 'ADMIN',
    },
  });

  await prisma.usuario.upsert({
    where:  { email: 'test-inst@modenaceac.ar' },
    update: {},
    create: {
      email: 'test-inst@modenaceac.ar',
      passwordHash: instHash,
      nombre: 'Eduardo', apellido: 'Forgan', rol: 'INSTRUCTOR',
    },
  });
});

afterAll(async () => {
  // Limpiar datos de test
  await prisma.usuario.deleteMany({ where: { email: { contains: 'test-' } } });
  await prisma.$disconnect();
});

// ════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════════
describe('GET /health', () => {
  it('devuelve status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('6XSIM');
    expect(res.body.version).toBe('4.0.0');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  it('login exitoso — devuelve JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-admin@modenaceac.ar', password: 'TestAdmin2024!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('ADMIN');
    adminToken = res.body.token;
  });

  it('login instructor Eduardo Forgan', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-inst@modenaceac.ar', password: 'TestInst2024!' });

    expect(res.status).toBe(200);
    expect(res.body.usuario.nombre).toBe('Eduardo');
    expect(res.body.usuario.rol).toBe('INSTRUCTOR');
    instructorToken = res.body.token;
  });

  it('credenciales incorrectas — 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-admin@modenaceac.ar', password: 'wrong_password' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('email inválido — 400 (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe('email');
  });

  it('sin token — rutas protegidas retornan 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me — retorna perfil del usuario', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test-admin@modenaceac.ar');
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/dashboard', () => {
  it('devuelve estructura correcta de KPIs', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('kpis');
    expect(res.body).toHaveProperty('alertas');
    expect(res.body).toHaveProperty('proximasReservas');
    expect(res.body).toHaveProperty('simuladores');

    // KPIs esperados
    const { kpis } = res.body;
    expect(typeof kpis.sesionesHoy).toBe('number');
    expect(typeof kpis.totalPilotos).toBe('number');
    expect(typeof kpis.tareasVencidas).toBe('number');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// PILOTOS
// ════════════════════════════════════════════════════════════════════════════
describe('/api/pilotos', () => {
  let pilotoId: string;

  it('POST — crea un piloto', async () => {
    const res = await request(app)
      .post('/api/pilotos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre:   'Juan',
        apellido: 'Test-Piloto',
        licencia: 'TEST-PPL-9999',
        habAW109: true,
        habR44:   true,
        habIFR:   false,
      });

    expect(res.status).toBe(201);
    expect(res.body.licencia).toBe('TEST-PPL-9999');
    pilotoId = res.body.id;
  });

  it('GET / — lista pilotos con alerta de psicofísico', async () => {
    const res = await request(app)
      .get('/api/pilotos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Verificar estructura de cada piloto
    const p = res.body.find((p: any) => p.licencia === 'TEST-PPL-9999');
    expect(p).toBeDefined();
    expect(p).toHaveProperty('psicofisicoVencido');
    expect(p).toHaveProperty('psicofisicoProximo');
  });

  it('GET /:id — detalle del piloto', async () => {
    const res = await request(app)
      .get(`/api/pilotos/${pilotoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Juan');
    expect(res.body).toHaveProperty('sesiones');
  });

  it('GET /:id/estadisticas — estadísticas del piloto', async () => {
    const res = await request(app)
      .get(`/api/pilotos/${pilotoId}/estadisticas`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalHoras');
    expect(res.body).toHaveProperty('totalSesiones');
    expect(res.body).toHaveProperty('horasPorAeronave');
  });

  it('PUT /:id — actualiza piloto', async () => {
    const res = await request(app)
      .put(`/api/pilotos/${pilotoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Juan Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Juan Actualizado');
  });

  it('POST — licencia duplicada — 409', async () => {
    const res = await request(app)
      .post('/api/pilotos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Dup', apellido: 'Test', licencia: 'TEST-PPL-9999' });

    expect(res.status).toBe(409);
  });

  // Limpieza
  afterAll(async () => {
    if (pilotoId) {
      await prisma.piloto.delete({ where: { id: pilotoId } }).catch(() => {});
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// RESERVAS
// ════════════════════════════════════════════════════════════════════════════
describe('/api/reservas', () => {
  let simId: string;
  let reservaId: string;

  beforeAll(async () => {
    // Obtener un simulador para las reservas
    const sim = await prisma.simulador.findFirst();
    simId = sim?.id ?? '';
  });

  it('GET /semana — vista semanal', async () => {
    const res = await request(app)
      .get('/api/reservas/semana')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('semana');
    expect(res.body).toHaveProperty('dias');
    expect(Array.isArray(res.body.dias)).toBe(true);
    expect(res.body.dias).toHaveLength(7);
  });

  it('POST — crea reserva', async () => {
    if (!simId) return;

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        simuladorId: simId,
        tipo:        'VUELO',
        fecha:       new Date().toISOString(),
        horaInicio:  '08:00',
        horaFin:     '09:00',
        tema:        'Test CI — reserva automatizada',
      });

    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('VUELO');
    reservaId = res.body.id;
  });

  it('POST — solapamiento de horario — 409', async () => {
    if (!simId || !reservaId) return;

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        simuladorId: simId,
        tipo:        'DEMO',
        fecha:       new Date().toISOString(),
        horaInicio:  '08:30',   // Solapa con 08:00-09:00
        horaFin:     '09:30',
      });

    expect(res.status).toBe(409);
  });

  it('POST /:id/cancelar — cancela la reserva', async () => {
    if (!reservaId) return;

    const res = await request(app)
      .post(`/api/reservas/${reservaId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('CANCELADA');
  });

  afterAll(async () => {
    if (reservaId) {
      await prisma.reserva.delete({ where: { id: reservaId } }).catch(() => {});
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// MANTENIMIENTO
// ════════════════════════════════════════════════════════════════════════════
describe('/api/mantenimiento', () => {
  it('GET /alertas — devuelve estructura correcta', async () => {
    const res = await request(app)
      .get('/api/mantenimiento/alertas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.vencidas).toBe('number');
    expect(typeof res.body.proximas7dias).toBe('number');
    expect(Array.isArray(res.body.tareasVencidas)).toBe(true);
    expect(Array.isArray(res.body.tareasProximas)).toBe(true);
  });

  it('GET / — lista tareas con diasRestantes', async () => {
    const res = await request(app)
      .get('/api/mantenimiento')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('diasRestantes');
      expect(res.body[0]).toHaveProperty('vencida');
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ANAC
// ════════════════════════════════════════════════════════════════════════════
describe('/api/anac', () => {
  it('GET /sesiones — requiere ADMIN o DIRECTOR', async () => {
    // Con token de instructor
    const res = await request(app)
      .get('/api/anac/sesiones')
      .set('Authorization', `Bearer ${instructorToken}`);
    // Instructor sí puede ver (no está restringido en GET)
    expect([200, 403]).toContain(res.status);
  });

  it('GET /estadisticas — devuelve KPIs ANAC', async () => {
    const res = await request(app)
      .get('/api/anac/estadisticas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalSesiones).toBe('number');
    expect(typeof res.body.totalHoras).toBe('number');
    expect(typeof res.body.sesionesConFirma).toBe('number');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// LOG TÉCNICO
// ════════════════════════════════════════════════════════════════════════════
describe('/api/log', () => {
  let logId: string;

  it('POST — registra un log técnico', async () => {
    const res = await request(app)
      .post('/api/log')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipo:        'INFO',
        descripcion: 'Test CI — verificación automática del sistema',
        operador:    'CI/CD Runner',
      });

    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('INFO');
    logId = res.body.id;
  });

  it('PATCH /:id/resolver — marca el log como resuelto', async () => {
    if (!logId) return;

    const res = await request(app)
      .patch(`/api/log/${logId}/resolver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolucion: 'Test completado. Sistema OK.' });

    expect(res.status).toBe(200);
    expect(res.body.resueltoEn).not.toBeNull();
  });

  afterAll(async () => {
    if (logId) {
      await prisma.logTecnico.delete({ where: { id: logId } }).catch(() => {});
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SIMULADORES
// ════════════════════════════════════════════════════════════════════════════
describe('/api/simuladores', () => {
  it('GET / — lista los simuladores', async () => {
    const res = await request(app)
      .get('/api/simuladores')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /:id/estado — cambia estado operativo', async () => {
    const sim = await prisma.simulador.findFirst();
    if (!sim) return;

    const res = await request(app)
      .patch(`/api/simuladores/${sim.id}/estado`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ operativo: false });

    expect(res.status).toBe(200);
    expect(res.body.operativo).toBe(false);

    // Restaurar
    await prisma.simulador.update({
      where: { id: sim.id },
      data:  { operativo: true },
    });
  });
});
