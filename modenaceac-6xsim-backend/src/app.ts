// src/app.ts — Express application
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

// Routers
import sesionesRouter     from './routes/sesiones';
import pilotosRouter      from './routes/pilotos';
import reservasRouter     from './routes/reservas';
import mantenimientoRouter from './routes/mantenimiento';
import anacRouter         from './routes/anac';
import simuladoresRouter  from './routes/simuladores';
import logRouter          from './routes/log';
import authRouter         from './routes/auth';
import dashboardRouter    from './routes/dashboard';

const app = express();

// ── Seguridad ─────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para facilitar el frontend embebido
}));

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
  .split(',')
  .map(s => s.trim());

// Regex para permitir localhost y rangos IP privados (192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x)
const isLocalNetwork = (origin: string) => {
  if (!origin) return true; // Permitir clientes sin origin (postman, apps móviles)
  const regex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/;
  return regex.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    // Permitir origen si está en la lista estricta o si es de la red local
    if (!origin || allowedOrigins.includes(origin) || isLocalNetwork(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX ?? '200'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas peticiones. Intentar en 15 minutos.' },
});
app.use('/api/', limiter);

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));      // Para firma digital base64
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── Logging HTTP ──────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Health check (sin autenticación) ─────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    service: 'MODENACEAC 6XSIM Backend',
    version: '4.0.0',
    ts:      new Date().toISOString(),
  });
});

// ── Archivos estáticos (PDFs generados) ──────────────────────────────────
app.use('/pdfs', express.static(path.resolve(process.env.PDF_OUTPUT_DIR ?? './pdfs')));

// ── Rutas públicas ────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Rutas protegidas ──────────────────────────────────────────────────────
app.use('/api/dashboard',    authMiddleware, dashboardRouter);
app.use('/api/sesiones',     authMiddleware, sesionesRouter);
app.use('/api/pilotos',      authMiddleware, pilotosRouter);
app.use('/api/reservas',     authMiddleware, reservasRouter);
app.use('/api/simuladores',  authMiddleware, simuladoresRouter);
app.use('/api/mantenimiento',authMiddleware, mantenimientoRouter);
app.use('/api/anac',         authMiddleware, anacRouter);
app.use('/api/log',          authMiddleware, logRouter);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Error handler global ──────────────────────────────────────────────────
app.use(errorHandler);

export default app;
