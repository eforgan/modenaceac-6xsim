import React from 'react';
import { PIL, TD, PB } from '../data/mock';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Dashboard operacional</div>
          <div className="ps">MODENACEAC · 6XSIM · React Version</div>
        </div>
        <button className="btn btnp" onClick={() => alert('Reporte ejecutivo PDF generado')}>
          Exportar PDF
        </button>
      </div>

      <div className="g4">
        <div className="kpi">
          <div className="kv">47</div>
          <div className="kl">Sesiones este mes</div>
          <div className="kt" style={{ color: '#27500A' }}>↑ +12% vs mes anterior</div>
        </div>
        <div className="kpi">
          <div className="kv">94h</div>
          <div className="kl">Horas efectivas simulador</div>
          <div className="kt" style={{ color: '#27500A' }}>↑ +8% vs mes anterior</div>
        </div>
        <div className="kpi">
          <div className="kv">23</div>
          <div className="kl">Pilotos entrenados</div>
          <div className="kt" style={{ color: 'var(--gy)' }}>→ igual mes anterior</div>
        </div>
        <div className="kpi">
          <div className="kv" style={{ color: '#A32D2D' }}>3</div>
          <div className="kl">Fallas abiertas</div>
          <div className="kt" style={{ color: '#A32D2D' }}>2 pend. mantenimiento</div>
        </div>
      </div>

      <div className="g2">
        <Card title="Estado de simuladores">
          <div style={{ background: 'var(--gyl)', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '12px' }}>AW109</div>
                <div style={{ fontSize: '9px', color: 'var(--gy)' }}>X-Plane 11.55r2 · 192.168.1.101</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>27</div>
                  <div style={{ fontSize: '9px', color: 'var(--gy)' }}>sesiones</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>54h</div>
                  <div style={{ fontSize: '9px', color: 'var(--gy)' }}>efectivas</div>
                </div>
                <Badge variant="bo">Operativo</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--gy)', marginBottom: '3px' }}>
              <span>Utilización mensual</span><span style={{ fontWeight: 500 }}>78%</span>
            </div>
            <div className="pbar"><div className="pf" style={{ width: '78%', background: '#185FA5' }}></div></div>
          </div>

          <div style={{ background: 'var(--gyl)', borderRadius: '10px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '12px' }}>Robinson R44</div>
                <div style={{ fontSize: '9px', color: 'var(--gy)' }}>X-Plane 11.55r2 · 192.168.1.102</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>20</div>
                  <div style={{ fontSize: '9px', color: 'var(--gy)' }}>sesiones</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>40h</div>
                  <div style={{ fontSize: '9px', color: 'var(--gy)' }}>efectivas</div>
                </div>
                <Badge variant="bmt">MANT activo</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--gy)', marginBottom: '3px' }}>
              <span>Utilización mensual</span><span style={{ fontWeight: 500 }}>62%</span>
            </div>
            <div className="pbar"><div className="pf" style={{ width: '62%', background: '#1D9E75' }}></div></div>
          </div>
        </Card>

        <Card title="Alertas psicofísicos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PIL.filter(p => p.ps !== 'VIGENTE').map((p, i) => (
              <div key={i} style={{ padding: '8px 12px', background: p.ps === 'VENCIDO' ? '#FCEBEB' : '#FAEEDA', border: `0.5px solid ${p.ps === 'VENCIDO' ? '#F09595' : '#FAC775'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '12px' }}>{p.n}</div>
                  <div style={{ fontSize: '10px', color: 'var(--gy)' }}>{p.lic} · {p.vc}</div>
                </div>
                <Badge variant={PB[p.ps] as any}>{p.ps.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Desempeño de pilotos — último mes">
        <table className="tbl">
          <thead>
            <tr>
              <th>Piloto</th>
              <th>Habilitaciones</th>
              <th>Ses.</th>
              <th>Hrs. sim.</th>
              <th>Evaluaciones AS · S · SB · NA</th>
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {PIL.map((p, i) => {
              const v = [3, 6, 4, 1];
              const tot = 14;
              const sesCount = [8, 6, 5, 4, 3, 3][i];
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{p.n}</td>
                  <td>
                    <div className="tagr">
                      {p.hab.map(h => <Badge key={h} variant="bv">{h}</Badge>)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{sesCount}</td>
                  <td style={{ textAlign: 'center' }}>{p.hs}h</td>
                  <td>
                    <div style={{ fontSize: '9px', color: 'var(--gy)', marginBottom: '3px' }}>
                      AS:{v[0]} S:{v[1]} SB:{v[2]} NA:{v[3]}
                    </div>
                    <div className="eb">
                      <div className="es" style={{ width: `${Math.round(v[0] / tot * 100)}%`, background: '#EAF3DE', border: '0.5px solid #97C459' }}></div>
                      <div className="es" style={{ width: `${Math.round(v[1] / tot * 100)}%`, background: '#E6F1FB', border: '0.5px solid #378ADD' }}></div>
                      <div className="es" style={{ width: `${Math.round(v[2] / tot * 100)}%`, background: '#FAEEDA', border: '0.5px solid #FAC775' }}></div>
                      <div className="es" style={{ width: `${Math.round(v[3] / tot * 100)}%`, background: '#F1EFE8' }}></div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, color: TD[p.td].c }}>{TD[p.td].i}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
