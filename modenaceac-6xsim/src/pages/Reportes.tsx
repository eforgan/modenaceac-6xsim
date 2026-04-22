import React from 'react';
import { useUiStore } from '../store/uiStore';
import { Card } from '../components/Card';
import { MAN, RC } from '../data/mock';

export const Reportes: React.FC = () => {
  const { timer, evals } = useUiStore();
  const [globalEval, setGlobalEval] = React.useState<string | null>(null);

  const fmtTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Reporte final de sesión</div>
          <div className="ps">Cap. Diego Ferreira · AW109 · Habilitación IFR</div>
        </div>
      </div>
      
      <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', color: '#633806', borderRadius: '12px', padding: '12px 16px', fontSize: '12px', marginBottom: '16px' }}>
        El reporte se generará como PDF y se enviará por email al piloto. Se requiere firma del instructor.
      </div>

      <div className="g2">
        <Card title="Resumen de sesión">
          <div className="row"><span style={{ color: 'var(--gy)' }}>Piloto</span><span style={{ fontWeight: 500 }}>Cap. Diego Ferreira</span></div>
          <div className="row"><span style={{ color: 'var(--gy)' }}>Instructor</span><span style={{ fontWeight: 500 }}>Eduardo Forgan</span></div>
          <div className="row"><span style={{ color: 'var(--gy)' }}>Simulador</span><span style={{ fontWeight: 500 }}>AW109 · X-Plane 11</span></div>
          <div className="row"><span style={{ color: 'var(--gy)' }}>Curso</span><span style={{ fontWeight: 500 }}>Habilitación IFR</span></div>
          <div className="row"><span style={{ color: 'var(--gy)' }}>Duración registrada</span><span style={{ fontWeight: 500 }}>{fmtTimer(timer)}</span></div>
          <div className="row"><span style={{ color: 'var(--gy)' }}>Tiempo efectivo histórico</span><span style={{ fontWeight: 500 }}>01:47:14</span></div>
          <div className="row"><span style={{ color: 'var(--gy)' }}>Maniobras analizadas</span><span style={{ fontWeight: 500 }}>{Object.keys(evals).length} / {MAN.length}</span></div>
        </Card>

        <Card title="Maniobras evaluadas">
          {MAN.map(m => {
            const e = evals[m.id];
            return (
              <div className="row" key={m.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{m.n}</div>
                  <div style={{ fontSize: '10px', color: 'var(--gy)' }}>{m.c}</div>
                </div>
                {e ? (
                  <span style={{ fontWeight: 700, padding: '4px 12px', borderRadius: '8px', background: RC[e]?.bg, color: RC[e]?.c }}>{e}</span>
                ) : (
                  <span style={{ color: 'var(--gy)', fontSize: '10px' }}>sin evaluar</span>
                )}
              </div>
            );
          })}
        </Card>
      </div>

      <Card title="Evaluación global del instructor">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {['AS', 'S', 'SB', 'NA'].map(r => (
            <button
              key={r}
              onClick={() => setGlobalEval(r)}
              style={{
                padding: '16px 0', borderRadius: '12px', border: '0.5px solid var(--gyb)', cursor: 'pointer', fontSize: '18px', fontWeight: 700, transition: 'var(--trans)',
                background: globalEval === r ? RC[r].bg : 'var(--bg-input)', color: RC[r].c
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--gy)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>OBSERVACIONES GENERALES</label>
            <textarea style={{ width: '100%', border: '0.5px solid var(--gyb)', borderRadius: '12px', padding: '12px', fontSize: '12px', minHeight: '80px', resize: 'vertical', background: 'var(--bg-input)', color: 'var(--text)' }} placeholder="Comentarios sobre el desempeño del piloto..." />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--gy)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>RECOMENDACIONES</label>
            <textarea style={{ width: '100%', border: '0.5px solid var(--gyb)', borderRadius: '12px', padding: '12px', fontSize: '12px', minHeight: '60px', resize: 'vertical', background: 'var(--bg-input)', color: 'var(--text)' }} placeholder="Áreas de mejora..." />
          </div>
        </div>
      </Card>

      <Card title="Firma digital del instructor">
        <div style={{ fontSize: '11px', color: 'var(--gy)', marginBottom: '12px' }}>Eduardo Forgan · Legajo 48291 · Firma interna MODENACEAC</div>
        <div style={{ border: '1px dashed var(--gyb)', borderRadius: '12px', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--kpi-bg)' }}>
          <span style={{ fontSize: '12px', color: 'var(--gy)' }}>Hacer click para firmar (canvas táctil habilitado)</span>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button className="btn">Descargar borrador</button>
        <button className="btn btnp">Finalizar y enviar reporte PDF</button>
      </div>
    </div>
  );
};
