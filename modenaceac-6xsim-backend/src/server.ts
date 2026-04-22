// src/server.ts — MODENACEAC 6XSIM Backend
import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main() {
  // Verificar conexión a DB
  try {
    await prisma.$connect();
    logger.info('PostgreSQL conectado OK');
  } catch (err) {
    logger.error('Error conectando a PostgreSQL:', err);
    process.exit(1);
  }

  const server = app.listen(PORT, HOST, () => {
    logger.info(`╔══════════════════════════════════════════════╗`);
    logger.info(`║   MODENACEAC 6XSIM Backend — v4.0            ║`);
    logger.info(`║   Escuchando en http://${HOST}:${PORT}        ║`);
    logger.info(`║   Entorno: ${process.env.NODE_ENV ?? 'development'}                    ║`);
    logger.info(`╚══════════════════════════════════════════════╝`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Señal ${signal} recibida. Cerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Servidor cerrado correctamente.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
