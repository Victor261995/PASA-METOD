<?php

use App\Http\Controllers\AdopcionController;
use App\Http\Controllers\AnimalController;
use App\Http\Controllers\AuditoriaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EvaluacionController;
use App\Http\Controllers\ProtocoloController;
use App\Http\Controllers\ValidacionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas públicas
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);

Route::prefix('public')->group(function () {
    Route::get('/animales', [AdopcionController::class, 'index']);
    Route::get('/animales/{animal}', [AdopcionController::class, 'show'])
        ->whereNumber('animal');
    Route::post('/animales/{animal}/solicitudes', [AdopcionController::class, 'store'])
        ->whereNumber('animal');
});

/*
|--------------------------------------------------------------------------
| Rutas autenticadas
|--------------------------------------------------------------------------
*/
Route::middleware('pasa.auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/animales', [AnimalController::class, 'index']);
    Route::get('/animales/{animal}', [AnimalController::class, 'show'])
        ->whereNumber('animal');
    Route::get('/animales/{animal}/evaluaciones', [EvaluacionController::class, 'index'])
        ->whereNumber('animal');
    Route::get('/animales/{animal}/protocolo', [ProtocoloController::class, 'show'])
        ->whereNumber('animal');

    Route::middleware('role:OPERADOR,ADMIN')->group(function () {
        Route::post('/animales', [AnimalController::class, 'store']);
        Route::put('/animales/{animal}', [AnimalController::class, 'update'])
            ->whereNumber('animal');
        Route::post('/animales/{animal}/foto', [AnimalController::class, 'uploadPhoto'])
            ->whereNumber('animal');

        Route::post('/animales/{animal}/evaluaciones', [EvaluacionController::class, 'store'])
            ->whereNumber('animal');

        Route::post('/animales/{animal}/evidencias', [ProtocoloController::class, 'storeEvidence'])
            ->whereNumber('animal');
        Route::post('/animales/{animal}/solicitar-validacion', [ProtocoloController::class, 'requestValidation'])
            ->whereNumber('animal');
    });

    Route::middleware('role:VALIDADOR,ADMIN')->group(function () {
        Route::get('/validaciones', [ValidacionController::class, 'index']);
        Route::post('/validaciones/{validacion}/aprobar', [ValidacionController::class, 'approve'])
            ->whereNumber('validacion');
        Route::post('/validaciones/{validacion}/rechazar', [ValidacionController::class, 'reject'])
            ->whereNumber('validacion');
    });

    Route::middleware('role:AUDITOR,ADMIN')->group(function () {
        Route::get('/auditoria', [AuditoriaController::class, 'index']);
        Route::get('/animales/{animal}/auditoria', [AuditoriaController::class, 'animal'])
            ->whereNumber('animal');
        Route::get('/auditoria/verificar/{animal}', [AuditoriaController::class, 'verify'])
            ->whereNumber('animal');
    });
});
