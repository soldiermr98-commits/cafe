<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResolveTenantMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $tenantId = $request->header('X-Tenant-Id') ?? $request->query('tenant_id');
        $tenantSlug = $request->header('X-Tenant-Slug') ?? $request->route('slug');

        // Subdomain detection fallback (e.g., cafe-gol.cafegol.ir)
        if (!$tenantId && !$tenantSlug) {
            $hostParts = explode('.', $request->getHost());
            if (count($hostParts) >= 3 && !in_array($hostParts[0], ['www', 'app', 'api'])) {
                $tenantSlug = $hostParts[0];
            }
        }

        $query = DB::table('tenants');
        $tenant = $tenantId
            ? $query->where('id', $tenantId)->first()
            : ($tenantSlug ? $query->where('slug', $tenantSlug)->first() : $query->first());

        if (!$tenant) {
            return response()->json(['message' => 'کافه مورد نظر یافت نشد.'], 404);
        }

        if ($tenant->status === 'suspended' && !$request->is('api/v1/superadmin/*')) {
            return response()->json([
                'message' => 'اشتراک این کافه منقضی یا مسدود شده است. لطفاً از بخش اشتراک اقدام به تمدید نمایید.',
                'tenant_status' => 'suspended',
            ], 402);
        }

        app()->instance('currentTenantId', $tenant->id);
        app()->instance('currentTenant', $tenant);

        return $next($request);
    }
}
