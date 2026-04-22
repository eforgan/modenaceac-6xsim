# Informe Arquitectónico: Sistema Integral MODENACEAC 6XSIM

**Versión:** 2.0 (Post-Migración React)
**Fecha:** 21 de Abril de 2026
**Departamento:** MODENACEAC - Gestión de Simuladores

---

## 1. Visión General del Proyecto

El sistema **6XSIM** es una suite de hardware y software diseñada para administrar, monitorear y registrar el entrenamiento de pilotos en los simuladores de vuelo del MODENACEAC (principalmente plataformas Agusta AW109 y Robinson R44 ejecutando X-Plane 11).

La arquitectura ha sido recientemente modernizada para soportar alta resiliencia ante caídas de red (*Offline-First*), capacidades de conexión "Zero-Config" vía descubrimiento automático (Auto-Discovery) y una renovación estética integral de Grado Aeronáutico.

El ecosistema se divide en 4 pilares fundamentales:
1. **El Motor de Simulación (X-Plane + Lua Bridge)**
2. **El Frontend Táctico (React + Vite Web App)**
3. **El Frontend Operativo Móvil (Android React Native App)**
4. **El Backend Central (Node.js + Prisma PostgreSQL)**

---

## 2. Descripción de Componentes y Flujos

### 2.1. Componente 1: X-Plane Lua Bridge (`modenaceac-6xsim-android/MODENACEAC_6XSIM_Bridge.lua`)
Este script reside dentro del simulador (plugin FlyWithLua) y es el corazón central de la extracción de datos físicos.
*   **Funciones:** Recoge DataRefs vitales (Altitud, Velocidad, RPM, Heading, Pitch/Roll) calculadas por las físicas de X-Plane a altísima frecuencia.
*   **Auto-Discovery:** Recientemente se le implementó un socket UDP en el puerto `49003`. Está programado para "escuchar" la red LAN y, al oír un ping de "Estoy aquí" proveniente de la Tablet o la Web, registra automáticamente la dirección IP de destino para comenzar a despacharle telemetría sin requerir que los instructores configuren las IPs manualmente.
*   **Telemetría UDP (`49001` y `49002`):** Envía empaquetamientos estructurales hacia la aplicación y recibe comandos externos (como fallas inyectadas: apagar un motor, fallar hidráulica).

### 2.2. Componente 2: Frontend Web (Dashboard & Briefing Monitor)
Migrado de un archivo HTML crudo hacia una robusta **Progressive Web App construida en React, TypeScript y Vite**.
*   **UI/UX Premium:** Estilizado mediante variables nativas CSS utilizando los lineamientos corporativos (Glassmorphism avanzado, Sombras dinámicas y tipografía "Inter"). Se ajusta orgánicamente respondiendo a orientaciones verticales y horizontales de tablets.
*   **Pantalla de Status (`/status`):** Una vista separada arquitectónicamente pensada para "Briefing Rooms". Carece de menús de navegación, está fijada en alto contraste y detalla en tiempo real, de manera predictiva, a qué hora exactamente finalizarán las sesiones en curso (`Fin Previsto`) y quién es el piloto asignado al `Próximo Turno`.
*   **Gestión Centralizada (Zustand):** Depende completamente de `src/store/uiStore.ts`, operando un bucle temporal independiente que muta la telemetría falsa e hidrata uniformemente los componentes modulares (`Cards`, `Badges`).

### 2.3. Componente 3: Aplicación Android Offline-First
La herramienta en cabina utilizada por el Instructor (IOS - Instructor Operating Station), basada en **React Native**.
*   **Emisor de Auto-Discovery:** Al carecer de conexión inicial, dispara broadcasts (`255.255.255.255`) sistemáticos usando la clase `LuaBridge.ts` hasta que el motor Lua lo registra.
*   **Sync Asíncrono (Redundancia Offline):** Toda sesión finalizada de vuelo viaja comúnmente al Backend. Si la Tablet pierde Wi-Fi (algo frecuente en hangares con interferencia electromagnética), `sesionStore.ts` atrapa el JSON de la evaluación técnica y lo encripta temporalmente en el `AsyncStorage` del dispositivo bajo la etiqueta `@sync_queue`.
*   **Workers en Background:** Tras la reconexión de red (`NetInfo`), `App.tsx` transfiere automáticamente la cola retenida hacia el Backend sin pérdida de datos.

### 2.4. Componente 4: Backend Node.js
El servidor central transaccional encaramado en Express.js y acoplado a una base de datos PostgreSQL.
*   **CORS Dinámico:** En lugar de estipular una lista blanca rígida, `app.ts` aplica una expresión regular segura que convalida el tráfico entrante de cualquier IP local/privada típica (`192.168.x.x`, `10.x.x.x`). Esto es fundamental en infraestructuras aeronáuticas que mutan las subredes de sus routers DHCP.
*   **Prisma ORM:** Maneja el esquema relacional (`schema.prisma`) asegurando coherencia temporal entre la asignación de `Pilotos`, `Reservas`, cronogramas del `Simulador` y un sistema detallado de control de Mantenimiento (`Log Técnico`).

---

## 3. Integración Universal y Flujo de Vida de una Sesión 

1.  **Agendamiento:** A través del Dashboard (`Web Frontend`), la Gerencia programa un vuelo para un alumno. Este registro impacta en PostgreSQL (vía `Backend`).
2.  **Briefing:** Horas antes del turno, el *Status Monitor* montado en la sala de Briefing consulta los datos y pronostica temporalmente la utilización en pantalla del AW109.
3.  **Boot de Cabina:** El instructor enciende la Tablet Android en la cabina; su dispositivo lanza "pings" ciegos por la red LAN. X-Plane despierta cargando `MODENACEAC_6XSIM_Bridge.lua`, ataja el rastro UDP del instructor y empieza a inyectar telemetría.
4.  **Operación:** El instructor en `Android` visualiza diales, inyecta fallas meteorológicas y califica "OEI" (One Engine Inoperative) con "Satisfactorio".
5.  **Cierre Inestable:** El instructor da por terminada la sesión pero el Router cae. La Tablet archiva la evaluación cifrada localmente.
6.  **Sincronización:** El equipo de soporte reinicia el router. La tablet percibe el pulso web y descarga sus registros al `Backend`, volviendo a reflejar los KPI operativos e hitos en el React Web Dashboard general.

---
*Documento generado por IA Avanzada de Sistemas. Sistema 6XSIM Architecture v2.0.*
