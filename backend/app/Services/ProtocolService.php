<?php

namespace App\Services;

use App\Models\Evidencia;
use App\Models\ProtocoloSanitario;

class ProtocolService
{
    public function getOrCreate(int $animalId): ProtocoloSanitario
    {
        return ProtocoloSanitario::query()->firstOrCreate(
            ['animal_id' => $animalId],
            [
                'control_parasitos' => 0,
                'vacuna_antirrabica' => 0,
                'porcentaje_cumplimiento' => 0,
                'completo' => 0,
            ]
        );
    }

    public function recompute(int $animalId): ProtocoloSanitario
    {
        $protocol = $this->getOrCreate($animalId);

        $evidences = Evidencia::query()
            ->where('animal_id', $animalId)
            ->get(['tipo', 'fecha_vencimiento', 'estado']);

        $parasites = false;
        $rabies = false;

        foreach ($evidences as $evidence) {
            $valid = $evidence->estado === 'VALIDA'
                && (!$evidence->fecha_vencimiento
                    || $evidence->fecha_vencimiento >= now()->toDateString());

            if (!$valid) {
                continue;
            }

            if ($evidence->tipo === 'DESPARASITACION') {
                $parasites = true;
            }

            if ($evidence->tipo === 'VACUNACION') {
                $rabies = true;
            }
        }

        $percentage = ((int) $parasites + (int) $rabies) * 50;

        $protocol->update([
            'control_parasitos' => $parasites,
            'vacuna_antirrabica' => $rabies,
            'porcentaje_cumplimiento' => $percentage,
            'completo' => $percentage === 100,
        ]);

        return $protocol->fresh();
    }
}
