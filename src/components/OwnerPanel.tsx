import React, { useState, useEffect } from 'react';
import {
  TenantCafe,
  Category,
  Product,
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  InventoryItem,
  LedgerEntry,
  CashRegisterShift,
  StaffMember,
  CafeTable,
  SaaSPlan,
} from '../types';
import { formatToman, toPersianNum, toJalaliTime } from '../utils/persian';

interface OwnerPanelProps {
  tenant: TenantCafe;
  categories: Category[];
  products: Product[];
  orders: Order[];
  inventory: InventoryItem[];
  ledger: LedgerEntry[];
  shift: CashRegisterShift;
  staff: StaffMember[];
  tables: CafeTable[];
  plans: SaaSPlan[];
  onUpdateTenant: (updated: Partial<TenantCafe>) => void;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (productId: string, updated: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkPriceAdjustment: (percentage: number) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onApproveReceipt: (orderId: string, approved: boolean) => void;
  onCreatePosOrder: (order: Order) => void;
  onAddLedgerEntry: (entry: LedgerEntry) => void;
  onUpdateShift: (updated: Partial<CashRegisterShift>) => void;
  onUpdateInventoryItem: (itemId: string, deltaStock: number) => void;
  onAddStaff: (member: StaffMember) => void;
  onPreviewCustomerMenu: () => void;
}

type OwnerTab =
  | 'dashboard'
  | 'orders'
  | 'pos'
  | 'products'
  | 'accounting'
  | 'inventory'
  | 'staff'
  | 'settings'
  | 'subscription';

export const OwnerPanel: React.FC<OwnerPanelProps> = ({
  tenant,
  categories,
  products,
  orders,
  inventory,
  ledger,
  shift,
  staff,
  tables,
  plans,
  onUpdateTenant,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkPriceAdjustment,
  onUpdateOrderStatus,
  onApproveReceipt,
  onCreatePosOrder,
  onAddLedgerEntry,
  onUpdateShift,
  onUpdateInventoryItem,
  onAddStaff,
  onPreviewCustomerMenu,
}) => {
  const [activeTab, setActiveTab] = useState<OwnerTab>('dashboard');
  const [pollingSeconds, setPollingSeconds] = useState<number>(6);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Product modal state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdCat, setNewProdCat] = useState<string>(categories[0]?.id || 'cat_espresso');
  const [newProdPrice, setNewProdPrice] = useState<number>(95000);
  const [newProdCost, setNewProdCost] = useState<number>(32000);
  const [newProdStock, setNewProdStock] = useState<number>(30);
  const [newProdDesc, setNewProdDesc] = useState<string>('');
  const [bulkPercent, setBulkPercent] = useState<number>(10);

  // POS State
  const [posCart, setPosCart] = useState<{ product: Product; qty: number }[]>([]);
  const [posDineType, setPosDineType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [posTable, setPosTable] = useState<string>('۱');
  const [posSplitCash, setPosSplitCash] = useState<number>(0);
  const [posSplitReader, setPosSplitReader] = useState<number>(0);
  const [posSplitCard, setPosSplitCard] = useState<number>(0);

  // Accounting New Entry State
  const [expTitle, setExpTitle] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('خرید مواد اولیه');
  const [expAmount, setExpAmount] = useState<number>(450000);
  const [expType, setExpType] = useState<'income' | 'expense'>('expense');
  const [jalaliDateFilter, setJalaliDateFilter] = useState<string>('همه تاریخ‌ها');

  // Staff modal state
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffPhone, setNewStaffPhone] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<'manager' | 'cashier' | 'kitchen'>('cashier');

  // Short-Polling Simulation (Every 6s, pausing when tab is hidden per Hard Hosting Constraints)
  useEffect(() => {
    const handleVis = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVis);
    const timer = setInterval(() => {
      if (!document.hidden) {
        setPollingSeconds((prev) => (prev <= 1 ? 6 : prev - 1));
      }
    }, 1000);
    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      clearInterval(timer);
    };
  }, []);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2800);
  };

  // Web Audio Beep for Live Order Alert
  const playBellSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore if audio blocked
    }
  };

  // Metrics Calculation
  const tenantOrders = orders.filter((o) => o.tenantId === tenant.id);
  const tenantProducts = products.filter((p) => p.tenantId === tenant.id);
  const todaySales = tenantOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingReceiptsCount = tenantOrders.filter(
    (o) => o.status === 'pending_payment' && !o.receiptVerified
  ).length;
  const lowStockItems = inventory.filter(
    (i) => i.tenantId === tenant.id && i.currentStock <= i.minThreshold
  );

  const totalIncome = ledger
    .filter((l) => l.tenantId === tenant.id && l.type === 'income')
    .reduce((s, l) => s + l.amount, 0);
  const totalExpense = ledger
    .filter((l) => l.tenantId === tenant.id && l.type === 'expense')
    .reduce((s, l) => s + l.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const posTotal = posCart.reduce((s, i) => s + i.product.basePrice * i.qty, 0);

  const currentPlan = plans.find((p) => p.id === tenant.planId) || plans[2];

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-primary text-on-primary px-5 py-2.5 rounded-full shadow-xl text-[13px] font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{notice}</span>
        </div>
      )}

      {/* Sidebar Navigation (RTL Right Side) */}
      <aside className="w-full lg:w-64 bg-surface-container border-b lg:border-b-0 lg:border-l border-outline-variant/40 shrink-0 flex flex-col justify-between p-4">
        <div>
          {/* Cafe Brand Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/30">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined fill-1">spa</span>
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-on-surface">{tenant.name}</h2>
                <span className="text-[11px] text-primary font-medium block">
                  پنل مدیریت کافه (Tenant)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateTenant({ isOpen: !tenant.isOpen });
                showToast(
                  !tenant.isOpen ? 'وضعیت کافه به «باز» تغییر یافت' : 'کافه موقتاً بسته شد'
                );
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                tenant.isOpen
                  ? 'bg-secondary-container text-primary border-primary/30'
                  : 'bg-error-container text-on-error-container border-error/30'
              }`}
            >
              {tenant.isOpen ? '● کافه باز است' : '○ بسته'}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {[
              { id: 'dashboard', label: 'پیشخوان و آمار', icon: 'dashboard' },
              {
                id: 'orders',
                label: 'برد زنده سفارش‌ها',
                icon: 'receipt_long',
                badge: tenantOrders.filter((o) => o.status !== 'delivered').length,
              },
              { id: 'pos', label: 'صندوق فروشگاهی (POS)', icon: 'point_of_sale' },
              { id: 'products', label: 'منو و محصولات', icon: 'restaurant_menu' },
              { id: 'accounting', label: 'حسابداری و صندوق', icon: 'account_balance_wallet' },
              {
                id: 'inventory',
                label: 'انبار و رسپی مواد',
                icon: 'inventory_2',
                alert: lowStockItems.length,
              },
              { id: 'staff', label: 'پرسنل و دسترسی‌ها', icon: 'badge' },
              { id: 'settings', label: 'میزها، QR و بات‌ها', icon: 'qr_code_2' },
              { id: 'subscription', label: 'اشتراک و صورت‌حساب', icon: 'workspace_premium' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as OwnerTab)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
                  activeTab === item.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === item.id
                        ? 'bg-on-primary text-primary'
                        : 'bg-secondary-container text-primary'
                    }`}
                  >
                    {toPersianNum(item.badge)}
                  </span>
                ) : null}
                {item.alert ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error text-on-error">
                    {toPersianNum(item.alert)} هشدار
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        {/* Shared Hosting Polling Telemetry & Customer Menu Link */}
        <div className="hidden lg:flex flex-col gap-2.5 pt-4 border-t border-outline-variant/30 mt-6">
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-primary font-bold">
              <span>به‌روزرسانی زنده (Polling)</span>
              <span>{isTabVisible ? `${toPersianNum(pollingSeconds)} ثانیه` : 'متوقف'}</span>
            </div>
            <p className="text-outline text-[10px]">
              بدون نیاز به WebSocket یا Redis (بهینه برای هاست اشتراکی)
            </p>
          </div>
          <button
            type="button"
            onClick={onPreviewCustomerMenu}
            className="w-full py-2.5 px-3 rounded-xl bg-secondary-container text-on-secondary-container hover:bg-primary hover:text-on-primary font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">visibility</span>
            <span>مشاهده منوی مشتری کافه</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {/* =================================================================
            TAB 1: DASHBOARD (پیشخوان و آمار)
           ================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-bold text-on-surface">
                  پیشخوان مدیریت {tenant.name}
                </h1>
                <p className="text-[13px] text-on-surface-variant">
                  پنج‌شنبه ۳۰ مهر ۱۴۰۵ • شیفت فعال: {shift.cashierName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playBellSound();
                    showToast('تست صدای زنگ سفارش جدید اجرا شد');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-[12px] font-semibold flex items-center gap-1.5 hover:border-primary"
                >
                  <span className="material-symbols-outlined text-[17px] text-primary">
                    notifications_active
                  </span>
                  <span>تست هشدار صوتی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pos')}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[17px]">add_shopping_cart</span>
                  <span>ثبت سفارش حضوری (POS)</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span>فروش امروز (۳۰ مهر)</span>
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <div className="text-[22px] font-extrabold text-primary mt-2">
                  {formatToman(todaySales + 17450000)}{' '}
                  <span className="text-[12px] font-normal">تومان</span>
                </div>
                <div className="text-[11px] text-secondary mt-1">
                  +۱۸٪ نسبت به پنج‌شنبه گذشته
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span>فروش ماه جاری (مهر ۱۴۰۵)</span>
                  <span className="material-symbols-outlined text-primary">insights</span>
                </div>
                <div className="text-[22px] font-extrabold text-on-surface mt-2">
                  {formatToman(428500000)}{' '}
                  <span className="text-[12px] font-normal">تومان</span>
                </div>
                <div className="text-[11px] text-outline mt-1">
                  مجموع {toPersianNum(tenant.ordersCountThisMonth)} سفارش ثبت‌شده
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span>میانگین مبلغ هر سفارش</span>
                  <span className="material-symbols-outlined text-primary">receipt</span>
                </div>
                <div className="text-[22px] font-extrabold text-on-surface mt-2">
                  {formatToman(301000)}{' '}
                  <span className="text-[12px] font-normal">تومان</span>
                </div>
                <div className="text-[11px] text-secondary mt-1">
                  حاشیه سود ناخالص: ۶۴٪
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-xs">
                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span>رسیدهای منتظر تأیید</span>
                  <span className="material-symbols-outlined text-primary">pending_actions</span>
                </div>
                <div className="text-[22px] font-extrabold text-primary mt-2">
                  {toPersianNum(pendingReceiptsCount)} <span className="text-[12px] font-normal">فیش</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-[11px] text-primary font-bold underline mt-1"
                >
                  بررسی فوری در برد سفارش‌ها ←
                </button>
              </div>
            </div>

            {/* Sales Chart & Low Stock Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Weekly Jalali Chart */}
              <div className="lg:col-span-2 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-on-surface">
                    نمودار فروش ۷ روز اخیر (تقویم جلالی)
                  </h3>
                  <span className="text-[11px] text-outline">واحد: میلیون تومان</span>
                </div>
                <div className="grid grid-cols-7 gap-2 items-end h-44 pt-6 px-2 border-b border-outline-variant/30">
                  {[
                    { day: 'شنبه', val: 12.4, h: '55%' },
                    { day: 'یکشنبه', val: 11.8, h: '50%' },
                    { day: 'دوشنبه', val: 14.2, h: '65%' },
                    { day: 'سه‌شنبه', val: 13.5, h: '60%' },
                    { day: 'چهارشنبه', val: 16.9, h: '78%' },
                    { day: 'پنج‌شنبه', val: 21.4, h: '95%' },
                    { day: 'جمعه', val: 19.8, h: '88%' },
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-primary">
                        {toPersianNum(bar.val)}
                      </span>
                      <div
                        style={{ height: bar.h }}
                        className="w-full max-w-[36px] rounded-t-xl bg-primary/85 hover:bg-primary transition-all"
                      ></div>
                      <span className="text-[10px] text-on-surface-variant pb-1">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock & Top Products */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
                <h3 className="text-[16px] font-bold text-on-surface flex items-center justify-between">
                  <span>هشدار کسری موجودی انبار</span>
                  <span className="text-[11px] bg-error-container text-on-error-container px-2 py-0.5 rounded-full">
                    {toPersianNum(lowStockItems.length)} مورد
                  </span>
                </h3>
                <div className="space-y-2.5">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-surface-container-low border border-error/30 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[13px] font-bold text-on-surface">{item.name}</div>
                        <div className="text-[11px] text-outline">
                          موجودی فعلی: {toPersianNum(item.currentStock)} {item.unit} (حد مجاز:{' '}
                          {toPersianNum(item.minThreshold)})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateInventoryItem(item.id, 1000);
                          showToast(`موجودی «${item.name}» شارژ شد`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-bold"
                      >
                        + شارژ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: LIVE ORDER BOARD (برد زنده سفارش‌ها)
           ================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-bold text-on-surface">
                  برد زنده سفارش‌ها (Workflow کافه گل)
                </h1>
                <p className="text-[12px] text-on-surface-variant">
                  در انتظار پرداخت ← پرداخت تأیید شد ← در حال آماده‌سازی ← آماده ← تحویل شد / لغو
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1.5 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 ${
                    soundEnabled
                      ? 'bg-secondary-container text-primary border-primary/30'
                      : 'bg-surface-container text-outline border-outline-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {soundEnabled ? 'volume_up' : 'volume_off'}
                  </span>
                  <span>{soundEnabled ? 'زنگ هشدار فعال' : 'بی‌صدا'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenantOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold text-[13px]">
                        #{ord.code}
                      </span>
                      <div>
                        <div className="text-[14px] font-bold text-on-surface">
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] text-outline">
                          {ord.dineType === 'dine_in'
                            ? `سرو در کافه • میز شماره ${ord.tableNumber}`
                            : 'بیرون‌بر (Takeaway)'}{' '}
                          • ساعت {ord.createdAt}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary-container text-primary">
                      {ORDER_STATUS_LABELS[ord.status]}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-1.5 text-[12px]">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          <strong>{toPersianNum(it.quantity)}×</strong> {it.name}{' '}
                          <span className="text-outline">({it.details})</span>
                        </span>
                        <span className="font-bold text-primary">
                          {formatToman(it.unitPrice * it.quantity)} ت
                        </span>
                      </div>
                    ))}
                  </div>

                  {ord.notes && (
                    <div className="p-2 rounded-xl bg-surface-container-low text-[11px] text-secondary">
                      <strong>توضیحات باریستا:</strong> {ord.notes}
                    </div>
                  )}

                  {/* Card-to-Card Receipt Verification Box */}
                  {ord.paymentMethod === 'card_to_card' && (
                    <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px]">
                        <span className="font-bold text-on-surface block">
                          پرداخت کارت‌به‌کارت (۴ رقم آخر: {ord.cardLastFour || '۷۸۴۱'})
                        </span>
                        <span className="text-outline">
                          مبلغ: {formatToman(ord.totalAmount)} تومان •{' '}
                          {ord.receiptVerified ? 'رسید تأیید شده ✓' : 'منتظر بررسی فیش'}
                        </span>
                      </div>
                      {!ord.receiptVerified && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onApproveReceipt(ord.id, true);
                              playBellSound();
                              showToast(`رسید سفارش #${ord.code} تأیید و به بار ارسال شد`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold"
                          >
                            تأیید فیش
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onApproveReceipt(ord.id, false);
                              showToast(`رسید سفارش #${ord.code} رد شد`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-error-container text-on-error-container text-[11px] font-bold"
                          >
                            رد
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Workflow Stepper Buttons */}
                  <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(
                        [
                          'pending_payment',
                          'payment_verified',
                          'preparing',
                          'ready',
                          'delivered',
                        ] as OrderStatus[]
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            onUpdateOrderStatus(ord.id, st);
                            showToast(
                              `وضعیت سفارش #${ord.code} به «${ORDER_STATUS_LABELS[st]}» تغییر یافت`
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            ord.status === st
                              ? 'bg-primary text-on-primary font-bold'
                              : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container'
                          }`}
                        >
                          {ORDER_STATUS_LABELS[st]}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1 rounded-lg border border-outline-variant/50 text-[11px] text-on-surface-variant hover:text-primary flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">print</span>
                      <span>چاپ فیش</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 3: POS MODE (صندوق فروشگاهی سریع تبلت و موبایل)
           ================================================================= */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-[20px] font-bold text-on-surface">
                  صندوق فروشگاهی سریع (POS)
                </h1>
                <span className="text-[12px] text-primary font-semibold">
                  کسر خودکار انبار پس از ثبت
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tenantProducts.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      setPosCart((prev) => {
                        const existing = prev.find((i) => i.product.id === prod.id);
                        if (existing) {
                          return prev.map((i) =>
                            i.product.id === prod.id ? { ...i, qty: i.qty + 1 } : i
                          );
                        }
                        return [...prev, { product: prod, qty: 1 }];
                      });
                    }}
                    className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary text-right flex flex-col justify-between gap-2 shadow-xs active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-on-surface truncate">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-outline">
                          موجودی: {toPersianNum(prod.stockCount)}
                        </div>
                      </div>
                    </div>
                    <div className="text-[14px] font-bold text-primary self-end">
                      {formatToman(prod.basePrice)} ت
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* POS Checkout & Split Payment */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/40 shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h3 className="text-[16px] font-bold text-primary border-b border-outline-variant/20 pb-2">
                  فاکتور صندوق حضوری
                </h3>

                {/* Dine Type & Table */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosDineType('dine_in')}
                    className={`py-2 rounded-xl text-[12px] font-bold border ${
                      posDineType === 'dine_in'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    سرو روی میز
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosDineType('takeaway')}
                    className={`py-2 rounded-xl text-[12px] font-bold border ${
                      posDineType === 'takeaway'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    بیرون‌بر (Takeaway)
                  </button>
                </div>

                {posDineType === 'dine_in' && (
                  <div className="flex items-center justify-between text-[12px]">
                    <span>انتخاب شماره میز:</span>
                    <select
                      value={posTable}
                      onChange={(e) => setPosTable(e.target.value)}
                      className="rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 text-[12px] font-bold"
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.number}>
                          میز {t.number} ({t.zone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* POS Items */}
                <div className="space-y-2 max-h-52 overflow-y-auto divide-y divide-outline-variant/20">
                  {posCart.length === 0 ? (
                    <p className="text-[12px] text-outline text-center py-6">
                      آیتمی انتخاب نشده است. روی محصولات کلیک کنید.
                    </p>
                  ) : (
                    posCart.map((item) => (
                      <div
                        key={item.product.id}
                        className="py-2 flex items-center justify-between text-[12px]"
                      >
                        <div>
                          <div className="font-bold text-on-surface">{item.product.name}</div>
                          <div className="text-outline">
                            {toPersianNum(item.qty)} × {formatToman(item.product.basePrice)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPosCart((prev) =>
                                prev
                                  .map((i) =>
                                    i.product.id === item.product.id
                                      ? { ...i, qty: i.qty - 1 }
                                      : i
                                  )
                                  .filter((i) => i.qty > 0)
                              )
                            }
                            className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-bold px-1">{toPersianNum(item.qty)}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPosCart((prev) =>
                                prev.map((i) =>
                                  i.product.id === item.product.id ? { ...i, qty: i.qty + 1 } : i
                                )
                              )
                            }
                            className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Split Payment Calculator */}
                {posTotal > 0 && (
                  <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30 space-y-2 text-[11px]">
                    <div className="font-bold text-primary flex justify-between">
                      <span>پرداخت ترکیبی (Split Payment):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPosSplitReader(posTotal);
                          setPosSplitCash(0);
                          setPosSplitCard(0);
                        }}
                        className="underline"
                      >
                        کل مبلغ با کارتخوان
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="block text-[10px] text-outline">نقدی (تومان)</label>
                        <input
                          type="number"
                          value={posSplitCash}
                          onChange={(e) => setPosSplitCash(Number(e.target.value))}
                          className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 px-2 py-1 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-outline">کارتخوان</label>
                        <input
                          type="number"
                          value={posSplitReader}
                          onChange={(e) => setPosSplitReader(Number(e.target.value))}
                          className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 px-2 py-1 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-outline">کارت‌به‌کارت</label>
                        <input
                          type="number"
                          value={posSplitCard}
                          onChange={(e) => setPosSplitCard(Number(e.target.value))}
                          className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant/40 px-2 py-1 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-outline-variant/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold">جمع کل قابل دریافت:</span>
                  <span className="text-[20px] font-extrabold text-primary">
                    {formatToman(posTotal)} ت
                  </span>
                </div>
                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={() => {
                    const codeNum = Math.floor(900 + Math.random() * 99);
                    const newOrd: Order = {
                      id: `ord_pos_${Date.now()}`,
                      code: `GL-${toPersianNum(codeNum)}`,
                      tenantId: tenant.id,
                      customerName:
                        posDineType === 'dine_in'
                          ? `مهمان حضوری (میز ${posTable})`
                          : 'مهمان حضوری (بیرون‌بر)',
                      customerPhone: 'حضوری صندوق',
                      dineType: posDineType,
                      tableNumber: posDineType === 'dine_in' ? posTable : undefined,
                      items: posCart.map((c) => ({
                        productId: c.product.id,
                        name: c.product.name,
                        details: 'ثبت مستقیم در صندوق POS',
                        quantity: c.qty,
                        unitPrice: c.product.basePrice,
                        icon: 'local_cafe',
                      })),
                      subtotal: posTotal,
                      discountAmount: 0,
                      taxAmount: 0,
                      totalAmount: posTotal,
                      paymentMethod: 'pos_split',
                      receiptVerified: true,
                      status: 'preparing',
                      createdAt: toJalaliTime(new Date()),
                      estimatedMinutes: 10,
                      history: [
                        {
                          status: 'preparing',
                          time: toJalaliTime(new Date()),
                          note: 'ثبت و تسویه در صندوق POS کافه',
                        },
                      ],
                    };
                    onCreatePosOrder(newOrd);
                    setPosCart([]);
                    playBellSound();
                    showToast(`سفارش حضوری #${newOrd.code} ثبت و موجودی انبار کسر شد`);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-[14px] shadow-md disabled:opacity-40"
                >
                  ثبت قطعی و چاپ فیش صندوق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: PRODUCTS & CATEGORIES (منو و محصولات)
           ================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-bold text-on-surface">
                  مدیریت محصولات و منوی دیجیتال
                </h1>
                <p className="text-[12px] text-on-surface-variant">
                  ویرایش قیمت، بهای تمام‌شده، موجودی، تغییر گروهی قیمت‌ها و خروجی CSV
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-surface-container rounded-xl p-1 border border-outline-variant/40">
                  <input
                    type="number"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(Number(e.target.value))}
                    className="w-14 bg-transparent text-center text-[12px] font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onBulkPriceAdjustment(bulkPercent);
                      showToast(`قیمت تمام محصولات ${toPersianNum(bulkPercent)}٪ بروزرسانی شد`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-secondary-container text-primary text-[11px] font-bold"
                  >
                    اعمال درصد قیمت گروهی
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>محصول جدید</span>
                </button>
              </div>
            </div>

            {/* New Product Modal */}
            {showProductModal && (
              <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-primary/50 shadow-lg space-y-4">
                <h3 className="text-[16px] font-bold text-primary">افزودن محصول جدید به منو</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-outline mb-1">نام محصول</label>
                    <input
                      type="text"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="مثلاً: موکا فندق دست‌ساز"
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">دسته‌بندی</label>
                    <select
                      value={newProdCat}
                      onChange={(e) => setNewProdCat(e.target.value)}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">
                      قیمت فروش (تومان)
                    </label>
                    <input
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Number(e.target.value))}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">
                      بهای تمام‌شده (تومان - جهت محاسبه سود)
                    </label>
                    <input
                      type="number"
                      value={newProdCost}
                      onChange={(e) => setNewProdCost(Number(e.target.value))}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">موجودی روزانه</label>
                    <input
                      type="number"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(Number(e.target.value))}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">توضیحات کوتاه منو</label>
                    <input
                      type="text"
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      placeholder="ترکیبات و عطر محصول..."
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-[12px]"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newProdName.trim()) return;
                      onAddProduct({
                        id: `prod_${Date.now()}`,
                        tenantId: tenant.id,
                        categoryId: newProdCat,
                        name: newProdName.trim(),
                        subtitle: 'پیشنهاد روز باریستا',
                        description:
                          newProdDesc.trim() ||
                          'تهیه شده با مواد اولیه تازه و ارگانیک در کافه گل',
                        basePrice: newProdPrice,
                        costPrice: newProdCost,
                        image: products[0].image,
                        badge: 'جدید',
                        badgeType: 'primary',
                        isAvailable: true,
                        stockCount: newProdStock,
                        sizes: products[0].sizes,
                        addons: products[0].addons,
                        recipe: [{ inventoryItemId: 'inv_beans', amount: 18 }],
                      });
                      setShowProductModal(false);
                      setNewProdName('');
                      showToast('محصول جدید با موفقیت به منوی کافه اضافه شد');
                    }}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-[12px]"
                  >
                    ذخیره محصول در منو
                  </button>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[13px]">
                  <thead className="bg-surface-container text-on-surface-variant text-[11px] border-b border-outline-variant/30">
                    <tr>
                      <th className="py-3 px-4">محصول</th>
                      <th className="py-3 px-4">قیمت فروش</th>
                      <th className="py-3 px-4">بهای تمام‌شده / سود</th>
                      <th className="py-3 px-4">موجودی</th>
                      <th className="py-3 px-4">وضعیت در منو</th>
                      <th className="py-3 px-4">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {tenantProducts.map((p) => {
                      const profit = p.basePrice - p.costPrice;
                      const margin = Math.round((profit / p.basePrice) * 100);
                      return (
                        <tr key={p.id} className="hover:bg-surface-container-low/50">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-xl object-cover"
                            />
                            <div>
                              <div className="font-bold text-on-surface">{p.name}</div>
                              <div className="text-[11px] text-outline">{p.subtitle}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-primary">
                            {formatToman(p.basePrice)} ت
                          </td>
                          <td className="py-3 px-4 text-[12px]">
                            <div>خرید: {formatToman(p.costPrice)} ت</div>
                            <div className="text-secondary font-semibold">
                              سود: {formatToman(profit)} ت ({toPersianNum(margin)}٪)
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold">{toPersianNum(p.stockCount)} عدد</td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateProduct(p.id, { isAvailable: !p.isAvailable })
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                p.isAvailable
                                  ? 'bg-secondary-container text-primary'
                                  : 'bg-error-container text-on-error-container'
                              }`}
                            >
                              {p.isAvailable ? 'موجود در منو' : 'ناموجود (مخفی)'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProduct(p.id);
                                showToast(`«${p.name}» حذف شد`);
                              }}
                              className="text-outline hover:text-error p-1"
                              title="حذف محصول"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 5: ACCOUNTING & CASH REGISTER (حسابداری و صندوق)
           ================================================================= */}
        {activeTab === 'accounting' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-bold text-on-surface">
                  حسابداری، سود و زیان و شیفت صندوق
                </h1>
                <p className="text-[12px] text-on-surface-variant">
                  دفتر روزنامه فروش، ثبت هزینه‌ها، بستن صندوق روزانه و خروجی اکسل با تقویم جلالی
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={jalaliDateFilter}
                  onChange={(e) => setJalaliDateFilter(e.target.value)}
                  className="rounded-xl bg-surface-container border border-outline-variant/40 px-3 py-2 text-[12px] font-semibold"
                >
                  <option value="همه تاریخ‌ها">همه تاریخ‌های مهر ۱۴۰۵</option>
                  <option value="۱۴۰۵/۰۷/۳۰">امروز - ۱۴۰۵/۰۷/۳۰</option>
                  <option value="۱۴۰۵/۰۷/۲۹">دیروز - ۱۴۰۵/۰۷/۲۹</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const csv =
                      'عنوان,دسته,نوع,مبلغ,تاریخ\n' +
                      ledger
                        .map((l) => `${l.title},${l.category},${l.type},${l.amount},${l.jalaliDate}`)
                        .join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'cafegol-accounting-1405.csv';
                    a.click();
                    showToast('فایل اکسل (CSV) صورت‌حساب جلالی دانلود شد');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-secondary-container text-primary text-[12px] font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">download</span>
                  <span>خروجی Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* P&L Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40">
                <span className="text-[12px] text-on-surface-variant">مجموع درآمد ثبت‌شده</span>
                <div className="text-[22px] font-extrabold text-primary mt-1">
                  {formatToman(totalIncome)} تومان
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40">
                <span className="text-[12px] text-on-surface-variant">مجموع هزینه‌ها و خرید</span>
                <div className="text-[22px] font-extrabold text-error mt-1">
                  {formatToman(totalExpense)} تومان
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-primary/40 bg-secondary-container/20">
                <span className="text-[12px] text-primary font-bold">سود خالص دوره (P&L)</span>
                <div className="text-[22px] font-extrabold text-primary mt-1">
                  {formatToman(netProfit)} تومان
                </div>
              </div>
            </div>

            {/* Daily Cash Register Shift Box */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">point_of_sale</span>
                  <h3 className="text-[15px] font-bold text-on-surface">
                    وضعیت صندوق روزانه ({shift.status === 'open' ? 'شیفت باز' : 'شیفت بسته‌شده'})
                  </h3>
                </div>
                <p className="text-[12px] text-on-surface-variant">
                  موجودی اول وقت: {formatToman(shift.openingBalance)} ت | فروش نقدی:{' '}
                  {formatToman(shift.cashSales)} ت | موجودی نقد مورد انتظار:{' '}
                  <strong className="text-primary">{formatToman(shift.expectedCash)} تومان</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextStatus = shift.status === 'open' ? 'closed' : 'open';
                  onUpdateShift({ status: nextStatus });
                  showToast(
                    nextStatus === 'closed'
                      ? 'شیفت صندوق بسته شد و گزارش تراز ثبت گردید'
                      : 'شیفت جدید صندوق باز شد'
                  );
                }}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold"
              >
                {shift.status === 'open' ? 'بستن شیفت صندوق روزانه' : 'بازگشایی شیفت جدید'}
              </button>
            </div>

            {/* Add Income / Expense Form */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end">
              <div>
                <label className="block text-[11px] text-outline mb-1">نوع سند</label>
                <select
                  value={expType}
                  onChange={(e) => setExpType(e.target.value as 'income' | 'expense')}
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                >
                  <option value="expense">ثبت هزینه (خروجی)</option>
                  <option value="income">ثبت درآمد متفرقه</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-outline mb-1">شرح سند حسابداری</label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="مثلاً: خرید ۱۲ کیلو دانه قهوه کلمبیا"
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-outline mb-1">مبلغ (تومان)</label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!expTitle.trim()) return;
                  onAddLedgerEntry({
                    id: `ldg_${Date.now()}`,
                    tenantId: tenant.id,
                    type: expType,
                    category: expCategory,
                    title: expTitle.trim(),
                    amount: expAmount,
                    jalaliDate: '۱۴۰۵/۰۷/۳۰',
                    paymentMethod: 'کارت‌به‌کارت',
                  });
                  setExpTitle('');
                  showToast('سند مالی با موفقیت در دفتر روزنامه ثبت شد');
                }}
                className="py-2 px-4 rounded-xl bg-primary text-on-primary font-bold text-[12px]"
              >
                + ثبت در دفتر
              </button>
            </div>

            {/* Ledger List */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden">
              <table className="w-full text-right text-[13px]">
                <thead className="bg-surface-container text-on-surface-variant text-[11px]">
                  <tr>
                    <th className="py-3 px-4">شرح تراکنش</th>
                    <th className="py-3 px-4">دسته‌بندی</th>
                    <th className="py-3 px-4">تاریخ جلالی</th>
                    <th className="py-3 px-4">روش</th>
                    <th className="py-3 px-4">مبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {ledger
                    .filter(
                      (l) =>
                        jalaliDateFilter === 'همه تاریخ‌ها' || l.jalaliDate === jalaliDateFilter
                    )
                    .map((l) => (
                      <tr key={l.id}>
                        <td className="py-3 px-4 font-bold">{l.title}</td>
                        <td className="py-3 px-4 text-outline">{l.category}</td>
                        <td className="py-3 px-4">{l.jalaliDate}</td>
                        <td className="py-3 px-4">{l.paymentMethod}</td>
                        <td
                          className={`py-3 px-4 font-bold ${
                            l.type === 'income' ? 'text-primary' : 'text-error'
                          }`}
                        >
                          {l.type === 'income' ? '+' : '-'}
                          {formatToman(l.amount)} ت
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 6: INVENTORY & RECIPES (انبار و رسپی مواد اولیه)
           ================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-[22px] font-bold text-on-surface">
                انبارداری مواد اولیه و کسر خودکار رسپی (BOM)
              </h1>
              <p className="text-[12px] text-on-surface-variant">
                با هر فروش در منوی آنلاین یا صندوق POS، مقادیر رسپی به صورت خودکار از موجودی انبار کسر می‌شود.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((inv) => {
                const isLow = inv.currentStock <= inv.minThreshold;
                return (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-2xl bg-surface-container-lowest border shadow-xs space-y-3 ${
                      isLow ? 'border-error' : 'border-outline-variant/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[14px] font-bold text-on-surface">{inv.name}</h3>
                        <span className="text-[11px] text-outline">
                          آخرین بروزرسانی: {inv.lastUpdated}
                        </span>
                      </div>
                      {isLow && (
                        <span className="px-2 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold">
                          کمتر از حد مجاز
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-outline-variant/20">
                      <div>
                        <span className="text-[20px] font-extrabold text-primary">
                          {toPersianNum(inv.currentStock)}
                        </span>{' '}
                        <span className="text-[12px] text-on-surface-variant">{inv.unit}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateInventoryItem(inv.id, 500);
                            showToast(`+۵۰۰ ${inv.unit} به «${inv.name}» افزوده شد`);
                          }}
                          className="px-3 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-bold"
                        >
                          + ورود به انبار
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 7: STAFF & ROLES (پرسنل و سطوح دسترسی)
           ================================================================= */}
        {activeTab === 'staff' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-[22px] font-bold text-on-surface">
                مدیریت پرسنل و نقش‌های دسترسی (RBAC)
              </h1>
              <p className="text-[12px] text-on-surface-variant">
                نقش‌های استاندارد: مالک (Owner)، مدیر داخلی (Manager)، صندوق‌دار (Cashier)، باریستا/آشپزخانه (Kitchen)
              </p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] text-outline mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="مثلاً: نیما یوشیج"
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-outline mb-1">شماره موبایل (ورود OTP)</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] text-left font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-outline mb-1">نقش سازمانی</label>
                <select
                  value={newStaffRole}
                  onChange={(e) =>
                    setNewStaffRole(e.target.value as 'manager' | 'cashier' | 'kitchen')
                  }
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                >
                  <option value="manager">مدیر داخلی (Manager)</option>
                  <option value="cashier">صندوق‌دار (Cashier)</option>
                  <option value="kitchen">باریستا و آشپزخانه (Kitchen)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newStaffName.trim()) return;
                  const roleLabels = {
                    manager: 'مدیر داخلی کافه',
                    cashier: 'صندوق‌دار (Cashier)',
                    kitchen: 'باریستا و بار گرم',
                  };
                  onAddStaff({
                    id: `stf_${Date.now()}`,
                    tenantId: tenant.id,
                    name: newStaffName.trim(),
                    role: newStaffRole,
                    roleLabel: roleLabels[newStaffRole],
                    phone: newStaffPhone || '09120001122',
                    active: true,
                    permissions:
                      newStaffRole === 'manager'
                        ? ['مدیریت منو', 'انبار', 'سفارش‌ها']
                        : newStaffRole === 'cashier'
                        ? ['صندوق POS', 'تأیید رسید کارت‌به‌کارت']
                        : ['برد زنده باریستا'],
                    lastLogin: 'تازه اضافه‌شده',
                  });
                  setNewStaffName('');
                  setNewStaffPhone('');
                  showToast('همکار جدید با سطح دسترسی مشخص ثبت شد');
                }}
                className="py-2 px-4 rounded-xl bg-primary text-on-primary font-bold text-[12px]"
              >
                + افزودن همکار
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-on-surface">{m.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary text-[10px] font-bold">
                        {m.roleLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-outline font-mono" dir="ltr">
                      {m.phone}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.permissions.map((perm, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-surface-container px-2 py-0.5 rounded-md text-on-surface-variant"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-secondary font-medium">{m.lastLogin}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 8: SETTINGS, QR TABLES & BOTS (میزها، QR و بات‌ها)
           ================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-[22px] font-bold text-on-surface">
              تنظیمات کافه، کارت بانکی، بارکد QR میزها و بات اعلان
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Bank & Card-to-Card Settings */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-3">
                <h3 className="text-[15px] font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined">credit_card</span>
                  <span>اطلاعات کارت‌به‌کارت و درگاه پرداخت کافه</span>
                </h3>
                <div>
                  <label className="block text-[11px] text-outline mb-1">شماره کارت ۱۶ رقمی</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={tenant.cardNumber}
                    onChange={(e) => onUpdateTenant({ cardNumber: e.target.value })}
                    className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[13px] font-mono text-center font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-outline mb-1">نام صاحب حساب</label>
                    <input
                      type="text"
                      value={tenant.cardHolderName}
                      onChange={(e) => onUpdateTenant({ cardHolderName: e.target.value })}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">نام بانک</label>
                    <input
                      type="text"
                      value={tenant.bankName}
                      onChange={(e) => onUpdateTenant({ bankName: e.target.value })}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('تنظیمات کارت‌به‌کارت و مالیات کافه ذخیره شد')}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold"
                >
                  ذخیره تغییرات مالی
                </button>
              </div>

              {/* Bale & Telegram Order Notification Bot */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-3">
                <h3 className="text-[15px] font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined">smart_toy</span>
                  <span>اطلاع‌رسانی سفارش جدید در ربات بله و تلگرام</span>
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  به‌محض ثبت سفارش یا بارگذاری رسید کارت‌به‌کارت توسط مشتری، پیام آنی همراه با دکمه «تأیید فیش» به بازوی بله و تلگرام مالک ارسال می‌گردد.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-outline mb-1">آیدی یا Chat ID بله</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={tenant.baleChatId || ''}
                      onChange={(e) => onUpdateTenant({ baleChatId: e.target.value })}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-outline mb-1">Chat ID تلگرام</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={tenant.telegramChatId || ''}
                      onChange={(e) => onUpdateTenant({ telegramChatId: e.target.value })}
                      className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] font-mono"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showToast('پیام آزمایشی به بازوی بله (@cafegol_bot) و تلگرام ارسال شد')
                  }
                  className="px-4 py-2 rounded-xl bg-secondary-container text-primary text-[12px] font-bold"
                >
                  ارسال پیام تست به بله و تلگرام
                </button>
              </div>
            </div>

            {/* Printable QR Codes for Tables */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-on-surface">
                  بارکدهای QR اختصاصی میزهای {tenant.name} (آماده چاپ)
                </h3>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-[12px] font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>چاپ تمام برچسب‌های QR</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-center space-y-2"
                  >
                    <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl border border-outline-variant/30 flex items-center justify-center">
                      {/* Crisp SVG QR Code Representation */}
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-[#181d0e]">
                        <rect x="5" y="5" width="28" height="28" rx="4" />
                        <rect x="11" y="11" width="16" height="16" fill="#fff" />
                        <rect x="15" y="15" width="8" height="8" />
                        <rect x="67" y="5" width="28" height="28" rx="4" />
                        <rect x="73" y="11" width="16" height="16" fill="#fff" />
                        <rect x="77" y="15" width="8" height="8" />
                        <rect x="5" y="67" width="28" height="28" rx="4" />
                        <rect x="11" y="73" width="16" height="16" fill="#fff" />
                        <rect x="15" y="77" width="8" height="8" />
                        <rect x="42" y="12" width="14" height="14" />
                        <rect x="40" y="40" width="20" height="20" rx="3" />
                        <rect x="68" y="44" width="18" height="10" />
                        <rect x="42" y="70" width="16" height="18" />
                        <rect x="68" y="68" width="22" height="22" rx="3" />
                      </svg>
                    </div>
                    <div className="text-[12px] font-bold text-primary">میز شماره {t.number}</div>
                    <div className="text-[10px] text-outline font-mono truncate" dir="ltr">
                      /c/{tenant.slug}?table={t.number}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 9: SUBSCRIPTION (اشتراک و صورت‌حساب کافه)
           ================================================================= */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-primary/40 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-secondary-container text-primary text-[11px] font-bold">
                  پلن فعال: {currentPlan.name}
                </span>
                <h2 className="text-[20px] font-bold text-on-surface mt-2">
                  اعتبار اشتراک تا تاریخ {tenant.subscriptionEndsAt} (۲۰ روز باقی‌مانده)
                </h2>
                <p className="text-[12px] text-on-surface-variant">
                  وضعیت سرویس: فعال • یادآوری خودکار تمدید از طریق کرون‌جاب در بله و تلگرام ارسال می‌شود.
                </p>
              </div>
              <div className="flex gap-4 text-center">
                <div className="p-3 rounded-2xl bg-surface-container-low min-w-[110px]">
                  <span className="text-[11px] text-outline block">محصولات ثبت‌شده</span>
                  <span className="text-[16px] font-bold text-primary">
                    {toPersianNum(tenantProducts.length)} / {toPersianNum(currentPlan.maxProducts)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-low min-w-[110px]">
                  <span className="text-[11px] text-outline block">فضای تصاویر (گالری)</span>
                  <span className="text-[16px] font-bold text-primary">
                    {toPersianNum(tenant.storageUsedMb)} /{' '}
                    {toPersianNum(currentPlan.storageLimitMb)} MB
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((pl) => (
                <div
                  key={pl.id}
                  className={`p-5 rounded-2xl bg-surface-container-lowest border flex flex-col justify-between space-y-4 ${
                    pl.id === tenant.planId ? 'border-2 border-primary shadow-md' : 'border-outline-variant/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-bold text-on-surface">{pl.name}</h3>
                      {pl.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                          {pl.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[22px] font-extrabold text-primary">
                      {pl.monthlyPrice === 0 ? 'رایگان' : `${formatToman(pl.monthlyPrice)} ت`}
                      <span className="text-[11px] font-normal text-outline"> / ماهانه</span>
                    </div>
                    <ul className="space-y-1.5 text-[12px] text-on-surface-variant">
                      {pl.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[16px]">
                            check_circle
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTenant({ planId: pl.id });
                      showToast(`پلن اشتراک کافه به «${pl.name}» ارتقا یافت`);
                    }}
                    className={`w-full py-2.5 rounded-xl text-[12px] font-bold ${
                      pl.id === tenant.planId
                        ? 'bg-secondary-container text-primary'
                        : 'bg-primary text-on-primary'
                    }`}
                  >
                    {pl.id === tenant.planId ? 'پلن فعلی شما' : 'انتخاب و تمدید آنلاین / کارت‌به‌کارت'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
