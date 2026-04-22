# MODENACEAC 6XSIM — Sistema Integral de Gestión de Simuladores de Vuelo

**Centro de Entrenamiento Aeronáutico MODENACEAC · Departamento 6XSIM**
**Instructor de referencia: Eduardo Forgan**

---

## Estructura del proyecto

```
sistema_gestion_simuladores/
│
├── MODENACEAC_6XSIM_Demo.html          ← Demo web completa (abrir en browser)
├── 6XSIM_StatusBoard.html              ← Panel estado apaisado para sala
├── MODENACEAC_6XSIM_InformeSistema.pdf ← Informe técnico completo (22 págs)
│
├── modenaceac-6xsim-android/           ← App React Native Android (tablet instructor)
│   ├── src/
│   │   ├── screens/      SesionScreen · ManiobrasScreen · FallasScreen · etc.
│   │   ├── services/     LuaBridge.ts v2.0 (comunicación UDP con X-Plane)
│   │   ├── store/        sesionStore.ts · configStore.ts (Zustand)
│   │   ├── data/         fallas.ts (77 fallas AW109 + 26 R44 + maniobras)
│   │   └── types.ts      Tipos TypeScript completos
│   ├── android/          Proyecto Android nativo (Kotlin + recursos)
│   └── MODENACEAC_6XSIM_Bridge.lua  ← Script FlyWithLua v2.0 para X-Plane
│
├── modenaceac-6xsim-backend/           ← API REST Node.js
│   ├── src/              35+ endpoints · 11 modelos Prisma
│   ├── prisma/           Schema PostgreSQL + seed
│   ├── tests/            Suite Vitest 25+ aserciones
│   ├── .github/workflows/ 4 workflows GitHub Actions CI/CD
│   └── DEPLOY_SETUP.md   Guía de instalación
│
└── modenaceac-6xsim/                   ← Fuente para GitHub Pages
    ├── index.html        = Demo web
    ├── status.html       = Panel estado
    └── .github/workflows/pages.yml
```

## Repositorios GitHub

- Android:  https://github.com/eforgan/modenaceac-6xsim-android
- Backend:  https://github.com/eforgan/modenaceac-6xsim-backend
- Web/Pages:https://github.com/eforgan/modenaceac-6xsim

## Uso rápido

### Demo web
Abrir `MODENACEAC_6XSIM_Demo.html` en cualquier browser.
Botón 🌙/☀ en la topbar para modo oscuro/claro.

### Panel estado
Abrir `6XSIM_StatusBoard.html` en el monitor de la sala (F11 = pantalla completa).
Botón ⚙ para editar sesiones en pantalla.

### FlyWithLua Bridge
Copiar `modenaceac-6xsim-android/MODENACEAC_6XSIM_Bridge.lua` a:
`X-Plane/Resources/plugins/FlyWithLua/Scripts/`
Editar TABLET_IP con la IP de la tablet Android.

### Backend (con Docker)
```bash
cd modenaceac-6xsim-backend
cp .env.example .env   # editar DATABASE_URL y JWT_SECRET
docker compose up -d
curl http://localhost:3000/health
```

## Red WiFi recomendada
- PC X-Plane AW109:  192.168.1.101
- PC X-Plane R44:    192.168.1.102
- Servidor backend:  192.168.1.10
- Tablet Android:    192.168.1.200

---
*MODENACEAC · Departamento 6XSIM · v4.0 · Abril 2026*
