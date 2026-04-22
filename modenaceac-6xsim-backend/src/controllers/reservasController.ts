// src/controllers/reservasController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const reservaSchema = z.object({
  simuladorId:  z.string().uuid(),
  pilotoId:     z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
  tipo:         z.enum(['VUELO','DEMO','MANT','CAPACITACION']),
  fecha:        z.string(),
  horaInicio:   z.string().regex(/^\d{2}:\d{2}$/),
  horaFin:      z.string().regex(/^\d{2}:\d{2}$/),
  tema:         z.string().optional(),
  notas:        z.string().optional(),
});

// Verificar solapamiento de horarios
async function verificarSolapamiento(
  simuladorId: string,
  fecha:       string,
  horaInicio:  string,
  horaFin:     string,
  excluirId?:  string,
): Promise<boolean> {
  const reservas = await prisma.reserva.findMany({
    where: {
      simuladorId,
      fecha:  new Date(fecha),
      estado: { in: ['PENDIENTE','CONFIRMADA','EN_CURSO'] },
      id:     excluirId ? { not: excluirId } : undefined,
    },
  });

  // Convertir HH:MM a minutos para comparar
  const toMin = (h: string) => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm;
  };

  const ini = toMin(horaInicio);
  const fin = toMin(horaFin);

  return reservas.some(r => {
    const rIni = toMin(r.horaInicio);
    const rFin = toMin(r.horaFin);
    return ini < rFin && fin > rIni; // Solapamiento
  });
}

export async function listarReservas(req: Request, res: Response, next: NextFunction) {
  try {
    const { desde, hasta, simuladorId, pilotoId, estado } = req.query;

    const where: any = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde as string);
      if (hasta) where.fecha.lte = new Date(hasta as string);
    }
    if (simuladorId) where.simuladorId = simuladorId;
    if (pilotoId)    where.pilotoId    = pilotoId;
    if (estado)      where.estado      = estado;

    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
      include: {
        simulador:  { select: { nombre: true, aeronave: true } },
        piloto:     { select: { nombre: true, apellido: true, licencia: true } },
        instructor: { select: { nombre: true, apellido: true } },
        _count:     { select: { sesiones: true } },
      },
    });

    res.json(reservas);
  } catch (err) { next(err); }
}

// Vista semanal — usada por el dashboard de reservas
export async function semanaActual(req: Request, res: Response, next: NextFunction) {
  try {
    const offsetDias  = parseInt(req.query.offset as string ?? '0');
    const baseDate    = addDays(new Date(), offsetDias * 7);
    const inicio      = startOfWeek(baseDate, { weekStartsOn: 1 }); // Lunes
    const fin         = endOfWeek(baseDate,   { weekStartsOn: 1 }); // Domingo

    const [reservas, simuladores] = await Promise.all([
      prisma.reserva.findMany({
        where:   { fecha: { gte: inicio, lte: fin } },
        orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
        include: {
          simulador:  { select: { id: true, nombre: true, aeronave: true } },
          piloto:     { select: { nombre: true, apellido: true } },
          instructor: { select: { nombre: true, apellido: true } },
        },
      }),
      prisma.simulador.findMany({ select: { id: true, nombre: true, aeronave: true } }),
    ]);

    // Organizar por día y simulador
    const dias = Array.from({ length: 7 }, (_, i) => {
      const dia = addDays(inicio, i);
      return {
        fecha:    format(dia, 'yyyy-MM-dd'),
        etiqueta: format(dia, 'EEEE dd/MM', { locale: { code: 'es' } as any }),
        reservas: reservas.filter(
          r => format(new Date(r.fecha), 'yyyy-MM-dd') === format(dia, 'yyyy-MM-dd'),
        ),
      };
    });

    res.json({
      semana: {
        inicio: format(inicio, 'yyyy-MM-dd'),
        fin:    format(fin,    'yyyy-MM-dd'),
      },
      simuladores,
      dias,
    });
  } catch (err) { next(err); }
}

export async function obtenerReserva(req: Request, res: Response, next: NextFunction) {
  try {
    const r = await prisma.reserva.findUniqueOrThrow({
      where:   { id: req.params.id },
      include: {
        simulador:  true,
        piloto:     true,
        instructor: true,
        sesiones:   { select: { id: true, estado: true, horaInicio: true, horaFin: true } },
      },
    });
    res.json(r);
  } catch (err) { next(err); }
}

export async function crearReserva(req: Request, res: Response, next: NextFunction) {
  try {
    const data = reservaSchema.parse(req.body);

    // Verificar solapamiento
    const solapa = await verificarSolapamiento(
      data.simuladorId, data.fecha, data.horaInicio, data.horaFin,
    );
    if (solapa) {
      res.status(409).json({ error: 'Horario solapado con otra reserva en ese simulador' });
      return;
    }

    const reserva = await prisma.reserva.create({
      data: {
        ...data,
        fecha: new Date(data.fecha),
      },
    });
    logger.info(`Reserva creada: ${reserva.id} · ${data.fecha} ${data.horaInicio}-${data.horaFin}`);
    res.status(201).json(reserva);
  } catch (err) { next(err); }
}

export async function actualizarReserva(req: Request, res: Response, next: NextFunction) {
  try {
    const data = reservaSchema.partial().parse(req.body);

    if (data.fecha && data.horaInicio && data.horaFin && data.simuladorId) {
      const solapa = await verificarSolapamiento(
        data.simuladorId, data.fecha, data.horaInicio, data.horaFin, req.params.id,
      );
      if (solapa) {
        res.status(409).json({ error: 'Horario solapado con otra reserva en ese simulador' });
        return;
      }
    }

    const reserva = await prisma.reserva.update({
      where: { id: req.params.id },
      data: { ...data, fecha: data.fecha ? new Date(data.fecha) : undefined },
    });
    res.json(reserva);
  } catch (err) { next(err); }
}

export async function cancelarReserva(req: Request, res: Response, next: NextFunction) {
  try {
    const reserva = await prisma.reserva.update({
      where: { id: req.params.id },
      data:  { estado: 'CANCELADA' },
    });
    logger.info(`Reserva cancelada: ${req.params.id}`);
    res.json(reserva);
  } catch (err) { next(err); }
}
