<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Shared Hosting Cron Schedule (cPanel / DirectAdmin: * * * * * php artisan schedule:run)
|--------------------------------------------------------------------------
| Processes database queue jobs without a persistent supervisor worker,
| transitions expired tenant subscriptions into 3-day grace_period or suspended,
| and creates daily compressed SQL backups.
*/

Schedule::command('queue:work database --stop-when-empty --max-time=50')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::call(function () {
    // Transition expired active/trial tenants to 3-day grace_period
    DB::table('tenants')
        ->whereIn('status', ['active', 'trial'])
        ->whereNotNull('subscription_expires_at')
        ->where('subscription_expires_at', '<', now())
        ->update(['status' => 'grace_period', 'updated_at' => now()]);

    // Suspend tenants whose 3-day grace_period has elapsed
    DB::table('tenants')
        ->where('status', 'grace_period')
        ->whereNotNull('subscription_expires_at')
        ->where('subscription_expires_at', '<', now()->subDays(3))
        ->update(['status' => 'suspended', 'updated_at' => now()]);
})->hourly()->name('check-tenant-subscriptions');
