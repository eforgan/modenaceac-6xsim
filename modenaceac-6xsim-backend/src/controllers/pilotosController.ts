// src/controllers/pilotosController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const pilotoSchema = z.object({
  nombre:         z.string().min(2),
  apellido:       z.string().min(2),
  licencia:       z.string().min(4),
  dni:            z.string().optional(),
  email:          z.string().email().optional(),
  telefono:       z.string().optional(),
  habAW109:       z.boolean().default(false),
  habR44:         z.boolean().default(false),
  habIFR:         z.boolean().default(false),
  psicofisicoVto: z.string().datetime().optional(),
});

export async function listarPilotos(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, activo = 'true', aeronave } = req.query;

    const where: any = { activo: activo === 'true' };
    if (q) {
      where.OR = [
        { nombre:   { contains: q as string, mode: 'insensitive' } },
        { apellido: { contains: q as string, mode: 'insensitive' } },
        { licencia: { contains: q as string, mode: 'insensitive' } },
      ];
    }
    if (aeronave === 'AW109') where.habAW109 = true;
    if (aeronave === 'R44')   where.habR44   = true;

    const pilotos = await prisma.piloto.findMany({
      where,
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true, nombre: true, apellido: true, licencia: true,
        habAW109: true, habR44: true, habIFR: true,
        psicofisicoVto: true, totalHoras: true, totalSesiones: true,
        activo: true,
        _count: { select: { sesiones: true } },
      },
    });

    // Alertas de psicofísico
    const hoy = new Date();
    const pilotos_con_alerta = pilotos.map(p => ({
      ...p,
      psicofisicoVencido:  p.psicofisicoVto ? new Date(p.psicofisicoVto) < hoy : false,
      psicofisicoProximo:  p.psicofisicoVto
        ? (new Date(p.psicofisicoVto).getTime() - hoy.getTime()) / (1000*60*60*24) <= 30
        : false,
    }));

    res.json(pilotos_con_alerta);
  } catch (err) { next(err); }
}

export async function obtenerPiloto(req: Request, res: Response, next: NextFunction) {
  try {
    const piloto = await prisma.piloto.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        sesiones: {
          orderBy:  { fecha: 'desc' },
          take:     10,
          include:  {
            simulador:  { select: { nombre: true, aeronave: true } },
            instructor: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });
    res.json(piloto);
  } catch (err) { next(err); }
}

export async function crearPiloto(req: Request, res: Response, next: NextFunction) {
  try {
    const data   = pilotoSchema.parse(req.body);
    const piloto = await prisma.piloto.create({
      data: {
        ...data,
        psicofisicoVto: data.psicofisicoVto ? new Date(data.psicofisicoVto) : undefined,
      },
    });
    res.status(201).json(piloto);
  } catch (err) { next(err); }
}

export async function actualizarPiloto(req: Request, res: Response, next: NextFunction) {
  try {
    const data   = pilotoSchema.partial().parse(req.body);
    const piloto = await prisma.piloto.update({
      where: { id: req.params.id },
      data: {
        ...data,
        psicofisicoVto: data.psicofisicoVto ? new Date(data.psicofisicoVto) : undefined,
      },
    });
    res.json(piloto);
  } catch (err) { next(err); }
}

export async function estadisticasPiloto(req: Request, res: Response, next: NextFunction) {
  try {
    const piloto = await prisma.piloto.findUniqueOrThrow({
      where: { id: req.params.id },
    });

    const [sesiones, evalDistrib] = await Promise.all([
      prisma.sesion.findMany({
        where:    { pilotoId: req.params.id, estado: 'COMPLETADA' },
        orderBy:  { fecha: 'desc' },
        select:   {
          fecha: true, duracionSeg: true, evaluacionGlobal: true,
          simulador: { select: { aeronave: true } },
        },
      }),
      prisma.evalManiobra.groupBy({
        by:    ['resultado'],
        where: { sesion: { pilotoId: req.params.id } },
        _count: { _all: true },
      }),
    ]);

    const totalH = sesiones.reduce((a, s) => a + (s.duracionSeg ?? 0), 0) / 3600;
    const horasPorAeronave = sesiones.reduce((acc, s) => {
      const ae = s.simulador.aeronave;
      acc[ae] = (acc[ae] ?? 0) + (s.duracionSeg ?? 0) / 3600;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      piloto: { id: piloto.id, nombre: piloto.nombre, apellido: piloto.apellido, licencia: piloto.licencia },
      totalSesiones:    sesiones.length,
      totalHoras:       Math.round(totalH * 10) / 10,
      horasPorAeronave: Object.fromEntries(
        Object.entries(horasPorAeronave).map(([k, v]) => [k, Math.round(v * 10) / 10]),
      ),
      distribucionEvaluaciones: Object.fromEntries(
        evalDistrib.map(e => [e.resultado, e._count._all]),
      ),
      ultimasSesiones: sesiones.slice(0, 5).map(s => ({
        fecha:            s.fecha,
        duracionMin:      s.duracionSeg ? Math.round(s.duracionSeg / 60) : 0,
        evaluacionGlobal: s.evaluacionGlobal,
        aeronave:         s.simulador.aeronave,
      })),
    });
  } catch (err) { next(err); }
}
