<?php

namespace App\Services;

use App\Models\ProtocoloSanitario;

class RuleEngine
{
    public function evaluate(ProtocoloSanitario $protocol): array
    {
        $errors = [];

        if (!$protocol->control_parasitos) {
            $errors[] = 'Control antiparasitario pendiente.';
        }

        if (!$protocol->vacuna_antirrabica) {
            $errors[] = 'Vacuna antirrábica pendiente.';
        }

        return [
            'valido' => count($errors) === 0,
            'errores' => $errors,
        ];
    }
}
