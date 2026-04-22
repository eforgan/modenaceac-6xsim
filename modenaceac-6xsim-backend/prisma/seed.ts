// prisma/seed.ts — Datos iniciales MODENACEAC 6XSIM
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MODENACEAC 6XSIM database...');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash('Admin6XSIM2024!', 12);
  const instHash   = await bcrypt.hash('Instructor2024!', 12);
  const opHash     = await bcrypt.hash('Operador2024!',   12);

  const admin = await prisma.usuario.upsert({
    where:  { email: 'admin@modenaceac.ar' },
    update: {},
    create: {
      email:        'admin@modenaceac.ar',
      passwordHash: adminHash,
      nombre:       'Sistema',
      apellido:     'Administrador',
      rol:          'ADMIN',
    },
  });

  const instructora = await prisma.usuario.upsert({
    where:  { email: 'l.rivas@modenaceac.ar' },
    update: {},
    create: {
      email:        'l.rivas@modenaceac.ar',
      passwordHash: instHash,
      nombre:       'Laura',
      apellido:     'Rivas',
      rol:          'INSTRUCTOR',
    },
  });

  const instructor2 = await prisma.usuario.upsert({
    where:  { email: 'p.torres@modenaceac.ar' },
    update: {},
    create: {
      email:        'p.torres@modenaceac.ar',
      passwordHash: instHash,
      nombre:       'Pablo',
      apellido:     'Torres',
      rol:          'INSTRUCTOR',
    },
  });

  await prisma.usuario.upsert({
    where:  { email: 'op@modenaceac.ar' },
    update: {},
    create: {
      email:        'op@modenaceac.ar',
      passwordHash: opHash,
      nombre:       'Raúl',
      apellido:     'Nuñez',
      rol:          'OPERADOR',
    },
  });

  console.log('✓ Usuarios creados');

  // ── Simuladores ───────────────────────────────────────────────────────────
  const simAW = await prisma.simulador.upsert({
    where:  { id: 'sim-aw109-001' },
    update: {},
    create: {
      id:            'sim-aw109-001',
      nombre:        'AgustaWestland AW109E',
      aeronave:      'AW109',
      xplaneVersion: 'XP11',
      xplaneIp:      '192.168.1.101',
      operativo:     true,
      ultimaRevision:new Date('2026-04-01'),
    },
  });

  const simR44 = await prisma.simulador.upsert({
    where:  { id: 'sim-r44-001' },
    update: {},
    create: {
      id:            'sim-r44-001',
      nombre:        'Robinson R44 II',
      aeronave:      'R44',
      xplaneVersion: 'XP11',
      xplaneIp:      '192.168.1.102',
      operativo:     true,
      ultimaRevision:new Date('2026-04-01'),
    },
  });

  console.log('✓ Simuladores creados');

  // ── Pilotos ───────────────────────────────────────────────────────────────
  const pilotos = await Promise.all([
    prisma.piloto.upsert({
      where:  { licencia: 'PPL-H-0741' },
      update: {},
      create: {
        nombre:         'Marcos',
        apellido:       'Alvarez',
        licencia:       'PPL-H-0741',
        email:          'm.alvarez@ejercito.mil.ar',
        habAW109:       true,
        habR44:         true,
        habIFR:         true,
        psicofisicoVto: new Date('2026-09-30'),
        totalHoras:     248.5,
        totalSesiones:  36,
      },
    }),
    prisma.piloto.upsert({
      where:  { licencia: 'PPL-H-0892' },
      update: {},
      create: {
        nombre:         'Diego',
        apellido:       'Ferreira',
        licencia:       'PPL-H-0892',
        email:          'd.ferreira@ejercito.mil.ar',
        habAW109:       true,
        habR44:         true,
        habIFR:         false,
        psicofisicoVto: new Date('2026-07-15'),
        totalHoras:     112.0,
        totalSesiones:  18,
      },
    }),
    prisma.piloto.upsert({
      where:  { licencia: 'PPL-H-1103' },
      update: {},
      create: {
        nombre:         'Ana',
        apellido:       'Suárez',
        licencia:       'PPL-H-1103',
        email:          'a.suarez@ejercito.mil.ar',
        habAW109:       false,
        habR44:         true,
        habIFR:         false,
        psicofisicoVto: new Date('2026-05-20'),  // Por vencer pronto ⚠
        totalHoras:     54.0,
        totalSesiones:  9,
      },
    }),
    prisma.piloto.upsert({
      where:  { licencia: 'PPL-H-0654' },
      update: {},
      create: {
        nombre:         'Roberto',
        apellido:       'Méndez',
        licencia:       'PPL-H-0654',
        email:          'r.mendez@ejercito.mil.ar',
        habAW109:       true,
        habR44:         true,
        habIFR:         true,
        psicofisicoVto: new Date('2026-12-31'),
        totalHoras:     380.0,
        totalSesiones:  52,
      },
    }),
  ]);

  console.log('✓ Pilotos creados');

  // ── Tareas de mantenimiento ───────────────────────────────────────────────
  const tareas = [
    // AW109
    { simuladorId:simAW.id, titulo:'Inspección visual diaria AW109', descripcion:'Revisión visual completa de la cabina, controles y sistemas. Verificar que no haya daños, FOD o irregularidades.', frecuencia:'DIARIA' as const, critica:false, proximaFecha: new Date() },
    { simuladorId:simAW.id, titulo:'Verificación conectividad UDP AW109', descripcion:'Test completo de conexión UDP FlyWithLua (puertos 49001 y 49002). Verificar telemetría y comandos de falla.', frecuencia:'SEMANAL' as const, critica:true, proximaFecha: new Date() },
    { simuladorId:simAW.id, titulo:'Calibración IDS / EDU AW109', descripcion:'Verificar calibración de EDU1 y EDU2 contra valores reales del RFM. Validar datarefs de N1, TOT y Torque.', frecuencia:'MENSUAL' as const, critica:true, proximaFecha: new Date(Date.now() + 15*24*60*60*1000) },
    { simuladorId:simAW.id, titulo:'Actualización X-Plane y plugins AW109', descripcion:'Verificar actualizaciones disponibles de X-Plane, FlyWithLua y el modelo de aeronave AW109E.', frecuencia:'TRIMESTRAL' as const, critica:false, proximaFecha: new Date(Date.now() + 45*24*60*60*1000) },
    { simuladorId:simAW.id, titulo:'Mantenimiento preventivo PC simulador AW109', descripcion:'Limpieza física, verificación de hardware, temperatura y rendimiento. Desfragmentación y optimización del disco SSD.', frecuencia:'SEMESTRAL' as const, critica:true, proximaFecha: new Date(Date.now() + 90*24*60*60*1000) },
    // R44
    { simuladorId:simR44.id, titulo:'Inspección visual diaria R44', descripcion:'Revisión visual completa de la cabina, controles y sistema de audio.', frecuencia:'DIARIA' as const, critica:false, proximaFecha: new Date() },
    { simuladorId:simR44.id, titulo:'Verificación conectividad UDP R44', descripcion:'Test completo de conexión UDP con X-Plane. Verificar telemetría, comandos de falla y governor.', frecuencia:'SEMANAL' as const, critica:true, proximaFecha: new Date() },
    { simuladorId:simR44.id, titulo:'Calibración instrumentos analógicos R44', descripcion:'Verificar calibración de altímetro, velocímetro, VSI y RPM contra datarefs de X-Plane.', frecuencia:'MENSUAL' as const, critica:false, proximaFecha: new Date(Date.now() + 20*24*60*60*1000) },
    // Ambos
    { simuladorId:null, titulo:'Revisión lista de datarefs y fallas', descripcion:'Verificar todos los datarefs de fallas contra DataRefTool en X-Plane. Actualizar lista si hay cambios con actualizaciones.', frecuencia:'TRIMESTRAL' as const, critica:true, proximaFecha: new Date(Date.now() + 60*24*60*60*1000) },
    { simuladorId:null, titulo:'Actualización manual de instrucción 6XSIM', descripcion:'Revisar y actualizar los manuales y checklists del sistema contra las últimas revisiones del POH/RFM.', frecuencia:'ANUAL' as const, critica:false, proximaFecha: new Date(Date.now() + 180*24*60*60*1000) },
  ];

  for (const t of tareas) {
    await prisma.tareaMantenimiento.upsert({
      where:  { id: `maint-${t.titulo.slice(0,20).replace(/\s/g,'-').toLowerCase()}` },
      update: {},
      create: { ...t, id: `maint-${t.titulo.slice(0,20).replace(/\s/g,'-').toLowerCase()}` },
    });
  }

  console.log('✓ Tareas de mantenimiento creadas');

  // ── Reservas de ejemplo ───────────────────────────────────────────────────
  const hoy = new Date();

  await prisma.reserva.createMany({
    skipDuplicates: true,
    data: [
      {
        simuladorId:  simAW.id,
        pilotoId:     pilotos[0].id,
        instructorId: instructora.id,
        tipo:         'VUELO',
        estado:       'CONFIRMADA',
        fecha:        hoy,
        horaInicio:   '09:00',
        horaFin:      '11:00',
        tema:         'OEI en crucero e ILS con falla AFCS',
      },
      {
        simuladorId:  simR44.id,
        pilotoId:     pilotos[2].id,
        instructorId: instructor2.id,
        tipo:         'VUELO',
        estado:       'CONFIRMADA',
        fecha:        hoy,
        horaInicio:   '14:00',
        horaFin:      '16:00',
        tema:         'Autorrotación y falla de motor',
      },
      {
        simuladorId:  simAW.id,
        pilotoId:     pilotos[1].id,
        instructorId: instructora.id,
        tipo:         'VUELO',
        estado:       'PENDIENTE',
        fecha:        new Date(hoy.getTime() + 24*60*60*1000),
        horaInicio:   '09:00',
        horaFin:      '11:00',
        tema:         'Procedimientos AFCS en IMC',
      },
      {
        simuladorId:  simAW.id,
        pilotoId:     null,
        instructorId: null,
        tipo:         'MANT',
        estado:       'PENDIENTE',
        fecha:        new Date(hoy.getTime() + 48*60*60*1000),
        horaInicio:   '08:00',
        horaFin:      '10:00',
        tema:         'Mantenimiento preventivo semanal',
        notas:        'Verificar conectividad UDP y calibración IDS',
      },
    ],
  });

  console.log('✓ Reservas de ejemplo creadas');

  // ── Log técnico inicial ───────────────────────────────────────────────────
  await prisma.logTecnico.createMany({
    skipDuplicates: true,
    data: [
      {
        id:          'log-001',
        simuladorId: simAW.id,
        tipo:        'INFO',
        descripcion: 'Sistema iniciado. Conectividad UDP verificada correctamente.',
        operador:    'Téc. R. Nuñez',
        resolucion:  'N/A — Sin inconvenientes',
        resueltoEn:  new Date(),
      },
      {
        id:          'log-002',
        simuladorId: simR44.id,
        tipo:        'ALERTA',
        descripcion: 'Latencia UDP elevada detectada (>80ms). Posible congestión de red WiFi.',
        operador:    'Téc. R. Nuñez',
      },
    ],
  });

  console.log('✓ Logs técnicos creados');

  console.log('');
  console.log('✅ Seed completado exitosamente');
  console.log('');
  console.log('Credenciales de acceso:');
  console.log('  Admin:      admin@modenaceac.ar     / Admin6XSIM2024!');
  console.log('  Instructor: l.rivas@modenaceac.ar   / Instructor2024!');
  console.log('  Operador:   op@modenaceac.ar         / Operador2024!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
