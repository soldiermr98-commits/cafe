<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InstallController;
use App\Http\Controllers\Api\V1\TenantApiController;
use App\Http\Middleware\ResolveTenantMiddleware;
use App\Http\Middleware\EnforceStaffRoleMiddleware;

// Web Installer & Updater (Shared Hosting ZIP Deployment)
Route::prefix('install')->group(function () {
    Route::get('/requirements', [InstallController::class, 'checkRequirements']);
    Route::post('/run', [InstallController::class, 'runInstall']);
});
Route::post('/update/run', [InstallController::class, 'runUpdate']);

// Public Auth & Multi-Driver OTP (Email, Bale Bot, Telegram Bot)
Route::prefix('v1/auth')->group(function () {
    Route::post('/otp/send', [TenantApiController::class, 'sendOtp']);
    Route::post('/otp/verify', [TenantApiController::class, 'verifyOtp']);
});

// Tenant-Isolated Routes (Enforced by ResolveTenantMiddleware)
Route::prefix('v1')->middleware([ResolveTenantMiddleware::class])->group(function () {
    Route::get('/tenant/bootstrap', [TenantApiController::class, 'bootstrap']);
    Route::get('/tenant/orders/poll', [TenantApiController::class, 'pollOrders']);

    // Role-Scoped Staff Endpoints
    Route::middleware([EnforceStaffRoleMiddleware::class . ':products'])->group(function () {
        Route::post('/tenant/products', [TenantApiController::class, 'storeProduct']);
        Route::patch('/tenant/products/{id}', [TenantApiController::class, 'updateProduct']);
        Route::delete('/tenant/products/{id}', [TenantApiController::class, 'deleteProduct']);
    });
});
