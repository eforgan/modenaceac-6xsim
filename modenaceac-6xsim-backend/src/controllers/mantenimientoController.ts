// src/controllers/mantenimientoController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { addDays, addMonths, addWeeks, addYears, addHours } from 'date-fns';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const tareaSchema = z.object({
  simuladorId:    z.string().uuid().optional(),
  titulo:         z.string().min(3),
  descripcion:    z.string(),
  frecuencia:     z.enum(['DIARIA','SEMANAL','MENSUAL','TRIMESTRAL','SEMESTRAL','ANUAL','POR_HORAS']),
  critica:        z.boolean().default(false),
  proximaFecha:   z.string().datetime().optional(),
  proximasHoras:  z.number().optional(),
  notas:          z.string().optional(),
});

const completarSchema = z.object({
  responsable:    z.string(),
  descripcion:    z.string(),
  horasMaquina:   z.number().optional(),
});

// Calcular próxima fecha basada en frecuencia
function calcProximaFecha(frecuencia: string, desde: Date = new Date()): Date {
  switch (frecuencia) {
    case 'DIARIA':       return addDays(desde, 1);
    case 'SEMANAL':      return addWeeks(desde, 1);
    case 'MENSUAL':      return addMonths(desde, 1);
    case 'TRIMESTRAL':   return addMonths(desde, 3);
    case 'SEMESTRAL':    return addMonths(desde, 6);
    case 'ANUAL':        return addYears(desde, 1);
    default:             return addDays(desde, 30);
  }
}

export async function listarTareas(req: Request, res: Response, next: NextFunction) {
  try {
    const { simuladorId, frecuencia, estado, critica } = req.query;

    const where: any = {};
    if (simuladorId) where.simuladorId = simuladorId;
    if (frecuencia)  where.frecuencia  = frecuencia;
    if (estado)      where.estado      = estado;
    if (critica !== undefined) where.critica = critica === 'true';

    const tareas = await prisma.tareaMantenimiento.findMany({
      where,
      orderBy: [{ critica: 'desc' }, { proximaFecha: 'asc' }],
      include: {
        simulador: { select: { nombre: true, aeronave: true } },
        _count:    { select: { historial: true } },
      },
    });

    const hoy = new Date();
    const con_estado = tareas.map(t => ({
      ...t,
      diasRestantes: t.proximaFecha
        ? Math.round((new Date(t.proximaFecha).getTime() - hoy.getTime()) / (1000*60*60*24))
        : null,
      vencida: t.proximaFecha ? new Date(t.proximaFecha) < hoy : false,
    }));

    res.json(con_estado);
  } catch (err) { next(err); }
}

export async function alertasVencidas(req: Request, res: Response, next: NextFunction) {
  try {
    const hoy  = new Date();
    const en7d = addDays(hoy, 7);

    const [vencidas, proximas] = await Promise.all([
      // Tareas ya vencidas
      prisma.tareaMantenimiento.findMany({
        where: {
          estado:       { in: ['PENDIENTE','EN_PROGRESO'] },
          proximaFecha: { lt: hoy },
        },
        include: { simulador: { select: { nombre: true, aeronave: true } } },
        orderBy: { proximaFecha: 'asc' },
      }),
      // Tareas que vencen en los próximos 7 días
      prisma.tareaMantenimiento.findMany({
        where: {
          estado:       { in: ['PENDIENTE','EN_PROGRESO'] },
          proximaFecha: { gte: hoy, lte: en7d },
        },
        include: { simulador: { select: { nombre: true, aeronave: true } } },
        orderBy: { proximaFecha: 'asc' },
      }),
    ]);

    res.json({
      vencidas: vencidas.length,
      proximas7dias: proximas.length,
      tareasVencidas: vencidas,
      tareasProximas: proximas,
    });
  } catch (err) { next(err); }
}

export async function crearTarea(req: Request, res: Response, next: NextFunction) {
  try {
    const data  = tareaSchema.parse(req.body);
    const tarea = await prisma.tareaMantenimiento.create({
      data: {
        ...data,
        proximaFecha: data.proximaFecha
          ? new Date(data.proximaFecha)
          : calcProximaFecha(data.frecuencia),
      },
    });
    logger.info(`Tarea mantenimiento creada: ${tarea.id} · ${tarea.titulo}`);
    res.status(201).json(tarea);
  } catch (err) { next(err); }
}

export async function actualizarTarea(req: Request, res: Response, next: NextFunction) {
  try {
    const data  = tareaSchema.partial().parse(req.body);
    const tarea = await prisma.tareaMantenimiento.update({
      where: { id: req.params.id },
      data: {
        ...data,
        proximaFecha: data.proximaFecha ? new Date(data.proximaFecha) : undefined,
      },
    });
    res.json(tarea);
  } catch (err) { next(err); }
}

export async function completarTarea(req: Request, res: Response, next: NextFunction) {
  try {
    const { responsable, descripcion, horasMaquina } = completarSchema.parse(req.body);

    const tarea = await prisma.tareaMantenimiento.findUniqueOrThrow({
      where: { id: req.params.id },
    });

    const ahora      = new Date();
    const proximaFecha = calcProximaFecha(tarea.frecuencia, ahora);

    const [tareaActualizada] = await prisma.$transaction([
      // Actualizar tarea
      prisma.tareaMantenimiento.update({
        where: { id: req.params.id },
        data: {
          estado:           'COMPLETADA',
          ultimaFecha:      ahora,
          ultimoResponsable:responsable,
          proximaFecha,
        },
      }),
      // Registrar en historial
      prisma.historialMantenimiento.create({
        data: {
          tareaId:     req.params.id,
          responsable,
          descripcion,
          horasMaquina,
        },
      }),
      // Crear la próxima ocurrencia si la frecuencia lo requiere
      ...(tarea.frecuencia !== 'POR_HORAS' ? [
        prisma.tareaMantenimiento.update({
          where: { id: req.params.id },
          data:  { estado: 'PENDIENTE', proximaFecha },
        }),
      ] : []),
    ]);

    logger.info(`Tarea completada: ${req.params.id} por ${responsable}`);
    res.json(tareaActualizada);
  } catch (err) { next(err); }
}

export async function historial(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.historialMantenimiento.findMany({
      where:   { tareaId: req.params.id },
      orderBy: { realizadoEn: 'desc' },
      take:    50,
    });
    res.json(items);
  } catch (err) { next(err); }
}
