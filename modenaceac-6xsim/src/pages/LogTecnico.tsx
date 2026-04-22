import React from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LOGS, SB_COLORS } from '../data/mock';

export const LogTecnico: React.FC = () => {
  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Bitácora técnica de fallas</div>
          <div className="ps">Departamento de mantenimiento SIM</div>
        </div>
        <button className="btn btnw">+ Reportar incidencia</button>
      </div>

      {LOGS.map(L => (
        <Card key={L.id}>
          <div className="sh">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ background: 'var(--gyl)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '13px', color: 'var(--gy)' }}>
                #{L.id}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{L.desc}</div>
                <div style={{ fontSize: '10px', color: 'var(--gy)', marginTop: '2px' }}>{L.sim} · {L.tipo}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 500 }}>{L.fecha}</div>
                <div style={{ fontSize: '10px', color: 'var(--gy)', marginTop: '2px' }}>{L.op}</div>
              </div>
              <Badge variant={SB_COLORS[L.est] as any}>{L.est.replace('_', ' ')}</Badge>
            </div>
          </div>
          <div className="lb" style={{ borderTop: 'none', padding: '14px' }}>
            {L.tl.map((t, idx) => (
              <div className="trow" key={idx}>
                <div style={{ width: '40px', fontSize: '10px', color: 'var(--text-m)', fontWeight: 500, textAlign: 'right', marginTop: '2px', fontFamily: 'monospace' }}>{t.t}</div>
                <div className="tdot" style={{ background: t.c }}></div>
                <div style={{ fontSize: '11px', color: 'var(--text)' }}>
                  {t.txt}
                  {idx === 0 && <span style={{ marginLeft: '10px', color: 'var(--gy)' }}>· Tiempo est: {L.dur} min</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="bh">
            <span>Acciones</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn" style={{ padding: '4px 10px', fontSize: '9px' }}>ACTUALIZAR ESTADO</button>
              <button className="btn" style={{ padding: '4px 10px', fontSize: '9px' }}>NOTIFICAR ANAC</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
