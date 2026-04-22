# MODENACEAC 6XSIM Backend — Guía de CI/CD con GitHub Actions

## Arquitectura del pipeline

```
Push a develop/main  →  CI (lint + typecheck + tests + build)
                              ↓
Merge a main         →  CD (Docker build → push → deploy SSH)
                              ↓
Push tag v*.*.*      →  Release (GitHub Release + imagen versionada)
Lunes 06:00 UTC      →  Security audit (npm audit + outdated)
```

---

## Workflows disponibles

| Archivo | Trigger | Jobs | Duración aprox. |
|---------|---------|------|-----------------|
| `ci.yml` | Push/PR a main o develop | lint · typecheck · test · build | ~8 min |
| `cd.yml` | Push a main | docker build · push GHCR · deploy SSH | ~10 min |
| `release.yml` | Push de tag `v*.*.*` | build · docker tag · GitHub Release | ~12 min |
| `security.yml` | Lunes 06:00 + push main | npm audit · outdated | ~3 min |

---

## Configuración inicial

### 1 — Secrets requeridos en GitHub

Ir a **Settings → Secrets and variables → Actions → New repository secret**:

#### Para el deploy (CD)
| Secret | Valor | Descripción |
|--------|-------|-------------|
| `DEPLOY_HOST` | `192.168.1.10` | IP del servidor de producción |
| `DEPLOY_USER` | `ubuntu` o `sixsim` | Usuario SSH del servidor |
| `DEPLOY_SSH_KEY` | `-----BEGIN OPENSSH...` | Clave privada SSH (sin passphrase) |
| `DEPLOY_PORT` | `22` | Puerto SSH (opcional, default 22) |

#### Para la aplicación (leídas en el servidor vía .env)
No se pasan como secrets de Actions — están en el `.env` del servidor.

### 2 — Variables de entorno de Actions (opcionales)

Ir a **Settings → Secrets and variables → Actions → Variables**:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DEPLOY_DIR` | `/opt/modenaceac-6xsim` | Directorio en el servidor |
| `DEPLOY_URL` | `http://192.168.1.10:3000` | URL del servicio para el environment |

---

## Preparar el servidor de producción

### 1 — Instalar Docker en el servidor
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker sixsim   # o el usuario que uses
```

### 2 — Crear directorio del proyecto
```bash
sudo mkdir -p /opt/modenaceac-6xsim
sudo chown sixsim:sixsim /opt/modenaceac-6xsim
cd /opt/modenaceac-6xsim
```

### 3 — Subir docker-compose.yml y .env al servidor
```bash
# Desde tu PC
scp docker-compose.yml sixsim@192.168.1.10:/opt/modenaceac-6xsim/
scp .env               sixsim@192.168.1.10:/opt/modenaceac-6xsim/
```

### 4 — Inicializar la base de datos (primera vez)
```bash
docker compose up -d postgres
sleep 5
docker compose run --rm api sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts"
```

### 5 — Generar clave SSH para GitHub Actions
```bash
# En el servidor
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

# Agregar la clave pública al authorized_keys del servidor
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# El contenido de la clave PRIVADA va en el secret DEPLOY_SSH_KEY de GitHub:
cat ~/.ssh/github_actions
```

---

## Flujo completo de trabajo

### Desarrollo diario
```bash
# 1. Crear rama de feature
git checkout -b feat/nueva-funcionalidad

# 2. Desarrollar y commitear
git add . && git commit -m "feat: descripción del cambio"

# 3. Push → dispara CI automáticamente
git push origin feat/nueva-funcionalidad

# 4. Crear Pull Request en GitHub hacia main
# → CI corre: lint + typecheck + tests + build

# 5. Merge del PR → dispara CD automáticamente
# → Docker build → push → deploy al servidor
```

### Crear un release
```bash
# Tag semántico → dispara workflow de release
git tag v4.1.0 -m "Release v4.1.0 — nuevas funcionalidades"
git push origin v4.1.0

# → Crea GitHub Release con changelog automático
# → Publica imagen Docker ghcr.io/TU-USUARIO/modenaceac-6xsim-backend:v4.1.0
```

### Deploy manual (sin merge)
Ir a **Actions → CD — Deploy → Run workflow → Seleccionar entorno**

---

## Estructura de jobs del CI

```
ci.yml
├── lint-typecheck (rápido, sin DB)
│   ├── npm ci
│   ├── prisma generate
│   ├── tsc --noEmit         ← Detecta errores de tipos
│   └── eslint (opcional)
│
└── test (depende de lint-typecheck)
    ├── Service: postgres:16-alpine
    ├── npm ci
    ├── prisma migrate deploy  ← DB limpia de test
    ├── db:seed
    ├── vitest run             ← Suite completa
    └── upload coverage artifact
```

---

## Suite de tests (tests/api.test.ts)

Cubre **9 recursos** con **25+ aserciones**:

| Recurso | Tests |
|---------|-------|
| Health | status ok · version · service name |
| Auth | login ok · login instructor Forgan · credenciales inválidas · Zod email · sin token · /me |
| Dashboard | estructura KPIs · alertas · simuladores |
| Pilotos | CRUD completo · licencia duplicada · estadísticas |
| Reservas | vista semanal · crear · solapamiento · cancelar |
| Mantenimiento | alertas · lista con diasRestantes |
| ANAC | estadísticas · sesiones para exportar |
| Log técnico | crear · resolver |
| Simuladores | lista · cambiar estado operativo |

---

## Solución de problemas comunes

**CI falla en `tsc --noEmit`**
→ Error de tipos en el código. Corregir antes de pushear.

**CI falla en los tests**
→ Ver logs del job. Pueden ser datos del seed, errores de DB o lógica incorrecta.

**CD falla en SSH**
→ Verificar que el secret `DEPLOY_SSH_KEY` contiene la clave completa incluyendo `-----BEGIN` y `-----END`.

**CD falla en healthcheck**
→ La nueva imagen puede tardar más en levantar. Aumentar el loop de 30 a 60s en el script.

**Docker image no se puede pullear desde el servidor**
→ El GitHub token de Actions no se puede usar desde fuera de CI. Usar un Personal Access Token (PAT) con permisos `packages:read` guardado como secret en el servidor en `~/.docker/config.json`.

---

*MODENACEAC · Departamento 6XSIM · Eduardo Forgan · v4.0*
