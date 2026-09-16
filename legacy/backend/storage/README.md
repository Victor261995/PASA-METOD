En desarrollo, los archivos cargados se almacenan en `storage/uploads`.
Para Apache, si querés servir estas imágenes directamente, podés crear un Alias o cambiar StorageService
para copiar al directorio público. En el MVP los documentos quedan preservados aunque una fotografía local
no tenga URL pública automáticamente.
