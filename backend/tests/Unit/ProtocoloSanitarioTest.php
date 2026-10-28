<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Animal;
use App\Models\Evidencia;
use App\Services\ProtocolService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;

class ProtocoloSanitarioTest extends TestCase
{
    use DatabaseTransactions;

    private ProtocolService $service;
    private Animal $animal;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ProtocolService();
        $this->animal = Animal::create([
            'codigo' => 'T-' . Str::random(5),
            'nombre' => 'TestAnimal',
            'especie' => 'PERRO',
            'refugio' => 'Refugio Test',
            'estado' => 'INGRESADO',
        ]);
    }

    public function test_calculo_de_porcentaje_sin_evidencias_es_cero(): void
    {
        $protocolo = $this->service->recompute($this->animal->id);

        $this->assertEquals(0, $protocolo->porcentaje_cumplimiento);
        $this->assertFalse($protocolo->completo);
        $this->assertFalse($protocolo->control_parasitos);
        $this->assertFalse($protocolo->vacuna_antirrabica);
    }

    public function test_calculo_de_porcentaje_con_una_evidencia_es_cincuenta(): void
    {
        Evidencia::create([
            'animal_id' => $this->animal->id,
            'tipo' => 'DESPARASITACION',
            'estado' => 'VALIDA',
            'fecha_emision' => now()->toDateString(),
        ]);

        $protocolo = $this->service->recompute($this->animal->id);

        $this->assertEquals(50, $protocolo->porcentaje_cumplimiento);
        $this->assertFalse($protocolo->completo);
        $this->assertTrue($protocolo->control_parasitos);
        $this->assertFalse($protocolo->vacuna_antirrabica);
    }

    public function test_calculo_de_porcentaje_con_todas_las_evidencias_es_cien(): void
    {
        Evidencia::create([
            'animal_id' => $this->animal->id,
            'tipo' => 'DESPARASITACION',
            'estado' => 'VALIDA',
            'fecha_emision' => now()->toDateString(),
        ]);

        Evidencia::create([
            'animal_id' => $this->animal->id,
            'tipo' => 'VACUNACION',
            'estado' => 'VALIDA',
            'fecha_emision' => now()->toDateString(),
        ]);

        $protocolo = $this->service->recompute($this->animal->id);

        $this->assertEquals(100, $protocolo->porcentaje_cumplimiento);
        $this->assertTrue($protocolo->completo);
        $this->assertTrue($protocolo->control_parasitos);
        $this->assertTrue($protocolo->vacuna_antirrabica);
    }

    public function test_evidencia_vencida_no_suma_al_porcentaje(): void
    {
        Evidencia::create([
            'animal_id' => $this->animal->id,
            'tipo' => 'VACUNACION',
            'estado' => 'VALIDA',
            'fecha_emision' => now()->subYears(2)->toDateString(),
            'fecha_vencimiento' => now()->subDay()->toDateString(),
        ]);

        $protocolo = $this->service->recompute($this->animal->id);

        $this->assertEquals(0, $protocolo->porcentaje_cumplimiento);
        $this->assertFalse($protocolo->vacuna_antirrabica);
        $this->assertFalse($protocolo->completo);
    }
}