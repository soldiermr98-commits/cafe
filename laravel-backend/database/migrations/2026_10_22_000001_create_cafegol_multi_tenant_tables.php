<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saas_plans', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name', 120);
            $table->string('badge', 60)->nullable();
            $table->unsignedBigInteger('monthly_price')->default(0);
            $table->unsignedBigInteger('yearly_price')->default(0);
            $table->unsignedInteger('max_products')->default(50);
            $table->unsignedInteger('max_staff')->default(5);
            $table->unsignedInteger('max_orders_per_month')->default(1000);
            $table->unsignedInteger('storage_limit_mb')->default(512);
            $table->json('features');
            $table->timestamps();
        });

        Schema::create('tenants', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('slug', 80)->unique();
            $table->string('custom_domain', 190)->nullable()->unique();
            $table->string('name', 150);
            $table->string('tagline', 255)->nullable();
            $table->string('welcome_title', 190)->nullable();
            $table->string('welcome_subtitle', 255)->nullable();
            $table->string('badge_text', 100)->nullable();
            $table->text('story_quote')->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('instagram', 100)->nullable();
            $table->string('wifi_ssid', 100)->nullable();
            $table->string('wifi_pass', 100)->nullable();
            $table->string('weekday_hours', 120)->nullable();
            $table->string('weekend_hours', 120)->nullable();
            $table->boolean('is_open')->default(true);
            $table->enum('primary_color_palette', ['olive', 'sage', 'forest', 'terracotta', 'amber'])->default('olive');
            $table->string('card_number', 32)->nullable();
            $table->string('card_holder_name', 150)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->string('sheba_number', 40)->nullable();
            $table->decimal('tax_percentage', 5, 2)->default(0);
            $table->decimal('service_fee_percentage', 5, 2)->default(0);
            $table->unsignedBigInteger('loyalty_discount_amount')->default(0);
            $table->string('plan_id', 64)->index();
            $table->string('subscription_ends_at', 32);
            $table->timestamp('subscription_expires_at')->nullable();
            $table->enum('status', ['active', 'trial', 'grace_period', 'suspended'])->default('trial');
            $table->string('owner_name', 150);
            $table->string('owner_phone', 32)->index();
            $table->string('owner_email', 190)->index();
            $table->string('bale_chat_id', 100)->nullable();
            $table->string('telegram_chat_id', 100)->nullable();
            $table->unsignedInteger('orders_count_this_month')->default(0);
            $table->unsignedInteger('storage_used_mb')->default(0);
            $table->timestamps();

            $table->foreign('plan_id')->references('id')->on('saas_plans');
        });

        Schema::create('otp_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('identifier', 190)->index();
            $table->enum('channel', ['email', 'bale', 'telegram']);
            $table->string('code_hash', 255);
            $table->string('bot_session_token', 100)->nullable()->unique();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(5);
            $table->string('ip_address', 45);
            $table->timestamp('expires_at')->index();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('name', 120);
            $table->string('icon', 60)->default('coffee');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('products', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('category_id', 64)->index();
            $table->string('name', 180);
            $table->string('subtitle', 180)->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('base_price');
            $table->unsignedBigInteger('cost_price')->default(0);
            $table->string('image', 255);
            $table->string('badge', 80)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_bestseller')->default(false);
            $table->boolean('is_available')->default(true);
            $table->integer('stock_count')->default(100);
            $table->string('Origin', 120)->nullable();
            $table->string('roast_level', 120)->nullable();
            $table->integer('calories')->nullable();
            $table->string('prep_time', 60)->nullable();
            $table->json('sizes');
            $table->json('addons');
            $table->json('recipe');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('cafe_tables', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('number', 20);
            $table->string('name', 120);
            $table->string('zone', 120);
            $table->unsignedTinyInteger('capacity')->default(4);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('code', 32)->index();
            $table->string('tenant_id', 64)->index();
            $table->string('customer_name', 150);
            $table->string('customer_phone', 32)->index();
            $table->enum('dine_type', ['dine_in', 'takeaway'])->default('dine_in');
            $table->string('table_number', 20)->nullable();
            $table->json('items');
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('total_amount');
            $table->enum('payment_method', ['card_to_card', 'online_gateway', 'pos_split', 'cash', 'pos_reader']);
            $table->json('split_payment')->nullable();
            $table->string('card_last_four', 10)->nullable();
            $table->string('receipt_image_url', 255)->nullable();
            $table->boolean('receipt_verified')->default(false);
            $table->enum('status', ['pending_payment', 'payment_verified', 'preparing', 'ready', 'delivered', 'cancelled'])->default('pending_payment')->index();
            $table->string('created_at_jalali', 40);
            $table->unsignedSmallInteger('estimated_minutes')->default(15);
            $table->text('notes')->nullable();
            $table->json('history');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('name', 160);
            $table->string('unit', 40);
            $table->decimal('current_stock', 12, 2)->default(0);
            $table->decimal('min_threshold', 12, 2)->default(0);
            $table->unsignedBigInteger('cost_per_unit')->default(0);
            $table->string('last_updated', 40);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->enum('type', ['income', 'expense'])->index();
            $table->string('category', 100);
            $table->string('title', 255);
            $table->unsignedBigInteger('amount');
            $table->string('jalali_date', 32)->index();
            $table->string('payment_method', 80);
            $table->string('reference_code', 64)->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('cash_register_shifts', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('opened_at', 64);
            $table->string('closed_at', 64)->nullable();
            $table->unsignedBigInteger('opening_balance')->default(0);
            $table->unsignedBigInteger('cash_sales')->default(0);
            $table->unsignedBigInteger('card_to_card_sales')->default(0);
            $table->unsignedBigInteger('pos_reader_sales')->default(0);
            $table->unsignedBigInteger('expenses_out')->default(0);
            $table->unsignedBigInteger('expected_cash')->default(0);
            $table->unsignedBigInteger('actual_closing_cash')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->string('cashier_name', 150);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('staff_members', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('name', 150);
            $table->enum('role', ['owner', 'manager', 'cashier', 'kitchen']);
            $table->string('role_label', 120);
            $table->string('phone', 32);
            $table->boolean('active')->default(true);
            $table->json('permissions');
            $table->string('last_login', 64)->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('tenant_name', 150);
            $table->string('subject', 255);
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['open', 'answered', 'closed'])->default('open');
            $table->string('created_at_jalali', 64);
            $table->json('messages');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('staff_members');
        Schema::dropIfExists('cash_register_shifts');
        Schema::dropIfExists('ledger_entries');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('cafe_tables');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('otp_challenges');
        Schema::dropIfExists('tenants');
        Schema::dropIfExists('saas_plans');
    }
};
