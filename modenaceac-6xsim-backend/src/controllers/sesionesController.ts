// src/controllers/sesionesController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { pdfService } from '../services/pdfService';
import { logger } from '../utils/logger';

// ── Schemas ────────────────────────────────────────────────────────────────
const crearSchema = z.object({
  pilotoId:      z.string().uuid(),
  instructorId:  z.string().uuid(),
  simuladorId:   z.string().uuid(),
  icao:          z.string().length(4),
  horaLocal:     z.string().regex(/^\d{2}:\d{2}$/),
  fecha:         z.string().datetime().or(z.string()),
  meteo: z.object({
    vientoDirGrados: z.number().min(0).max(360).default(0),
    vientoKts:       z.number().min(0).max(100).default(0),
    visibilidadSm:   z.number().min(0).max(50).default(10),
    turbulencia:     z.number().min(0).max(3).default(0),
    tipoNubes:       z.enum(['CAVOK','SCT','BKN','OVC','CB','FG']).default('CAVOK'),
    techoPies:       z.number().default(5000),
    temperaturaC:    z.number().min(-50).max(60).default(20),
  }).optional(),
  reservaId:     z.string().uuid().optional(),
});

const finalizarSchema = z.object({
  evaluacionGlobal: z.enum(['AS','S','SB','NA']),
  observaciones:    z.string().optional(),
  firmaBase64:      z.string().optional(),
  evaluaciones: z.array(z.object({
    maniobraId:   z.string(),
    nombre:       z.string(),
    resultado:    z.enum(['AS','S','SB','NA']),
    observaciones:z.string().optional(),
  })).optional(),
  fallasUsadas: z.array(z.object({
    fallaId:  z.string(),
    nombre:   z.string(),
    dataref:  z.string(),
    sistema:  z.string(),
    aeronave: z.enum(['AW109','R44']),
  })).optional(),
});

// ── Listar sesiones ────────────────────────────────────────────────────────
export async function listarSesiones(req: Request, res: Response, next: NextFunction) {
  try {
    const { desde, hasta, simuladorId, pilotoId, estado, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde as string);
      if (hasta) where.fecha.lte = new Date(hasta as string);
    }
    if (simuladorId) where.simuladorId = simuladorId;
    if (pilotoId)    where.pilotoId    = pilotoId;
    if (estado)      where.estado      = estado;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [sesiones, total] = await Promise.all([
      prisma.sesion.findMany({
        where,
        skip, take,
        orderBy: { fecha: 'desc' },
        include: {
          piloto:     { select: { id: true, nombre: true, apellido: true, licencia: true } },
          instructor: { select: { id: true, nombre: true, apellido: true } },
          simulador:  { select: { id: true, nombre: true, aeronave: true } },
          evaluaciones: true,
          _count: { select: { fallasUsadas: true } },
        },
      }),
      prisma.sesion.count({ where }),
    ]);

    res.json({
      data: sesiones,
      meta: { total, page: parseInt(page as string), limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) { next(err); }
}

// ── Obtener sesión ─────────────────────────────────────────────────────────
export async function obtenerSesion(req: Request, res: Response, next: NextFunction) {
  try {
    const sesion = await prisma.sesion.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        piloto:       true,
        instructor:   { select: { id: true, nombre: true, apellido: true, email: true } },
        simulador:    true,
        evaluaciones: { orderBy: { createdAt: 'asc' } },
        fallasUsadas: { orderBy: { inyectadaEn: 'asc' } },
        reserva:      true,
      },
    });
    res.json(sesion);
  } catch (err) { next(err); }
}

// ── Crear sesión ───────────────────────────────────────────────────────────
export async function crearSesion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = crearSchema.parse(req.body);
    const sesion = await prisma.sesion.create({
      data: {
        pilotoId:     data.pilotoId,
        instructorId: data.instructorId,
        simuladorId:  data.simuladorId,
        icao:         data.icao,
        horaLocal:    data.horaLocal,
        fecha:        new Date(data.fecha),
        horaInicio:   new Date(),
        reservaId:    data.reservaId,
        ...(data.meteo ?? {}),
      },
    });
    logger.info(`Sesión creada: ${sesion.id}`);
    res.status(201).json(sesion);
  } catch (err) { next(err); }
}

// ── Actualizar sesión ──────────────────────────────────────────────────────
export async function actualizarSesion(req: Request, res: Response, next: NextFunction) {
  try {
    const sesion = await prisma.sesion.update({
      where: { id: req.params.id },
      data:  req.body,
    });
    res.json(sesion);
  } catch (err) { next(err); }
}

// ── Finalizar sesión ───────────────────────────────────────────────────────
export async function finalizarSesion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = finalizarSchema.parse(req.body);
    const ahora = new Date();

    // Obtener sesión activa
    const sesion = await prisma.sesion.findUniqueOrThrow({ where: { id: req.params.id } });
    const duracionSeg = Math.round((ahora.getTime() - sesion.horaInicio.getTime()) / 1000);

    // Transacción: actualizar sesión + insertar evaluaciones y fallas
    const sesionFinal = await prisma.$transaction(async (tx) => {
      // Actualizar sesión
      const updated = await tx.sesion.update({
        where: { id: req.params.id },
        data: {
          estado:           'COMPLETADA',
          horaFin:          ahora,
          duracionSeg,
          evaluacionGlobal: data.evaluacionGlobal,
          observaciones:    data.observaciones,
          firmaBase64:      data.firmaBase64,
        },
      });

      // Insertar evaluaciones de maniobras
      if (data.evaluaciones?.length) {
        await tx.evalManiobra.createMany({
          data: data.evaluaciones.map(e => ({
            sesionId:     req.params.id,
            maniobraId:   e.maniobraId,
            nombre:       e.nombre,
            resultado:    e.resultado,
            observaciones:e.observaciones,
          })),
        });
      }

      // Registrar fallas usadas
      if (data.fallasUsadas?.length) {
        await tx.fallaRegistro.createMany({
          data: data.fallasUsadas.map(f => ({
            sesionId: req.params.id,
            fallaId:  f.fallaId,
            nombre:   f.nombre,
            dataref:  f.dataref,
            sistema:  f.sistema,
            aeronave: f.aeronave,
          })),
        });
      }

      // Actualizar estadísticas del piloto
      await tx.piloto.update({
        where: { id: sesion.pilotoId },
        data: {
          totalSesiones: { increment: 1 },
          totalHoras:    { increment: duracionSeg / 3600 },
        },
      });

      // Actualizar estado de la reserva si existe
      if (sesion.reservaId) {
        await tx.reserva.update({
          where: { id: sesion.reservaId },
          data:  { estado: 'COMPLETADA' },
        });
      }

      return updated;
    });

    logger.info(`Sesión finalizada: ${req.params.id} · ${Math.round(duracionSeg/60)} min`);
    res.json(sesionFinal);
  } catch (err) { next(err); }
}

// ── Generar PDF de la sesión ───────────────────────────────────────────────
export async function generarPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const sesion = await prisma.sesion.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        piloto:       true,
        instructor:   true,
        simulador:    true,
        evaluaciones: { orderBy: { createdAt: 'asc' } },
        fallasUsadas: true,
      },
    });

    const pdfPath = await pdfService.generarReporteSesion(sesion as any);

    // Guardar URL del PDF en la sesión
    await prisma.sesion.update({
      where: { id: req.params.id },
      data:  { reportePdfUrl: pdfPath },
    });

    logger.info(`PDF generado: ${pdfPath}`);

    // Responder con la URL del PDF o enviarlo directamente
    if (req.query.download === '1') {
      res.download(pdfPath);
    } else {
      res.json({ pdfUrl: `/pdfs/${req.params.id}.pdf` });
    }
  } catch (err) { next(err); }
}
