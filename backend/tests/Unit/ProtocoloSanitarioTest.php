<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ProtocoloSanitarioTest extends TestCase
{
    public function test_calculo_de_porcentaje_sin_evidencias_es_cero(): void
    {
        $evidencias = [];
        $parasitos = in_array('DESPARASITACION', $evidencias) ? 1 : 0;
        $rabia = in_array('VACUNACION', $evidencias) ? 1 : 0;

        $porcentaje = ($parasitos + $rabia) * 50;
        $completo = $porcentaje === 100;

        $this->assertEquals(0, $porcentaje);
        $this->assertFalse($completo);
    }

    public function test_calculo_de_porcentaje_con_una_evidencia_es_cincuenta(): void
    {
        $evidencias = ['DESPARASITACION'];
        $parasitos = in_array('DESPARASITACION', $evidencias) ? 1 : 0;
        $rabia = in_array('VACUNACION', $evidencias) ? 1 : 0;

        $porcentaje = ($parasitos + $rabia) * 50;
        $completo = $porcentaje === 100;

        $this->assertEquals(50, $porcentaje);
        $this->assertFalse($completo);
    }

    public function test_calculo_de_porcentaje_con_todas_las_evidencias_es_cien(): void
    {
        $evidencias = ['DESPARASITACION', 'VACUNACION'];
        $parasitos = in_array('DESPARASITACION', $evidencias) ? 1 : 0;
        $rabia = in_array('VACUNACION', $evidencias) ? 1 : 0;

        $porcentaje = ($parasitos + $rabia) * 50;
        $completo = $porcentaje === 100;

        $this->assertEquals(100, $porcentaje);
        $this->assertTrue($completo);
    }
}