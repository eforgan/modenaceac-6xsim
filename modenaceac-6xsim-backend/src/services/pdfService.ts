// src/services/pdfService.ts
// Genera reportes PDF oficiales con Puppeteer
// Cumple formato ANAC RAA 61.57 / 135.293

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logger } from '../utils/logger';

const PDF_DIR = path.resolve(process.env.PDF_OUTPUT_DIR ?? './pdfs');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

const RESULTADOS: Record<string, string> = {
  AS: 'Apenas Satisface',
  S:  'Satisface',
  SB: 'Satisface Bien',
  NA: 'No Aplica',
};

const COLORES_RESULTADO: Record<string, string> = {
  AS: '#795520',
  S:  '#185FA5',
  SB: '#27500A',
  NA: '#5F5E5A',
};

const BG_RESULTADO: Record<string, string> = {
  AS: '#FAEEDA',
  S:  '#E6F1FB',
  SB: '#EAF3DE',
  NA: '#F1EFE8',
};

type SesionCompleta = {
  id:             string;
  fecha:          Date;
  horaLocal:      string;
  horaInicio:     Date;
  horaFin:        Date | null;
  duracionSeg:    number | null;
  icao:           string;
  evaluacionGlobal: string | null;
  observaciones:  string | null;
  firmaBase64:    string | null;
  vientoDirGrados:number;
  vientoKts:      number;
  visibilidadSm:  number;
  turbulencia:    number;
  tipoNubes:      string;
  temperaturaC:   number;
  piloto:         { nombre: string; apellido: string; licencia: string };
  instructor:     { nombre: string; apellido: string };
  simulador:      { nombre: string; aeronave: string };
  evaluaciones:   { nombre: string; resultado: string; observaciones?: string | null }[];
  fallasUsadas:   { nombre: string; sistema: string; dataref: string }[];
};

class PdfService {
  private browser: puppeteer.Browser | null = null;

  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });
    }
    return this.browser;
  }

  // ── Reporte de sesión individual ────────────────────────────────────────
  async generarReporteSesion(sesion: SesionCompleta): Promise<string> {
    const browser = await this.getBrowser();
    const page    = await browser.newPage();

    try {
      const html  = this.buildReporteSesionHTML(sesion);
      const pdfPath = path.join(PDF_DIR, `sesion_${sesion.id}.pdf`);

      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path:   pdfPath,
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-family:Arial,sans-serif;font-size:8px;color:#888;
                      width:100%;text-align:center;padding-bottom:4mm">
            MODENACEAC 6XSIM — Reporte de sesión ${sesion.id.slice(0,8).toUpperCase()} —
            Página <span class="pageNumber"></span> de <span class="totalPages"></span> —
            Documento generado el ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </div>`,
      });

      await page.close();
      logger.info(`PDF generado: sesion_${sesion.id}.pdf`);
      return pdfPath;
    } catch (err) {
      await page.close();
      throw err;
    }
  }

  // ── Exportación masiva ANAC ─────────────────────────────────────────────
  async generarReporteANAC(sesiones: SesionCompleta[], params: {
    desde: string;
    hasta: string;
    aeronave?: string;
  }): Promise<string> {
    const browser = await this.getBrowser();
    const page    = await browser.newPage();

    try {
      const html    = this.buildReporteANACHTML(sesiones, params);
      const ts      = format(new Date(), 'yyyyMMdd_HHmmss');
      const pdfPath = path.join(PDF_DIR, `anac_export_${ts}.pdf`);

      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path:   pdfPath,
        format: 'A4',
        landscape: true,
        margin: { top: '12mm', right: '10mm', bottom: '15mm', left: '10mm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-family:Arial,sans-serif;font-size:8px;color:#888;
                      width:100%;text-align:center;padding-bottom:3mm">
            MODENACEAC 6XSIM — Exportación ANAC RAA 61.57 / 135.293 —
            Página <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>`,
      });

      await page.close();
      logger.info(`PDF ANAC generado: anac_export_${ts}.pdf · ${sesiones.length} sesiones`);
      return pdfPath;
    } catch (err) {
      await page.close();
      throw err;
    }
  }

  // ── HTML: Reporte de sesión ─────────────────────────────────────────────
  private buildReporteSesionHTML(s: SesionCompleta): string {
    const durMin = s.duracionSeg ? Math.round(s.duracionSeg / 60) : 0;
    const durH   = Math.floor(durMin / 60);
    const durM   = durMin % 60;
    const durStr = `${String(durH).padStart(2,'0')}:${String(durM).padStart(2,'0')} hs`;

    const fechaFmt = format(new Date(s.fecha), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es });
    const inicioFmt = s.horaInicio ? format(new Date(s.horaInicio), 'HH:mm') : '--:--';
    const finFmt    = s.horaFin    ? format(new Date(s.horaFin),    'HH:mm') : '--:--';

    const turb = ['Ninguna','Leve','Moderada','Severa'][s.turbulencia] ?? 'Ninguna';
    const evGlobal = s.evaluacionGlobal ?? 'S';

    const rowsEval = s.evaluaciones.map(e => `
      <tr>
        <td>${e.nombre}</td>
        <td style="text-align:center">
          <span style="display:inline-block;padding:2px 10px;border-radius:4px;
                font-weight:700;background:${BG_RESULTADO[e.resultado]};
                color:${COLORES_RESULTADO[e.resultado]}">
            ${e.resultado}
          </span>
        </td>
        <td>${e.observaciones ?? ''}</td>
      </tr>`).join('');

    const rowsFallas = s.fallasUsadas.map(f => `
      <tr>
        <td>${f.nombre}</td>
        <td>${f.sistema}</td>
        <td style="font-family:monospace;font-size:9px">${f.dataref}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a18; line-height: 1.4; }
  .header { display: flex; align-items: center; justify-content: space-between;
            border-bottom: 3px solid #185FA5; padding-bottom: 10px; margin-bottom: 16px; }
  .org-name { font-size: 20px; font-weight: 700; color: #185FA5; letter-spacing: .05em; }
  .org-sub  { font-size: 9px; color: #5F5E5A; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 14px; color: #1a1a18; }
  .doc-title p  { font-size: 9px; color: #5F5E5A; margin-top: 2px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 9px; font-weight: 700; color: #5F5E5A; letter-spacing: .12em;
                   text-transform: uppercase; border-bottom: 0.5px solid #D3D1C7;
                   padding-bottom: 3px; margin-bottom: 8px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .field { background: #F5F4F0; border-radius: 4px; padding: 6px 8px; }
  .field label { display: block; font-size: 8px; color: #888780; font-weight: 700;
                 text-transform: uppercase; letter-spacing: .1em; margin-bottom: 2px; }
  .field span { font-size: 11px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #185FA5; color: #fff; padding: 5px 8px; text-align: left;
       font-weight: 600; font-size: 9px; letter-spacing: .06em; }
  td { padding: 5px 8px; border-bottom: 0.5px solid #D3D1C7; }
  tr:nth-child(even) td { background: #FAFAF8; }
  .eval-global { display: inline-block; padding: 6px 20px; border-radius: 6px; font-weight: 700;
                 font-size: 16px; border: 1.5px solid; }
  .firma-box { border: 1px dashed #D3D1C7; border-radius: 6px; padding: 6px;
               min-height: 80px; display: flex; align-items: center; justify-content: center; }
  .anac-footer { margin-top: 16px; background: #E6F1FB; border: 0.5px solid #378ADD;
                 border-radius: 6px; padding: 8px 12px; font-size: 9px; color: #042C53; }
</style>
</head>
<body>

<!-- ENCABEZADO -->
<div class="header">
  <div>
    <div class="org-name">MODENACEAC</div>
    <div class="org-sub">Centro de Entrenamiento Aeronáutico</div>
    <div class="org-sub">Departamento 6XSIM — Simuladores de Vuelo</div>
  </div>
  <div class="doc-title">
    <h1>REPORTE DE SESIÓN DE SIMULADOR</h1>
    <p>N° ${s.id.slice(0,8).toUpperCase()} · Conforme RAA 61.57 / 135.293</p>
    <p>${fechaFmt}</p>
  </div>
</div>

<!-- TRIPULACIÓN Y SIMULADOR -->
<div class="section">
  <div class="section-title">Tripulación y simulador</div>
  <div class="grid3">
    <div class="field">
      <label>Piloto</label>
      <span>${s.piloto.nombre} ${s.piloto.apellido}</span>
    </div>
    <div class="field">
      <label>Licencia</label>
      <span style="font-family:monospace">${s.piloto.licencia}</span>
    </div>
    <div class="field">
      <label>Instructor</label>
      <span>${s.instructor.nombre} ${s.instructor.apellido}</span>
    </div>
    <div class="field">
      <label>Simulador</label>
      <span>${s.simulador.nombre}</span>
    </div>
    <div class="field">
      <label>Aeronave simulada</label>
      <span>${s.simulador.aeronave}</span>
    </div>
    <div class="field">
      <label>Aeródromo (ICAO)</label>
      <span>${s.icao}</span>
    </div>
  </div>
</div>

<!-- TIEMPOS -->
<div class="section">
  <div class="section-title">Tiempos de sesión</div>
  <div class="grid3">
    <div class="field">
      <label>Hora de inicio</label>
      <span>${inicioFmt}</span>
    </div>
    <div class="field">
      <label>Hora de finalización</label>
      <span>${finFmt}</span>
    </div>
    <div class="field">
      <label>Duración efectiva</label>
      <span style="font-weight:700;color:#185FA5">${durStr}</span>
    </div>
  </div>
</div>

<!-- METEOROLOGÍA -->
<div class="section">
  <div class="section-title">Condiciones meteorológicas configuradas</div>
  <div class="grid3">
    <div class="field">
      <label>Viento</label>
      <span>${s.vientoDirGrados}° / ${s.vientoKts} kts</span>
    </div>
    <div class="field">
      <label>Visibilidad</label>
      <span>${s.visibilidadSm} SM</span>
    </div>
    <div class="field">
      <label>Temperatura</label>
      <span>${s.temperaturaC}°C</span>
    </div>
    <div class="field">
      <label>Nubes</label>
      <span>${s.tipoNubes}</span>
    </div>
    <div class="field">
      <label>Turbulencia</label>
      <span>${turb}</span>
    </div>
  </div>
</div>

<!-- EVALUACIÓN DE MANIOBRAS -->
${s.evaluaciones.length > 0 ? `
<div class="section">
  <div class="section-title">Evaluación de maniobras</div>
  <table>
    <thead>
      <tr>
        <th style="width:45%">Maniobra</th>
        <th style="width:15%;text-align:center">Resultado</th>
        <th style="width:40%">Observaciones del instructor</th>
      </tr>
    </thead>
    <tbody>${rowsEval}</tbody>
  </table>
</div>` : ''}

<!-- FALLAS INYECTADAS -->
${s.fallasUsadas.length > 0 ? `
<div class="section">
  <div class="section-title">Fallas de emergencia inyectadas en simulador</div>
  <table>
    <thead>
      <tr>
        <th style="width:40%">Falla</th>
        <th style="width:20%">Sistema</th>
        <th style="width:40%">DataRef X-Plane</th>
      </tr>
    </thead>
    <tbody>${rowsFallas}</tbody>
  </table>
</div>` : ''}

<!-- EVALUACIÓN GLOBAL Y FIRMA -->
<div class="section">
  <div class="section-title">Evaluación global y firma del instructor</div>
  <div class="grid2">
    <div>
      <div style="margin-bottom:8px">
        <label style="font-size:8px;color:#888780;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Evaluación global del piloto</label>
        <div style="margin-top:6px">
          <span class="eval-global" style="background:${BG_RESULTADO[evGlobal]};color:${COLORES_RESULTADO[evGlobal]};border-color:${COLORES_RESULTADO[evGlobal]}">
            ${evGlobal} — ${RESULTADOS[evGlobal]}
          </span>
        </div>
      </div>
      ${s.observaciones ? `
      <div class="field" style="margin-top:8px">
        <label>Observaciones generales</label>
        <span>${s.observaciones}</span>
      </div>` : ''}
    </div>
    <div>
      <label style="font-size:8px;color:#888780;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Firma digital del instructor</label>
      <div class="firma-box" style="margin-top:6px">
        ${s.firmaBase64
          ? `<img src="${s.firmaBase64}" style="max-height:70px;max-width:100%">`
          : '<span style="color:#D3D1C7;font-size:10px">Sin firma registrada</span>'
        }
      </div>
      <div style="font-size:9px;color:#5F5E5A;margin-top:4px;text-align:right">
        ${s.instructor.nombre} ${s.instructor.apellido}
      </div>
    </div>
  </div>
</div>

<!-- PIE ANAC -->
<div class="anac-footer">
  <strong>Cumplimiento ANAC:</strong> Este reporte certifica la realización de una sesión de entrenamiento en simulador
  de vuelo conforme a los requisitos de los Reglamentos de Aviación Argentina (RAA) 61.57 y 135.293.
  La firma digital del instructor certifica la autenticidad de los datos registrados.
  Organismo: ${process.env.ANAC_ORG_NOMBRE ?? 'MODENACEAC'} ·
  Certificado: ${process.env.ANAC_CERT_NUMERO ?? 'CERT-SIM-2024-001'} ·
  ID sesión: ${s.id}
</div>

</body>
</html>`;
  }

  // ── HTML: Exportación masiva ANAC ──────────────────────────────────────
  private buildReporteANACHTML(sesiones: SesionCompleta[], params: {
    desde: string; hasta: string; aeronave?: string;
  }): string {
    const rows = sesiones.map((s, i) => {
      const durMin = s.duracionSeg ? Math.round(s.duracionSeg / 60) : 0;
      const ev = s.evaluacionGlobal ?? '—';
      return `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${format(new Date(s.fecha), 'dd/MM/yyyy')}</td>
        <td>${s.piloto.nombre} ${s.piloto.apellido}</td>
        <td style="font-family:monospace">${s.piloto.licencia}</td>
        <td>${s.simulador.aeronave}</td>
        <td>${s.icao}</td>
        <td style="text-align:center">${Math.floor(durMin/60)}h ${durMin%60}m</td>
        <td style="text-align:center">
          <span style="padding:2px 8px;border-radius:3px;font-weight:700;font-size:9px;
                background:${BG_RESULTADO[ev]??'#F1EFE8'};color:${COLORES_RESULTADO[ev]??'#444'}">
            ${ev}
          </span>
        </td>
        <td>${s.instructor.nombre} ${s.instructor.apellido}</td>
        <td style="text-align:center">${s.firmaBase64 ? '✓' : '—'}</td>
        <td style="font-family:monospace;font-size:8px">${s.id.slice(0,8).toUpperCase()}</td>
      </tr>`;
    }).join('');

    const totalMinutos = sesiones.reduce((a, s) => a + (s.duracionSeg ? Math.round(s.duracionSeg/60) : 0), 0);
    const totalH = Math.floor(totalMinutos / 60);
    const totalM = totalMinutos % 60;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #1a1a18; }
  .header { display: flex; align-items: center; justify-content: space-between;
            border-bottom: 3px solid #185FA5; padding-bottom: 8px; margin-bottom: 12px; }
  .org-name { font-size: 16px; font-weight: 700; color: #185FA5; }
  .org-sub  { font-size: 8px; color: #5F5E5A; margin-top: 1px; }
  .kpis { display: grid; grid-template-columns: repeat(5,1fr); gap: 6px; margin-bottom: 10px; }
  .kpi { background: #F5F4F0; border-radius: 4px; padding: 6px 8px; text-align: center; }
  .kpi .val { font-size: 14px; font-weight: 700; color: #185FA5; }
  .kpi .lbl { font-size: 7px; color: #888780; margin-top: 1px; text-transform: uppercase; letter-spacing:.08em; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #185FA5; color: #fff; padding: 4px 6px; text-align: left; font-size: 8px;
       font-weight: 600; letter-spacing: .06em; }
  td { padding: 4px 6px; border-bottom: 0.5px solid #D3D1C7; font-size: 8.5px; }
  tr:nth-child(even) td { background: #FAFAF8; }
  .anac-footer { margin-top: 10px; background: #E6F1FB; border: 0.5px solid #378ADD;
                 border-radius: 4px; padding: 6px 10px; font-size: 8px; color: #042C53; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="org-name">MODENACEAC</div>
    <div class="org-sub">Departamento 6XSIM — Simuladores de Vuelo</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:12px;font-weight:700">REGISTRO DE SESIONES — ANAC</div>
    <div style="font-size:8px;color:#5F5E5A">RAA 61.57 / 135.293</div>
    <div style="font-size:8px;color:#5F5E5A">
      Período: ${params.desde} al ${params.hasta}
      ${params.aeronave ? ` · Aeronave: ${params.aeronave}` : ''}
    </div>
  </div>
</div>

<div class="kpis">
  <div class="kpi"><div class="val">${sesiones.length}</div><div class="lbl">Sesiones totales</div></div>
  <div class="kpi"><div class="val">${totalH}h ${totalM}m</div><div class="lbl">Horas totales</div></div>
  <div class="kpi"><div class="val">${sesiones.filter(s=>s.simulador.aeronave==='AW109').length}</div><div class="lbl">Sesiones AW109E</div></div>
  <div class="kpi"><div class="val">${sesiones.filter(s=>s.simulador.aeronave==='R44').length}</div><div class="lbl">Sesiones R44 II</div></div>
  <div class="kpi"><div class="val">${sesiones.filter(s=>s.firmaBase64).length}</div><div class="lbl">Con firma digital</div></div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:3%;text-align:center">#</th>
      <th style="width:8%">Fecha</th>
      <th style="width:14%">Piloto</th>
      <th style="width:10%">Licencia</th>
      <th style="width:6%">Sim.</th>
      <th style="width:5%">ICAO</th>
      <th style="width:7%;text-align:center">Duración</th>
      <th style="width:7%;text-align:center">Eval.</th>
      <th style="width:14%">Instructor</th>
      <th style="width:5%;text-align:center">Firma</th>
      <th style="width:8%;text-align:center">ID Sesión</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="anac-footer">
  <strong>Certificación ANAC:</strong> El presente registro certifica las sesiones de entrenamiento en simulador realizadas
  en el período indicado, conforme a los Reglamentos de Aviación Argentina RAA 61.57 y 135.293.
  Organismo: ${process.env.ANAC_ORG_NOMBRE ?? 'MODENACEAC'} ·
  CUIT: ${process.env.ANAC_ORG_CUIT ?? '—'} ·
  Certificado: ${process.env.ANAC_CERT_NUMERO ?? 'CERT-SIM-2024-001'} ·
  Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
</div>
</body>
</html>`;
  }

  async destroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfService = new PdfService();
