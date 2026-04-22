// src/utils/logger.ts
import winston from 'winston';
import path from 'path';
import fs from 'fs';

const LOG_DIR = path.resolve(process.env.LOG_DIR ?? './logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}] ${stack ?? message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat,
  ),
  transports: [
    // Consola con colores en desarrollo
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
      silent: process.env.NODE_ENV === 'test',
    }),
    // Archivo general
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'app.log'),
      maxsize:  10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // Archivo de errores
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level:    'error',
      maxsize:  5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
});
