// src/routes/simuladores.ts
import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const sims = await prisma.simulador.findMany({
      include: {
        _count: { select: { sesiones: true, tareas: true } },
      },
    });
    res.json(sims);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const sim = await prisma.simulador.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        sesiones: {
          orderBy: { fecha: 'desc' },
          take:    5,
          include: {
            piloto:     { select: { nombre: true, apellido: true } },
            instructor: { select: { nombre: true, apellido: true } },
          },
        },
        tareas: {
          where:   { estado: { in: ['PENDIENTE','EN_PROGRESO'] } },
          orderBy: { proximaFecha: 'asc' },
          take:    5,
        },
      },
    });
    res.json(sim);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const sim = await prisma.simulador.update({
      where: { id: req.params.id },
      data:  req.body,
    });
    res.json(sim);
  } catch (err) { next(err); }
});

router.patch('/:id/estado', async (req, res, next) => {
  try {
    const { operativo } = req.body;
    const sim = await prisma.simulador.update({
      where: { id: req.params.id },
      data:  { operativo },
    });
    res.json(sim);
  } catch (err) { next(err); }
});

export default router;
