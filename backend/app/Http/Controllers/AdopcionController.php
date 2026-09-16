<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\SolicitudAdopcion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdopcionController extends Controller
{
    public function index(): JsonResponse
    {
        $animals = Animal::query()
            ->where('estado', 'APTO_PARA_ADOPCION')
            ->orderBy('nombre')
            ->get([
                'id',
                'codigo',
                'nombre',
                'especie',
                'raza',
                'edad_estimada',
                'sexo',
                'color',
                'descripcion_fisica',
                'refugio',
                'foto_principal',
                'estado',
            ]);

        $animals->each(function ($animal) {
            $animal->foto_url = $animal->foto_principal
                ? url($animal->foto_principal)
                : null;
        });

        return response()->json(['data' => $animals]);
    }

    public function show(int $animal): JsonResponse
    {
        $model = Animal::query()
            ->where('id', $animal)
            ->where('estado', 'APTO_PARA_ADOPCION')
            ->first([
                'id',
                'codigo',
                'nombre',
                'especie',
                'raza',
                'edad_estimada',
                'sexo',
                'color',
                'descripcion_fisica',
                'refugio',
                'foto_principal',
                'estado',
            ]);

        if (!$model) {
            return response()->json(['error' => 'Animal no encontrado.'], 404);
        }

        $model->foto_url = $model->foto_principal
            ? url($model->foto_principal)
            : null;

        return response()->json(['animal' => $model]);
    }

    public function store(Request $request, int $animal): JsonResponse
    {
        $model = Animal::query()
            ->where('id', $animal)
            ->where('estado', 'APTO_PARA_ADOPCION')
            ->first();

        if (!$model) {
            return response()->json(['error' => 'Animal no encontrado.'], 404);
        }

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:200'],
            'email' => ['required', 'email', 'max:200'],
            'telefono' => ['nullable', 'string', 'max:100'],
            'tipo_vivienda' => ['nullable', 'string', 'max:150'],
            'composicion_hogar' => ['nullable', 'string'],
            'mensaje' => ['nullable', 'string'],
        ]);

        $application = SolicitudAdopcion::query()->create([
            'animal_id' => $model->id,
            ...$data,
            'estado' => 'PENDIENTE',
        ]);

        return response()->json([
            'success' => true,
            'id' => $application->id,
        ], 201);
    }
}
