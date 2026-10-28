<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Auditoria;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;

class AuditoriaController extends Controller
{
    public function __construct(private AuditService $audit)
    {
    }

    public function index(): JsonResponse
    {
        $rows = Auditoria::query()
            ->from('auditoria as au')
            ->leftJoin('animales as a', 'a.id', '=', 'au.animal_id')
            ->leftJoin('usuarios as u', 'u.id', '=', 'au.usuario_id')
            ->select(
                'au.*',
                'a.codigo as animal_codigo',
                'a.nombre as animal_nombre',
                'a.especie as animal_especie',
                'a.estado as animal_estado',
                'u.nombre as usuario_nombre',
                'u.apellido as usuario_apellido',
                'u.rol as usuario_rol'
            )
            ->orderByDesc('au.id')
            ->limit(300)
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function animal(int $animal): JsonResponse
    {
        Animal::query()->findOrFail($animal);

        $rows = Auditoria::query()
            ->from('auditoria as au')
            ->leftJoin('usuarios as u', 'u.id', '=', 'au.usuario_id')
            ->where('au.animal_id', $animal)
            ->select(
                'au.*',
                'u.nombre as usuario_nombre',
                'u.apellido as usuario_apellido',
                'u.rol as usuario_rol'
            )
            ->orderBy('au.id')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function verify(int $animal): JsonResponse
    {
        Animal::query()->findOrFail($animal);

        return response()->json([
            'integridad' => $this->audit->verifyAnimal($animal),
        ]);
    }
}
