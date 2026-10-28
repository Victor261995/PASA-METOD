<?php
class AuthService {
    public function __construct(private PDO $db) {}

    public function login(string $email, string $password): array {
        $st = $this->db->prepare("SELECT id,nombre,apellido,email,password_hash,rol,activo FROM usuarios WHERE email=? LIMIT 1");
        $st->execute([$email]);
        $user = $st->fetch();

        if (!$user || !$user['activo'] || !password_verify($password, $user['password_hash'])) {
            Http::json(['error' => 'Credenciales inválidas.'], 401);
        }

        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);

        $this->db->prepare("DELETE FROM auth_tokens WHERE user_id=?")->execute([$user['id']]);
        $this->db->prepare("INSERT INTO auth_tokens(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(), INTERVAL 8 HOUR))")
            ->execute([$user['id'], $hash]);

        unset($user['password_hash']);
        return ['token' => $token, 'user' => $user];
    }

    public function userFromToken(?string $token): ?array {
        if (!$token) return null;
        $hash = hash('sha256', $token);
        $st = $this->db->prepare("
            SELECT u.id,u.nombre,u.apellido,u.email,u.rol,u.activo
            FROM auth_tokens t
            JOIN usuarios u ON u.id=t.user_id
            WHERE t.token_hash=? AND t.expires_at>NOW() AND u.activo=1
            LIMIT 1
        ");
        $st->execute([$hash]);
        return $st->fetch() ?: null;
    }

    public function logout(?string $token): void {
        if (!$token) return;
        $this->db->prepare("DELETE FROM auth_tokens WHERE token_hash=?")->execute([hash('sha256',$token)]);
    }
}
