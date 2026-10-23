<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\Otp\OtpService;

class TenantApiController
{
    public function __construct(private OtpService $otpService) {}

    public function bootstrap(Request $request)
    {
        $tenantId = app('currentTenantId');
        $tenant = DB::table('tenants')->where('id', $tenantId)->first();

        return response()->json([
            'tenant' => $tenant,
            'categories' => DB::table('categories')->where('tenant_id', $tenantId)->orderBy('sort_order')->get(),
            'products' => DB::table('products')->where('tenant_id', $tenantId)->get(),
            'tables' => DB::table('cafe_tables')->where('tenant_id', $tenantId)->get(),
            'orders' => DB::table('orders')->where('tenant_id', $tenantId)->orderByDesc('created_at')->limit(100)->get(),
            'inventory' => DB::table('inventory_items')->where('tenant_id', $tenantId)->get(),
            'ledger' => DB::table('ledger_entries')->where('tenant_id', $tenantId)->orderByDesc('created_at')->limit(100)->get(),
            'shift' => DB::table('cash_register_shifts')->where('tenant_id', $tenantId)->orderByDesc('created_at')->first(),
            'staff' => DB::table('staff_members')->where('tenant_id', $tenantId)->get(),
        ]);
    }

    public function pollOrders(Request $request)
    {
        $tenantId = app('currentTenantId');
        $orders = DB::table('orders')
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'tenant_id' => $tenantId,
            'polled_at' => now()->toIso8601String(),
            'pending_count' => $orders->where('status', 'pending_payment')->count(),
            'orders' => $orders,
        ]);
    }

    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'identifier' => 'required|string|max:190',
            'channel' => 'required|in:email,bale,telegram',
        ]);

        // Rate limit per identifier (max 3 challenges in 2 minutes)
        $recentCount = DB::table('otp_challenges')
            ->where('identifier', $data['identifier'])
            ->where('created_at', '>', now()->subMinutes(2))
            ->count();

        if ($recentCount >= 3) {
            return response()->json(['message' => 'تعداد درخواست بیش از حد مجاز است. لطفاً ۲ دقیقه صبر کنید.'], 429);
        }

        $challenge = $this->otpService->issueChallenge(
            $data['identifier'],
            $data['channel'],
            (string) $request->ip()
        );

        return response()->json([
            'status' => 'sent',
            'channel' => $data['channel'],
            'expires_in_seconds' => 120,
            'bot_session_token' => $challenge['session_token'],
            'demo_code_preview' => $challenge['raw_code'],
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'identifier' => 'required|string',
            'channel' => 'required|in:email,bale,telegram',
            'code' => 'required|string|size:6',
        ]);

        $verified = $this->otpService->verifyCode($data['identifier'], $data['channel'], $data['code']);
        if (!$verified) {
            return response()->json(['message' => 'کد وارد شده نامعتبر یا منقضی شده است.'], 422);
        }

        return response()->json([
            'status' => 'authenticated',
            'token' => bin2hex(random_bytes(24)),
        ]);
    }
}
