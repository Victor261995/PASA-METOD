# PASA - Backend Laravel 11

Conversión del backend PHP puro de PASA a Laravel 11 manteniendo la API que ya consume el frontend React.

## Requisitos

- PHP 8.2+ (el proyecto académico puede usar PHP 8.3)
- Composer
- MySQL
- Base de datos existente `pasa`

## Instalación en Windows/XAMPP

1. Copiar esta carpeta, por ejemplo, a:

   `C:\xampp2\htdocs\pasa\backend-laravel`

2. Abrir PowerShell dentro de la carpeta.

3. Instalar dependencias:

   `composer install`

4. Crear `.env`:

   `Copy-Item .env.example .env`

5. Completar en `.env` el usuario y contraseña reales de MySQL.

6. Generar la clave:

   `php artisan key:generate`

7. Crear el enlace para archivos públicos:

   `php artisan storage:link`

8. Limpiar caché:

   `php artisan optimize:clear`

9. Levantar Laravel:

   `php artisan serve`

   Por defecto quedará en `http://127.0.0.1:8000`.

10. En el frontend React usar:

   `VITE_API_URL=http://127.0.0.1:8000`

   El archivo `api.js` ya agrega `/api/...` en cada llamada, por lo que NO debe ponerse `/api` al final de `VITE_API_URL`.

## Base de datos

Este proyecto está preparado para usar las tablas PASA existentes:

- usuarios
- auth_tokens
- animales
- evaluaciones_clinicas
- protocolos_sanitarios
- evidencias
- validaciones
- auditoria
- solicitudes_adopcion

No ejecutes `php artisan migrate:fresh` sobre tu base actual.

## Autenticación

Se conservó el contrato actual del frontend:

- `POST /api/login`
- devuelve `{ token, user }`
- las rutas privadas reciben `Authorization: Bearer <token>`
- token con hash SHA-256 en `auth_tokens`
- expiración de 8 horas

Esto permite migrar a Laravel sin obligar a reescribir ahora el AuthContext de React.

## Roles

- OPERADOR: registro, evaluación, protocolo y evidencias.
- VALIDADOR: validaciones.
- AUDITOR: auditoría.
- ADMIN: acceso a todas las operaciones internas.

## Flujo

`INGRESADO -> EVALUACION -> PROTOCOLO_SANITARIO -> VALIDACION -> APTO_PARA_ADOPCION`

Una validación rechazada vuelve a `PROTOCOLO_SANITARIO`.

`REQUIERE_ATENCION` y `CUARENTENA` llevan al estado `CUARENTENA`.

## CORS

`.env.example` acepta ambos puertos usados durante el desarrollo:

`CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174`

Si Vite usa otro puerto, agregarlo a esa variable.

## Auditoría

La versión Laravel usa el algoritmo corregido: el hash se puede reconstruir y verificar. Si la tabla `auditoria` contiene registros creados con la versión PHP antigua que agregaba un `nonce` no almacenado, esos registros no son compatibles con la verificación nueva. Para pruebas de desarrollo, usar un animal nuevo y generar una cadena nueva completa.
