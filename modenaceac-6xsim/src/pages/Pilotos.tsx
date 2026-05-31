import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { pilotosApi, type Piloto } from '../services/api';

const PB: Record<string, string> = { VIGENTE: 'bo', POR_VENCER: 'bpv', VENCIDO: 'bvn' };

function psicoEstado(vto: string | null): 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' {
  if (!vto) return 'VIGENTE';
  const dias = Math.round((new Date(vto).getTime() - Date.now()) / 86400000);
  if (dias < 0)  return 'VENCIDO';
  if (dias < 30) return 'POR_VENCER';
  return 'VIGENTE';
}

function formatVto(vto: string | null) {
  if (!vto) return '—';
  return new Date(vto).toLocaleDateString('es-AR');
}

export const Pilotos: React.FC = () => {
  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', licencia: '' });
  const [saving, setSaving]   = useState(false);

  const cargar = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await pilotosApi.listar({ page: p, limit: 20 });
      setPilotos(res.data);
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
      await pilotosApi.crear(form);
      setShowForm(false);
      setForm({ nombre: '', apellido: '', licencia: '' });
      cargar(1);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Registro de pilotos</div>
          <div className="ps">Control de habilitaciones y vencimientos psicofísicos · {total} pilotos</div>
        </div>
        <button className="btn" onClick={() => setShowForm(v => !v)}>+ Añadir piloto</button>
      </div>

      {/* Formulario nuevo piloto */}
      {showForm && (
        <Card title="Nuevo piloto">
          <form onSubmit={handleCrear} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            {[
              { label: 'Nombre', key: 'nombre', placeholder: 'Ej: Carlos' },
              { label: 'Apellido', key: 'apellido', placeholder: 'Ej: Rodríguez' },
              { label: 'Licencia', key: 'licencia', placeholder: 'Ej: PPL-H-0999' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gy)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</label>
                <input
                  required
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '0.5px solid var(--gyb)', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <button type="submit" className="btn btnp" disabled={saving} style={{ padding: '8px 20px' }}>
              {saving ? 'Guardando...' : 'Guardar'}
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

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gy)', fontSize: '13px' }}>Cargando pilotos...</div>
        ) : (
          <div className="table-responsive">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Piloto</th>
                  <th>Licencia</th>
                  <th>Habilitaciones</th>
                  <th>Psicofísico</th>
                  <th>Vencimiento</th>
                  <th>Total hs.</th>
                  <th>Sesiones</th>
                </tr>
              </thead>
              <tbody>
                {pilotos.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gy)', padding: '30px' }}>Sin pilotos registrados</td></tr>
                ) : pilotos.map(p => {
                  const psico = psicoEstado(p.psicofisicoVto);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nombre} {p.apellido}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--gy)', fontSize: '11px' }}>{p.licencia}</td>
                      <td>
                        <div className="tagr">
                          {(p.habilitaciones ?? []).map(h => <Badge key={h} variant="bv">{h}</Badge>)}
                        </div>
                      </td>
                      <td><Badge variant={PB[psico] as any}>{psico.replace('_', ' ')}</Badge></td>
                      <td style={{ color: psico === 'VENCIDO' ? '#A32D2D' : 'inherit', fontWeight: psico === 'VENCIDO' ? 600 : 400 }}>
                        {formatVto(p.psicofisicoVto)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{Math.round(p.totalHoras * 10) / 10}h</td>
                      <td style={{ textAlign: 'center' }}>{p.totalSesiones}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button className="btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <span style={{ fontSize: '12px', color: 'var(--gy)', alignSelf: 'center' }}>Pág. {page} · {total} total</span>
            <button className="btn" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
          </div>
        )}
      </Card>
    </div>
  );
};
