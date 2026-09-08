# PASA — Plataforma de Aseguramiento Sanitario Animal

MVP full-stack basado en la arquitectura suministrada para PASA.

## Stack

- Frontend: React + Vite + styled-components + React Router + Axios
- Backend: PHP 8+ + Apache + PDO
- Base de datos: MySQL
- Archivos: almacenamiento local para desarrollo y soporte FTP configurable
- Autenticación: token opaco persistido en MySQL
- Auditoría: eventos encadenados con SHA-256 para detectar modificaciones

## Flujo del animal

INGRESADO → EVALUACION → PROTOCOLO_SANITARIO → VALIDACION → APTO_PARA_ADOPCION

También se contemplan CUARENTENA, RECHAZADO y ADOPTADO.

## Roles

- OPERADOR: registra animales, realiza evaluación y carga evidencias
- VALIDADOR: aprueba o rechaza solicitudes
- AUDITOR: consulta trazabilidad
- ADMIN: acceso completo
- ADOPTANTE: acceso público al catálogo y solicitudes de adopción

## Credenciales demo

Todos usan la contraseña:

    pasa123

Usuarios:

- operador@pasa.local
- validador@pasa.local
- auditor@pasa.local
- admin@pasa.local

## 1. Base de datos

Crear la base ejecutando:

    database/pasa.sql
    database/seed.sql

Con phpMyAdmin se pueden importar ambos archivos en ese orden.

## 2. Backend en XAMPP

Copiar la carpeta `backend` dentro de:

    C:\xampp\htdocs\pasa\backend

Editar:

    backend/config/config.php

Si tu MySQL usa otras credenciales o puerto, modificarlos allí.

Iniciar Apache y MySQL en XAMPP.

La API quedará en:

    http://localhost/pasa/backend/public

El archivo `.htaccess` necesita `mod_rewrite`. En XAMPP normalmente ya está disponible.

## 3. Frontend

Desde `frontend`:

    npm install
    npm run dev

El frontend usa por defecto:

    http://localhost/pasa/backend/public

Puede cambiarse creando `.env`:

    VITE_API_URL=http://localhost/pasa/backend/public

## 4. Archivos / FTP

Para que el MVP sea ejecutable sin instalar un servidor FTP adicional, por defecto usa almacenamiento local:

    backend/storage/uploads

En `backend/config/config.php` se puede cambiar:

    'storage_driver' => 'ftp'

y configurar host, usuario y contraseña. El servicio `FtpService.php` ya está incluido.

## 5. Seguridad

- Las contraseñas se verifican con `password_verify`.
- Los tokens se generan con `random_bytes`.
- Las rutas privadas exigen autenticación y roles.
- El catálogo público solo devuelve animales `APTO_PARA_ADOPCION`.
- La auditoría SHA-256 permite detectar alteraciones en la cadena de eventos, pero no convierte por sí sola la base en un sistema físicamente inmutable.

## 6. Endpoints principales

### Auth
- POST `/api/login`
- POST `/api/logout`
- GET `/api/me`

### Animales
- GET `/api/animales`
- GET `/api/animales/{id}`
- POST `/api/animales`
- PUT `/api/animales/{id}`

### Evaluaciones
- GET `/api/animales/{id}/evaluaciones`
- POST `/api/animales/{id}/evaluaciones`

### Protocolo / evidencias
- GET `/api/animales/{id}/protocolo`
- POST `/api/animales/{id}/evidencias`
- POST `/api/animales/{id}/solicitar-validacion`

### Validaciones
- GET `/api/validaciones`
- POST `/api/validaciones/{id}/aprobar`
- POST `/api/validaciones/{id}/rechazar`

### Auditoría
- GET `/api/auditoria`
- GET `/api/animales/{id}/auditoria`
- GET `/api/auditoria/verificar/{animalId}`

### Público
- GET `/api/public/animales`
- GET `/api/public/animales/{id}`
- POST `/api/public/animales/{id}/solicitudes`

## Estructura

    PASA/
      frontend/
      backend/
      database/
      docs/

## Ejecución alternativa sin XAMPP (PHP CLI + MariaDB/MySQL CLI)

### 1. Importar Base de Datos por Consola

Crear la base de datos e importar el esquema y los datos iniciales usando la CLI de MySQL/MariaDB:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS pasa;"
mysql -u root pasa < database/pasa.sql
mysql -u root pasa < database/seed.sql
```

*(Si tu usuario requiere contraseña, agrega `-p` después de `-u root`)*.

### 2. Levantar el Backend con el servidor embebido de PHP

Desde la raíz del proyecto, ejecuta:

```bash
php -S 127.0.0.1:8000 -t backend/public backend/public/index.php
```

La API quedará escuchando en: `http://127.0.0.1:8000`

### 3. Configurar Frontend

Para vincular el frontend con el servidor embebido de PHP, crea un archivo `.env` en la carpeta `frontend/`:

```env
VITE_API_URL=http://127.0.0.1:8000
```


