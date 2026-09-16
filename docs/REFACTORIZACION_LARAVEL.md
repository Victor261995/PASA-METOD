# Refactorización y Consolidación del Backend en Laravel 11

**Fecha:** 16 de septiembre de 2026  
**Rama Git:** `refactor/archivar-legacy-laravel`  
**Autor:** Equipo de Desarrollo / PASA  

---

## 🎯 1. Objetivo de la Refactorización

El proyecto PASA contaba con dos soluciones de backend conviviendo en la raíz del repositorio:
1. Un backend en PHP nativo script/monolítico (`/backend`).
2. Una migración a Laravel 11 (`/PASA-Laravel-11`).

Esta refactorización tiene como objetivo **consolidar el desarrollo en Laravel 11** como el backend principal y oficial del sistema, archivando la implementación nativa previa para referencia histórica sin perder trazabilidad en el control de versiones.

---

## 📂 2. Reorganización de la Estructura de Archivos

Se aplicaron los siguientes movimientos en el repositorio manteniendo el historial de Git mediante `git mv`:

| Ubicación Original | Nueva Ubicación | Descripción / Propósito |
| :--- | :--- | :--- |
| `/backend` | `/legacy/backend` | Preserva el código PHP nativo script inicial en modo archivo. |
| `/PASA-Laravel-11` | `/backend` | Promueve la API en Laravel 11 como el backend oficial del repositorio. |

### Estructura Consolidada del Repositorio:

```
PASA-METOD/
  ├── backend/               # API Oficial en Laravel 11
  ├── frontend/              # Aplicación React + Vite SPA
  ├── database/              # Scripts SQL (pasa.sql y seed.sql)
  ├── docs/                  # Documentación del proyecto
  └── legacy/                # Archivo del backend PHP nativo histórico
```

---

## 🔧 3. Ajustes de Configuración e Integración

1. **Frontend BaseURL Default:**
   - Se actualizó el cliente Axios en `frontend/src/api/api.js` para usar por defecto la URL `http://127.0.0.1:8000` (puerto por defecto de `php artisan serve`), manteniendo el soporte para la variable de entorno `VITE_API_URL`.

2. **Compatibilidad del Contrato REST:**
   - La implementación en Laravel 11 mantiene la compatibilidad total con los endpoints existentes consumidos por el frontend:
     - `POST /api/login`, `POST /api/logout`, `GET /api/me`
     - `GET/POST/PUT /api/animales`
     - `GET/POST /api/animales/{id}/evaluaciones`
     - `GET/POST /api/animales/{id}/protocolo`, `/evidencias`, `/solicitar-validacion`
     - `GET/POST /api/validaciones` y `/api/validaciones/{id}/(aprobar|rechazar)`
     - `GET /api/auditoria` y `/api/auditoria/verificar/{animalId}`
     - Endpoints públicos `/api/public/animales` y `/solicitudes`.

3. **Documentación Raíz:**
   - Se reestructuró el archivo `README.md` principal para guiar a los desarrolladores directamente en el flujo de trabajo consolidado con Laravel 11.

---

## 🚀 4. Guía de Inicio Rápido (Backend Consolidado)

Para levantar el backend consolidado en un entorno de desarrollo local:

```bash
# 1. Acceder al backend
cd backend

# 2. Instalar dependencias PHP
composer install

# 3. Crear y configurar .env
cp .env.example .env

# 4. Generar clave de aplicación y symlink de almacenamiento
php artisan key:generate
php artisan storage:link

# 5. Iniciar servidor de desarrollo
php artisan serve
```

---

## 🔮 5. Próximos Pasos Recomendados

1. **Dockerización:** Crear el archivo `docker-compose.yml` en la raíz para orquestar los contenedores de MySQL, Laravel Backend y React Frontend.
2. **Pruebas de Integración:** Verificar el flujo completo del animal (Ingreso $\rightarrow$ Evaluación $\rightarrow$ Protocolo $\rightarrow$ Validación $\rightarrow$ Adopción) sobre la API de Laravel.
