import React, { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import { RES } from '../data/mock';

export const StatusMonitor: React.FC = () => {
  const { timer, td, startTimer, stopTimer } = useUiStore();
  const [time, setTime] = React.useState(new Date());

  useEffect(() => {
    startTimer();
    const clockInt = setInterval(() => setTime(new Date()), 1000);
    // Forzar modo oscuro en esta vista
    document.body.classList.add('dark');
    return () => {
      stopTimer();
      clearInterval(clockInt);
      // Restaurar tema normal (asume claro, o lee del local store en una app real)
      document.body.classList.remove('dark');
    };
  }, [startTimer, stopTimer]);

  const activeRes = RES.find(r => r.est === 'EN_CURSO') || RES[0];

  // Cálculo realista de horarios en base a la hora actual para evitar solapamientos visuales
  const h = time.getHours();
  // El turno actual empezó a principio de esta hora o la hora anterior
  const iniH = h > 0 ? h - 1 : 23;
  const activeIniStr = `${String(iniH).padStart(2, '0')}:00`;
  
  const addTwoHours = (timeStr: string) => {
    if (!timeStr) return '--:--';
    const [hStr, mStr] = timeStr.split(':');
    const hh = parseInt(hStr, 10);
    return `${String((hh + 2) % 24).padStart(2, '0')}:${mStr}`;
  };

  const endStr = addTwoHours(activeIniStr);
  const nextTurnStr = addTwoHours(endStr); // Próximo turno se programa 2 hs después de terminar el actual para mantenimiento

  const nextSessions = RES.filter(r => (r.est === 'CONFIRMADA' || r.est === 'PENDIENTE') && r.sim === activeRes.sim);
  const nextTurnInfo = nextSessions.length > 0 ? nextSessions[0] : null;

  const fmtTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER MONITOR */}
      <div style={{ padding: '20px 40px', background: 'rgba(24, 27, 35, 0.95)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--az)', letterSpacing: '2px' }}>MODENACEAC · 6XSIM</div>
          <div style={{ fontSize: '14px', color: 'var(--text-m)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '4px' }}>Briefing Room Status Center</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{time.toLocaleTimeString('es-AR')}</div>
          <div style={{ fontSize: '14px', color: 'var(--az)' }}>Hora Local</div>
        </div>
      </div>

      {/* CUERPO CENTRAL */}
      <div style={{ flex: 1, padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* SIMULADOR 1 - ACTIVO */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--az)', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 40px rgba(24, 95, 165, 0.15)' }}>
          <div style={{ background: 'var(--az)', color: '#fff', padding: '16px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>AW109</span>
            <span style={{ padding: '6px 16px', background: '#EAF3DE', color: '#27500A', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>EN SESIÓN</span>
          </div>
          <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
               <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-m)', textTransform: 'uppercase' }}>Piloto en Comando</div>
                  <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '8px' }}>{activeRes.pil}</div>
               </div>
               <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-m)', textTransform: 'uppercase' }}>Instructor (IOS)</div>
                  <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '8px' }}>{activeRes.ins}</div>
               </div>
             </div>
             
             <div>
                <div style={{ fontSize: '14px', color: 'var(--text-m)', textTransform: 'uppercase', marginBottom: '8px' }}>Misión / Entrenamiento</div>
                <div style={{ fontSize: '20px', color: 'var(--az)' }}>{activeRes.tema}</div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div>
                   <div style={{ fontSize: '12px', color: 'var(--text-m)', textTransform: 'uppercase', marginBottom: '4px' }}>Inicio Sesión</div>
                   <div style={{ fontSize: '22px', fontWeight: 600 }}>{activeIniStr} Hs</div>
                </div>
                <div>
                   <div style={{ fontSize: '12px', color: 'var(--text-m)', textTransform: 'uppercase', marginBottom: '4px' }}>Fin Previsto</div>
                   <div style={{ fontSize: '22px', fontWeight: 600 }}>{endStr} Hs</div>
                </div>
                <div>
                   <div style={{ fontSize: '12px', color: 'var(--az)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Próximo Turno</div>
                   <div style={{ fontSize: '16px', fontWeight: 600 }}>{nextTurnStr} Hs</div>
                   <div style={{ fontSize: '12px', color: 'var(--text-m)', marginTop: '2px' }}>{nextTurnInfo ? `${nextTurnInfo.pil}` : 'Libre'} · AW109</div>
                </div>
             </div>

             <div style={{ marginTop: 'auto', background: 'var(--kpi-bg)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-m)', textTransform: 'uppercase' }}>Tiempo de Vuelo</div>
                  <div style={{ fontSize: '48px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{fmtTimer(timer)}</div>
                </div>
                <div style={{ width: '2px', height: '60px', background: 'var(--border)' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 30px' }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 600 }}>{td.alt}</div><div style={{ fontSize: '10px', color: 'var(--text-m)' }}>ALT (ft)</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 600 }}>{td.ias}</div><div style={{ fontSize: '10px', color: 'var(--text-m)' }}>IAS (kts)</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 600 }}>{td.hdg}°</div><div style={{ fontSize: '10px', color: 'var(--text-m)' }}>HDG</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '24px', fontWeight: 600 }}>{td.rpm}</div><div style={{ fontSize: '10px', color: 'var(--text-m)' }}>RPM</div></div>
                </div>
             </div>
          </div>
        </div>

        {/* SIMULADOR 2 - INACTIVO / MANTENIMIENTO */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', display: 'flex', flexDirection: 'column', opacity: 0.85 }}>
          <div style={{ background: 'var(--kpi-bg)', padding: '16px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-m)' }}>Robinson R44</span>
            <span style={{ padding: '6px 16px', background: '#FAEEDA', color: '#633806', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>MANTENIMIENTO PROGRAMADO</span>
          </div>
          <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F1EFE8', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#5F5E5A', fontSize: '32px' }}>🔧</div>
             <div>
               <div style={{ fontSize: '24px', fontWeight: 600 }}>Fuera de servicio</div>
               <div style={{ fontSize: '16px', color: 'var(--text-m)', marginTop: '8px' }}>Verificación UDP y calibración de pedales</div>
             </div>
             <div style={{ background: 'var(--bg)', padding: '12px 24px', borderRadius: '12px', color: 'var(--text-m)', marginTop: '20px', border: '1px solid var(--border)' }}>
               Próxima sesión estimada: 14:00 Hs
             </div>
          </div>
        </div>

      </div>

      {/* TICKER INFERIOR DE RESERVAS */}
      <div style={{ background: 'var(--kpi-bg)', borderTop: '1px solid var(--border)', height: '60px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ background: 'var(--az)', color: '#fff', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', fontWeight: 'bold', zIndex: 10, position: 'relative' }}>
          PRÓXIMAS SESIONES
        </div>
        <div style={{ display: 'flex', gap: '40px', padding: '0 20px', whiteSpace: 'nowrap', color: 'var(--text-m)', fontSize: '16px', overflowX: 'hidden' }}>
          {RES.filter(r => r.est === 'CONFIRMADA' || r.est === 'PENDIENTE').slice(0,4).map(r => (
            <span key={r.id}>
              <b>{r.ini} Hs</b> — {r.pil || 'Mantenimiento'} ({r.sim})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
