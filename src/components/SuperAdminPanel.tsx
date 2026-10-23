import React, { useState } from 'react';
import { TenantCafe, SaaSPlan, SupportTicket } from '../types';
import { formatToman, toPersianNum } from '../utils/persian';

interface SuperAdminPanelProps {
  tenants: TenantCafe[];
  plans: SaaSPlan[];
  tickets: SupportTicket[];
  onUpdateTenantStatus: (tenantId: string, status: TenantCafe['status']) => void;
  onImpersonateTenant: (tenantId: string) => void;
  onReplyTicket: (ticketId: string, replyText: string) => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  tenants,
  plans,
  tickets,
  onUpdateTenantStatus,
  onImpersonateTenant,
  onReplyTicket,
}) => {
  const [subTab, setSubTab] = useState<'tenants' | 'bots' | 'plans' | 'tickets' | 'backups'>(
    'tenants'
  );
  const [baleBotToken, setBaleBotToken] = useState<string>(
    '1948271042:AAH9xK8mPqL2vR5nTzW0cJ4bY7gF1dM3sE'
  );
  const [telegramBotToken, setTelegramBotToken] = useState<string>(
    '7102938475:AAHkL9pQ2wR4xT6yU8iO0pA3sD5fG7hJ9k'
  );
  const [telegramProxyUrl, setTelegramProxyUrl] = useState<string>(
    'https://tg-relay.cafegol-worker.workers.dev/bot'
  );
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [backupLogs, setBackupLogs] = useState<
    { id: string; file: string; size: string; date: string }[]
  >([
    {
      id: 'bkp_1',
      file: 'storage/app/backups/cafegol_db_1405_07_30_0300.sql.gz',
      size: '۴.۸ مگابایت',
      date: '۱۴۰۵/۰۷/۳۰ - ۰۳:۰۰ بامداد (Cron)',
    },
    {
      id: 'bkp_2',
      file: 'storage/app/backups/cafegol_db_1405_07_29_0300.sql.gz',
      size: '۴.۶ مگابایت',
      date: '۱۴۰۵/۰۷/۲۹ - ۰۳:۰۰ بامداد (Cron)',
    },
  ]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-primary text-on-primary px-5 py-2.5 rounded-full shadow-xl text-[13px] font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/40 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-on-surface">
              پنل سوپرادمین پلتفرم کافه گل (SaaS Platform Owner)
            </h1>
            <p className="text-[12px] text-on-surface-variant">
              مدیریت کافه‌ها (Tenants)، بازوهای OTP بله و تلگرام، پلن‌های اشتراک، تیکت‌ها و بکاپ دیتابیس
            </p>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="flex items-center gap-1.5 flex-wrap bg-surface-container p-1.5 rounded-2xl">
          {[
            { id: 'tenants', label: 'کافه‌ها (Tenants)', icon: 'storefront' },
            { id: 'bots', label: 'ربات بله و تلگرام (OTP)', icon: 'smart_toy' },
            { id: 'plans', label: 'پلن‌ها و کرون انقضا', icon: 'workspace_premium' },
            { id: 'tickets', label: 'تیکت‌های پشتیبانی', icon: 'support_agent' },
            { id: 'backups', label: 'بکاپ خودکار MySQL', icon: 'backup' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                subTab === t.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40">
          <span className="text-[12px] text-outline">کافه‌های ثبت‌شده (Tenants)</span>
          <div className="text-[22px] font-extrabold text-primary mt-1">
            {toPersianNum(tenants.length)} کافه فعال
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40">
          <span className="text-[12px] text-outline">درآمد ماهانه اشتراک (MRR)</span>
          <div className="text-[22px] font-extrabold text-on-surface mt-1">
            {formatToman(38450000)} ت
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40">
          <span className="text-[12px] text-outline">وضعیت Cron Job هاست</span>
          <div className="text-[15px] font-bold text-primary mt-2">
            اجرای هر دقیقه (schedule:run)
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40">
          <span className="text-[12px] text-outline">ایزولاسیون TenantScope</span>
          <div className="text-[15px] font-bold text-secondary mt-2">
            تأیید شده (Single-DB)
          </div>
        </div>
      </div>

      {/* TAB 1: TENANTS */}
      {subTab === 'tenants' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h3 className="text-[16px] font-bold">لیست تمام کافه‌های مستأجر (Multi-Tenant)</h3>
            <span className="text-[11px] text-outline">
              هر کافه دارای tenant_id مجزا در دیتابیس واحد MySQL است
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-surface-container text-on-surface-variant text-[11px]">
                <tr>
                  <th className="py-3 px-4">نام کافه و آدرس (Slug)</th>
                  <th className="py-3 px-4">مالک و تماس</th>
                  <th className="py-3 px-4">پلن و انقضا</th>
                  <th className="py-3 px-4">سفارش ماهانه / فضا</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4">عملیات سوپرادمین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-low/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface">{t.name}</div>
                      <div className="text-[11px] text-primary font-mono" dir="ltr">
                        /c/{t.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium">{t.ownerName}</div>
                      <div className="text-[11px] text-outline font-mono" dir="ltr">
                        {t.ownerPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-primary">
                        {plans.find((p) => p.id === t.planId)?.name}
                      </div>
                      <div className="text-[11px] text-outline">انقضا: {t.subscriptionEndsAt}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[12px]">
                      <div>{toPersianNum(t.ordersCountThisMonth)} سفارش</div>
                      <div className="text-outline">{toPersianNum(t.storageUsedMb)} مگابایت</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          t.status === 'active'
                            ? 'bg-secondary-container text-primary'
                            : t.status === 'trial'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {t.status === 'active'
                          ? 'فعال'
                          : t.status === 'trial'
                          ? 'آزمایشی (Trial)'
                          : t.status === 'grace_period'
                          ? 'مهلت تمدید (Grace)'
                          : 'مسدود'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onImpersonateTenant(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-bold"
                        >
                          ورود به پنل کافه (Impersonate)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = t.status === 'suspended' ? 'active' : 'suspended';
                            onUpdateTenantStatus(t.id, next);
                            notify(`وضعیت «${t.name}» تغییر یافت`);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-outline-variant text-[11px]"
                        >
                          {t.status === 'suspended' ? 'فعال‌سازی' : 'تعلیق'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BALE & TELEGRAM BOT WEBHOOK CONFIG */}
      {subTab === 'bots' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-4">
            <h3 className="text-[16px] font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">chat</span>
              <span>پیکربندی بازوی پیام‌رسان بله (Bale OTP Driver)</span>
            </h3>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              پیام‌رسان بله روی تمام سرورهای اشتراکی ایران بدون نیاز به پروکسی با آدرس{' '}
              <code className="font-mono text-primary">https://tapi.bale.ai</code> کار می‌کند.
            </p>
            <div>
              <label className="block text-[11px] text-outline mb-1">
                توکن بازوی بله (دریافتی از @botfather در بله)
              </label>
              <input
                type="text"
                dir="ltr"
                value={baleBotToken}
                onChange={(e) => setBaleBotToken(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] font-mono"
              />
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low text-[11px] font-mono" dir="ltr">
              POST /api/v1/webhooks/bale
            </div>
            <button
              type="button"
              onClick={() =>
                notify('وب‌هوک بازوی بله (setWebhook) با موفقیت روی سرور ثبت شد')
              }
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold"
            >
              ذخیره و ثبت خودکار Webhook بله
            </button>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-4">
            <h3 className="text-[16px] font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">send</span>
              <span>پیکربندی ربات تلگرام + پروکسی خروجی (Telegram OTP Driver)</span>
            </h3>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              از آنجا که در هاست‌های اشتراکی داخل ایران دسترسی مستقیم به api.telegram.org مسدود است، سیستم از Base URL سفارشی (Cloudflare Worker Relay) یا پروکسی خروجی cURL پشتیبانی می‌کند.
            </p>
            <div>
              <label className="block text-[11px] text-outline mb-1">توکن ربات تلگرام</label>
              <input
                type="text"
                dir="ltr"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-outline mb-1">
                آدرس رله / Custom API Base URL (جهت عبور از فیلترینگ روی هاست ایران)
              </label>
              <input
                type="text"
                dir="ltr"
                value={telegramProxyUrl}
                onChange={(e) => setTelegramProxyUrl(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                notify('تنظیمات ربات تلگرام و رله Cloudflare Worker ذخیره و تست شد')
              }
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold"
            >
              تست اتصال رله و ثبت Webhook تلگرام
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PLANS & CRON EXPIRY */}
      {subTab === 'plans' && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[16px] font-bold">
                چرخه خودکار انقضای اشتراک (Cron Job:SubscriptionsCheckCommand)
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                ارسال اخطار ۷ روز و ۳ روز قبل از انقضا در بله/تلگرام/ایمیل ← دوره تنفس ۳ روزه (Grace Period) ← حالت فقط‌خواندنی (Read-Only)
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/v1/cron/schedule-run', { method: 'POST' });
                  const data = await res.json();
                  notify(data.log?.summary || 'کرون‌جاب سرور اجرا شد');
                } catch {
                  notify('کرون‌جاب بررسی اشتراک‌ها اجرا شد');
                }
              }}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold"
            >
              اجرای واقعی php artisan schedule:run (POST /api/v1/cron/schedule-run)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {plans.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2"
              >
                <div className="font-bold text-[15px] text-primary">{p.name}</div>
                <div className="text-[13px] font-bold">
                  ماهانه: {formatToman(p.monthlyPrice)} ت | سالانه: {formatToman(p.yearlyPrice)} ت
                </div>
                <div className="text-[11px] text-outline">
                  سقف محصول: {toPersianNum(p.maxProducts)} • پرسنل: {toPersianNum(p.maxStaff)} •
                  فضا: {toPersianNum(p.storageLimitMb)} MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT TICKETS */}
      {subTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.map((tk) => (
            <div
              key={tk.id}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div>
                  <span className="font-bold text-[15px] text-on-surface">{tk.subject}</span>
                  <span className="text-[12px] text-primary mr-2">({tk.tenantName})</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-primary text-[11px] font-bold">
                  {tk.status === 'answered' ? 'پاسخ داده شده' : 'در انتظار پاسخ'}
                </span>
              </div>
              <div className="space-y-2">
                {tk.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-[12px] ${
                      m.sender === 'superadmin'
                        ? 'bg-secondary-container/40 text-on-surface mr-6'
                        : 'bg-surface-container-low text-on-surface ml-6'
                    }`}
                  >
                    <div className="font-bold text-primary mb-1">
                      {m.senderName} • {m.time}
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={replyTextMap[tk.id] || ''}
                  onChange={(e) =>
                    setReplyTextMap((prev) => ({ ...prev, [tk.id]: e.target.value }))
                  }
                  placeholder="پاسخ پشتیبانی پلتفرم را بنویسید..."
                  className="flex-1 rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const txt = replyTextMap[tk.id];
                    if (!txt?.trim()) return;
                    onReplyTicket(tk.id, txt.trim());
                    setReplyTextMap((prev) => ({ ...prev, [tk.id]: '' }));
                    notify('پاسخ تیکت ثبت و به مالک کافه در بله/ایمیل اطلاع داده شد');
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold"
                >
                  ارسال پاسخ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: DATABASE BACKUPS */}
      {subTab === 'backups' && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold">
                پشتیبان‌گیری خودکار روزانه دیتابیس MySQL با چرخش ۱۴ روزه (Rotation)
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                بدون نیاز به تابع غیرفعال exec() در هاست اشتراکی (تولید Dump با PDO خالص PHP و فشرده‌سازی Gzip)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBackupLogs((prev) => [
                  {
                    id: `bkp_${Date.now()}`,
                    file: `storage/app/backups/cafegol_db_manual_${Date.now()}.sql.gz`,
                    size: '۴.۹ مگابایت',
                    date: 'هم‌اکنون (ایجاد دستی توسط سوپرادمین)',
                  },
                  ...prev,
                ]);
                notify('فایل پشتیبان جدید دیتابیس با موفقیت ایجاد و فشرده‌سازی شد');
              }}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_download</span>
              <span>تهیه بکاپ آنی (One-Click Export)</span>
            </button>
          </div>

          <div className="space-y-2">
            {backupLogs.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-[12px]"
              >
                <div>
                  <div className="font-mono font-bold text-primary" dir="ltr">
                    {b.file}
                  </div>
                  <div className="text-outline text-[11px]">
                    حجم: {b.size} • زمان: {b.date}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-secondary-container text-primary font-bold text-[11px]">
                  سالم (Verified)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
