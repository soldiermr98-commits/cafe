import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowModal(true);
          }
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-primary text-[11px] font-semibold hover:bg-primary hover:text-on-primary transition-all active:scale-95 whitespace-nowrap shrink-0"
        title="نصب وب‌اپلیکیشن کافه گل (PWA)"
      >
        <span className="material-symbols-outlined text-[15px]">install_mobile</span>
        <span>نصب اپ</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-5 text-on-surface shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[22px]">install_mobile</span>
                <h3 className="text-[16px] font-bold">نصب وب‌اپلیکیشن کافه گل (PWA)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-outline"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              منوی دیجیتال و پنل مدیریت کافه گل به صورت وب‌اپلیکیشن پیش‌رونده (PWA) با کش آفلاین طراحی شده است تا در شبکه‌های موبایل ضعیف نیز با سرعت بالا اجرا شود.
            </p>
            {isIOS ? (
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-[12px] space-y-1.5">
                <p className="font-bold text-primary">راهنمای نصب در آیفون و آیپد (Safari):</p>
                <p>۱. در نوار پایین مرورگر سافاری روی دکمه <strong>Share (اشتراک‌گذاری)</strong> بزنید.</p>
                <p>۲. گزینه <strong>Add to Home Screen</strong> را انتخاب نمایید.</p>
              </div>
            ) : (
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-[12px] space-y-1.5">
                <p className="font-bold text-primary">راهنمای نصب در اندروید و دسکتاپ:</p>
                <p>از منوی سه نقطه مرورگر کروم گزینه <strong>Install App</strong> یا <strong>Add to Home screen</strong> را انتخاب کنید.</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-all"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
