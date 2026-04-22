# MODENACEAC 6XSIM — Backend API

API REST para el sistema integral de gestión de simuladores de vuelo.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 + TypeScript |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT (jsonwebtoken) |
| Validación | Zod |
| PDF | Puppeteer (Chromium headless) |
| Logging | Winston |
| Contenedores | Docker + docker-compose |

---

## Endpoints disponibles

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login con email/password → JWT |
| GET  | `/api/auth/me`    | Perfil del usuario autenticado |
| POST | `/api/auth/change-password` | Cambiar contraseña |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | KPIs generales, alertas, próximas reservas |

### Sesiones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/sesiones` | Listar sesiones con filtros y paginación |
| POST | `/api/sesiones` | Crear nueva sesión |
| GET  | `/api/sesiones/:id` | Detalle completo con evaluaciones y fallas |
| PUT  | `/api/sesiones/:id` | Actualizar sesión |
| POST | `/api/sesiones/:id/finalizar` | Finalizar sesión con evaluaciones + firma |
| POST | `/api/sesiones/:id/pdf` | Generar PDF con Puppeteer |

### Pilotos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/pilotos` | Listar pilotos con alerta de psicofísico |
| POST | `/api/pilotos` | Crear piloto |
| GET  | `/api/pilotos/:id` | Detalle + últimas sesiones |
| PUT  | `/api/pilotos/:id` | Actualizar piloto |
| GET  | `/api/pilotos/:id/estadisticas` | Horas, distribución de evaluaciones |

### Reservas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/reservas` | Listar reservas con filtros |
| GET  | `/api/reservas/semana` | Vista semanal por simulador (calendario) |
| POST | `/api/reservas` | Crear reserva (valida solapamiento) |
| GET  | `/api/reservas/:id` | Detalle |
| PUT  | `/api/reservas/:id` | Actualizar |
| POST | `/api/reservas/:id/cancelar` | Cancelar reserva |

### Mantenimiento
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/mantenimiento` | Listar tareas con días restantes |
| GET  | `/api/mantenimiento/alertas` | Tareas vencidas y próximas a vencer |
| POST | `/api/mantenimiento` | Crear tarea |
| PUT  | `/api/mantenimiento/:id` | Actualizar tarea |
| POST | `/api/mantenimiento/:id/completar` | Marcar como completada y calcular próxima |
| GET  | `/api/mantenimiento/:id/historial` | Historial de realizaciones |

### ANAC (RAA 61.57 / 135.293)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/anac/sesiones` | Sesiones listas para exportar (firmadas) |
| GET  | `/api/anac/estadisticas` | KPIs de cumplimiento ANAC |
| POST | `/api/anac/exportar` | Generar PDF + CSV oficial para ANAC |

### Simuladores
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/simuladores` | Listar simuladores |
| GET  | `/api/simuladores/:id` | Detalle con sesiones y tareas |
| PUT  | `/api/simuladores/:id` | Actualizar |
| PATCH| `/api/simuladores/:id/estado` | Cambiar operativo/inoperativo |

### Log técnico
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/log` | Listar logs con filtros |
| POST | `/api/log` | Registrar nuevo evento |
| PATCH| `/api/log/:id/resolver` | Marcar como resuelto |

---

## Inicio rápido

### 1 — Configurar entorno

```bash
cp .env.example .env
# Editar .env con las variables correctas
```

### 2 — Docker (recomendado)

```bash
# Levantar PostgreSQL + API
docker compose up -d

# Con Prisma Studio
docker compose --profile dev up -d

# Ver logs
docker compose logs -f api
```

### 3 — Local (sin Docker)

**Requisitos:** Node.js 20 LTS + PostgreSQL 16

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Cargar datos iniciales
npm run db:seed

# Iniciar en desarrollo (hot reload)
npm run dev
```

### 4 — Verificar que funciona

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"MODENACEAC 6XSIM Backend","version":"4.0.0"}

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@modenaceac.ar","password":"Admin6XSIM2024!"}'
```

---

## Credenciales de desarrollo (seed)

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin | admin@modenaceac.ar | Admin6XSIM2024! | ADMIN |
| Instructora | l.rivas@modenaceac.ar | Instructor2024! | INSTRUCTOR |
| Instructor | p.torres@modenaceac.ar | Instructor2024! | INSTRUCTOR |
| Operador | op@modenaceac.ar | Operador2024! | OPERADOR |

---

## Generación de PDFs

Los PDFs se generan con Puppeteer (Chromium headless) y se guardan en `./pdfs/`.

**Reporte individual de sesión** (`POST /api/sesiones/:id/pdf`):
- Datos de tripulación y simulador
- Condiciones meteorológicas
- Evaluación maniobra por maniobra con criterios AS/S/SB/NA
- Fallas inyectadas con datarefs
- Evaluación global con firma digital embebida
- Pie conforme RAA 61.57 / 135.293

**Exportación masiva ANAC** (`POST /api/anac/exportar`):
- Tabla consolidada de todas las sesiones del período
- KPIs de cumplimiento (total horas, por aeronave, distribución evaluaciones)
- Membrete oficial MODENACEAC
- También genera CSV con BOM UTF-8 (compatible con Excel argentino)

---

## Arquitectura

```
src/
├── server.ts          ← Entry point, graceful shutdown
├── app.ts             ← Express setup, middleware, rutas
├── middleware/
│   ├── auth.ts        ← JWT validation, requireRol()
│   └── errorHandler.ts← Zod + Prisma errors → HTTP responses
├── routes/            ← Solo define rutas, delega a controllers
├── controllers/       ← Lógica de negocio + DB queries
├── services/
│   └── pdfService.ts  ← Puppeteer PDF generation
└── utils/
    ├── logger.ts      ← Winston
    ├── prisma.ts      ← Prisma singleton
    └── csv.ts         ← CSV generation con BOM UTF-8
```

---

## Variables de entorno importantes

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | requerido |
| `JWT_SECRET` | Secreto para firmar tokens | requerido |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `PDF_OUTPUT_DIR` | Directorio para PDFs generados | `./pdfs` |
| `PUPPETEER_EXECUTABLE_PATH` | Path a Chromium | auto |
| `CORS_ORIGINS` | Origins permitidos (separados por coma) | `localhost:3001` |

---

*MODENACEAC · Departamento 6XSIM · v4.0 · Abril 2026*
