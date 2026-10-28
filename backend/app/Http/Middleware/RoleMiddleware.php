<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->rol, $roles, true)) {
            return response()->json([
                'error' => 'No autorizado para esta operación.',
            ], 403);
        }

        return $next($request);
    }
}
