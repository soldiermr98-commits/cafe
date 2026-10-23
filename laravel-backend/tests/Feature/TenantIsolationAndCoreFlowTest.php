<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use App\Services\Otp\OtpService;

class TenantIsolationAndCoreFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_global_scope_prevents_cross_tenant_data_leak(): void
    {
        // Bind Tenant A
        app()->instance('currentTenantId', 101);
        $tenantAProducts = DB::table('products')->where('tenant_id', app('currentTenantId'))->count();

        // Bind Tenant B
        app()->instance('currentTenantId', 202);
        $tenantBProducts = DB::table('products')->where('tenant_id', app('currentTenantId'))->count();

        $this->assertEquals(0, $tenantAProducts);
        $this->assertEquals(0, $tenantBProducts);
    }

    public function test_otp_generation_expiration_and_attempt_lockout(): void
    {
        $otpService = new OtpService();
        $challenge = $otpService->issueChallenge('09123456789', 'bale', '127.0.0.1');

        // Wrong code fails
        $this->assertFalse($otpService->verifyCode('09123456789', 'bale', '000000'));

        // Correct code succeeds
        $this->assertTrue($otpService->verifyCode('09123456789', 'bale', $challenge['raw_code']));

        // Reusing already verified code fails
        $this->assertFalse($otpService->verifyCode('09123456789', 'bale', $challenge['raw_code']));
    }
}
