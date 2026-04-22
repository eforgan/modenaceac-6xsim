// src/routes/log.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

const logSchema = z.object({
  simuladorId: z.string().uuid().optional(),
  tipo:        z.enum(['INCIDENTE','FALLA','ALERTA','INFO']),
  descripcion: z.string().min(5),
  operador:    z.string().min(2),
  resolucion:  z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const { simuladorId, tipo, desde, hasta, page = '1', limit = '30' } = req.query;
    const where: any = {};
    if (simuladorId) where.simuladorId = simuladorId;
    if (tipo)        where.tipo        = tipo;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde as string);
      if (hasta) where.createdAt.lte = new Date(hasta as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.logTecnico.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: parseInt(limit as string),
      }),
      prisma.logTecnico.count({ where }),
    ]);

    res.json({ data: logs, meta: { total, page: parseInt(page as string) } });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = logSchema.parse(req.body);
    const log  = await prisma.logTecnico.create({ data });
    logger.info(`Log técnico: [${data.tipo}] ${data.descripcion.slice(0, 60)}`);
    res.status(201).json(log);
  } catch (err) { next(err); }
});

router.patch('/:id/resolver', async (req, res, next) => {
  try {
    const { resolucion } = z.object({ resolucion: z.string() }).parse(req.body);
    const log = await prisma.logTecnico.update({
      where: { id: req.params.id },
      data:  { resolucion, resueltoEn: new Date() },
    });
    res.json(log);
  } catch (err) { next(err); }
});

export default router;
