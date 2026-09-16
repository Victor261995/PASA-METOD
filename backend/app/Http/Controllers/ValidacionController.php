<?php

namespace App\Http\Controllers;

use App\Models\Validacion;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ValidacionController extends Controller
{
    public function __construct(private AuditService $audit)
    {
    }

    public function index(): JsonResponse
    {
        $rows = Validacion::query()
            ->from('validaciones as v')
            ->join('animales as a', 'a.id', '=', 'v.animal_id')
            ->leftJoin('usuarios as s', 's.id', '=', 'v.solicitante_id')
            ->leftJoin('usuarios as val', 'val.id', '=', 'v.validador_id')
            ->select(
                'v.*',
                'a.codigo',
                'a.nombre',
                'a.especie',
                'a.raza',
                'a.edad_estimada',
                'a.sexo',
                'a.color',
                'a.refugio',
                'a.sector',
                'a.estado as animal_estado',
                's.nombre as solicitante_nombre',
                's.apellido as solicitante_apellido',
                'val.nombre as validador_nombre',
                'val.apellido as validador_apellido'
            )
            ->orderByRaw("FIELD(v.decision, 'PENDIENTE', 'RECHAZADO', 'APROBADO')")
            ->orderByDesc('v.created_at')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function approve(Request $request, int $validacion): JsonResponse
    {
        return $this->resolve($request, $validacion, true);
    }

    public function reject(Request $request, int $validacion): JsonResponse
    {
        return $this->resolve($request, $validacion, false);
    }

    private function resolve(Request $request, int $id, bool $approved): JsonResponse
    {
        $validation = Validacion::query()
            ->from('validaciones as v')
            ->join('animales as a', 'a.id', '=', 'v.animal_id')
            ->where('v.id', $id)
            ->select('v.*', 'a.estado as actual')
            ->first();

        if (!$validation) {
            return response()->json(['error' => 'Validación no encontrada.'], 404);
        }

        if ($validation->decision !== 'PENDIENTE') {
            return response()->json(['error' => 'La validación ya fue resuelta.'], 409);
        }

        if ($validation->actual !== 'VALIDACION') {
            return response()->json([
                'error' => 'El animal ya no se encuentra en estado VALIDACION.',
            ], 409);
        }

        $decision = $approved ? 'APROBADO' : 'RECHAZADO';
        $newState = $approved ? 'APTO_PARA_ADOPCION' : 'PROTOCOLO_SANITARIO';
        $event = $approved ? 'VALIDACION_APROBADA' : 'VALIDACION_RECHAZADA';

        DB::transaction(function () use (
            $request,
            $validation,
            $decision,
            $newState,
            $event
        ) {
            DB::table('validaciones')
                ->where('id', $validation->id)
                ->update([
                    'validador_id' => $request->user()->id,
                    'decision' => $decision,
                    'observaciones' => $request->input('observaciones'),
                    'fecha_decision' => now(),
                ]);

            DB::table('animales')
                ->where('id', $validation->animal_id)
                ->update(['estado' => $newState]);

            $this->audit->add(
                (int) $validation->animal_id,
                (int) $request->user()->id,
                $event,
                $validation->actual,
                $newState,
                [
                    'validacion_id' => $validation->id,
                    'observaciones' => $request->input('observaciones'),
                ]
            );
        });

        return response()->json([
            'success' => true,
            'estado' => $newState,
        ]);
    }
}
