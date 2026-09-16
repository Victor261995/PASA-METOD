<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\EvaluacionClinica;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvaluacionController extends Controller
{
    public function __construct(private AuditService $audit)
    {
    }

    public function index(int $animal): JsonResponse
    {
        Animal::query()->findOrFail($animal);

        $rows = EvaluacionClinica::query()
            ->from('evaluaciones_clinicas as e')
            ->join('usuarios as u', 'u.id', '=', 'e.operador_id')
            ->where('e.animal_id', $animal)
            ->orderByDesc('e.created_at')
            ->select('e.*', 'u.nombre as operador_nombre')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request, int $animal): JsonResponse
    {
        $model = Animal::query()->findOrFail($animal);

        if ($model->estado !== 'INGRESADO') {
            return response()->json([
                'error' => 'La evaluación inicial solo puede registrarse desde INGRESADO.',
            ], 409);
        }

        $data = $request->validate([
            'peso' => ['nullable', 'numeric', 'min:0'],
            'temperatura' => ['nullable', 'numeric'],
            'frecuencia_cardiaca' => ['nullable', 'integer', 'min:0'],
            'frecuencia_respiratoria' => ['nullable', 'integer', 'min:0'],
            'condicion_corporal' => ['nullable', 'integer', 'between:1,9'],
            'comportamiento' => ['nullable', 'in:DOCIL,ANSIOSO,AGRESIVO'],
            'socializacion_personas' => ['nullable', 'string'],
            'socializacion_animales' => ['nullable', 'string'],
            'estado_pelaje' => ['nullable', 'string'],
            'estado_ojos' => ['nullable', 'string'],
            'marcha' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string'],
            'criterio_operador' => ['required', 'in:APTO_PROTOCOLO,REQUIERE_ATENCION,CUARENTENA'],
        ]);

        $newState = $data['criterio_operador'] === 'APTO_PROTOCOLO'
            ? 'EVALUACION'
            : 'CUARENTENA';

        DB::transaction(function () use ($request, $model, $data, $newState) {
            EvaluacionClinica::query()->create([
                ...$data,
                'animal_id' => $model->id,
                'operador_id' => $request->user()->id,
            ]);

            $old = $model->estado;
            $model->update(['estado' => $newState]);

            $this->audit->add(
                $model->id,
                $request->user()->id,
                'EVALUACION_CLINICA',
                $old,
                $newState,
                ['criterio_operador' => $data['criterio_operador']]
            );
        });

        return response()->json([
            'success' => true,
            'estado' => $newState,
        ], 201);
    }
}
