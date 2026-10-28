<?php
class FtpService {
    private $conn = null;
    public function __construct(private array $cfg) {}

    public function upload(string $localPath, string $remotePath): string {
        $fn = !empty($this->cfg['ssl']) ? 'ftp_ssl_connect' : 'ftp_connect';
        $this->conn = $fn($this->cfg['host'], $this->cfg['port'] ?? 21, 10);
        if (!$this->conn) throw new RuntimeException('No se pudo conectar al servidor FTP.');
        if (!ftp_login($this->conn, $this->cfg['user'], $this->cfg['pass'])) throw new RuntimeException('Login FTP fallido.');
        ftp_pasv($this->conn, true);

        $full = rtrim($this->cfg['base_dir'] ?? '', '/') . '/' . ltrim($remotePath, '/');
        $dir = dirname($full);
        $this->mkdirRecursive($dir);

        if (!ftp_put($this->conn, $full, $localPath, FTP_BINARY)) throw new RuntimeException('No se pudo subir el archivo por FTP.');
        ftp_close($this->conn);
        return $full;
    }

    private function mkdirRecursive(string $dir): void {
        $parts = array_filter(explode('/', $dir));
        $path = '';
        foreach ($parts as $part) {
            $path .= '/' . $part;
            @ftp_mkdir($this->conn, $path);
        }
    }
}
