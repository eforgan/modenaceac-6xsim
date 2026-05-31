import React, { useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { dashboardApi, type DashboardData } from '../services/api';

const formatHoras = (h: number) => h >= 1 ? `${Math.round(h * 10) / 10}h` : `${Math.round(h * 60)}min`;

export const Dashboard: React.FC = () => {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    try {
      setError(null);
      const d = await dashboardApi.get();
      setData(d);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--gy)', fontSize: '13px' }}>
      Cargando dashboard...
    </div>
  );

  if (error) return (
    <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '12px', padding: '20px', color: '#A32D2D', fontSize: '13px' }}>
      <b>Error al cargar dashboard:</b> {error}
      <button className="btn" style={{ marginLeft: '16px' }} onClick={cargar}>Reintentar</button>
    </div>
  );

  const kpis = data!.kpis;
  const alertas = data!.alertas;

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Dashboard operacional</div>
          <div className="ps">MODENACEAC · 6XSIM</div>
        </div>
        <button className="btn btnp" onClick={cargar}>Actualizar</button>
      </div>

      {/* Alertas del sistema */}
      {alertas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {alertas.map((a, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px',
              background: a.nivel === 'CRITICA' ? '#FCEBEB' : a.nivel === 'ADVERTENCIA' ? '#FAEEDA' : '#E6F1FB',
              border: `0.5px solid ${a.nivel === 'CRITICA' ? '#F09595' : a.nivel === 'ADVERTENCIA' ? '#FAC775' : '#7ABAE8'}`,
              color: a.nivel === 'CRITICA' ? '#A32D2D' : a.nivel === 'ADVERTENCIA' ? '#633806' : '#0A3466',
            }}>
              <b>{a.tipo}</b> {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPIs principales */}
      <div className="g4">
        <div className="kpi">
          <div className="kv">{kpis.sesionsMes}</div>
          <div className="kl">Sesiones este mes</div>
          <div className="kt" style={{ color: 'var(--gy)' }}>{kpis.sesionesHoy} hoy · {kpis.sesionesEnCurso} en curso</div>
        </div>
        <div className="kpi">
          <div className="kv">{formatHoras(kpis.horasMes)}</div>
          <div className="kl">Horas efectivas simulador</div>
          <div className="kt" style={{ color: 'var(--gy)' }}>~{kpis.promedioMinSesion} min promedio</div>
        </div>
        <div className="kpi">
          <div className="kv">{kpis.totalPilotos}</div>
          <div className="kl">Pilotos activos</div>
          <div className="kt" style={{ color: kpis.pilotosPsicofisicoAlerta > 0 ? '#A32D2D' : 'var(--gy)' }}>
            {kpis.pilotosPsicofisicoAlerta > 0 ? `${kpis.pilotosPsicofisicoAlerta} con psicofísico por vencer` : 'Psicofísicos al día'}
          </div>
        </div>
        <div className="kpi">
          <div className="kv" style={{ color: kpis.tareasVencidas > 0 ? '#A32D2D' : 'inherit' }}>
            {kpis.tareasVencidas}
          </div>
          <div className="kl">Tareas vencidas</div>
          <div className="kt" style={{ color: kpis.tareasProximas > 0 ? '#EF9F27' : 'var(--gy)' }}>
            {kpis.tareasProximas} próximas a vencer
          </div>
        </div>
      </div>

      {/* Reservas extra */}
      <div className="g4" style={{ marginTop: '-8px' }}>
        <div className="kpi">
          <div className="kv">{kpis.reservasHoy}</div>
          <div className="kl">Reservas hoy</div>
          <div className="kt" style={{ color: 'var(--gy)' }}>{kpis.reservasMañana} mañana</div>
        </div>
        <div className="kpi">
          <div className="kv" style={{ color: kpis.logsNoResueltos > 0 ? '#EF9F27' : 'inherit' }}>{kpis.logsNoResueltos}</div>
          <div className="kl">Incidentes sin resolver</div>
          <div className="kt" style={{ color: 'var(--gy)' }}>Log técnico</div>
        </div>
        {data!.simuladores.map(s => (
          <div className="kpi" key={s.id}>
            <div className="kv" style={{ fontSize: '13px', fontWeight: 600 }}>{s.aeronave}</div>
            <div className="kl">{s.nombre}</div>
            <div className="kt">
              {!s.operativo
                ? <Badge variant="bvn">INOPERATIVO</Badge>
                : s.enSesion
                  ? <Badge variant="be">EN SESIÓN</Badge>
                  : <Badge variant="bo">Operativo</Badge>}
            </div>
          </div>
        ))}
      </div>

      {/* Próximas reservas del día */}
      {data!.proximasReservas.length > 0 && (
        <Card title="Próximas reservas del día">
          <table className="tbl">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Simulador</th>
                <th>Piloto</th>
                <th>Instructor</th>
                <th>Tema</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data!.proximasReservas.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.horaInicio} – {r.horaFin}</td>
                  <td><b>{r.simulador.aeronave}</b></td>
                  <td>{r.piloto ? `${r.piloto.nombre} ${r.piloto.apellido}` : <span style={{ color: 'var(--gy)', fontStyle: 'italic' }}>Sin asignar</span>}</td>
                  <td>{r.instructor ? `${r.instructor.nombre} ${r.instructor.apellido}` : '—'}</td>
                  <td style={{ color: 'var(--text-m)', fontSize: '11px' }}>{r.tema ?? '—'}</td>
                  <td><Badge variant="bc">CONFIRMADA</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
