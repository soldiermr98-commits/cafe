<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnforceStaffRoleMiddleware
{
    /**
     * Scoped RBAC permissions per staff role:
     * - owner: all permissions
     * - manager: products, inventory, orders, pos, dashboard
     * - cashier: pos, orders, receipt_approval, shift
     * - kitchen: orders, stock_toggle
     */
    private const ROLE_SCOPES = [
        'owner' => ['*'],
        'manager' => ['dashboard', 'orders', 'pos', 'products', 'inventory'],
        'cashier' => ['orders', 'pos', 'receipt_approval', 'shift'],
        'kitchen' => ['orders', 'stock_toggle'],
    ];

    public function handle(Request $request, Closure $next, string $requiredScope)
    {
        $role = $request->header('X-Staff-Role', 'owner');
        $allowed = self::ROLE_SCOPES[$role] ?? [];

        if (!in_array('*', $allowed, true) && !in_array($requiredScope, $allowed, true)) {
            return response()->json([
                'message' => "نقش کاربری شما ({$role}) مجوز دسترسی به بخش «{$requiredScope}» را ندارد.",
            ], 403);
        }

        return $next($request);
    }
}
