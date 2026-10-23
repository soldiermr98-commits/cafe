import React, { useState } from 'react';

export const InstallerAndArchitecture: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<
    'installer' | 'backend_code' | 'database_sql' | 'deployment_guide'
  >('installer');
  const [installStep, setInstallStep] = useState<number>(1);
  const [dbHost, setDbHost] = useState<string>('localhost');
  const [dbName, setDbName] = useState<string>('cafegol_saas_db');
  const [dbUser, setDbUser] = useState<string>('cafegol_user');
  const [adminEmail, setAdminEmail] = useState<string>('admin@cafegol.ir');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const copyCode = (label: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2200);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {copiedLabel && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-primary text-on-primary px-5 py-2 rounded-full shadow-xl text-[12px] font-bold">
          کد «{copiedLabel}» در حافظه کپی شد ✓
        </div>
      )}

      {/* Header */}
      <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-primary">
            نصب‌کننده تحت وب (/install) و کدهای کامل بک‌اند Laravel 11 + MySQL
          </h1>
          <p className="text-[12px] text-on-surface-variant">
            آماده آپلود به صورت ZIP روی هاست اشتراکی ایران (cPanel / DirectAdmin) با PHP 8.2+ و بدون نیاز به Node.js، Docker یا Redis روی سرور
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap bg-surface-container p-1.5 rounded-2xl">
          {[
            { id: 'installer', label: 'ویزارد نصب (/install)', icon: 'build_circle' },
            { id: 'database_sql', label: 'اسکیمای کامل MySQL', icon: 'database' },
            { id: 'backend_code', label: 'کدهای Laravel 11 و OTP', icon: 'code' },
            { id: 'deployment_guide', label: 'راهنمای استقرار cPanel و عیب‌یابی', icon: 'menu_book' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubView(tab.id as typeof activeSubView)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                activeSubView === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: WEB-BASED INSTALLER (/install) & UPDATER (/update)
         ===================================================================== */}
      {activeSubView === 'installer' && (
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 max-w-3xl mx-auto space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div>
              <h2 className="text-[18px] font-bold text-on-surface">
                جادوگر نصب تحت وب کافه گل (مسیر /install در هاست اشتراکی)
              </h2>
              <p className="text-[12px] text-outline">
                بررسی پیش‌نیازهای PHP 8.2+، ساخت خودکار فایل .env، اجرای مایگریشن‌ها و سیدرها
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-secondary-container text-primary text-[12px] font-bold">
              گام {installStep} از ۴
            </span>
          </div>

          {installStep === 1 && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-primary">
                ۱. بررسی اکستنشن‌ها و دسترسی پوشه‌ها در هاست اشتراکی
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
                {[
                  { name: 'نسخه PHP >= 8.2.0', val: 'PHP 8.2.18 (تأیید شد)' },
                  { name: 'اکستنشن PDO & pdo_mysql', val: 'فعال ✓' },
                  { name: 'اکستنشن GD (فشرده‌سازی تصاویر)', val: 'فعال ✓' },
                  { name: 'اکستنشن‌های mbstring, openssl, curl, zip', val: 'فعال ✓' },
                  { name: 'عدم وابستگی به exec / shell_exec', val: 'ایمن (غیرفعال در هاست)' },
                  { name: 'دسترسی نوشتن storage/ و bootstrap/cache/', val: '0775 قابل نوشتن ✓' },
                ].map((chk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between"
                  >
                    <span>{chk.name}</span>
                    <span className="font-bold text-primary">{chk.val}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setInstallStep(2)}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
              >
                ادامه به تنظیمات دیتابیس MySQL ←
              </button>
            </div>
          )}

          {installStep === 2 && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-primary">
                ۲. پیکربندی دیتابیس MySQL / MariaDB و نوشتن فایل .env
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                <div>
                  <label className="block text-outline mb-1">میزبان دیتابیس (DB_HOST)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-outline mb-1">نام دیتابیس (DB_DATABASE)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-outline mb-1">نام کاربری (DB_USERNAME)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low text-[11px] font-mono" dir="ltr">
                QUEUE_CONNECTION=database | CACHE_STORE=file | SESSION_DRIVER=database
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInstallStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container text-[12px]"
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  onClick={() => setInstallStep(3)}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
                >
                  تست اتصال دیتابیس و اجرای Migrations ←
                </button>
              </div>
            </div>
          )}

          {installStep === 3 && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-primary">
                ۳. ساخت جداول Multi-Tenant و حساب سوپرادمین پلتفرم
              </h3>
              <div>
                <label className="block text-[11px] text-outline mb-1">
                  ایمیل سوپرادمین پلتفرم
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => setInstallStep(4)}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
              >
                نصب نهایی، اجرای Seeders و قفل کردن نصب‌کننده ←
              </button>
            </div>
          )}

          {installStep === 4 && (
            <div className="p-4 rounded-2xl bg-secondary-container/40 border border-primary/40 text-center space-y-3">
              <span className="material-symbols-outlined text-primary text-4xl">verified</span>
              <h3 className="text-[16px] font-bold text-primary">
                نصب پلتفرم «کافه گل» با موفقیت کامل شد!
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                فایل قفل <code className="font-mono">storage/installed.lock</code> ایجاد شد و مسیر{' '}
                <code className="font-mono">/install</code> برای امنیت کامل مسدود گردید.
              </p>
              <div className="p-3 rounded-xl bg-surface-container-lowest text-left font-mono text-[11px]" dir="ltr">
                * * * * * /usr/local/bin/php /home/username/public_html/artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
              </div>
              <button
                type="button"
                onClick={() => setInstallStep(1)}
                className="px-4 py-2 rounded-xl bg-surface-container text-[12px]"
              >
                بازنشانی شبیه‌ساز نصب
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 2: COMPLETE MYSQL SCHEMA & MIGRATIONS
         ===================================================================== */}
      {activeSubView === 'database_sql' && (
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-primary">
              مایگریشن جامع MySQL با ایزولاسیون tenant_id و ایندکس‌های بهینه
            </h2>
            <button
              type="button"
              onClick={() =>
                copyCode(
                  'MySQL Migration',
                  document.getElementById('sql-schema-code')?.innerText || ''
                )
              }
              className="px-3 py-1.5 rounded-xl bg-secondary-container text-primary text-[11px] font-bold"
            >
              کپی کامل مایگریشن لاراول
            </button>
          </div>
          <pre
            id="sql-schema-code"
            dir="ltr"
            className="bg-[#141810] text-[#d9ea9e] p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed"
          >{`<?php
// database/migrations/2026_10_22_000001_create_cafegol_multi_tenant_schema.php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. SaaS Plans
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('monthly_price')->default(0);
            $table->unsignedBigInteger('yearly_price')->default(0);
            $table->unsignedInteger('max_products')->default(50);
            $table->unsignedInteger('max_staff')->default(5);
            $table->unsignedInteger('max_orders_per_month')->default(2000);
            $table->unsignedInteger('storage_limit_mb')->default(512);
            $table->json('features')->nullable();
            $table->timestamps();
        });

        // 2. Tenants (Cafes)
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('custom_domain')->nullable()->unique();
            $table->string('name');
            $table->string('tagline')->nullable();
            $table->text('story_quote')->nullable();
            $table->string('primary_palette', 32)->default('olive');
            $table->string('card_number', 32)->nullable();
            $table->string('card_holder_name')->nullable();
            $table->string('bank_name', 64)->nullable();
            $table->unsignedTinyInteger('tax_percentage')->default(0);
            $table->unsignedTinyInteger('service_fee_percentage')->default(0);
            $table->unsignedBigInteger('loyalty_discount_amount')->default(0);
            $table->boolean('is_open')->default(true);
            $table->foreignId('plan_id')->constrained('plans');
            $table->enum('status', ['trial', 'active', 'grace_period', 'readonly', 'suspended'])->default('trial');
            $table->timestamp('subscription_ends_at')->nullable()->index();
            $table->string('bale_chat_id', 64)->nullable();
            $table->string('telegram_chat_id', 64)->nullable();
            $table->timestamps();
        });

        // 3. Users & Scoped Roles
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable()->unique();
            $table->string('phone', 20)->nullable()->index();
            $table->string('password')->nullable();
            $table->enum('role', ['super_admin', 'owner', 'manager', 'cashier', 'kitchen', 'customer'])->default('owner');
            $table->json('permissions')->nullable();
            $table->string('theme_preference', 10)->default('light');
            $table->timestamps();
            $table->index(['tenant_id', 'role']);
        });

        // 4. Hardened OTP Codes (Email, Bale Bot, Telegram Bot)
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('identifier', 120)->index();
            $table->enum('channel', ['email', 'bale', 'telegram']);
            $table->string('token_hash'); // Bcrypt/SHA-256 hashed
            $table->string('bot_start_token', 64)->nullable()->unique();
            $table->unsignedTinyInteger('attempts')->default(0); // Max 5 attempts
            $table->string('ip_address', 45)->index();
            $table->timestamp('expires_at')->index(); // 2 minutes TTL
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });

        // 5. Categories & Products (Strict Tenant Indexing)
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('icon', 40)->default('spa');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['tenant_id', 'sort_order']);
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('base_price');
            $table->unsignedBigInteger('cost_price')->default(0);
            $table->string('image_path')->nullable();
            $table->string('badge', 40)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_bestseller')->default(false);
            $table->boolean('is_available')->default(true);
            $table->integer('stock_count')->default(0);
            $table->json('sizes')->nullable();
            $table->json('addons')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'category_id', 'is_available']);
        });

        // 6. Inventory & Recipes (Automatic Deduction on Sale)
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('unit', 24);
            $table->decimal('current_stock', 12, 2)->default(0);
            $table->decimal('min_threshold', 12, 2)->default(0);
            $table->unsignedBigInteger('cost_per_unit')->default(0);
            $table->timestamps();
            $table->index(['tenant_id', 'current_stock']);
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('amount_used', 10, 2);
            $table->unique(['product_id', 'inventory_item_id']);
        });

        // 7. Orders, Order Items, Receipts & Accounting Ledger
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('code', 24)->index();
            $table->string('customer_name');
            $table->string('customer_phone', 20)->index();
            $table->enum('dine_type', ['dine_in', 'takeaway'])->default('dine_in');
            $table->string('table_number', 16)->nullable();
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('total_amount');
            $table->enum('payment_method', ['card_to_card', 'online_gateway', 'pos_split', 'cash']);
            $table->string('card_last_four', 4)->nullable(); // Never store full card numbers!
            $table->string('receipt_image_path')->nullable();
            $table->boolean('receipt_verified')->default(false);
            $table->enum('status', ['pending_payment', 'payment_verified', 'preparing', 'ready', 'delivered', 'cancelled'])->default('pending_payment');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->enum('type', ['income', 'expense']);
            $table->string('category', 64);
            $table->string('title');
            $table->unsignedBigInteger('amount');
            $table->string('jalali_date', 16)->index();
            $table->string('payment_method', 32);
            $table->timestamps();
            $table->index(['tenant_id', 'type', 'jalali_date']);
        });
    }
};`}</pre>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: LARAVEL 11 MULTI-TENANCY, OTP DRIVERS, HTACCESS & TESTS
         ===================================================================== */}
      {activeSubView === 'backend_code' && (
        <div className="space-y-5">
          {/* Root .htaccess */}
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-primary">
                ۱. فایل .htaccess ریشه (برای هاست‌هایی که DocumentRoot به /public اشاره نمی‌کند)
              </h3>
              <button
                type="button"
                onClick={() =>
                  copyCode('.htaccess', document.getElementById('htaccess-code')?.innerText || '')
                }
                className="px-3 py-1 rounded-xl bg-secondary-container text-primary text-[11px] font-bold"
              >
                کپی .htaccess
              </button>
            </div>
            <pre
              id="htaccess-code"
              dir="ltr"
              className="bg-[#141810] text-[#d9ea9e] p-4 rounded-2xl text-[11px] font-mono overflow-x-auto"
            >{`<IfModule mod_rewrite.c>
    RewriteEngine On
    # Block direct access to sensitive files on shared hosting
    RewriteRule ^(\\.env|composer\\.json|composer\\.lock|artisan) - [F,L,NC]
    RewriteRule ^(app|bootstrap|config|database|resources|routes|storage|tests|vendor)/(.*) - [F,L,NC]

    # Forward all requests cleanly to /public directory
    RewriteCond %{REQUEST_URI} !^/public/
    RewriteRule ^(.*)$ public/$1 [L,QSA]
</IfModule>
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>`}</pre>
          </div>

          {/* Global Tenant Scope & OTP Service */}
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-primary">
                ۲. ایزولاسیون سراسری مستأجران (BelongsToTenant) و درایور OTP بله و تلگرام
              </h3>
              <button
                type="button"
                onClick={() =>
                  copyCode('Laravel Services', document.getElementById('otp-code')?.innerText || '')
                }
                className="px-3 py-1 rounded-xl bg-secondary-container text-primary text-[11px] font-bold"
              >
                کپی کد PHP
              </button>
            </div>
            <pre
              id="otp-code"
              dir="ltr"
              className="bg-[#141810] text-[#d9ea9e] p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed"
            >{`<?php
// app/Models/Concerns/BelongsToTenant.php
namespace App\\Models\\Concerns;

use Illuminate\\Database\\Eloquent\\Builder;
use Illuminate\\Database\\Eloquent\\Model;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::creating(function (Model $model) {
            if (empty($model->tenant_id) && app()->bound('currentTenantId')) {
                $model->tenant_id = app('currentTenantId');
            }
        });

        static::addGlobalScope('tenant', function (Builder $builder) {
            if (app()->bound('currentTenantId') && app('currentTenantId') !== null) {
                $builder->where($builder->getQuery()->from . '.tenant_id', app('currentTenantId'));
            }
        });
    }
}

// app/Services/Otp/Drivers/TelegramBotDriver.php
namespace App\\Services\\Otp\\Drivers;

use Illuminate\\Support\\Facades\\Http;
use App\\Models\\Setting;

class TelegramBotDriver implements OtpDriverInterface
{
    public function sendOtp(string $chatId, string $rawCode): bool
    {
        $token = Setting::get('telegram_bot_token');
        // Supports custom Cloudflare Worker relay or outgoing SOCKS5/HTTP proxy on Iranian hosts
        $baseUrl = rtrim(Setting::get('telegram_api_base_url', 'https://api.telegram.org/bot'), '/');
        $proxy = Setting::get('telegram_outbound_proxy');

        $request = Http::timeout(8);
        if (!empty($proxy)) {
            $request = $request->withOptions(['proxy' => $proxy]);
        }

        $response = $request->post("{$baseUrl}{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => "🌱 کد ورود یک‌بارمصرف شما به کافه گل: {$rawCode}\\n⏳ اعتبار: ۲ دقیقه",
        ]);

        return $response->successful();
    }
}`}</pre>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: CPANEL / DIRECTADMIN DEPLOYMENT GUIDE & TROUBLESHOOTING
         ===================================================================== */}
      {activeSubView === 'deployment_guide' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/40 space-y-3">
            <h3 className="text-[16px] font-bold text-primary">
              راهنمای گام‌به‌گام استقرار در cPanel و DirectAdmin
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-[12px] text-on-surface-variant leading-relaxed">
              <li>
                <strong>بیلد محلی پروژه:</strong> در سیستم خود دستور{' '}
                <code className="font-mono text-primary">composer install --optimize-autoloader --no-dev</code>{' '}
                و سپس <code className="font-mono text-primary">npm run build</code> را اجرا کنید تا فایل‌های استاتیک در پوشه <code className="font-mono">/public</code> قرار گیرند.
              </li>
              <li>
                <strong>فشرده‌سازی و آپلود:</strong> کل پوشه پروژه (شامل پوشه <code className="font-mono">vendor</code> و <code className="font-mono">public/build</code>) را ZIP کرده و در <code className="font-mono">public_html</code> هاست اشتراکی Extract نمایید.
              </li>
              <li>
                <strong>ساخت دیتابیس MySQL:</strong> از بخش MySQL Database Wizard در cPanel یک دیتابیس و کاربر ساخته و تمام دسترسی‌ها (ALL PRIVILEGES) را اعطا کنید.
              </li>
              <li>
                <strong>اجرای نصب‌کننده وب:</strong> آدرس <code className="font-mono">https://your-domain.ir/install</code> را باز کرده و مشخصات دیتابیس و سوپرادمین را وارد نمایید.
              </li>
              <li>
                <strong>تنظیم Cron Job واحد:</strong> در بخش Cron Jobs هاست، دستور زیر را روی اجرای هر دقیقه (<code className="font-mono">* * * * *</code>) تنظیم کنید:
                <div className="p-2 mt-1 rounded-lg bg-surface-container-low font-mono text-[10px]" dir="ltr">
                  /usr/local/bin/php /home/USER/public_html/artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/40 space-y-3">
            <h3 className="text-[16px] font-bold text-primary">
              عیب‌یابی خطاهای رایج در هاست اشتراکی ایران + نقشه راه آینده
            </h3>
            <div className="space-y-2 text-[12px] text-on-surface-variant">
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <strong className="text-on-surface block">
                  ۱. خطای 500 Internal Server Error پس از استخراج ZIP:
                </strong>
                علت: سطح دسترسی پوشه <code className="font-mono">storage</code> یا وجود دستور غیرمجاز <code className="font-mono">Options +FollowSymLinks</code> در برخی هاست‌های DirectAdmin. آن را به <code className="font-mono">Options +SymLinksIfOwnerMatch</code> تغییر دهید و دسترسی <code className="font-mono">storage</code> را روی 755 بگذارید.
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <strong className="text-on-surface block">
                  ۲. عدم ارسال پیام ربات تلگرام روی هاست ایران:
                </strong>
                در پنل سوپرادمین، آدرس <code className="font-mono">Custom API Base URL</code> را روی آدرس Cloudflare Worker شخصی خود قرار دهید تا درخواست‌ها بدون تایم‌اوت ارسال شوند.
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <strong className="text-primary block">نقشه راه ارتقاهای آینده (Roadmap):</strong>
                • اتصال درایور پیامکی کاوه‌نگار و ملی‌پیامک به <code className="font-mono">OtpManager</code><br />
                • چاپگر حرارتی تحت شبکه (ESC/POS) مستقیم از مرورگر (WebUSB / Print Server)<br />
                • اتصال درگاه‌های مستقیم زرین‌پال، زیبال و سامان‌کیش به ازای هر کافه
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
