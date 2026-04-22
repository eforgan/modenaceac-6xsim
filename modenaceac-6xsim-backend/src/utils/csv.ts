// src/utils/csv.ts
// Genera archivos CSV para exportación ANAC

import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PDF_DIR = path.resolve(process.env.PDF_OUTPUT_DIR ?? './pdfs');

type SesionRow = {
  id:              string;
  fecha:           Date;
  piloto:          { nombre: string; apellido: string; licencia: string };
  instructor:      { nombre: string; apellido: string };
  simulador:       { nombre: string; aeronave: string };
  icao:            string;
  duracionSeg:     number | null;
  evaluacionGlobal:string | null;
  firmaBase64:     string | null;
  evaluaciones:    { nombre: string; resultado: string }[];
  fallasUsadas:    { nombre: string; sistema: string }[];
};

function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function stringify(
  sesiones: SesionRow[],
  params: { desde: string; hasta: string },
): Promise<string> {
  const ts      = format(new Date(), 'yyyyMMdd_HHmmss');
  const outPath = path.join(PDF_DIR, `anac_export_${ts}.csv`);

  const headers = [
    'ID_Sesion',
    'Fecha',
    'Piloto',
    'Licencia',
    'Instructor',
    'Aeronave',
    'ICAO',
    'Duracion_Min',
    'Evaluacion_Global',
    'Con_Firma',
    'N_Maniobras_Evaluadas',
    'N_Fallas_Usadas',
    'Maniobras_Detalle',
    'Fallas_Detalle',
  ];

  const rows = sesiones.map(s => {
    const durMin = s.duracionSeg ? Math.round(s.duracionSeg / 60) : 0;
    const maniobrasDetalle = s.evaluaciones
      .map(e => `${e.nombre}:${e.resultado}`)
      .join(' | ');
    const fallasDetalle = s.fallasUsadas
      .map(f => `${f.sistema}/${f.nombre}`)
      .join(' | ');

    return [
      s.id,
      format(new Date(s.fecha), 'dd/MM/yyyy'),
      `${s.piloto.nombre} ${s.piloto.apellido}`,
      s.piloto.licencia,
      `${s.instructor.nombre} ${s.instructor.apellido}`,
      s.simulador.aeronave,
      s.icao,
      durMin,
      s.evaluacionGlobal ?? '',
      s.firmaBase64 ? 'SI' : 'NO',
      s.evaluaciones.length,
      s.fallasUsadas.length,
      maniobrasDetalle,
      fallasDetalle,
    ].map(escapeCsv).join(',');
  });

  const bom  = '\uFEFF'; // BOM para que Excel abra UTF-8 correctamente
  const csv  = bom + [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(outPath, csv, 'utf8');

  return outPath;
}
