// src/server.ts — MODENACEAC 6XSIM Backend
import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main() {
  // Arrancar el servidor primero para pasar health checks de Render/Railway
  const server = app.listen(PORT, HOST, () => {
    logger.info(`╔══════════════════════════════════════════════╗`);
    logger.info(`║   MODENACEAC 6XSIM Backend — v4.0            ║`);
    logger.info(`║   Escuchando en http://${HOST}:${PORT}        ║`);
    logger.info(`║   Entorno: ${process.env.NODE_ENV ?? 'development'}                    ║`);
    logger.info(`╚══════════════════════════════════════════════╝`);
  });

  // Conectar a DB después de arrancar (Neon puede tardar en despertar)
  try {
    await prisma.$connect();
    logger.info('PostgreSQL conectado OK');
  } catch (err) {
    logger.error('Error conectando a PostgreSQL:', err);
    // No hacer process.exit — el servidor sigue respondiendo health checks
  }

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
