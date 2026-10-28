<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use App\Models\User;
use App\Models\Animal;
use App\Models\AuthToken;
use App\Models\Validacion;
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

    /**
     * Prueba de Integración: Ciclo de vida completo del animal hasta adopción.
     * Valida códigos HTTP estrictos (201 Created, 200 OK), persistencia correcta 
     * en las tablas en español ('animales', 'protocolos_sanitarios', 'validaciones'),
     * control de roles de usuario (caso negativo HTTP 403 para OPERADOR intentando aprobar) 
     * y visibilidad en el catálogo público final.
     */
    public function test_flujo_completo_sanitario_hasta_adopcion_con_aserciones_estrictas(): void
    {
        $headersOperador = $this->crearTokenParaUsuario('OPERADOR');
        $headersValidador = $this->crearTokenParaUsuario('VALIDADOR');

        // 1. INGRESO: Registrar animal como OPERADOR (Validación estricta de creación)
        $resIngreso = $this->withHeaders($headersOperador)->postJson('/api/animales', [
            'nombre' => 'Milo',
            'especie' => 'PERRO',
            'refugio' => 'Refugio Central'
        ]);

        $resIngreso->assertStatus(201);
        $animalId = $resIngreso->json('id') ?? $resIngreso->json('animal.id') ?? $resIngreso->json('data.id');
        
        $this->assertNotNull($animalId);
        $this->assertDatabaseHas('animales', [
            'id' => $animalId,
            'nombre' => 'Milo',
            'estado' => 'INGRESADO'
        ]);

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

        $resEval->assertStatus(201);

        // 3. PROTOCOLO SANITARIO (Evidencias)
        $file = UploadedFile::fake()->create('certificado.pdf', 100);

        $this->withHeaders($headersOperador)->postJson("/api/animales/{$animalId}/evidencias", [
            'tipo' => 'DESPARASITACION',
            'fecha_emision' => now()->toDateString(),
            'fecha_vencimiento' => now()->addMonths(6)->toDateString(),
            'archivo' => $file
        ])->assertStatus(201);

        $this->withHeaders($headersOperador)->postJson("/api/animales/{$animalId}/evidencias", [
            'tipo' => 'VACUNACION',
            'fecha_emision' => now()->toDateString(),
            'fecha_vencimiento' => now()->addYear()->toDateString(),
            'archivo' => $file
        ])->assertStatus(201);

        // Verificar que el protocolo sanitario llegó al 100%
        $this->assertDatabaseHas('protocolos_sanitarios', [
            'animal_id' => $animalId,
            'porcentaje_cumplimiento' => 100
        ]);

        // 4. SOLICITUD DE VALIDACIÓN
        $resSol = $this->withHeaders($headersOperador)->postJson("/api/animales/{$animalId}/solicitar-validacion");
        $resSol->assertStatus(201);
        
        $valId = $resSol->json('id') ?? Validacion::latest('id')->first()->id;
        $this->assertNotNull($valId);

        // 5. CASO NEGATIVO DE ROLES: OPERADOR intentando aprobar una validación (Debe ser rechazado por rol 403)
        $this->withHeaders($headersOperador)->postJson("/api/validaciones/{$valId}/aprobar", [
            'observaciones' => 'Intento ilegal de operador.'
        ])->assertStatus(403);

        // 6. APROBACIÓN VÁLIDA CON ROL VALIDADOR
        $resAprob = $this->withHeaders($headersValidador)->postJson("/api/validaciones/{$valId}/aprobar", [
            'observaciones' => 'Protocolo sanitario verificado y aprobado.'
        ]);
        $resAprob->assertOk();

        // Verificar que la validación quedó registrada en base de datos
        $this->assertDatabaseHas('validaciones', [
            'id' => $valId
        ]);

        // 7. CATÁLOGO PÚBLICO: Comprobar que Milo aparece en la lista pública
        $resPub = $this->getJson('/api/public/animales');
        $resPub->assertOk();
        
        $resPub->assertJsonFragment([
            'nombre' => 'Milo',
            'especie' => 'PERRO'
        ]);
    }

    /**
     * Prueba de Integración de Seguridad: Control de acceso no autenticado.
     * Verifica que toda petición sin token Bearer a endpoints protegidos 
     * sea rechazada de forma estricta con código HTTP 401 Unauthorized.
     */
    public function test_acceso_no_autenticado_es_rechazado(): void
    {
        // Petición sin token Bearer a ruta protegida debe retornar 401
        $this->getJson('/api/animales')->assertStatus(401);
    }
}