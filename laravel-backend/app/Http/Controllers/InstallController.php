<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class InstallController
{
    public function checkRequirements(): array
    {
        return [
            'php_version' => version_compare(PHP_VERSION, '8.2.0', '>='),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'mbstring' => extension_loaded('mbstring'),
            'openssl' => extension_loaded('openssl'),
            'gd_or_imagick' => extension_loaded('gd') || extension_loaded('imagick'),
            'json' => extension_loaded('json'),
            'curl' => extension_loaded('curl'),
            'storage_writable' => is_writable(storage_path()),
            'env_writable' => is_writable(base_path()),
        ];
    }

    public function runInstall(Request $request)
    {
        if (file_exists(storage_path('installed.lock'))) {
            abort(403, 'سامانه قبلاً نصب و قفل شده است.');
        }

        $validated = $request->validate([
            'db_host' => 'required|string',
            'db_name' => 'required|string',
            'db_user' => 'required|string',
            'db_pass' => 'nullable|string',
            'admin_email' => 'required|email',
            'admin_phone' => 'required|string',
            'admin_password' => 'required|string|min:8',
        ]);

        // Write .env configuration safely without exec() or shell_exec()
        $envContent = file_get_contents(base_path('.env.example'));
        $replacements = [
            'DB_HOST=127.0.0.1' => 'DB_HOST=' . $validated['db_host'],
            'DB_DATABASE=laravel' => 'DB_DATABASE=' . $validated['db_name'],
            'DB_USERNAME=root' => 'DB_USERNAME=' . $validated['db_user'],
            'DB_PASSWORD=' => 'DB_PASSWORD="' . ($validated['db_pass'] ?? '') . '"',
            'QUEUE_CONNECTION=sync' => 'QUEUE_CONNECTION=database',
            'CACHE_STORE=file' => 'CACHE_STORE=database',
        ];
        $envContent = str_replace(array_keys($replacements), array_values($replacements), $envContent);
        file_put_contents(base_path('.env'), $envContent);

        Artisan::call('key:generate', ['--force' => true]);
        Artisan::call('migrate', ['--force' => true]);
        Artisan::call('db:seed', ['--force' => true]);

        // Create Super Admin account
        DB::table('users')->updateOrInsert(
            ['email' => $validated['admin_email']],
            [
                'full_name' => 'مدیر کل پلتفرم کافه گل',
                'phone' => $validated['admin_phone'],
                'password' => Hash::make($validated['admin_password']),
                'is_super_admin' => true,
                'role' => 'owner',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        file_put_contents(storage_path('installed.lock'), now()->toIso8601String());

        return response()->json(['status' => 'installed']);
    }

    public function runUpdate()
    {
        Artisan::call('migrate', ['--force' => true]);
        Artisan::call('optimize:clear');
        return response()->json(['status' => 'updated']);
    }
}
