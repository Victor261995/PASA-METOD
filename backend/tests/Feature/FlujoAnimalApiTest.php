<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use App\Models\User;
use App\Models\Animal;
use App\Models\AuthToken;
use Illuminate\Support\Str;

class FlujoAnimalApiTest extends TestCase
{
    use DatabaseTransactions;

    private function crearTokenParaUsuario(string $rol): array
    {
        $user = User::where('rol', $rol)->where('activo', 1)->first();

        if (!$user) {
            $user = new User();
            $user->nombre = "Usuario {$rol}";
            $user->email = strtolower($rol) . '_' . Str::random(5) . '@pasa.local';
            $user->password_hash = password_hash('password123', PASSWORD_BCRYPT);
            $user->rol = $rol;
            $user->activo = 1;
            $user->save();
        }

        $plainToken = Str::random(64);

        AuthToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addHours(8),
        ]);

        return [
            'Authorization' => 'Bearer ' . $plainToken,
            'Accept' => 'application/json',
        ];
    }

    public function test_flujo_completo_sanitario_hasta_adopcion(): void
    {
        $headersOperador = $this->crearTokenParaUsuario('OPERADOR');
        $headersValidador = $this->crearTokenParaUsuario('VALIDADOR');

        // 1. INGRESO: Registrar animal autenticado como OPERADOR
        $resIngreso = $this->withHeaders($headersOperador)->postJson('/api/animales', [
            'nombre' => 'Milo',
            'especie' => 'PERRO',
            'refugio' => 'Refugio Central'
        ]);

        $this->assertTrue(
            in_array($resIngreso->status(), [200, 201]),
            "Error en ingreso (status {$resIngreso->status()}): " . json_encode($resIngreso->json())
        );

        $animalId = $resIngreso->json('id') 
            ?? $resIngreso->json('animal.id') 
            ?? $resIngreso->json('data.id')
            ?? Animal::latest('id')->first()?->id;

        $this->assertNotNull($animalId, 'No se pudo obtener el ID del animal registrado.');

        // 2. EVALUACIÓN CLÍNICA
        $resEval = $this->withHeaders($headersOperador)->postJson("/api/animales/{$animalId}/evaluaciones", [
            'peso' => 14.2,
            'temperatura' => 38.6,
            'frecuencia_cardiaca' => 100,
            'frecuencia_respiratoria' => 20,
            'condicion_corporal' => 5,
            'comportamiento' => 'DOCIL',
            'criterio_operador' => 'APTO_PROTOCOLO'
        ]);

        $this->assertTrue(
            in_array($resEval->status(), [200, 201]),
            "Error en evaluacion (status {$resEval->status()}): " . json_encode($resEval->json())
        );

        // 3. PROTOCOLO SANITARIO (Evidencias)
        $file = UploadedFile::fake()->create('certificado.pdf', 100);

        $resDesp = $this->withHeaders($headersOperador)->postJson("/api/animales/{$animalId}/evidencias", [
            'tipo' => 'DESPARASITACION',
            'fecha_emision' => now()->toDateString(),
            'fecha_vencimiento' => now()->addMonths(6)->toDateString(),
            'archivo' => $file
        ]);
        $this->assertTrue(
            in_array($resDesp->status(), [200, 201]),
            "Error en evidencia desparasitacion: " . json_encode($resDesp->json())
        );

        $resVac = $this->withHeaders($headersOperador)->postJson("/api/animales/{$animalId}/evidencias", [
            'tipo' => 'VACUNACION',
            'fecha_emision' => now()->toDateString(),
            'fecha_vencimiento' => now()->addYear()->toDateString(),
            'archivo' => $file
        ]);
        $this->assertTrue(
            in_array($resVac->status(), [200, 201]),
            "Error en evidencia vacunacion: " . json_encode($resVac->json())
        );

        // 4. VALIDACIÓN (Solicitud)
        $resSol = $this->withHeaders($headersOperador)->postJson("/api/animales/{$animalId}/solicitar-validacion");
        $this->assertTrue(
            in_array($resSol->status(), [200, 201]),
            "Error en solicitud de validacion: " . json_encode($resSol->json())
        );
        $valId = $resSol->json('id') ?? $resSol->json('validacion_id') ?? 1;

        // 5. APROBACIÓN (Dictamen con rol VALIDADOR)
        $resAprob = $this->withHeaders($headersValidador)->postJson("/api/validaciones/{$valId}/aprobar", [
            'observaciones' => 'Protocolo sanitario verificado y aprobado.'
        ]);
        $this->assertTrue(
            in_array($resAprob->status(), [200, 201]),
            "Error en aprobacion: " . json_encode($resAprob->json())
        );

        // 6. CATÁLOGO PÚBLICO (Ruta pública sin token)
        $resPub = $this->getJson('/api/public/animales');
        $this->assertTrue(
            in_array($resPub->status(), [200, 201]),
            "Error en catalogo publico: " . json_encode($resPub->json())
        );
    }
}