import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { logApi, type LogEntry } from '../services/api';

const SB_COLORS: Record<string, string> = {
  INCIDENTE: 'bvn', FALLA: 'bp', ALERTA: 'bpv', INFO: 'bc',
};

const TIPO_LABELS: Record<string, string> = {
  INCIDENTE: 'INCIDENTE', FALLA: 'FALLA', ALERTA: 'ALERTA', INFO: 'INFO',
};

export const LogTecnico: React.FC = () => {
  const [logs, setLogs]         = useState<LogEntry[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'INCIDENTE', descripcion: '', operador: '' });
  const [saving, setSaving]     = useState(false);
  const [resolviendo, setResolviendo] = useState<string | null>(null);

  const cargar = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await logApi.listar({ page: p });
      setLogs(res.data);
      setTotal(res.meta.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [page]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await logApi.crear(form);
      setShowForm(false);
      setForm({ tipo: 'INCIDENTE', descripcion: '', operador: '' });
      cargar(1);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResolver = async (id: string) => {
    const resolucion = prompt('Descripción de la resolución:');
    if (!resolucion) return;
    setResolviendo(id);
    try {
      await logApi.resolver(id, resolucion);
      cargar();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setResolviendo(null);
    }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Bitácora técnica de fallas</div>
          <div className="ps">Departamento de mantenimiento SIM · {total} registros</div>
        </div>
        <button className="btn btnw" onClick={() => setShowForm(v => !v)}>+ Reportar incidencia</button>
      </div>

      {/* Formulario nueva incidencia */}
      {showForm && (
        <Card title="Nueva incidencia">
          <form onSubmit={handleCrear} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 120px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)' }}
              >
                {['INCIDENTE','FALLA','ALERTA','INFO'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: '2 1 300px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Descripción</label>
              <input
                required
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción del incidente..."
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Operador</label>
              <input
                required
                value={form.operador}
                onChange={e => setForm(f => ({ ...f, operador: e.target.value }))}
                placeholder="Nombre del operador"
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" className="btn btnw" disabled={saving} style={{ padding: '8px 20px' }}>
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)} style={{ padding: '8px 16px' }}>Cancelar</button>
          </form>
        </Card>
      )}

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px 16px', color: '#A32D2D', fontSize: '12px', marginBottom: '12px' }}>
          {error} <button className="btn" style={{ marginLeft: '12px' }} onClick={() => cargar()}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gy)', fontSize: '13px' }}>Cargando bitácora...</div>
      ) : logs.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gy)', fontStyle: 'italic' }}>Sin incidencias registradas</div>
        </Card>
      ) : logs.map(L => (
        <Card key={L.id}>
          <div className="sh">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Badge variant={SB_COLORS[L.tipo] as any}>{TIPO_LABELS[L.tipo]}</Badge>
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{L.descripcion}</div>
                <div style={{ fontSize: '10px', color: 'var(--gy)', marginTop: '2px' }}>
                  {L.operador} · {new Date(L.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {L.resueltoEn
                ? <Badge variant="bo">RESUELTO</Badge>
                : <Badge variant="bpv">PENDIENTE</Badge>}
            </div>
          </div>

          {L.resolucion && (
            <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#173404', marginTop: '8px' }}>
              <b>Resolución:</b> {L.resolucion}
              {L.resueltoEn && <span style={{ marginLeft: '8px', color: 'var(--gy)' }}>({new Date(L.resueltoEn).toLocaleDateString('es-AR')})</span>}
            </div>
          )}

          {!L.resueltoEn && (
            <div className="bh" style={{ marginTop: '8px' }}>
              <span />
              <button
                className="btn"
                style={{ padding: '4px 12px', fontSize: '10px' }}
                onClick={() => handleResolver(L.id)}
                disabled={resolviendo === L.id}
              >
                {resolviendo === L.id ? 'Guardando...' : 'Marcar como resuelto'}
              </button>
            </div>
          )}
        </Card>
      ))}

      {total > 30 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button className="btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span style={{ fontSize: '12px', color: 'var(--gy)', alignSelf: 'center' }}>Pág. {page} · {total} total</span>
          <button className="btn" disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}
    </div>
  );
};
