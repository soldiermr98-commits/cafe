import React, { useState } from 'react';
import { SaaSPlan, TenantCafe } from '../types';
import { formatToman, toPersianNum } from '../utils/persian';

interface MarketingAndOnboardingProps {
  plans: SaaSPlan[];
  onRegisterNewCafe: (newCafe: TenantCafe) => void;
  onOpenDemoCafe: () => void;
  onOpenOwnerPanel: () => void;
}

export const MarketingAndOnboarding: React.FC<MarketingAndOnboardingProps> = ({
  plans,
  onRegisterNewCafe,
  onOpenDemoCafe,
  onOpenOwnerPanel,
}) => {
  const [authChannel, setAuthChannel] = useState<'bale' | 'telegram' | 'email'>('bale');
  const [identifier, setIdentifier] = useState<string>('09123456789');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('۵۸۴۹۲۰');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Onboarding Wizard State
  const [cafeName, setCafeName] = useState<string>('کافه بهارستان');
  const [cafeSlug, setCafeSlug] = useState<string>('cafe-baharestan');
  const [cardNum, setCardNum] = useState<string>('۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸');
  const [cardHolder, setCardHolder] = useState<string>('امیرمحمد رضوانی');

  return (
    <div className="min-h-screen bg-background text-on-surface py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 lg:p-10 border border-outline-variant/40 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-primary text-[12px] font-bold">
              <span className="material-symbols-outlined text-[16px]">spa</span>
              <span>پلتفرم جامع کافه‌ها و رستوران‌های ایران</span>
            </span>
            <h1 className="text-[28px] lg:text-[36px] font-extrabold text-on-surface leading-tight">
              منوی دیجیتال، سفارش‌گیری، صندوق POS و حسابداری «کافه گل»
            </h1>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">
              طراحی‌شده با هویت بصری گیاهی موگه (Muguet)، پشتیبانی کامل از کارت‌به‌کارت با تأیید رسید، انبارداری خودکار رسپی، تقویم جلالی و ورود آنی با ربات بله و تلگرام. کاملاً بهینه برای اجرا روی ارزان‌ترین هاست‌های اشتراکی لاراول (cPanel / DirectAdmin).
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenDemoCafe}
                className="px-5 py-3 rounded-2xl bg-primary text-on-primary font-bold text-[13px] flex items-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">local_cafe</span>
                <span>مشاهده دموی زنده منوی «کافه گل»</span>
              </button>
              <button
                type="button"
                onClick={onOpenOwnerPanel}
                className="px-5 py-3 rounded-2xl bg-secondary-container text-on-secondary-container font-bold text-[13px] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                <span>ورود به پنل مدیریت کافه</span>
              </button>
            </div>
          </div>

          {/* Interactive Multi-Driver OTP Login & Registration Card */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/50 space-y-4">
            {!showOnboarding ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-bold text-primary">
                    ثبت‌نام کافه جدید / ورود با OTP
                  </h3>
                  <span className="text-[11px] bg-secondary-container text-primary px-2.5 py-0.5 rounded-full font-bold">
                    ۱۴ روز رایگان
                  </span>
                </div>

                {/* Interchangeable OTP Drivers Selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthChannel('bale');
                      setOtpSent(false);
                    }}
                    className={`py-2 rounded-xl text-[12px] font-bold transition-all ${
                      authChannel === 'bale'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    بازوی بله (Bale)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthChannel('telegram');
                      setOtpSent(false);
                    }}
                    className={`py-2 rounded-xl text-[12px] font-bold transition-all ${
                      authChannel === 'telegram'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    ربات تلگرام
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthChannel('email');
                      setOtpSent(false);
                    }}
                    className={`py-2 rounded-xl text-[12px] font-bold transition-all ${
                      authChannel === 'email'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    ایمیل
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-outline mb-1">
                      {authChannel === 'email'
                        ? 'نشانی ایمیل مالک کافه'
                        : 'شماره موبایل مالک کافه'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3.5 py-2.5 text-[13px] font-mono text-left"
                    />
                  </div>

                  {authChannel !== 'email' && (
                    <div className="p-3 rounded-2xl bg-surface-container-lowest border border-primary/30 text-[11px] space-y-1.5">
                      <div className="font-bold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                        <span>
                          جریان احراز هویت وب‌هوک{' '}
                          {authChannel === 'bale' ? 'بازوی بله' : 'ربات تلگرام'}:
                        </span>
                      </div>
                      <p className="text-on-surface-variant">
                        ۱. روی لینک توکن یک‌بارمصرف{' '}
                        <code className="font-mono text-primary" dir="ltr">
                          {authChannel === 'bale'
                            ? 'https://ble.ir/cafegol_bot?start=tk_98a1'
                            : 'https://t.me/cafegol_bot?start=tk_98a1'}
                        </code>{' '}
                        بزنید.
                      </p>
                      <p className="text-on-surface-variant">
                        ۲. شماره تماس خود را در ربات به اشتراک بگذارید تا کد ۶ رقمی (اعتبار ۲ دقیقه، حداکثر ۵ تلاش) صادر شود.
                      </p>
                    </div>
                  )}

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={() => setOtpSent(true)}
                      className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
                    >
                      دریافت کد تأیید یک‌بارمصرف (OTP)
                    </button>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] text-primary font-bold mb-1">
                          کد ۶ رقمی ارسال‌شده (انقضا: ۱۲۰ ثانیه):
                        </label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full rounded-xl bg-surface-container-lowest border-2 border-primary px-3 py-2 text-center text-[16px] font-bold tracking-widest"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOnboarding(true)}
                        className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
                      >
                        تأیید کد و شروع ویزارد ساخت کافه ←
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <h3 className="text-[16px] font-bold text-primary">
                  ویزارد راه‌اندازی سریع کافه (Onboarding)
                </h3>
                <div>
                  <label className="block text-[11px] text-outline mb-1">نام کافه شما</label>
                  <input
                    type="text"
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-outline mb-1">
                    شناسه آدرس منو (Slug)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={cafeSlug}
                    onChange={(e) => setCafeSlug(e.target.value)}
                    className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-[12px] font-mono text-left"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-outline mb-1">
                      شماره کارت جهت واریز مشتریان
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value)}
                      className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-2.5 py-2 text-[11px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">نام صاحب کارت</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-2.5 py-2 text-[11px]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onRegisterNewCafe({
                      id: `tenant_${Date.now()}`,
                      slug: cafeSlug || 'my-cafe',
                      name: cafeName || 'کافه جدید',
                      tagline: 'آرامش یک فنجان قهوه تازه در کافه ما',
                      welcomeTitle: `به ${cafeName} خوش آمدید`,
                      welcomeSubtitle: 'سفارش آنلاین از منوی دیجیتال کافه',
                      badgeText: 'دم‌آوری تخصصی روزانه',
                      storyQuote: `«${cafeName}، میزبان لحظات گرم و صمیمی شما با بهترین دانه‌های قهوه.»`,
                      address: 'تهران، خیابان ولیعصر، پلاک ۱۱۰',
                      phone: identifier,
                      instagram: `@${cafeSlug}`,
                      wifiSsid: 'Cafe_Guest_WiFi',
                      wifiPass: 'welcome1405',
                      weekdayHours: '۸:۰۰ صبح الی ۲۳:۰۰ شب',
                      weekendHours: '۹:۰۰ صبح الی ۲۴:۰۰ بامداد',
                      isOpen: true,
                      primaryColorPalette: 'olive',
                      cardNumber: cardNum,
                      cardHolderName: cardHolder,
                      bankName: 'بانک ملت',
                      shebaNumber: 'IR000120000000000000000001',
                      taxPercentage: 0,
                      serviceFeePercentage: 0,
                      loyaltyDiscountAmount: 15000,
                      planId: 'plan_trial',
                      subscriptionEndsAt: '۱۴۰۵/۰۸/۱۵',
                      status: 'trial',
                      ownerName: cardHolder,
                      ownerPhone: identifier,
                      ownerEmail: 'owner@example.ir',
                      ordersCountThisMonth: 1,
                      storageUsedMb: 12,
                    });
                  }}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
                >
                  ساخت کافه و ورود به پنل مدیریت ←
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section className="space-y-4">
          <div className="text-center">
            <h2 className="text-[24px] font-bold text-on-surface">
              تعرفه پلن‌های اشتراک پلتفرم کافه گل
            </h2>
            <p className="text-[13px] text-on-surface-variant">
              امکان پرداخت آنلاین (زرین‌پال) یا کارت‌به‌کارت با تأیید فیش
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-primary">{p.name}</h3>
                    {p.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-primary text-[11px] font-bold">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[24px] font-extrabold text-on-surface">
                    {p.monthlyPrice === 0 ? 'رایگان' : `${formatToman(p.monthlyPrice)} تومان`}
                    <span className="text-[12px] font-normal text-outline"> / ماهانه</span>
                  </div>
                  <div className="text-[11px] text-secondary">
                    سقف {toPersianNum(p.maxProducts)} محصول • {toPersianNum(p.maxStaff)} پرسنل •{' '}
                    {toPersianNum(p.storageLimitMb)} مگابایت فضا
                  </div>
                  <ul className="space-y-2 text-[12px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[16px]">
                          check_circle
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
