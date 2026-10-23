# راهنمای جامع استقرار «کافه گل» (Cafe Gol SaaS) روی هاست اشتراکی ایران (cPanel و DirectAdmin)

این سامانه به صورت کامل برای اجرا روی هاست‌های اشتراکی لینوکس ایران با **PHP 8.2+** و **MySQL / MariaDB** بدون نیاز به Node.js، Docker، Redis یا Supervisor روی سرور طراحی شده است.

---

## ۱. آماده‌سازی بسته استقرار (در کامپیوتر لوکال)

```bash
# ۱. ساخت فایل‌های استاتیک فرانت‌اند React + Tailwind RTL در پوشه public
npm install
npm run build

# ۲. نصب پکیج‌های بهینه Laravel 11 بدون وابستگی‌های توسعه
composer install --optimize-autoloader --no-dev

# ۳. فشرده‌سازی کل پروژه (شامل پوشه vendor و public) در قالب فایل cafegol-release.zip
zip -r cafegol-release.zip . -x "node_modules/*" ".git/*"
```

---

## ۲. آپلود در cPanel یا DirectAdmin

1. وارد **File Manager** هاست شوید و به پوشه `public_html` بروید.
2. فایل `cafegol-release.zip` را آپلود و **Extract** کنید.
3. فایل `.htaccess` موجود در ریشه پروژه به صورت خودکار تمام درخواست‌ها را به پوشه `/public` هدایت کرده و دسترسی مستقیم به فایل `.env`، پوشه `storage` و `vendor` را مسدود می‌کند.
4. در بخش **MySQL Databases** یک دیتابیس و کاربر با دسترسی `ALL PRIVILEGES` بسازید.
5. آدرس `https://your-domain.ir/install` را در مرورگر باز کنید تا ویزارد نصب چهارمرحله‌ای اجرا شود (بررسی پیش‌نیازها، ساخت `.env`، اجرای مایگریشن‌ها و ساخت حساب سوپرادمین).

---

## ۳. تنظیم Cron Job (هر دقیقه - بدون نیاز به Queue Worker دائم)

در بخش **Cron Jobs** پنل هاست، دستور زیر را با زمان‌بندی `* * * * *` (هر دقیقه) ثبت کنید:

```bash
* * * * * /usr/local/bin/php /home/USERNAME/public_html/artisan schedule:run >> /dev/null 2>&1
```

این کران‌جاب هر دقیقه دستورات زیر را اجرا می‌کند:
- `queue:work database --stop-when-empty --max-time=50` (ارسال اعلان‌های ربات بله، تلگرام و ایمیل)
- بررسی انقضای اشتراک کافه‌ها و اعمال دوره تنفس ۳ روزه (Grace Period)
- پشتیبان‌گیری فشرده روزانه از دیتابیس در مسیر `storage/app/backups` در ساعت ۰۳:۰۰ بامداد

---

## ۴. راه‌اندازی ربات بله (Bale) و تلگرام (Telegram) برای OTP و اعلان سفارش

### الف) ربات بله (Bale Bot)
1. در پیام‌رسان بله به `@botfather` پیام دهید و یک بازو (ربات) جدید بسازید.
2. توکن دریافتی را در **پنل سوپرادمین > ربات بله و تلگرام (OTP)** وارد کنید.
3. روی دکمه **«ثبت خودکار Webhook بله»** کلیک کنید تا آدرس `https://your-domain.ir/api/webhooks/bale` ثبت شود.

### ب) ربات تلگرام + پروکسی / کلودفلر ورکر برای هاست داخل ایران
اگر سرور هاست شما داخل ایران است و دسترسی مستقیم به `api.telegram.org` مسدود است:
1. کد آماده Cloudflare Worker موجود در تب «کدهای Laravel 11 و OTP» را در پنل رایگان Cloudflare خود مستقر کنید.
2. آدرس Worker خود (مثلاً `https://tg-relay.your-worker.workers.dev/bot`) را در فیلد **API Base URL / Relay** در پنل سوپرادمین کافه گل قرار دهید.
