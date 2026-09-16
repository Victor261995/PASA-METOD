<?php
class StorageService {
    public function __construct(private array $config) {}

    public function saveUploaded(array $file, string $animalCode, string $category): ?string {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
        if (($file['error'] ?? 1) !== UPLOAD_ERR_OK) throw new RuntimeException('Error al recibir el archivo.');
        if (($file['size'] ?? 0) > 8 * 1024 * 1024) throw new RuntimeException('El archivo supera 8 MB.');

        $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
        $allowed = ['jpg','jpeg','png','webp','pdf'];
        if (!in_array($ext, $allowed, true)) throw new RuntimeException('Tipo de archivo no permitido.');

        $safe = preg_replace('/[^A-Za-z0-9_-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
        $name = date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '_' . $safe . '.' . $ext;
        $remote = "$category/$animalCode/$name";

        if (($this->config['storage_driver'] ?? 'local') === 'ftp') {
            $ftp = new FtpService($this->config['ftp']);
            return $ftp->upload($file['tmp_name'], $remote);
        }

        $base = $this->config['local_storage'];
        $dir = rtrim($base,'/') . '/' . $category . '/' . $animalCode;
        if (!is_dir($dir)) mkdir($dir, 0775, true);
        $dest = $dir . '/' . $name;
        if (!move_uploaded_file($file['tmp_name'], $dest)) throw new RuntimeException('No se pudo guardar el archivo.');
        return '/storage/uploads/' . $remote;
    }
}
