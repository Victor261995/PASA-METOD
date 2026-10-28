<?php
class RuleEngine {
    public static function evaluate(array $protocol): array {
        $errors = [];
        if (empty($protocol['control_parasitos'])) $errors[] = 'Control antiparasitario pendiente.';
        if (empty($protocol['vacuna_antirrabica'])) $errors[] = 'Vacuna antirrábica pendiente.';
        return [
            'valido' => count($errors) === 0,
            'errores' => $errors
        ];
    }
}
