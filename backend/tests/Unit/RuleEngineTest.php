<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\RuleEngine;
use App\Models\ProtocoloSanitario;

class RuleEngineTest extends TestCase
{
    public function test_motor_de_reglas_rechaza_si_falta_vacunacion(): void
    {
        $engine = new RuleEngine();

        $protocolo = new ProtocoloSanitario([
            'control_parasitos' => 1,
            'vacuna_antirrabica' => 0,
            'porcentaje_cumplimiento' => 50,
            'completo' => 0
        ]);

        $resultado = $engine->evaluate($protocolo);

        $this->assertFalse($resultado['valido']);
        $this->assertNotEmpty($resultado['errores']);
    }

    public function test_motor_de_reglas_rechaza_si_falta_desparasitacion(): void
    {
        $engine = new RuleEngine();

        $protocolo = new ProtocoloSanitario([
            'control_parasitos' => 0,
            'vacuna_antirrabica' => 1,
            'porcentaje_cumplimiento' => 50,
            'completo' => 0
        ]);

        $resultado = $engine->evaluate($protocolo);

        $this->assertFalse($resultado['valido']);
        $this->assertNotEmpty($resultado['errores']);
    }

    public function test_motor_de_reglas_aprueba_con_protocolo_completo(): void
    {
        $engine = new RuleEngine();

        $protocolo = new ProtocoloSanitario([
            'control_parasitos' => 1,
            'vacuna_antirrabica' => 1,
            'porcentaje_cumplimiento' => 100,
            'completo' => 1
        ]);

        $resultado = $engine->evaluate($protocolo);

        $this->assertTrue($resultado['valido']);
        $this->assertEmpty($resultado['errores']);
    }
}
