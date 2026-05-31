import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { mantenimientoApi, type TareaMantenimiento } from '../services/api';

const FREC_LABEL: Record<string, string> = {
  DIARIA: 'Diaria', SEMANAL: 'Semanal', MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual', POR_HORAS: 'Por horas',
};

export const Mantenimiento: React.FC = () => {
  const [tareas, setTareas]     = useState<TareaMantenimiento[]>([]);
  const [alertas, setAlertas]   = useState<{ vencidas: number; proximas7dias: number } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descripcion: '', frecuencia: 'MENSUAL', critica: false,
  });
  const [saving, setSaving]       = useState(false);
  const [completando, setCompletando] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, a] = await Promise.all([
        mantenimientoApi.listar(),
        mantenimientoApi.alertas(),
      ]);
      setTareas(t);
      setAlertas(a);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await mantenimientoApi.crear(form);
      setShowForm(false);
      setForm({ titulo: '', descripcion: '', frecuencia: 'MENSUAL', critica: false });
      cargar();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCompletar = async (id: string) => {
    const responsable = prompt('Nombre del responsable que completó la tarea:');
    if (!responsable) return;
    const descripcion = prompt('Descripción del trabajo realizado:');
    if (!descripcion) return;
    setCompletando(id);
    try {
      await mantenimientoApi.completar(id, { responsable, descripcion });
      cargar();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setCompletando(null);
    }
  };

  const vencidas   = tareas.filter(t => t.vencida);
  const proximas   = tareas.filter(t => !t.vencida && t.diasRestantes !== null && t.diasRestantes <= 7);
  const normales   = tareas.filter(t => !t.vencida && (t.diasRestantes === null || t.diasRestantes > 7));

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Mantenimiento de simuladores</div>
          <div className="ps">Programación y seguimiento de tareas preventivas</div>
        </div>
        <button className="btn" onClick={() => setShowForm(v => !v)}>+ Nueva tarea</button>
      </div>

      {/* Alertas resumen */}
      {alertas && (alertas.vencidas > 0 || alertas.proximas7dias > 0) && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {alertas.vencidas > 0 && (
            <div style={{ flex: 1, minWidth: '200px', background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#A32D2D' }}>{alertas.vencidas}</div>
              <div style={{ fontSize: '11px', color: '#A32D2D' }}>tarea(s) VENCIDA(S)</div>
            </div>
          )}
          {alertas.proximas7dias > 0 && (
            <div style={{ flex: 1, minWidth: '200px', background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#633806' }}>{alertas.proximas7dias}</div>
              <div style={{ fontSize: '11px', color: '#633806' }}>tarea(s) próximas a vencer (7 días)</div>
            </div>
          )}
        </div>
      )}

      {/* Formulario nueva tarea */}
      {showForm && (
        <Card title="Nueva tarea de mantenimiento">
          <form onSubmit={handleCrear} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 250px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Título</label>
              <input
                required value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Verificación sistema de imagen"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: '3 1 350px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Descripción</label>
              <input
                required value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción detallada del procedimiento..."
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Frecuencia</label>
              <select
                value={form.frecuencia}
                onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)' }}
              >
                {Object.entries(FREC_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '2px' }}>
              <input type="checkbox" id="critica" checked={form.critica} onChange={e => setForm(f => ({ ...f, critica: e.target.checked }))} />
              <label htmlFor="critica" style={{ fontSize: '12px', cursor: 'pointer' }}>Crítica</label>
            </div>
            <button type="submit" className="btn btnp" disabled={saving} style={{ padding: '8px 20px' }}>
              {saving ? 'Guardando...' : 'Crear tarea'}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
          </form>
        </Card>
      )}

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px 16px', color: '#A32D2D', fontSize: '12px', marginBottom: '12px' }}>
          {error} <button className="btn" style={{ marginLeft: '12px' }} onClick={cargar}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gy)', fontSize: '13px' }}>Cargando tareas...</div>
      ) : (
        <>
          {/* Tareas vencidas */}
          {vencidas.length > 0 && (
            <Card title={`Tareas vencidas (${vencidas.length})`}>
              <TablaTareas tareas={vencidas} onCompletar={handleCompletar} completando={completando} nivel="vencida" />
            </Card>
          )}

          {/* Tareas próximas */}
          {proximas.length > 0 && (
            <Card title={`Próximas a vencer — 7 días (${proximas.length})`}>
              <TablaTareas tareas={proximas} onCompletar={handleCompletar} completando={completando} nivel="proxima" />
            </Card>
          )}

          {/* Tareas normales */}
          <Card title={`Tareas programadas (${normales.length})`}>
            {normales.length === 0
              ? <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gy)', fontStyle: 'italic' }}>Sin tareas pendientes</div>
              : <TablaTareas tareas={normales} onCompletar={handleCompletar} completando={completando} nivel="normal" />
            }
          </Card>
        </>
      )}
    </div>
  );
};

interface TablaTareasProps {
  tareas: TareaMantenimiento[];
  onCompletar: (id: string) => void;
  completando: string | null;
  nivel: 'vencida' | 'proxima' | 'normal';
}

const TablaTareas: React.FC<TablaTareasProps> = ({ tareas, onCompletar, completando, nivel }) => (
  <table className="tbl">
    <thead>
      <tr>
        <th>Tarea</th>
        <th>Simulador</th>
        <th>Frecuencia</th>
        <th>Próxima fecha</th>
        <th>Días</th>
        <th>Último responsable</th>
        <th>Prioridad</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {tareas.map(t => (
        <tr key={t.id} style={{ background: nivel === 'vencida' ? 'rgba(163,45,45,0.03)' : undefined }}>
          <td>
            <div style={{ fontWeight: 500 }}>{t.titulo}</div>
            <div style={{ fontSize: '10px', color: 'var(--gy)', marginTop: '1px' }}>{t.descripcion.slice(0, 60)}{t.descripcion.length > 60 ? '...' : ''}</div>
          </td>
          <td>{t.simulador ? <b>{t.simulador.aeronave}</b> : <span style={{ color: 'var(--gy)' }}>Global</span>}</td>
          <td><Badge variant="bv">{FREC_LABEL[t.frecuencia] ?? t.frecuencia}</Badge></td>
          <td style={{ color: nivel === 'vencida' ? '#A32D2D' : undefined, fontWeight: nivel === 'vencida' ? 600 : undefined }}>
            {t.proximaFecha ? new Date(t.proximaFecha).toLocaleDateString('es-AR') : '—'}
          </td>
          <td style={{ textAlign: 'center', color: nivel === 'vencida' ? '#A32D2D' : nivel === 'proxima' ? '#EF9F27' : 'inherit', fontWeight: 600 }}>
            {t.diasRestantes !== null ? (t.diasRestantes < 0 ? `${Math.abs(t.diasRestantes)}d atrasada` : `${t.diasRestantes}d`) : '—'}
          </td>
          <td style={{ fontSize: '11px', color: 'var(--gy)' }}>{t.ultimoResponsable ?? '—'}</td>
          <td>{t.critica ? <Badge variant="bvn">CRÍTICA</Badge> : <Badge variant="bc">Normal</Badge>}</td>
          <td>
            <button
              className="btn"
              style={{ padding: '4px 10px', fontSize: '10px' }}
              onClick={() => onCompletar(t.id)}
              disabled={completando === t.id}
            >
              {completando === t.id ? '...' : 'Completar'}
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
