import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { anacApi } from '../services/api';

interface Estadisticas {
  totalSesiones: number;
  totalExportadas: number;
  pendientesExportar: number;
  sesionesConFirma: number;
  sesionsSinFirma: number;
  totalHoras: number;
  promedioMinPorSesion: number;
}

interface SesionAnac {
  id: string;
  fecha: string;
  piloto: string;
  licencia: string;
  aeronave: string;
  icao: string;
  duracionMin: number;
  evaluacionGlobal: string | null;
  instructor: string;
  firmaOk: boolean;
  exportadoAnac: boolean;
  nEvaluaciones: number;
  nFallas: number;
}

const RC: Record<string, { bg: string; c: string }> = {
  AS: { bg: '#EAF3DE', c: '#173404' }, S: { bg: '#E6F1FB', c: '#042C53' },
  SB: { bg: '#FAEEDA', c: '#412402' }, NA: { bg: '#F1EFE8', c: '#2C2C2A' },
};

export const ExportAnac: React.FC = () => {
  const hoy = new Date().toISOString().split('T')[0];
  const mesAnterior = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [desde, setDesde]         = useState(mesAnterior);
  const [hasta, setHasta]         = useState(hoy);
  const [aeronave, setAeronave]   = useState('');
  const [formato, setFormato]     = useState<'PDF' | 'CSV' | 'AMBOS'>('PDF');
  const [estadisticas, setEst]    = useState<Estadisticas | null>(null);
  const [sesiones, setSesiones]   = useState<SesionAnac[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [resultado, setResultado] = useState<{ pdfUrl?: string; csvUrl?: string; total: number } | null>(null);

  const cargarEst = async () => {
    setLoading(true);
    setError(null);
    try {
      const [est, ses] = await Promise.all([
        anacApi.estadisticas({ desde, hasta }),
        anacApi.sesionesParaExportar({ desde, hasta, aeronave: aeronave || undefined }),
      ]);
      setEst(est);
      setSesiones(ses.sesiones);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEst(); }, []);

  const handleExportar = async () => {
    setExportando(true);
    setResultado(null);
    try {
      const res = await anacApi.exportar({
        desde, hasta, formato,
        aeronave: aeronave || undefined,
      });
      setResultado(res);
      cargarEst(); // Actualizar estadísticas post-exportación
    } catch (e: any) {
      alert('Error al exportar: ' + e.message);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Exportación ANAC</div>
          <div className="ps">Registros de instrucción para la autoridad regulatoria</div>
        </div>
      </div>

      {/* Estadísticas globales */}
      {estadisticas && (
        <div className="g4" style={{ marginBottom: '16px' }}>
          <div className="kpi">
            <div className="kv">{estadisticas.totalSesiones}</div>
            <div className="kl">Sesiones completadas</div>
            <div className="kt" style={{ color: 'var(--gy)' }}>{estadisticas.totalHoras}h totales</div>
          </div>
          <div className="kpi">
            <div className="kv" style={{ color: estadisticas.sesionsSinFirma > 0 ? '#EF9F27' : '#27500A' }}>
              {estadisticas.sesionesConFirma}
            </div>
            <div className="kl">Con firma digital</div>
            <div className="kt" style={{ color: estadisticas.sesionsSinFirma > 0 ? '#EF9F27' : 'var(--gy)' }}>
              {estadisticas.sesionsSinFirma} sin firma
            </div>
          </div>
          <div className="kpi">
            <div className="kv" style={{ color: '#27500A' }}>{estadisticas.totalExportadas}</div>
            <div className="kl">Ya exportadas a ANAC</div>
            <div className="kt" style={{ color: 'var(--gy)' }}>~{estadisticas.promedioMinPorSesion} min promedio</div>
          </div>
          <div className="kpi">
            <div className="kv" style={{ color: estadisticas.pendientesExportar > 0 ? '#A32D2D' : '#27500A' }}>
              {estadisticas.pendientesExportar}
            </div>
            <div className="kl">Pendientes de exportar</div>
            <div className="kt" style={{ color: estadisticas.pendientesExportar > 0 ? '#A32D2D' : 'var(--gy)' }}>
              {estadisticas.pendientesExportar > 0 ? 'Requieren exportación' : 'Todo exportado'}
            </div>
          </div>
        </div>
      )}

      {/* Filtros y exportación */}
      <Card title="Generar exportación">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end', marginBottom: '16px' }}>
          {[
            { label: 'Desde', type: 'date', value: desde, onChange: setDesde },
            { label: 'Hasta', type: 'date', value: hasta, onChange: setHasta },
          ].map(({ label, type, value, onChange }) => (
            <div key={label} style={{ flex: '0 0 150px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</label>
              <input
                type={type} value={value}
                onChange={e => onChange(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div style={{ flex: '0 0 120px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Aeronave</label>
            <select
              value={aeronave}
              onChange={e => setAeronave(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)' }}
            >
              <option value="">Todas</option>
              <option value="AW109">AW109</option>
              <option value="R44">R44</option>
            </select>
          </div>

          <div style={{ flex: '0 0 120px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Formato</label>
            <select
              value={formato}
              onChange={e => setFormato(e.target.value as any)}
              style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)' }}
            >
              <option value="PDF">PDF</option>
              <option value="CSV">CSV</option>
              <option value="AMBOS">PDF + CSV</option>
            </select>
          </div>

          <button className="btn" onClick={cargarEst} style={{ padding: '8px 16px' }}>Buscar</button>
          <button
            className="btn btnp"
            onClick={handleExportar}
            disabled={exportando || sesiones.length === 0}
            style={{ padding: '8px 20px' }}
          >
            {exportando ? 'Generando...' : `Exportar ${sesiones.length} sesiones`}
          </button>
        </div>

        {/* Resultado de exportación */}
        {resultado && (
          <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, color: '#173404', marginBottom: '8px' }}>
              Exportación completada: {resultado.total} sesiones
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {resultado.pdfUrl && (
                <a href={`http://localhost:3000${resultado.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="btn btnp" style={{ textDecoration: 'none', padding: '6px 16px', fontSize: '11px' }}>
                  Descargar PDF
                </a>
              )}
              {resultado.csvUrl && (
                <a href={`http://localhost:3000${resultado.csvUrl}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ textDecoration: 'none', padding: '6px 16px', fontSize: '11px' }}>
                  Descargar CSV
                </a>
              )}
            </div>
          </div>
        )}
      </Card>

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px 16px', color: '#A32D2D', fontSize: '12px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* Lista de sesiones */}
      <Card title={`Sesiones con firma disponibles para exportar (${sesiones.length})`}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gy)', fontSize: '13px' }}>Cargando...</div>
        ) : sesiones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gy)', fontStyle: 'italic' }}>
            Sin sesiones firmadas en el período seleccionado
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Piloto</th>
                <th>Licencia</th>
                <th>Aeronave</th>
                <th>ICAO</th>
                <th>Duración</th>
                <th>Eval.</th>
                <th>Instructor</th>
                <th>Firma</th>
                <th>Exportado</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.fecha}</td>
                  <td>{s.piloto}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--gy)' }}>{s.licencia}</td>
                  <td><Badge variant="bv">{s.aeronave}</Badge></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{s.icao}</td>
                  <td style={{ textAlign: 'center' }}>{s.duracionMin} min</td>
                  <td>
                    {s.evaluacionGlobal
                      ? <span style={{ fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: RC[s.evaluacionGlobal]?.bg, color: RC[s.evaluacionGlobal]?.c }}>{s.evaluacionGlobal}</span>
                      : <span style={{ color: 'var(--gy)', fontSize: '10px' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '11px' }}>{s.instructor}</td>
                  <td style={{ textAlign: 'center' }}>{s.firmaOk ? '✓' : '✗'}</td>
                  <td>{s.exportadoAnac ? <Badge variant="bo">Exportado</Badge> : <Badge variant="bp">Pendiente</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
