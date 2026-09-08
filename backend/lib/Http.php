<?php

class Http
{
    public static function json(array $data, int $status = 200): never
    {
        http_response_code($status);

        header(
            'Content-Type: application/json; charset=utf-8'
        );

        echo json_encode(
            $data,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES
        );

        exit;
    }

    public static function body(): array
    {
        $raw = file_get_contents('php://input');

        if (!$raw) {
            return $_POST ?: [];
        }

        $data = json_decode($raw, true);

        return is_array($data)
            ? $data
            : ($_POST ?: []);
    }

    public static function bearer(): ?string
    {
        $header =
            $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if (!$header && function_exists('getallheaders')) {
            $headers = getallheaders();

            foreach ($headers as $key => $value) {
                if (strcasecmp($key, 'Authorization') === 0) {
                    $header = $value;
                    break;
                }
            }
        }

        if (
            preg_match(
                '/^Bearer\s+(\S+)$/i',
                trim($header),
                $matches
            )
        ) {
            return $matches[1];
        }

        return null;
    }
