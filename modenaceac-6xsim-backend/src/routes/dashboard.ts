// src/routes/dashboard.ts
import { Router } from 'express';
import { addDays, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const hoy     = new Date();
    const mañana  = addDays(hoy, 1);
    const inicioMes = startOfMonth(hoy);

    const [
      sesionesHoy,
      sesionesEnCurso,
      reservasHoy,
      reservasMañana,
      totalPilotos,
      pilotosPsicofisicoAlerta,
      tareasVencidas,
      tareasProximas,
      sesionsMes,
      logsNoResueltos,
      simuladores,
    ] = await Promise.all([
      // Sesiones de hoy
      prisma.sesion.count({
        where: { fecha: { gte: startOfDay(hoy), lte: endOfDay(hoy) } },
      }),
      // Sesiones en curso ahora
      prisma.sesion.count({ where: { estado: 'EN_CURSO' } }),
      // Reservas de hoy
      prisma.reserva.count({
        where: {
          fecha:  { gte: startOfDay(hoy), lte: endOfDay(hoy) },
          estado: { in: ['PENDIENTE','CONFIRMADA','EN_CURSO'] },
        },
      }),
      // Reservas de mañana
      prisma.reserva.count({
        where: {
          fecha:  { gte: startOfDay(mañana), lte: endOfDay(mañana) },
          estado: { in: ['PENDIENTE','CONFIRMADA'] },
        },
      }),
      // Total pilotos activos
      prisma.piloto.count({ where: { activo: true } }),
      // Pilotos con psicofísico vencido o por vencer (30 días)
      prisma.piloto.count({
        where: {
          activo:         true,
          psicofisicoVto: { lte: addDays(hoy, 30) },
        },
      }),
      // Tareas de mantenimiento vencidas
      prisma.tareaMantenimiento.count({
        where: {
          estado:       { in: ['PENDIENTE','EN_PROGRESO'] },
          proximaFecha: { lt: hoy },
        },
      }),
      // Tareas próximas a vencer (7 días)
      prisma.tareaMantenimiento.count({
        where: {
          estado:       { in: ['PENDIENTE','EN_PROGRESO'] },
          proximaFecha: { gte: hoy, lte: addDays(hoy, 7) },
        },
      }),
      // Estadísticas del mes actual
      prisma.sesion.aggregate({
        where: {
          fecha:  { gte: inicioMes },
          estado: 'COMPLETADA',
        },
        _count: { _all: true },
        _sum:   { duracionSeg: true },
        _avg:   { duracionSeg: true },
      }),
      // Logs técnicos sin resolver
      prisma.logTecnico.count({ where: { resueltoEn: null } }),
      // Estado simuladores
      prisma.simulador.findMany({
        select: { id: true, nombre: true, aeronave: true, operativo: true },
      }),
    ]);

    // Próximas reservas del día (detalladas)
    const proximasReservas = await prisma.reserva.findMany({
      where: {
        fecha:  { gte: startOfDay(hoy), lte: endOfDay(hoy) },
        estado: { in: ['PENDIENTE','CONFIRMADA','EN_CURSO'] },
      },
      orderBy: { horaInicio: 'asc' },
      include: {
        simulador:  { select: { nombre: true, aeronave: true } },
        piloto:     { select: { nombre: true, apellido: true } },
        instructor: { select: { nombre: true, apellido: true } },
      },
    });

    const horasMes = sesionsMes._sum.duracionSeg
      ? Math.round(sesionsMes._sum.duracionSeg / 3600 * 10) / 10
      : 0;

    res.json({
      kpis: {
        sesionesHoy,
        sesionesEnCurso,
        reservasHoy,
        reservasMañana,
        totalPilotos,
        pilotosPsicofisicoAlerta,
        tareasVencidas,
        tareasProximas,
        sesionsMes:  sesionsMes._count._all,
        horasMes,
        promedioMinSesion: sesionsMes._avg.duracionSeg
          ? Math.round(sesionsMes._avg.duracionSeg / 60)
          : 0,
        logsNoResueltos,
      },
      simuladores: simuladores.map(s => ({
        ...s,
        enSesion: sesionesEnCurso > 0,
      })),
      proximasReservas,
      alertas: [
        ...(tareasVencidas > 0
          ? [{ tipo:'MANT', nivel:'CRITICA', msg:`${tareasVencidas} tarea(s) de mantenimiento vencida(s)` }]
          : []),
        ...(pilotosPsicofisicoAlerta > 0
          ? [{ tipo:'PSICOFI', nivel:'ADVERTENCIA', msg:`${pilotosPsicofisicoAlerta} piloto(s) con psicofísico próximo a vencer` }]
          : []),
        ...(logsNoResueltos > 0
          ? [{ tipo:'LOG', nivel:'INFO', msg:`${logsNoResueltos} incidente(s) técnico(s) sin resolver` }]
          : []),
      ],
    });
  } catch (err) { next(err); }
});

export default router;
