// src/controllers/anacController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { format } from 'date-fns';
import { prisma } from '../utils/prisma';
import { pdfService } from '../services/pdfService';
import { logger } from '../utils/logger';
import { stringify as csvStringify } from '../utils/csv';

const exportSchema = z.object({
  desde:    z.string(),
  hasta:    z.string(),
  aeronave: z.enum(['AW109','R44']).optional(),
  formato:  z.enum(['PDF','CSV','AMBOS']).default('PDF'),
});

// ── Sesiones listas para exportar ─────────────────────────────────────────
export async function sesionesParaExportar(req: Request, res: Response, next: NextFunction) {
  try {
    const { desde, hasta, aeronave } = req.query;

    const where: any = {
      estado: 'COMPLETADA',
      firmaBase64: { not: null },
    };

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde as string);
      if (hasta) where.fecha.lte = new Date(hasta as string);
    }

    if (aeronave) {
      where.simulador = { aeronave };
    }

    const sesiones = await prisma.sesion.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: {
        piloto:     { select: { nombre: true, apellido: true, licencia: true } },
        instructor: { select: { nombre: true, apellido: true } },
        simulador:  { select: { nombre: true, aeronave: true } },
        _count:     { select: { evaluaciones: true, fallasUsadas: true } },
      },
    });

    res.json({
      total:    sesiones.length,
      sesiones: sesiones.map(s => ({
        id:               s.id,
        fecha:            format(new Date(s.fecha), 'dd/MM/yyyy'),
        piloto:           `${s.piloto.nombre} ${s.piloto.apellido}`,
        licencia:         s.piloto.licencia,
        aeronave:         s.simulador.aeronave,
        icao:             s.icao,
        duracionMin:      s.duracionSeg ? Math.round(s.duracionSeg / 60) : 0,
        evaluacionGlobal: s.evaluacionGlobal,
        instructor:       `${s.instructor.nombre} ${s.instructor.apellido}`,
        firmaOk:          !!s.firmaBase64,
        exportadoAnac:    s.exportadoAnac,
        nEvaluaciones:    s._count.evaluaciones,
        nFallas:          s._count.fallasUsadas,
      })),
    });
  } catch (err) { next(err); }
}

// ── Estadísticas ANAC ──────────────────────────────────────────────────────
export async function estadisticasANAC(req: Request, res: Response, next: NextFunction) {
  try {
    const { desde, hasta } = req.query;
    const where: any = { estado: 'COMPLETADA' };
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde as string);
      if (hasta) where.fecha.lte = new Date(hasta as string);
    }

    const [
      totalSesiones,
      totalExportadas,
      sesionesConFirma,
      porAeronave,
      porMes,
      duracionPromedio,
    ] = await Promise.all([
      prisma.sesion.count({ where }),
      prisma.sesion.count({ where: { ...where, exportadoAnac: true } }),
      prisma.sesion.count({ where: { ...where, firmaBase64: { not: null } } }),
      prisma.sesion.groupBy({
        by: ['simuladorId'],
        where,
        _count: { _all: true },
        _sum: { duracionSeg: true },
      }),
      // Sesiones por mes (últimos 12 meses)
      prisma.$queryRaw`
        SELECT TO_CHAR(fecha, 'YYYY-MM') as mes,
               COUNT(*) as total,
               SUM(duracion_seg) / 3600.0 as horas
        FROM sesiones
        WHERE estado = 'COMPLETADA'
        GROUP BY mes
        ORDER BY mes DESC
        LIMIT 12
      `,
      prisma.sesion.aggregate({
        where,
        _avg: { duracionSeg: true },
        _sum: { duracionSeg: true },
      }),
    ]);

    const totalHoras = duracionPromedio._sum.duracionSeg
      ? Math.round(duracionPromedio._sum.duracionSeg / 3600 * 10) / 10
      : 0;

    res.json({
      totalSesiones,
      totalExportadas,
      pendientesExportar: totalSesiones - totalExportadas,
      sesionesConFirma,
      sesionsSinFirma:    totalSesiones - sesionesConFirma,
      totalHoras,
      promedioMinPorSesion: duracionPromedio._avg.duracionSeg
        ? Math.round(duracionPromedio._avg.duracionSeg / 60)
        : 0,
      porMes,
    });
  } catch (err) { next(err); }
}

// ── Exportar a PDF y/o CSV ─────────────────────────────────────────────────
export async function exportarANAC(req: Request, res: Response, next: NextFunction) {
  try {
    const { desde, hasta, aeronave, formato } = exportSchema.parse(req.body);

    const where: any = {
      estado:      'COMPLETADA',
      firmaBase64: { not: null },
      fecha: {
        gte: new Date(desde),
        lte: new Date(hasta),
      },
    };
    if (aeronave) where.simulador = { aeronave };

    const sesiones = await prisma.sesion.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: {
        piloto:       true,
        instructor:   true,
        simulador:    true,
        evaluaciones: { orderBy: { createdAt: 'asc' } },
        fallasUsadas: true,
      },
    });

    if (!sesiones.length) {
      res.status(404).json({ error: 'No hay sesiones firmadas en el período seleccionado' });
      return;
    }

    const result: any = { total: sesiones.length };

    // ── Generar PDF ──────────────────────────────────────────────────────
    if (formato === 'PDF' || formato === 'AMBOS') {
      const pdfPath = await pdfService.generarReporteANAC(sesiones as any, { desde, hasta, aeronave });
      result.pdfUrl = `/pdfs/${pdfPath.split('/').pop()}`;
    }

    // ── Generar CSV ──────────────────────────────────────────────────────
    if (formato === 'CSV' || formato === 'AMBOS') {
      const csvPath = await csvStringify(sesiones as any, { desde, hasta });
      result.csvUrl = `/pdfs/${csvPath.split('/').pop()}`;
    }

    // Marcar sesiones como exportadas
    await prisma.sesion.updateMany({
      where: { id: { in: sesiones.map(s => s.id) } },
      data: {
        exportadoAnac:   true,
        exportadoAnacAt: new Date(),
      },
    });

    logger.info(`Export ANAC: ${sesiones.length} sesiones · formato ${formato}`);
    res.json(result);
  } catch (err) { next(err); }
}
