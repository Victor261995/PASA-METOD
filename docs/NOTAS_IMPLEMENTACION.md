# Notas de implementación

Este desarrollo transforma el mockup estático en una aplicación React con estado controlado por backend.

Cambios deliberados respecto del prototipo:

1. Las transiciones de estado no se realizan desde JavaScript del navegador.
2. El backend valida permisos y reglas sanitarias.
3. La evidencia es persistida en MySQL y el archivo puede almacenarse localmente o por FTP.
4. El Validador es quien habilita `APTO_PARA_ADOPCION`.
5. El catálogo público filtra exclusivamente ese estado.
6. La auditoría se registra desde el backend.

## Alcance del MVP

Incluido:
- Login y roles
- Registro
- Evaluación inicial
- Protocolo basado en evidencia
- Motor de reglas
- Solicitud de validación
- Aprobación/rechazo
- Auditoría
- Catálogo público
- Solicitud de adopción
- Soporte FTP configurable

No incluido todavía:
- Recuperación de contraseña
- Gestión visual de usuarios
- Dashboard estadístico
- Notificaciones por email
- Firma digital de certificados
- Gestión avanzada de refugios
- Edición completa de solicitudes de adopción
- Producción con HTTPS real
