<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed SaaS Subscription Plans
        DB::table('saas_plans')->updateOrInsert(['id' => 'plan_trial'], [
            'name' => 'آزمایشی ۱۴ روزه (رایگان)',
            'badge' => 'شروع سریع',
            'monthly_price' => 0,
            'yearly_price' => 0,
            'max_products' => 25,
            'max_staff' => 2,
            'max_orders_per_month' => 300,
            'storage_limit_mb' => 200,
            'features' => json_encode([
                'منوی دیجیتال QR کد نامحدود',
                'دریافت سفارش و پرداخت کارت‌به‌کارت',
                'ورود با ربات بله، تلگرام و ایمیل',
                'تم روشن و تاریک گیاهی موگه',
            ], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('saas_plans')->updateOrInsert(['id' => 'plan_basic'], [
            'name' => 'پایه (گلبرگ)',
            'badge' => null,
            'monthly_price' => 490000,
            'yearly_price' => 4900000,
            'max_products' => 80,
            'max_staff' => 5,
            'max_orders_per_month' => 2500,
            'storage_limit_mb' => 1024,
            'features' => json_encode([
                'تمامی امکانات پنل پایه و منوی PWA',
                'برد زنده سفارشات با هشدار صوتی',
                'صندوق فروشگاهی (POS) تبلت و موبایل',
                'اعلان سفارش جدید در بله و تلگرام مالک',
            ], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('saas_plans')->updateOrInsert(['id' => 'plan_pro'], [
            'name' => 'حرفه‌ای (گلخانه)',
            'badge' => 'پرفروش‌ترین',
            'monthly_price' => 890000,
            'yearly_price' => 8900000,
            'max_products' => 500,
            'max_staff' => 20,
            'max_orders_per_month' => 20000,
            'storage_limit_mb' => 5120,
            'features' => json_encode([
                'حسابداری کامل، سود و زیان و بهای تمام‌شده',
                'انبارداری و کسر خودکار مواد اولیه طبق رسپی',
                'مدیریت شیفت صندوق و تسویه ترکیبی (Split POS)',
                'خروجی اکسل و PDF با تقویم جلالی (شمسی)',
            ], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Seed Default Flagship Tenant (کافه گل)
        DB::table('tenants')->updateOrInsert(['id' => 'tenant_cafegol'], [
            'slug' => 'cafe-gol',
            'name' => 'کافه گل',
            'tagline' => 'آرامش یک فنجان تازگی در سایه‌سار برگ‌های سبز',
            'welcome_title' => 'به کافه گل خوش آمدید',
            'welcome_subtitle' => 'عطر خوش قهوه تازه در میان شکوفه‌های موگه',
            'badge_text' => 'گلخانه و آرامش صبحگاهی',
            'story_quote' => '«کافه گل، پناهگاهی سرسبز و آرام در دل شهر. جایی که هر قطره قهوه با اشتیاق عصاره‌گیری می‌شود.»',
            'address' => 'خیابان فرشته، بن‌بست نیلوفر، پلاک ۱۲، عمارت باغ گل',
            'phone' => '021-22005544',
            'instagram' => '@cafegol.tehran',
            'wifi_ssid' => 'CafeGol_Guest',
            'wifi_pass' => 'muguet2024',
            'weekday_hours' => '۸:۰۰ صبح الی ۲۳:۰۰ شب',
            'weekend_hours' => '۸:۳۰ صبح الی ۲۴:۰۰ بامداد',
            'is_open' => true,
            'primary_color_palette' => 'olive',
            'card_number' => '۶۰۳۷-۹۹۷۵-۹۹۱۲-۴۴۸۲',
            'card_holder_name' => 'سهراب سپهری (کافه گل)',
            'bank_name' => 'بانک ملی ایران',
            'sheba_number' => 'IR840170000000109283746501',
            'tax_percentage' => 0,
            'service_fee_percentage' => 0,
            'loyalty_discount_amount' => 20000,
            'plan_id' => 'plan_pro',
            'subscription_ends_at' => '۱۴۰۵/۱۱/۱۵',
            'subscription_expires_at' => now()->addMonths(4),
            'status' => 'active',
            'owner_name' => 'سهراب سپهری',
            'owner_phone' => '09123456789',
            'owner_email' => 'owner@cafegol.ir',
            'bale_chat_id' => '@cafegol_bale_admin',
            'telegram_chat_id' => '@cafegol_tg_admin',
            'orders_count_this_month' => 1420,
            'storage_used_mb' => 340,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
