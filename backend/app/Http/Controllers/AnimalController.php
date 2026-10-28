<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\ProtocoloSanitario;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AnimalController extends Controller
{
    public function __construct(private AuditService $audit)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Animal::query()->orderByDesc('created_at')->get(),
        ]);
    }

    public function show(int $animal): JsonResponse
    {
        return response()->json([
            'animal' => Animal::query()->findOrFail($animal),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'especie' => ['required', 'in:PERRO,GATO,OTRO'],
            'raza' => ['nullable', 'string', 'max:150'],
            'edad_estimada' => ['nullable', 'integer', 'min:0'],
            'sexo' => ['nullable', 'in:MACHO,HEMBRA,DESCONOCIDO'],
            'color' => ['nullable', 'string', 'max:150'],
            'descripcion_fisica' => ['nullable', 'string'],
            'refugio' => ['required', 'string', 'max:200'],
            'sector' => ['nullable', 'string', 'max:150'],
            'forma_ingreso' => ['nullable', 'in:RESCATE,DONACION,TRASLADO,DECOMISO,OTRO'],
            'observaciones_ingreso' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $animal = DB::transaction(function () use ($data, $user) {
            $animal = Animal::query()->create([
                'codigo' => '',
                'nombre' => trim($data['nombre']),
                'especie' => $data['especie'],
                'raza' => $data['raza'] ?? null,
                'edad_estimada' => $data['edad_estimada'] ?? null,
                'sexo' => $data['sexo'] ?? 'DESCONOCIDO',
                'color' => $data['color'] ?? null,
                'descripcion_fisica' => $data['descripcion_fisica'] ?? null,
                'refugio' => $data['refugio'],
                'sector' => $data['sector'] ?? null,
                'forma_ingreso' => $data['forma_ingreso'] ?? 'OTRO',
                'observaciones_ingreso' => $data['observaciones_ingreso'] ?? null,
                'estado' => 'INGRESADO',
                'created_by' => $user->id,
            ]);

            $code = 'A-'.str_pad((string) $animal->id, 5, '0', STR_PAD_LEFT);
            $animal->update(['codigo' => $code]);

            ProtocoloSanitario::query()->firstOrCreate(
                ['animal_id' => $animal->id],
                [
                    'control_parasitos' => 0,
                    'vacuna_antirrabica' => 0,
                    'porcentaje_cumplimiento' => 0,
                    'completo' => 0,
                ]
            );

            $this->audit->add(
                $animal->id,
                $user->id,
                'REGISTRO_ANIMAL',
                null,
                'INGRESADO',
                ['codigo' => $code]
            );

            return $animal->fresh();
        });

        return response()->json(['animal' => $animal], 201);
    }

    public function update(Request $request, int $animal): JsonResponse
    {
        $model = Animal::query()->findOrFail($animal);

        $data = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:150'],
            'raza' => ['nullable', 'string', 'max:150'],
            'edad_estimada' => ['nullable', 'integer', 'min:0'],
            'sexo' => ['nullable', 'in:MACHO,HEMBRA,DESCONOCIDO'],
            'color' => ['nullable', 'string', 'max:150'],
            'descripcion_fisica' => ['nullable', 'string'],
            'refugio' => ['sometimes', 'string', 'max:200'],
            'sector' => ['nullable', 'string', 'max:150'],
        ]);

        $model->fill($data)->save();

        $this->audit->add(
            $model->id,
            $request->user()->id,
            'ACTUALIZACION_ANIMAL',
            $model->estado,
            $model->estado,
            []
        );

        return response()->json(['animal' => $model->fresh()]);
    }

    public function uploadPhoto(Request $request, int $animal): JsonResponse
    {
        $model = Animal::query()->findOrFail($animal);

        $request->validate([
            'foto' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        $file = $request->file('foto');
        $name = now()->format('Ymd_His').'_'.bin2hex(random_bytes(3)).'.'.$file->extension();
        $path = $file->storeAs("animales/{$model->codigo}", $name, 'public');
        $publicPath = '/storage/'.$path;

        $model->update(['foto_principal' => $publicPath]);

        $this->audit->add(
            $model->id,
            $request->user()->id,
            'FOTO_PRINCIPAL_CARGADA',
            $model->estado,
            $model->estado,
            ['ruta' => $publicPath]
        );

        return response()->json([
            'success' => true,
            'foto_principal' => $publicPath,
            'foto_url' => url($publicPath),
        ]);
    }
}
