<?php

namespace App\Services;

use App\Models\Auditoria;

class AuditService
{
    public function add(
        ?int $animalId,
        ?int $userId,
        string $event,
        ?string $before,
        ?string $after,
        array $detail = []
    ): void {
        $previous = $animalId
            ? Auditoria::query()
                ->where('animal_id', $animalId)
                ->orderByDesc('id')
                ->value('hash_actual')
            : null;

        $payload = $this->buildPayload(
            $animalId,
            $userId,
            $event,
            $before,
            $after,
            $detail,
            $previous
        );

        Auditoria::query()->create([
            'animal_id' => $animalId,
            'usuario_id' => $userId,
            'tipo_evento' => $event,
            'estado_anterior' => $before,
            'estado_nuevo' => $after,
            'detalle' => $detail,
            'hash_anterior' => $previous,
            'hash_actual' => hash('sha256', $payload),
        ]);
    }

    public function verifyAnimal(int $animalId): bool
    {
        $rows = Auditoria::query()
            ->where('animal_id', $animalId)
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            return false;
        }

        $previous = null;

        foreach ($rows as $row) {
            $storedPrevious = $row->hash_anterior ?: null;

            if ($storedPrevious !== $previous) {
                return false;
            }

            $detail = is_array($row->detalle) ? $row->detalle : [];

            $expected = hash('sha256', $this->buildPayload(
                $row->animal_id !== null ? (int) $row->animal_id : null,
                $row->usuario_id !== null ? (int) $row->usuario_id : null,
                $row->tipo_evento,
                $row->estado_anterior,
                $row->estado_nuevo,
                $detail,
                $storedPrevious
            ));

            if (!hash_equals((string) $row->hash_actual, $expected)) {
                return false;
            }

            $previous = $row->hash_actual;
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
        return json_encode([
            'animal_id' => $animalId,
            'usuario_id' => $userId,
            'tipo_evento' => $event,
            'estado_anterior' => $before,
            'estado_nuevo' => $after,
            'detalle' => $detail,
            'hash_anterior' => $previousHash,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
