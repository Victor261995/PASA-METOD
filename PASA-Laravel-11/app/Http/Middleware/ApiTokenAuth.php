<?php

namespace App\Http\Middleware;

use App\Models\AuthToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();

        if (!$plainToken) {
            return response()->json(['error' => 'No autenticado.'], 401);
        }

        $token = AuthToken::query()
            ->with('user')
            ->where('token_hash', hash('sha256', $plainToken))
            ->where('expires_at', '>', now())
            ->first();

        if (!$token || !$token->user || !$token->user->activo) {
            return response()->json(['error' => 'No autenticado.'], 401);
        }

        $request->setUserResolver(fn () => $token->user);
        $request->attributes->set('pasa_token_hash', $token->token_hash);

        return $next($request);
    }
}
