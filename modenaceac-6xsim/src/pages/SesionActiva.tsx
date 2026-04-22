import React from 'react';
import { useUiStore } from '../store/uiStore';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { MAN, RC } from '../data/mock';

export const SesionActiva: React.FC = () => {
  const { timer, td, startTimer, stopTimer, manSel, setManSel, evals, setEval } = useUiStore();

  React.useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  const fmtTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div>
      <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--gyb)', borderRadius: '16px', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', boxShadow: 'var(--shadow)', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge variant="be">EN CURSO</Badge>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>Cap. Diego Ferreira</div>
            <div style={{ fontSize: '11px', color: 'var(--gy)', marginTop: '2px' }}>Habilitación IFR · AW109 · Eduardo Forgan</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--az)' }}>
            {fmtTimer(timer)}
          </div>
          <button className="btn btnw" onClick={() => alert('Pausa registrada')}>Registrar pausa</button>
          <button className="btn btns">Cerrar → Reporte</button>
        </div>
      </div>

      <div className="g2">
        <Card title="Telemetría en tiempo real · UDP 49000 · X-Plane 11">
          <div className="tg">
            <div className="ti"><div className="tv">{td.alt}</div><div className="tl">ALT ft</div></div>
            <div className="ti"><div className="tv">{td.vvi}</div><div className="tl">VVI fpm</div></div>
            <div className="ti"><div className="tv">{td.ias}</div><div className="tl">IAS kts</div></div>
            <div className="ti"><div className="tv">{td.pitch}</div><div className="tl">PITCH °</div></div>
            <div className="ti"><div className="tv">{td.roll}</div><div className="tl">ROLL °</div></div>
            <div className="ti"><div className="tv">{td.hdg}</div><div className="tl">HDG °M</div></div>
            <div className="ti"><div className="tv">{td.rpm}</div><div className="tl">RPM motor</div></div>
            <div className="ti"><div className="tv">{td.rotor}</div><div className="tl">RPM rotor</div></div>
            <div className="ti" style={{ background: '#EAF3DE' }}><div className="tv" style={{ fontSize: '13px', color: '#085041' }}>ACTIVO</div><div className="tl">X-Plane UDP</div></div>
          </div>
        </Card>

        <div>
          <Card title="Configuración X-Plane activa">
            <div className="row"><span style={{ color: 'var(--gy)' }}>Escenario</span><span style={{ fontWeight: 500 }}>SAEZ — Ezeiza</span></div>
            <div className="row"><span style={{ color: 'var(--gy)' }}>Hora local</span><span style={{ fontWeight: 500 }}>14:30</span></div>
            <div className="row"><span style={{ color: 'var(--gy)' }}>Condiciones</span><span style={{ fontWeight: 500 }}>3 SM · IMC parcial</span></div>
            <div className="row"><span style={{ color: 'var(--gy)' }}>Viento</span><span style={{ fontWeight: 500 }}>240° / 18 kts</span></div>
            <div style={{ marginTop: '16px' }}>
              <div className="ct">Fallas inyectadas</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge bvn" style={{ border: '0.5px solid #F09595' }}>Falla motor #1</span>
                <span className="badge bvn" style={{ border: '0.5px solid #F09595' }}>Advert. hidráulica</span>
                <span className="badge" style={{ background: 'var(--kpi-bg)', color: 'var(--text-m)' }}>Torque (inactiva)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Maniobras · hacer click para evaluar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MAN.map((m) => {
            const e = evals[m.id];
            const isSel = manSel === m.id;
            return (
              <React.Fragment key={m.id}>
                <div 
                  onClick={() => setManSel(m.id)}
                  style={{
                    padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'var(--trans)',
                    border: `0.5px solid ${isSel ? '#1D9E75' : 'var(--gyb)'}`,
                    background: isSel ? 'rgba(29, 158, 117, 0.1)' : 'var(--bg-card)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{m.n}</div>
                    <div style={{ fontSize: '10px', color: 'var(--gy)', marginTop: '2px' }}>{m.c}</div>
                  </div>
                  {e ? (
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px', background: RC[e]?.bg, color: RC[e]?.c }}>{e}</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--gy)' }}>Tocar para evaluar</span>
                  )}
                </div>
                {isSel && (
                  <div style={{ padding: '16px', background: 'rgba(29, 158, 117, 0.05)', border: '0.5px solid rgba(29, 158, 117, 0.3)', borderRadius: '12px', marginTop: '2px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#1D9E75', marginBottom: '12px' }}>Selecciona el resultado de la maniobra</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                      {['AS', 'S', 'SB', 'NA'].map(r => (
                        <button
                          key={r}
                          onClick={(ev) => { ev.stopPropagation(); setEval(m.id, r); }}
                          style={{
                            padding: '12px 0', borderRadius: '8px', border: '0.5px solid var(--gyb)', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'var(--trans)',
                            background: evals[m.id] === r ? RC[r].bg : 'var(--bg-input)', color: RC[r].c
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <button className="btn" onClick={(ev) => { ev.stopPropagation(); setManSel(null); }}>Cancelar</button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
