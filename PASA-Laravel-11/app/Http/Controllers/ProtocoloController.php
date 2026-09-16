<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\Evidencia;
use App\Models\Validacion;
use App\Services\AuditService;
use App\Services\ProtocolService;
use App\Services\RuleEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProtocoloController extends Controller
{
    public function __construct(
        private ProtocolService $protocols,
        private RuleEngine $rules,
        private AuditService $audit
    ) {
    }

    public function show(int $animal): JsonResponse
    {
        Animal::query()->findOrFail($animal);
        $protocol = $this->protocols->recompute($animal);

        $evidences = Evidencia::query()
            ->from('evidencias as e')
            ->leftJoin('usuarios as u', 'u.id', '=', 'e.uploaded_by')
            ->where('e.animal_id', $animal)
            ->orderByDesc('e.created_at')
            ->select(
                'e.*',
                'u.nombre as uploaded_by_nombre',
                'u.apellido as uploaded_by_apellido'
            )
            ->get();

        return response()->json([
            'protocolo' => $protocol,
            'evidencias' => $evidences,
        ]);
    }

    public function storeEvidence(Request $request, int $animal): JsonResponse
    {
        $model = Animal::query()->findOrFail($animal);

        if (!in_array($model->estado, ['EVALUACION', 'PROTOCOLO_SANITARIO'], true)) {
            return response()->json([
                'error' => 'El animal no se encuentra en etapa de protocolo.',
            ], 409);
        }

        $data = $request->validate([
            'tipo' => ['nullable', 'in:VACUNACION,DESPARASITACION,CERTIFICADO,FOTO,OTRO'],
            'archivo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'],
            'fecha_emision' => ['nullable', 'date'],
            'fecha_vencimiento' => ['nullable', 'date'],
        ]);

        $type = $data['tipo'] ?? 'OTRO';
        $route = null;
        $originalName = null;

        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $originalName = $file->getClientOriginalName();
            $name = now()->format('Ymd_His').'_'.bin2hex(random_bytes(3)).'.'.$file->extension();
            $stored = $file->storeAs("evidencias/{$model->codigo}", $name, 'public');
            $route = '/storage/'.$stored;
        }

        $status = !empty($data['fecha_vencimiento'])
            && $data['fecha_vencimiento'] < now()->toDateString()
            ? 'VENCIDA'
            : 'VALIDA';

        $protocol = DB::transaction(function () use (
            $request,
            $model,
            $data,
            $type,
            $route,
            $originalName,
            $status
        ) {
            $protocol = $this->protocols->getOrCreate($model->id);
            $old = $model->estado;
            $new = 'PROTOCOLO_SANITARIO';

            Evidencia::query()->create([
                'animal_id' => $model->id,
                'protocolo_id' => $protocol->id,
                'tipo' => $type,
                'nombre_archivo' => $originalName,
                'ruta_archivo' => $route,
                'fecha_emision' => $data['fecha_emision'] ?? null,
                'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
                'estado' => $status,
                'uploaded_by' => $request->user()->id,
            ]);

            if ($model->estado !== $new) {
                $model->update(['estado' => $new]);
            }

            $protocol = $this->protocols->recompute($model->id);

            $this->audit->add(
                $model->id,
                $request->user()->id,
                'EVIDENCIA_CARGADA',
                $old,
                $new,
                [
                    'tipo' => $type,
                    'estado' => $status,
                    'ruta' => $route,
                ]
            );

            return $protocol;
        });

        return response()->json([
            'success' => true,
            'protocolo' => $protocol,
        ], 201);
    }

    public function requestValidation(Request $request, int $animal): JsonResponse
    {
        $model = Animal::query()->findOrFail($animal);

        if ($model->estado !== 'PROTOCOLO_SANITARIO') {
            return response()->json([
                'error' => 'El animal debe estar en PROTOCOLO_SANITARIO para solicitar validación.',
            ], 409);
        }

        $protocol = $this->protocols->recompute($model->id);

        if (!$protocol->completo) {
            return response()->json([
                'error' => 'El protocolo sanitario todavía no está completo.',
            ], 409);
        }

        $check = $this->rules->evaluate($protocol);

        if (!$check['valido']) {
            return response()->json([
                'error' => implode(' ', $check['errores']),
                'reglas' => $check,
            ], 409);
        }

        $pending = Validacion::query()
            ->where('animal_id', $model->id)
            ->where('decision', 'PENDIENTE')
            ->exists();

        if ($pending) {
            return response()->json([
                'error' => 'Ya existe una validación pendiente.',
            ], 409);
        }

        $validation = DB::transaction(function () use ($request, $model, $check) {
            $old = $model->estado;

            $validation = Validacion::query()->create([
                'animal_id' => $model->id,
                'solicitante_id' => $request->user()->id,
                'estado_anterior' => $old,
                'estado_solicitado' => 'APTO_PARA_ADOPCION',
                'decision' => 'PENDIENTE',
            ]);

            $model->update(['estado' => 'VALIDACION']);

            $this->audit->add(
                $model->id,
                $request->user()->id,
                'SOLICITUD_VALIDACION',
                $old,
                'VALIDACION',
                [
                    'protocolo' => $check,
                    'validacion_id' => $validation->id,
                ]
            );

            return $validation;
        });

        return response()->json([
            'success' => true,
            'validacion_id' => $validation->id,
        ], 201);
    }
}
