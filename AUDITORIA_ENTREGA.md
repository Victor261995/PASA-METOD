# Auditoría y Tareas Requeridas para Entrega de Cátedra

## Contexto del Proyecto
El proyecto es **PASA (Plataforma de Aseguramiento Sanitario Animal)**.
Recientemente se migró el backend a **Laravel 11** y se incorporaron contenedores Docker en la rama `dev`.

## Devolución del Profesor
> "Esta muy bueno el producto, respetaron laravel 11.
> Avancen ahora con 2 puntos:
> 1. Que arranque desde el repositorio. Tal como lo mandaron faltan los archivos de Laravel que levantan la aplicación (public/index.php, storage/ y bootstrap/cache/), así que siguiendo su propio README no levanta. Clonen el repo en una máquina limpia, sigan sus pasos y no me lo manden hasta ver la API respondiendo.
> 2. Los tests, que son el centro de la materia y hoy no hay ninguno: no está la carpeta tests/ ni phpunit.xml, aunque el composer.json ya trae PHPUnit. Arranquen por los tests unitarios del motor de reglas y del protocolo sanitario, y sumen tests de la API para el flujo completo: Ingreso → Evaluación → Protocolo → Validación → Apto para adopción.
> Con esto listo estamos para montar en servidor de prueba."

---

## Tareas para OpenCode

Por favor, actúa como Lead Developer & QA Engineer y realiza las siguientes comprobaciones y correcciones directamente en el repositorio:

### Diagnóstico Inicial
1. Revisa si en la rama actual (`dev`) o en el historial de commits ya existían archivos de tests o configuraciones que quedaron sin trackear o ignorados por el `.gitignore`.
2. Inspecciona el `.gitignore` del backend:
   - Asegúrate de que no esté ignorando carpetas completas que deben mantener su estructura (como `storage/` o `bootstrap/cache/`).
   - Genera los archivos `.gitignore` internos necesarios (`!.gitignore`) dentro de `storage/framework/cache/data`, `storage/framework/sessions`, `storage/framework/views`, `storage/logs` y `bootstrap/cache` para que Git persista los directorios sin subir archivos temporales.
3. Verifica que `backend/public/index.php` exista y contenga el bootstrap estándar de Laravel 11.

### Configuración de Testing
1. Crea o restaura el archivo `backend/phpunit.xml` configurado para ejecutar pruebas sobre una base de datos SQLite en memoria (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`), de modo que los tests corran sin requerir una instancia MySQL activa.
2. Crea la carpeta `backend/tests/` con su estructura estándar:
   - `backend/tests/TestCase.php`
   - `backend/tests/Unit/`
   - `backend/tests/Feature/`

### Implementación de Tests
1. **Tests Unitarios (`backend/tests/Unit/RuleEngineTest.php`):**
   - Probar de forma aislada las funciones del motor de reglas sanitario / evaluación de protocolos sanitarios.
   - Escenario 1: Falla si falta vacuna antirrábica.
   - Escenario 2: Falla si falta desparasitación.
   - Escenario 3: Éxito con 100% de cumplimiento sanitario.
2. **Tests de Integración / API (`backend/tests/Feature/AnimalWorkflowTest.php`):**
   - Ejecutar sobre endpoints con `RefreshDatabase`.
   - Probar el flujo completo de estados:
     1. Creación de animal (`INGRESADO`).
     2. Registro de evaluación clínica (`EVALUACION`).
     3. Carga de evidencias sanitarias válidas (`PROTOCOLO_SANITARIO`).
     4. Solicitud de validación (`VALIDACION`).
     5. Aprobación por parte de un Validador (`APTO_PARA_ADOPCION`).
     6. Verificación en catálogo público (`/api/public/animales`).

### Docker y Documentación
1. Revisa el archivo `docker-compose.yml` y los `Dockerfile` para confirmar que los volúmenes montados no rompan ni oculten las carpetas `storage` o `vendor`.
2. Verifica que el comando de tests se pueda ejecutar dentro de Docker:
   `docker compose exec backend php artisan test`
   o fuera de Docker:
   `php artisan test`
3. Entrega un informe de ejecución con todos los tests en verde (`PASS`) y una lista de los archivos modificados/creados.