<?php

class AuditService
{
    public function __construct(
        private PDO $db
    ) {}

    public function add(
        ?int $animalId,
        ?int $userId,
        string $event,
        ?string $before,
        ?string $after,
        array $detail = []
    ): void {

        $prev = null;

        if ($animalId) {
            $st = $this->db->prepare("
                SELECT hash_actual
                FROM auditoria
                WHERE animal_id = ?
                ORDER BY id DESC
                LIMIT 1
            ");

            $st->execute([
                $animalId
            ]);

            $prev =
                $st->fetchColumn()
                ?: null;
        }

        $payload = $this->buildPayload(
            $animalId,
            $userId,
            $event,
            $before,
            $after,
            $detail,
            $prev
        );

        $hash = hash(
            'sha256',
            $payload
        );

        $st = $this->db->prepare("
            INSERT INTO auditoria (
                animal_id,
                usuario_id,
                tipo_evento,
                estado_anterior,
                estado_nuevo,
                detalle,
                hash_anterior,
                hash_actual
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $st->execute([
            $animalId,
            $userId,
            $event,
            $before,
            $after,
            json_encode(
                $detail,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            ),
            $prev,
            $hash
        ]);
    }

    public function verifyAnimal(
        int $animalId
    ): bool {

        $st = $this->db->prepare("
            SELECT *
            FROM auditoria
            WHERE animal_id = ?
            ORDER BY id ASC
        ");

        $st->execute([
            $animalId
        ]);

        $rows =
            $st->fetchAll(
                PDO::FETCH_ASSOC
            );

        $prev = null;

        foreach ($rows as $row) {

            /*
             * 1. Comprobar la cadena.
             */
            $storedPrevious =
                $row['hash_anterior']
                    ?: null;

            if (
                $storedPrevious !==
                $prev
            ) {
                return false;
            }

            /*
             * 2. Reconstruir el detalle.
             */
            $detail = [];

            if (!empty(
                $row['detalle']
            )) {
                $decoded =
                    json_decode(
                        $row['detalle'],
                        true
                    );

                if (
                    is_array(
                        $decoded
                    )
                ) {
                    $detail =
                        $decoded;
                }
            }

            /*
             * 3. Reconstruir exactamente
             * el contenido utilizado
             * al crear el hash.
             */
            $payload =
                $this->buildPayload(
                    $row['animal_id']
                        !== null
                        ? (int)$row[
                            'animal_id'
                        ]
                        : null,

                    $row['usuario_id']
                        !== null
                        ? (int)$row[
                            'usuario_id'
                        ]
                        : null,

                    $row[
                        'tipo_evento'
                    ],

                    $row[
                        'estado_anterior'
                    ],

                    $row[
                        'estado_nuevo'
                    ],

                    $detail,

                    $storedPrevious
                );

            /*
             * 4. Recalcular SHA-256.
             */
            $expectedHash =
                hash(
                    'sha256',
                    $payload
                );

            if (
                !hash_equals(
                    $row[
                        'hash_actual'
                    ],
                    $expectedHash
                )
            ) {
                return false;
            }

            $prev =
                $row[
                    'hash_actual'
                ];
        }

        return true;
    }

    private function buildPayload(
        ?int $animalId,
        ?int $userId,
        string $event,
        ?string $before,
        ?string $after,
        array $detail,
        ?string $previousHash
    ): string {

        return json_encode(
            [
                'animal_id' =>
                    $animalId,

                'usuario_id' =>
                    $userId,

                'tipo_evento' =>
                    $event,

                'estado_anterior' =>
                    $before,

                'estado_nuevo' =>
                    $after,

                'detalle' =>
                    $detail,

                'hash_anterior' =>
                    $previousHash,
            ],

            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES
        );
    }
