# PASA — Plataforma de Aseguramiento Sanitario Animal

MVP full-stack basado en la arquitectura suministrada para PASA.

## Stack

- **Frontend:** React + Vite + styled-components + React Router + Axios
- **Backend:** PHP 8.2+ (Laravel 11 API)
- **Base de Datos:** MySQL 8.0 / MariaDB
- **Autenticación:** Token persistido en MySQL (compatible con contraseñas hash)
- **Auditoría:** Cadena de eventos verificable con SHA-256
- **Infraestructura:** Docker + Docker Compose (opcional)

---

## Flujo del Animal

```
INGRESADO → EVALUACION → PROTOCOLO_SANITARIO → VALIDACION → APTO_PARA_ADOPCION
```

*(Estados adicionales: `CUARENTENA`, `RECHAZADO`, `ADOPTADO`)*

---

## Roles

- **OPERADOR:** Registra animales, realiza evaluación clínica inicial y sube evidencias sanitarias.
- **VALIDADOR:** Revisa y aprueba o rechaza solicitudes de paso a disponibilidad para adopción.
- **AUDITOR:** Consulta la trazabilidad inmutable y verifica cadenas SHA-256.
- **ADMIN:** Acceso completo a operaciones internas.
- **ADOPTANTE:** Usuario público que consulta el catálogo de animales aptos y envía solicitudes.

---

## Credenciales Demo

Contraseña universal para todos los usuarios de prueba:
`pasa123`

Usuarios precreados:
- `operador@pasa.local`
- `validador@pasa.local`
- `auditor@pasa.local`
- `admin@pasa.local`

---

## Estructura del Repositorio

```
PASA/
  ├── backend/               # API Backend en Laravel 11 (Oficial)
  ├── frontend/              # Aplicación Single Page App en React (Vite)
  ├── database/              # Esquema pasa.sql y seed.sql
  ├── docs/                  # Documentación de arquitectura y mockups
  ├── legacy/                # Archivo histórico (Backend PHP nativo sin framework)
  └── docker-compose.yml     # Orquestación de contenedores Docker
```

---

## Guía de Instalación y Ejecución

### 🐳 Opción A: Con Docker (Recomendada para Equipos)

Requisito: Tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y ejecutándose.

```bash
# Desde la raíz del proyecto, encender todos los servicios:
docker compose up -d
```

¡Y listo!
- **Frontend (React):** `http://localhost:5173`
- **Backend (Laravel API):** `http://localhost:8000`
- **Base de datos (MySQL):** `localhost:3306` (usuario `root`, clave `root`)

*(Para apagar el entorno: `docker compose down`)*

---

### 💻 Opción B: Ejecución Local en Windows (PowerShell)

#### 1. Base de Datos
```powershell
mysql -u root -e "CREATE DATABASE IF NOT EXISTS pasa;"
Get-Content database/pasa.sql | mysql -u root pasa
Get-Content database/seed.sql | mysql -u root pasa
```

#### 2. Backend (Laravel 11)
Desde la carpeta `backend`:
```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan storage:link
php artisan serve
```
La API escuchará en `http://127.0.0.1:8000`.

#### 3. Frontend (React + Vite)
Desde la carpeta `frontend`:
```powershell
cd frontend
npm install
npm run dev
```
El frontend escuchará en `http://localhost:5173`.

---

### 🐧 Opción C: Ejecución Local en Linux / macOS (Bash)

#### 1. Base de Datos
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS pasa;"
mysql -u root pasa < database/pasa.sql
mysql -u root pasa < database/seed.sql
```

#### 2. Backend (Laravel 11)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan storage:link
php artisan serve
```

#### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## Endpoints Principales

### Auth
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Animales
- `GET /api/animales`
- `GET /api/animales/{id}`
- `POST /api/animales`
- `PUT /api/animales/{id}`

### Evaluaciones & Evidencias
- `GET /api/animales/{id}/evaluaciones`
- `POST /api/animales/{id}/evaluaciones`
- `GET /api/animales/{id}/protocolo`
- `POST /api/animales/{id}/evidencias`
- `POST /api/animales/{id}/solicitar-validacion`

### Validaciones & Auditoría
- `GET /api/validaciones`
- `POST /api/validaciones/{id}/aprobar`
- `POST /api/validaciones/{id}/rechazar`
- `GET /api/auditoria`
- `GET /api/auditoria/verificar/{animalId}`

### Catálogo Público
- `GET /api/public/animales`
- `GET /api/public/animales/{id}`
- `POST /api/public/animales/{id}/solicitudes`
