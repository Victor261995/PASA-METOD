<?php

namespace App\Http\Controllers;

use App\Models\AuthToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', trim($data['email']))
            ->first();

        if (!$user || !$user->activo || !Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['error' => 'Credenciales inválidas.'], 401);
        }

        $plainToken = Str::random(80);

        AuthToken::query()->where('user_id', $user->id)->delete();

        AuthToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addHours(8),
        ]);

        return response()->json([
            'token' => $plainToken,
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $hash = $request->attributes->get('pasa_token_hash');

        if ($hash) {
            AuthToken::query()->where('token_hash', $hash)->delete();
        }

        return response()->json(['success' => true]);
    }
}
