# PASA — Plataforma de Aseguramiento Sanitario Animal

MVP full-stack basado en la arquitectura suministrada para PASA.

## Stack

- **Frontend:** React + Vite + styled-components + React Router + Axios
- **Backend:** PHP 8.2+ (Laravel 11 API)
- **Base de Datos:** MySQL / MariaDB
- **Autenticación:** Token persistido en MySQL (compatible con contraseñas hash)
- **Auditoría:** Cadena de eventos verificable con SHA-256

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
  └── legacy/                # Archivo histórico (Backend PHP nativo sin framework)
```

---

## Guía de Instalación y Ejecución

### 1. Base de Datos
Crear e importar la base de datos MySQL/MariaDB:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS pasa;"
mysql -u root pasa < database/pasa.sql
mysql -u root pasa < database/seed.sql
```

### 2. Backend (Laravel 11)

Desde la carpeta `backend`:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan storage:link
php artisan serve
```

La API quedará escuchando en `http://127.0.0.1:8000`.

### 3. Frontend (React + Vite)

Desde la carpeta `frontend`:

```bash
cd frontend
npm install
npm run dev
```

El frontend escuchará por defecto en `http://localhost:5173` y apuntará a `http://127.0.0.1:8000`.

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
