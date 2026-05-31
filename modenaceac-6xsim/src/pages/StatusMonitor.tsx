import React, { useEffect, useState } from 'react';
import { 
  Plane, Wrench, AlertTriangle, RefreshCw
} from 'lucide-react';

interface SimulatorDB {
  id: string;
  nombre: string;
  aeronave: 'AW109' | 'R44';
  xplaneVersion: string;
  xplaneIp: string;
  operativo: boolean;
  ultimaRevision: string | null;
  notas: string | null;
}

interface ReservaDB {
  id: string;
  simuladorId: string;
  tipo: 'VUELO' | 'DEMO' | 'MANT' | 'CAPACITACION';
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tema: string | null;
  notas: string | null;
  piloto?: { nombre: string; apellido: string } | null;
  instructor?: { nombre: string; apellido: string } | null;
}

interface SesionDB {
  id: string;
  simuladorId: string;
  icao: string;
  horaLocal: string;
  fecha: string;
  estado: 'EN_CURSO' | 'COMPLETADA' | 'ABORTADA' | 'CANCELADA';
  horaInicio: string;
  piloto: { nombre: string; apellido: string };
  instructor: { nombre: string; apellido: string };
}

// Helper de formateo numérico
const pad = (n: number) => String(n).padStart(2, '0');

export const StatusMonitor: React.FC = () => {
  const [time, setTime] = useState(new Date());
  
  // Datos del backend
  const [simuladores, setSimuladores] = useState<SimulatorDB[]>([]);
  const [reservasHoy, setReservasHoy] = useState<ReservaDB[]>([]);
  const [sesionesActivas, setSesionesActivas] = useState<SesionDB[]>([]);
  const [backendConectado, setBackendConectado] = useState(false);

  // Tiempos transcurridos (en segundos)
  const [timerAW109, setTimerAW109] = useState(0);
  const [timerR44, setTimerR44] = useState(0);

  // Reloj local (1 Hz)
  useEffect(() => {
    const clockInt = setInterval(() => setTime(new Date()), 1000);
    // Forzar modo oscuro táctico para la sala de briefing
    document.body.classList.add('dark');
    return () => {
      clearInterval(clockInt);
      document.body.classList.remove('dark');
    };
  }, []);

  // Sondeo del Backend (cada 5 segundos)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/public/status');
        if (!res.ok) throw new Error('Error al consultar estado');
        const data = await res.json();
        
        setSimuladores(data.simuladores);
        setReservasHoy(data.reservasHoy);
        setSesionesActivas(data.sesionesActivas);
        setBackendConectado(true);
      } catch (err) {
        console.warn('[StatusMonitor] Backend desconectado. Usando modo de simulación local de tiempo real.');
        setBackendConectado(false);
        setupFallbackData();
      }
    };

    fetchStatus();
    const pollInt = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollInt);
  }, []);

  // Cargar datos dinámicos relativos a la hora actual para simulación interactiva
  const setupFallbackData = () => {
    const now = new Date();
    
    // Sesión activa AW109: empezó hace 42 minutos, termina en 78 minutos (total 2 horas)
    const awStart = new Date(now.getTime() - 42 * 60 * 1000);
    const awEnd = new Date(now.getTime() + 78 * 60 * 1000);
    
    // Próxima sesión R44: empieza en 85 minutos, termina en 205 minutos
    const r44Start = new Date(now.getTime() + 85 * 60 * 1000);
    const r44End = new Date(now.getTime() + 205 * 60 * 1000);
    
    const formatTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setSimuladores([
      { id: '1', nombre: 'AgustaWestland AW109E', aeronave: 'AW109', xplaneVersion: 'XP12', xplaneIp: '192.168.1.101', operativo: true, ultimaRevision: null, notas: null },
      { id: '2', nombre: 'Robinson R44 II', aeronave: 'R44', xplaneVersion: 'XP11', xplaneIp: '192.168.1.102', operativo: true, ultimaRevision: null, notas: null }
    ]);

    setReservasHoy([
      { 
        id: 'r1', 
        simuladorId: '1', 
        tipo: 'VUELO', 
        estado: 'EN_CURSO', 
        fecha: '', 
        horaInicio: formatTimeStr(awStart), 
        horaFin: formatTimeStr(awEnd), 
        tema: 'Procedimiento OEI (One Engine Inoperative) y falla de Gobernador', 
        notas: null, 
        piloto: { nombre: 'Diego', apellido: 'Ferreira' }, 
        instructor: { nombre: 'Eduardo', apellido: 'Forgan' } 
      },
      { 
        id: 'r2', 
        simuladorId: '2', 
        tipo: 'VUELO', 
        estado: 'CONFIRMADA', 
        fecha: '', 
        horaInicio: formatTimeStr(r44Start), 
        horaFin: formatTimeStr(r44End), 
        tema: 'Autorrotación de Emergencia y Control de RPM', 
        notas: null, 
        piloto: { nombre: 'Ana', apellido: 'Suárez' }, 
        instructor: { nombre: 'Pablo', apellido: 'Torres' } 
      }
    ]);

    setSesionesActivas([
      {
        id: 's1',
        simuladorId: '1',
        icao: 'SAEZ',
        horaLocal: formatTimeStr(awStart),
        fecha: now.toISOString(),
        estado: 'EN_CURSO',
        horaInicio: awStart.toISOString(),
        piloto: { nombre: 'Diego', apellido: 'Ferreira' },
        instructor: { nombre: 'Eduardo', apellido: 'Forgan' }
      }
    ]);
  };

  // Manejo de contadores locales de vuelo transcurrido
  useEffect(() => {
    const timerInterval = setInterval(() => {
      // AW109
      const sesionAW109 = sesionesActivas.find(s => {
        const sim = simuladores.find(simul => simul.id === s.simuladorId);
        return sim?.aeronave === 'AW109';
      });
      if (sesionAW109) {
        const diff = Math.floor((Date.now() - new Date(sesionAW109.horaInicio).getTime()) / 1000);
        setTimerAW109(diff > 0 ? diff : 0);
      } else {
        setTimerAW109(0);
      }

      // R44
      const sesionR44 = sesionesActivas.find(s => {
        const sim = simuladores.find(simul => simul.id === s.simuladorId);
        return sim?.aeronave === 'R44';
      });
      if (sesionR44) {
        const diff = Math.floor((Date.now() - new Date(sesionR44.horaInicio).getTime()) / 1000);
        setTimerR44(diff > 0 ? diff : 0);
      } else {
        setTimerR44(0);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [sesionesActivas, simuladores]);

  // Formato de tiempo de sesión HH:MM (transcurrido)
  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${pad(h)}h ${pad(m)}min`;
  };

  // Calcular tiempo restante en base a la horaFin programada en reservas
  const getRemainingTime = (simId: string) => {
    const reservaActiva = reservasHoy.find(
      r => r.simuladorId === simId && r.estado === 'EN_CURSO'
    );
    if (!reservaActiva) return '00h 00min';

    const now = new Date();
    const [h, m] = reservaActiva.horaFin.split(':').map(Number);
    const dest = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

    let diff = Math.floor((dest.getTime() - now.getTime()) / 1000);
    if (diff <= 0) return '00h 00min';

    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    return `${pad(hrs)}h ${pad(mins)}min`;
  };

  const getFreeTime = (nextBooking: ReservaDB | null | undefined) => {
    if (!nextBooking) return 'SIN LÍMITE';
    
    const now = new Date();
    const [h, m] = nextBooking.horaInicio.split(':').map(Number);
    const dest = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

    let diff = Math.floor((dest.getTime() - now.getTime()) / 1000);
    if (diff <= 0) return '00h 00min';

    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    return `${pad(hrs)}h ${pad(mins)}min`;
  };

  // Calcular porcentaje de progreso del bloque horario asignado
  const getSessionProgress = (simId: string) => {
    const reservaActiva = reservasHoy.find(
      r => r.simuladorId === simId && r.estado === 'EN_CURSO'
    );
    if (!reservaActiva) return 0;

    const now = new Date();
    const [startH, startM] = reservaActiva.horaInicio.split(':').map(Number);
    const [endH, endM] = reservaActiva.horaFin.split(':').map(Number);

    const startDest = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, 0);
    const endDest = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, 0);

    const total = endDest.getTime() - startDest.getTime();
    if (total <= 0) return 100;

    const elapsed = now.getTime() - startDest.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  // Determinar estado unificado de un simulador
  const getSimState = (aeronave: 'AW109' | 'R44') => {
    const sim = simuladores.find(s => s.aeronave === aeronave);
    if (!sim) return { status: 'OFFLINE', label: 'DESCONECTADO', class: 'border-red-900/50 bg-red-950/20 text-red-500' };

    if (!sim.operativo) {
      return { status: 'OUT_OF_SERVICE', label: 'INOPERATIVO', class: 'border-red-900/60 bg-red-950/20 text-red-500', sim };
    }

    const activa = sesionesActivas.find(s => s.simuladorId === sim.id);
    if (activa) {
      return { status: 'ACTIVE', label: 'SESIÓN ACTIVA', class: 'border-emerald-500/50 bg-emerald-950/15 text-emerald-400', session: activa, sim };
    }

    const ahoraStr = `${pad(time.getHours())}:${pad(time.getMinutes())}`;
    const enMant = reservasHoy.find(
      r => r.simuladorId === sim.id && r.tipo === 'MANT' && r.estado === 'CONFIRMADA' && r.horaInicio <= ahoraStr && r.horaFin >= ahoraStr
    );
    if (enMant) {
      return { status: 'MAINTENANCE', label: 'MANTENIMIENTO', class: 'border-amber-500/50 bg-amber-950/20 text-amber-400', booking: enMant, sim };
    }

    const futuras = reservasHoy
      .filter(r => r.simuladorId === sim.id && r.estado !== 'COMPLETADA' && r.estado !== 'CANCELADA')
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    return { 
      status: 'STANDBY', 
      label: 'STAND BY', 
      class: 'border-blue-500/40 bg-blue-950/10 text-blue-400', 
      nextBooking: futuras.length > 0 ? futuras[0] : null,
      sim 
    };
  };

  const aw109State = getSimState('AW109');
  const r44State = getSimState('R44');

  return (
    <div className="h-screen w-screen bg-[#080b10] text-[#f8fafc] overflow-hidden flex flex-col font-sans relative select-none">
      
      {/* Líneas de exploración (Scanlines) sutiles de grado aeronáutico */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(0,0,0,0.15)_4px,rgba(0,0,0,0.15)_8px)]" />

      {/* CABECERA (Header) PRINCIPAL DE ALTA VISIBILIDAD */}
      <header className="px-12 py-7 bg-[#0c0f17] border-b-2 border-slate-900/80 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 border-2 border-[#e8c96a] flex items-center justify-center rotate-45 bg-[#e8c96a]/5">
            <Plane className="-rotate-45 text-[#e8c96a]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-[#e8c96a] font-condensed">MODENACEAC · 6XSIM</h1>
            <p className="text-xs text-slate-500 tracking-widest uppercase mt-1 font-bold">Monitor de Estado de Simuladores</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Badge de Red */}
          <div className={`flex items-center gap-3 px-5 py-2 rounded-lg border-2 text-xs font-black tracking-widest ${
            backendConectado 
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' 
              : 'border-amber-500/30 bg-amber-950/20 text-amber-400'
          }`}>
            <RefreshCw size={14} className={backendConectado ? '' : 'animate-spin'} />
            <span>{backendConectado ? 'RED BACKEND ACTIVA' : 'SOPORTE LOCAL ACTIVO'}</span>
          </div>

          <div className="w-[2px] h-10 bg-slate-900" />

          {/* Reloj y Fecha Masiva (Legible a distancia) */}
          <div className="text-right flex flex-col justify-center">
            <p className="text-4xl font-mono font-black tracking-widest text-[#f8fafc] leading-none">
              {time.toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1.5">
              {time.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      {/* CUERPO CENTRAL EN REJILLA DUAL (AW109 y R44) */}
      <main className="flex-1 p-12 grid grid-cols-2 gap-12 overflow-hidden z-10">
        
        {/* ============================================================ */}
        {/* SIMULADOR 1: AW109 POWER */}
        {/* ============================================================ */}
        <section className={`rounded-3xl border-2 p-10 flex flex-col justify-between shadow-2xl relative bg-[#0d111a]/90 backdrop-blur-md ${
          aw109State.status === 'ACTIVE' 
            ? 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.06)]' 
            : aw109State.status === 'STANDBY' 
              ? 'border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.04)]'
              : 'border-slate-800 bg-[#0b0e14]'
        }`}>
          {/* Línea de pulso de estado activo */}
          {aw109State.status === 'ACTIVE' && (
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_25px_#10b981] animate-pulse" />
          )}

          {/* Fila Cabecera Tarjeta */}
          <div className="flex justify-between items-start border-b-2 border-slate-900/60 pb-6">
            <div>
              <h2 className="text-4xl font-black tracking-wider text-slate-100 font-condensed">AW109 POWER</h2>
              <p className="text-xs text-slate-500 tracking-widest font-bold uppercase mt-1">Bimotor Turbina · Cabina A</p>
            </div>
            <div className={`px-6 py-2 rounded-xl border-2 text-sm font-black tracking-widest uppercase ${aw109State.class}`}>
              {aw109State.label}
            </div>
          </div>

          {/* Contenido Central Dinámico */}
          <div className="flex-1 py-8 flex flex-col justify-between">
            {aw109State.status === 'ACTIVE' && aw109State.session ? (
              // CASO A: SESIÓN ACTIVA (EN CURSO)
              <div className="flex-1 flex flex-col justify-between gap-6">
                
                {/* Detalles de Tripulación y Misión */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#121622] border-2 border-slate-900 p-5 rounded-2xl">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-black block">Piloto en Comando</span>
                    <span className="text-2xl font-extrabold text-[#f8fafc] mt-2 block tracking-wide">
                      {aw109State.session.piloto.nombre} {aw109State.session.piloto.apellido}
                    </span>
                  </div>
                  <div className="bg-[#121622] border-2 border-slate-900 p-5 rounded-2xl">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-black block">Instructor</span>
                    <span className="text-2xl font-extrabold text-[#f8fafc] mt-2 block tracking-wide">
                      {aw109State.session.instructor.nombre} {aw109State.session.instructor.apellido}
                    </span>
                  </div>
                  <div className="col-span-2 bg-[#121622]/50 border border-slate-900 p-5 rounded-2xl">
                    <span className="text-xs text-emerald-400 uppercase tracking-widest font-black block">Tema de la Sesión</span>
                    <span className="text-lg font-bold text-slate-300 mt-2 block italic">
                      "{reservasHoy.find(r => r.simuladorId === aw109State.sim?.id && r.estado === 'EN_CURSO')?.tema || 'Instrucción general'}"
                    </span>
                  </div>
                </div>

                {/* Relojes de Alta Visibilidad */}
                <div className="grid grid-cols-2 gap-6 bg-[#090c12] border-2 border-slate-900 p-6 rounded-3xl">
                  <div className="text-center border-r border-slate-900">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-black block">Tiempo Transcurrido</span>
                    <span className="text-5xl font-mono font-black text-emerald-400 mt-3 block tracking-wider">
                      {formatElapsed(timerAW109)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-black block">Tiempo Restante</span>
                    <span className="text-5xl font-mono font-black text-amber-500 mt-3 block tracking-wider">
                      {getRemainingTime(aw109State.sim?.id || '1')}
                    </span>
                  </div>
                </div>

                {/* Barra de Progreso Visual */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
                    <span>Inicio: {new Date(aw109State.session.horaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} Hs</span>
                    <span className="text-slate-300">Progreso de Bloque</span>
                    <span>Fin: {reservasHoy.find(r => r.simuladorId === aw109State.sim?.id && r.estado === 'EN_CURSO')?.horaFin || '—'} Hs</span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-950 border border-slate-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                      style={{ width: `${getSessionProgress(aw109State.sim?.id || '1')}%` }}
                    />
                  </div>
                </div>

              </div>
            ) : aw109State.status === 'STANDBY' ? (
              // CASO B: STANDBY (DISPONIBLE HASTA EL SIGUIENTE TURNO)
              <div className="flex-1 flex flex-col justify-between gap-6">
                
                {/* Datos del Siguiente Turno */}
                <div className="bg-[#121622]/50 border-2 border-slate-900 p-6 rounded-2xl flex-1 flex flex-col justify-center">
                  {aw109State.nextBooking ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <span className="text-xs text-blue-400 uppercase tracking-widest font-black">Próxima Reserva Agendada</span>
                        <span className="text-xl font-mono font-black text-slate-200">A las {aw109State.nextBooking.horaInicio} Hs</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                        <div>
                          <span className="text-xs text-slate-500 font-bold block uppercase">Alumno</span>
                          <span className="text-base font-extrabold text-slate-300 mt-1 block">
                            {aw109State.nextBooking.piloto ? `${aw109State.nextBooking.piloto.nombre} ${aw109State.nextBooking.piloto.apellido}` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-bold block uppercase">Instructor</span>
                          <span className="text-base font-extrabold text-slate-300 mt-1 block">
                            {aw109State.nextBooking.instructor ? `${aw109State.nextBooking.instructor.nombre} ${aw109State.nextBooking.instructor.apellido}` : '—'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-bold block uppercase">Misión programada</span>
                        <span className="text-sm text-slate-400 mt-1 block italic">
                          "{aw109State.nextBooking.tema || 'Procedimientos estándar'}"
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-lg text-slate-500 italic block">No hay más turnos programados hoy</span>
                    </div>
                  )}
                </div>

                {/* Cuenta Regresiva de Tiempo Libre Restante */}
                <div className="bg-[#090c12] border-2 border-slate-900 p-8 rounded-3xl text-center flex flex-col justify-center items-center">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-black block mb-3">Tiempo Libre Disponible</span>
                  <span className="text-6xl font-mono font-black text-blue-400 tracking-wider">
                    {getFreeTime(aw109State.nextBooking)}
                  </span>
                </div>

              </div>
            ) : aw109State.status === 'MAINTENANCE' && aw109State.booking ? (
              // CASO C: MANTENIMIENTO PROGRAMADO
              <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
                <div className="w-24 h-24 rounded-full bg-amber-950/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wrench size={48} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-400 uppercase tracking-wider">Mantenimiento Preventivo</h3>
                  <p className="text-base text-slate-400 mt-2 max-w-sm">
                    {aw109State.booking.tema || 'Calibración técnica de sistemas del simulador.'}
                  </p>
                </div>
                <div className="bg-[#121622] border-2 border-slate-900 px-8 py-4 rounded-2xl font-mono text-xl text-slate-200">
                  Finaliza: <span className="font-black text-amber-400">{aw109State.booking.horaFin} Hs</span>
                </div>
              </div>
            ) : (
              // CASO D: FUERA DE SERVICIO / OFFLINE
              <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
                <div className="w-24 h-24 rounded-full bg-red-950/30 border-2 border-red-500/30 flex items-center justify-center text-red-500">
                  <AlertTriangle size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-red-500 uppercase tracking-wider">Simulador Fuera de Servicio</h3>
                  <p className="text-base text-slate-400 mt-2 max-w-sm">
                    {aw109State.sim?.notas || 'El equipo no operativo por calibraciones pendientes de controles físicos.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SIMULADOR 2: ROBINSON R44 */}
        {/* ============================================================ */}
        <section className={`rounded-3xl border-2 p-10 flex flex-col justify-between shadow-2xl relative bg-[#0d111a]/90 backdrop-blur-md ${
          r44State.status === 'ACTIVE' 
            ? 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.06)]' 
            : r44State.status === 'STANDBY' 
              ? 'border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.04)]'
              : 'border-slate-800 bg-[#0b0e14]'
        }`}>
          {/* Línea de pulso de estado activo */}
          {r44State.status === 'ACTIVE' && (
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_25px_#10b981] animate-pulse" />
          )}

          {/* Fila Cabecera Tarjeta */}
          <div className="flex justify-between items-start border-b-2 border-slate-900/60 pb-6">
            <div>
              <h2 className="text-4xl font-black tracking-wider text-slate-100 font-condensed">ROBINSON R44</h2>
              <p className="text-xs text-slate-500 tracking-widest font-bold uppercase mt-1">Monomotor Pistón · Cabina B</p>
            </div>
            <div className={`px-6 py-2 rounded-xl border-2 text-sm font-black tracking-widest uppercase ${r44State.class}`}>
              {r44State.label}
            </div>
          </div>

          {/* Contenido Central Dinámico */}
          <div className="flex-1 py-8 flex flex-col justify-between">
            {r44State.status === 'ACTIVE' && r44State.session ? (
              // CASO A: SESIÓN ACTIVA (EN CURSO)
              <div className="flex-1 flex flex-col justify-between gap-6">
                
                {/* Detalles de Tripulación y Misión */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#121622] border-2 border-slate-900 p-5 rounded-2xl">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-black block">Piloto en Comando</span>
                    <span className="text-2xl font-extrabold text-[#f8fafc] mt-2 block tracking-wide">
                      {r44State.session.piloto.nombre} {r44State.session.piloto.apellido}
                    </span>
                  </div>
                  <div className="bg-[#121622] border-2 border-slate-900 p-5 rounded-2xl">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-black block">Instructor</span>
                    <span className="text-2xl font-extrabold text-[#f8fafc] mt-2 block tracking-wide">
                      {r44State.session.instructor.nombre} {r44State.session.instructor.apellido}
                    </span>
                  </div>
                  <div className="col-span-2 bg-[#121622]/50 border border-slate-900 p-5 rounded-2xl">
                    <span className="text-xs text-emerald-400 uppercase tracking-widest font-black block">Tema de la Sesión</span>
                    <span className="text-lg font-bold text-slate-300 mt-2 block italic">
                      "{reservasHoy.find(r => r.simuladorId === r44State.sim?.id && r.estado === 'EN_CURSO')?.tema || 'Instrucción general'}"
                    </span>
                  </div>
                </div>

                {/* Relojes de Alta Visibilidad */}
                <div className="grid grid-cols-2 gap-6 bg-[#090c12] border-2 border-slate-900 p-6 rounded-3xl">
                  <div className="text-center border-r border-slate-900">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-black block">Tiempo Transcurrido</span>
                    <span className="text-5xl font-mono font-black text-emerald-400 mt-3 block tracking-wider">
                      {formatElapsed(timerR44)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-black block">Tiempo Restante</span>
                    <span className="text-5xl font-mono font-black text-amber-500 mt-3 block tracking-wider">
                      {getRemainingTime(r44State.sim?.id || '2')}
                    </span>
                  </div>
                </div>

                {/* Barra de Progreso Visual */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
                    <span>Inicio: {new Date(r44State.session.horaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} Hs</span>
                    <span className="text-slate-300">Progreso de Bloque</span>
                    <span>Fin: {reservasHoy.find(r => r.simuladorId === r44State.sim?.id && r.estado === 'EN_CURSO')?.horaFin || '—'} Hs</span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-950 border border-slate-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                      style={{ width: `${getSessionProgress(r44State.sim?.id || '2')}%` }}
                    />
                  </div>
                </div>

              </div>
            ) : r44State.status === 'STANDBY' ? (
              // CASO B: STANDBY (DISPONIBLE HASTA EL SIGUIENTE TURNO)
              <div className="flex-1 flex flex-col justify-between gap-6">
                
                {/* Datos del Siguiente Turno */}
                <div className="bg-[#121622]/50 border-2 border-slate-900 p-6 rounded-2xl flex-1 flex flex-col justify-center">
                  {r44State.nextBooking ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <span className="text-xs text-blue-400 uppercase tracking-widest font-black">Próxima Reserva Agendada</span>
                        <span className="text-xl font-mono font-black text-slate-200">A las {r44State.nextBooking.horaInicio} Hs</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                        <div>
                          <span className="text-xs text-slate-500 font-bold block uppercase">Alumno</span>
                          <span className="text-base font-extrabold text-slate-300 mt-1 block">
                            {r44State.nextBooking.piloto ? `${r44State.nextBooking.piloto.nombre} ${r44State.nextBooking.piloto.apellido}` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-bold block uppercase">Instructor</span>
                          <span className="text-base font-extrabold text-slate-300 mt-1 block">
                            {r44State.nextBooking.instructor ? `${r44State.nextBooking.instructor.nombre} ${r44State.nextBooking.instructor.apellido}` : '—'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-bold block uppercase">Misión programada</span>
                        <span className="text-sm text-slate-400 mt-1 block italic">
                          "{r44State.nextBooking.tema || 'Procedimientos estándar'}"
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-lg text-slate-500 italic block">No hay más turnos programados hoy</span>
                    </div>
                  )}
                </div>

                {/* Cuenta Regresiva de Tiempo Libre Restante */}
                <div className="bg-[#090c12] border-2 border-slate-900 p-8 rounded-3xl text-center flex flex-col justify-center items-center">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-black block mb-3">Tiempo Libre Disponible</span>
                  <span className="text-6xl font-mono font-black text-blue-400 tracking-wider">
                    {getFreeTime(r44State.nextBooking)}
                  </span>
                </div>

              </div>
            ) : r44State.status === 'MAINTENANCE' && r44State.booking ? (
              // CASO C: MANTENIMIENTO PROGRAMADO
              <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
                <div className="w-24 h-24 rounded-full bg-amber-950/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Wrench size={48} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-400 uppercase tracking-wider">Mantenimiento Técnico</h3>
                  <p className="text-base text-slate-400 mt-2 max-w-sm">
                    {r44State.booking.tema || 'Revisión técnica periódica de hardware y mandos.'}
                  </p>
                </div>
                <div className="bg-[#121622] border-2 border-slate-900 px-8 py-4 rounded-2xl font-mono text-xl text-slate-200">
                  Finaliza: <span className="font-black text-amber-400">{r44State.booking.horaFin} Hs</span>
                </div>
              </div>
            ) : (
              // CASO D: FUERA DE SERVICIO / OFFLINE
              <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
                <div className="w-24 h-24 rounded-full bg-red-950/30 border-2 border-red-500/30 flex items-center justify-center text-red-500">
                  <AlertTriangle size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-red-500 uppercase tracking-wider">Simulador Fuera de Servicio</h3>
                  <p className="text-base text-slate-400 mt-2 max-w-sm">
                    {r44State.sim?.notas || 'No disponible para vuelos de instrucción.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};
