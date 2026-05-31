import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { reservasApi, type Reserva } from '../services/api';

const EB: Record<string, string> = {
  PENDIENTE: 'bp', CONFIRMADA: 'bc', EN_CURSO: 'be', COMPLETADA: 'bco', CANCELADA: 'bvn',
};
const TB: Record<string, string> = {
  VUELO: 'bc', DEMO: 'bco', MANT: 'bpv', CAPACITACION: 'bp',
};

function getFechaTab(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

function isSameFecha(reserva: Reserva, d: Date) {
  const r = new Date(reserva.fecha);
  return r.getFullYear() === d.getFullYear() && r.getMonth() === d.getMonth() && r.getDate() === d.getDate();
}

export const Reservas: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [diaOffset, setDiaOffset] = useState(0);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      // Traer reservas de la semana
      const desde = new Date();
      desde.setDate(desde.getDate());
      const hasta = new Date();
      hasta.setDate(hasta.getDate() + 6);
      const res = await reservasApi.listar({
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
      });
      setReservas(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const dias = Array.from({ length: 6 }, (_, i) => getFechaTab(i));
  const diaActivo = dias[diaOffset];
  const reservasDelDia = reservas.filter(r => isSameFecha(r, diaActivo));

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Calendario de reservas</div>
          <div className="ps">Gestión de tiempos e instructores de los simuladores</div>
        </div>
        <button className="btn btnp" onClick={cargar}>+ Nueva reserva</button>
      </div>

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px 16px', color: '#A32D2D', fontSize: '12px', marginBottom: '12px' }}>
          {error} <button className="btn" style={{ marginLeft: '12px' }} onClick={cargar}>Reintentar</button>
        </div>
      )}

      <Card>
        {/* Tabs de días */}
        <div className="wtabs">
          {dias.map((d, i) => (
            <div
              key={i}
              className={`wt ${i === diaOffset ? 'on' : ''}`}
              onClick={() => setDiaOffset(i)}
              style={{ cursor: 'pointer' }}
            >
              <div className="dn">{i === 0 ? 'HOY' : i === 1 ? 'MAÑANA' : d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase()}</div>
              <div className="dd">{d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gy)', fontSize: '13px' }}>Cargando reservas...</div>
        ) : (
          <div className="table-responsive">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Fin</th>
                  <th>Sim.</th>
                  <th>Tipo</th>
                  <th>Piloto</th>
                  <th>Instructor</th>
                  <th>Tema</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservasDelDia.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--gy)', padding: '30px', fontStyle: 'italic' }}>
                      Sin reservas para este día
                    </td>
                  </tr>
                ) : reservasDelDia
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.horaInicio}</td>
                    <td style={{ color: 'var(--gy)' }}>{r.horaFin}</td>
                    <td><b>{r.simulador.aeronave}</b></td>
                    <td><Badge variant={TB[r.tipo] as any}>{r.tipo}</Badge></td>
                    <td>
                      {r.piloto
                        ? `${r.piloto.nombre} ${r.piloto.apellido}`
                        : <span style={{ color: 'var(--gy)', fontStyle: 'italic' }}>Sin asignar</span>}
                    </td>
                    <td>{r.instructor ? `${r.instructor.nombre} ${r.instructor.apellido}` : '—'}</td>
                    <td style={{ color: 'var(--text-m)', fontSize: '11px' }}>{r.tema ?? '—'}</td>
                    <td><Badge variant={EB[r.estado] as any}>{r.estado.replace('_', ' ')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--gy)', textAlign: 'right' }}>
        * Las sesiones EN CURSO bloquean temporalmente el puerto 49001 UDP.
      </div>
    </div>
  );
};
