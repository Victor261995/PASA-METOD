# Migraciones

La aplicación se conecta a la base PASA existente.

No se incluyeron migraciones destructivas porque el backend original ya trabaja sobre tablas creadas y con datos.
Cuando se decida versionar el esquema con Laravel, crear migraciones que reproduzcan el SQL existente y probarlas primero sobre una base vacía distinta de `pasa`.
