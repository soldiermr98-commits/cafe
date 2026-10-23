import React, { useState } from 'react';
import {
  CustomerScreen,
  TenantCafe,
  Category,
  Product,
  CartItem,
  Order,
  CafeTable,
  ProductSize,
  ProductAddon,
} from '../types';
import { formatToman, toPersianNum } from '../utils/persian';

interface CustomerAppProps {
  tenant: TenantCafe;
  categories: Category[];
  products: Product[];
  tables: CafeTable[];
  cart: CartItem[];
  orders: Order[];
  activeOrderId: string | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
  onUpdateCartQty: (cartItemId: string, delta: number) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onSubmitOrder: (payload: {
    customerName: string;
    customerPhone: string;
    dineType: 'dine_in' | 'takeaway';
    tableNumber?: string;
    paymentMethod: 'card_to_card' | 'online_gateway';
    cardLastFour?: string;
    receiptImageUrl?: string;
    notes?: string;
  }) => Order;
  onSelectOrderForTracking: (orderId: string) => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  tenant,
  categories,
  products,
  tables,
  cart,
  orders,
  activeOrderId,
  isDark,
  onToggleTheme,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onSubmitOrder,
  onSelectOrderForTracking,
}) => {
  const [screen, setScreen] = useState<CustomerScreen>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || 'prod_vanilla_latte'
  );
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('۴');
  const [showTableModal, setShowTableModal] = useState<boolean>(false);

  // Detail Screen State
  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];
  const [detailSizeId, setDetailSizeId] = useState<string>('size_md');
  const [detailAddonIds, setDetailAddonIds] = useState<string[]>([]);
  const [detailSweetness, setDetailSweetness] = useState<'normal' | 'low'>('normal');
  const [detailNotes, setDetailNotes] = useState<string>('');
  const [detailQty, setDetailQty] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Checkout / Cart State
  const [dineType, setDineType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [showPaymentSheet, setShowPaymentSheet] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'card_to_card' | 'online_gateway'>('card_to_card');
  const [customerName, setCustomerName] = useState<string>('نیلوفر راد');
  const [customerPhone, setCustomerPhone] = useState<string>('09124455667');
  const [cardLastFour, setCardLastFour] = useState<string>('۷۸۴۱');
  const [receiptFileName, setReceiptFileName] = useState<string>('receipt_mellat_894.jpg');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  // Open product detail
  const openProductDetail = (prod: Product) => {
    setSelectedProductId(prod.id);
    const defaultSize = prod.sizes.find((s) => s.isDefault) || prod.sizes[0];
    setDetailSizeId(defaultSize?.id || '');
    setDetailAddonIds([]);
    setDetailSweetness('normal');
    setDetailNotes('');
    setDetailQty(1);
    setScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick add product with default options
  const handleQuickAdd = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const defaultSize: ProductSize = prod.sizes.find((s) => s.isDefault) ||
      prod.sizes[0] || {
        id: 'default',
        name: 'استاندارد',
        subtitle: '',
        priceDelta: 0,
      };
    onAddToCart({
      product: prod,
      selectedSize: defaultSize,
      selectedAddons: [],
      sweetness: 'normal',
      notes: '',
      quantity: 1,
      unitPrice: prod.basePrice + defaultSize.priceDelta,
    });
    triggerToast(`«${prod.name}» به سبد سفارش اضافه شد`);
  };

  // Filtered products
  const availableProducts = products.filter((p) => p.tenantId === tenant.id && p.isAvailable);
  const filteredProducts = availableProducts.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.includes(searchQuery.trim()) ||
      p.description.includes(searchQuery.trim()) ||
      p.subtitle.includes(searchQuery.trim());
    return matchesCat && matchesSearch;
  });

  const featuredProduct =
    availableProducts.find((p) => p.isFeatured) || availableProducts[0];
  const bestsellerProducts = availableProducts.filter((p) => p.isBestseller);

  // Cart totals
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const loyaltyDiscount = cartSubtotal > 0 ? tenant.loyaltyDiscountAmount : 0;
  const taxAmount =
    cartSubtotal > 0 ? Math.round((cartSubtotal * tenant.taxPercentage) / 100) : 0;
  const cartFinalTotal = Math.max(0, cartSubtotal + taxAmount - loyaltyDiscount);

  // Detail unit price calculation
  const currentSizeObj =
    selectedProduct?.sizes.find((s) => s.id === detailSizeId) ||
    selectedProduct?.sizes[0];
  const currentAddonsList: ProductAddon[] =
    selectedProduct?.addons.filter((a) => detailAddonIds.includes(a.id)) || [];
  const detailUnitPrice =
    (selectedProduct?.basePrice || 0) +
    (currentSizeObj?.priceDelta || 0) +
    currentAddonsList.reduce((acc, a) => acc + a.price, 0);
  const detailTotalPrice = detailUnitPrice * detailQty;

  // Active order for tracking screen
  const trackedOrder =
    orders.find((o) => o.id === activeOrderId) ||
    orders.find((o) => o.tenantId === tenant.id) ||
    orders[0];

  const currentTableObj =
    tables.find((t) => t.number === selectedTableNumber) || tables[3] || tables[0];

  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex justify-center relative pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-0 z-[90] flex justify-center px-4 pointer-events-none">
          <div className="bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-xl border border-primary/30 text-[12px] font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] fill-1">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Table Selector Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[370px] bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">table_restaurant</span>
                <span>انتخاب میز استقرار در کافه</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-outline"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTableNumber(t.number);
                    setShowTableModal(false);
                    triggerToast(`${t.name} انتخاب شد`);
                  }}
                  className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between transition-all ${
                    selectedTableNumber === t.number
                      ? 'border-primary bg-secondary-container/50 text-primary font-bold'
                      : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:border-primary/40'
                  }`}
                >
                  <div>
                    <div className="text-[13px] font-bold">{t.name}</div>
                    <div className="text-[11px] text-outline">
                      {t.zone} • ظرفیت {toPersianNum(t.capacity)} نفر
                    </div>
                  </div>
                  {selectedTableNumber === t.number && (
                    <span className="material-symbols-outlined text-primary fill-1">
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card-to-Card & Online Checkout Bottom Sheet */}
      {showPaymentSheet && (
        <div className="fixed inset-0 z-[95] bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[390px] bg-surface-container-lowest border-t sm:border border-outline-variant/40 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-primary">تأیید و پرداخت سفارش</h3>
                <p className="text-[11px] text-on-surface-variant">
                  مبلغ قابل پرداخت: {formatToman(cartFinalTotal)} تومان
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentSheet(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Guest Customer Info */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                  نام مهمان
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] text-on-surface focus:outline-none focus:border-primary"
                  placeholder="نام و نام خانوادگی"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                  شماره موبایل (جهت پیامک/بله)
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-[12px] text-on-surface focus:outline-none focus:border-primary text-left font-mono"
                  placeholder="0912..."
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMethod('card_to_card')}
                className={`py-2 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'card_to_card'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                <span>کارت‌به‌کارت (رسید)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('online_gateway')}
                className={`py-2 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'online_gateway'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                <span>درگاه شاپرک (زرین‌پال)</span>
              </button>
            </div>

            {paymentMethod === 'card_to_card' ? (
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>شماره کارت مقصد ({tenant.bankName}):</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(tenant.cardNumber);
                      triggerToast('شماره کارت کافه کپی شد');
                    }}
                    className="text-primary font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>کپی کارت</span>
                  </button>
                </div>
                <div
                  dir="ltr"
                  className="bg-surface-container-lowest py-2 px-3 rounded-xl text-center font-mono text-[15px] font-bold tracking-wider text-primary border border-outline-variant/30"
                >
                  {tenant.cardNumber}
                </div>
                <div className="text-[11px] text-center text-on-surface-variant">
                  به نام: <strong className="text-on-surface">{tenant.cardHolderName}</strong>
                </div>

                <div className="pt-2 border-t border-outline-variant/20 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                      ۴ رقم آخر کارت واریزکننده (جهت تطبیق سریع صندوق):
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLastFour}
                      onChange={(e) => setCardLastFour(e.target.value)}
                      className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3 py-1.5 text-[13px] font-bold text-center tracking-widest text-primary"
                      placeholder="مثلاً ۷۸۴۱"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                      بارگذاری تصویر رسید کارت‌به‌کارت (فشرده‌سازی خودکار):
                    </label>
                    <label className="w-full border border-dashed border-primary/50 rounded-xl p-2.5 bg-surface-container-lowest flex items-center justify-between cursor-pointer hover:bg-secondary-container/20 transition-colors">
                      <div className="flex items-center gap-2 text-[11px] text-on-surface">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          cloud_upload
                        </span>
                        <span className="truncate max-w-[180px]">{receiptFileName}</span>
                      </div>
                      <span className="text-[10px] bg-secondary-container text-primary px-2 py-0.5 rounded-full font-semibold">
                        انتخاب تصویر
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setReceiptFileName(file.name);
                            triggerToast('تصویر رسید با موفقیت بهینه‌سازی و پیوست شد');
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 text-center space-y-2">
                <span className="material-symbols-outlined text-primary text-[32px]">
                  verified_user
                </span>
                <p className="text-[13px] font-bold text-on-surface">
                  پرداخت مستقیم از طریق درگاه شاپرک (زرین‌پال / به‌پرداخت)
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  پس از پرداخت، سفارش شما به صورت خودکار در وضعیت «پرداخت تأیید شد» روی برد باریستا قرار می‌گیرد.
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(() => {
                  const created = onSubmitOrder({
                    customerName: customerName || 'مهمان کافه گل',
                    customerPhone: customerPhone || '09120000000',
                    dineType,
                    tableNumber: dineType === 'dine_in' ? selectedTableNumber : undefined,
                    paymentMethod,
                    cardLastFour,
                    receiptImageUrl: receiptFileName,
                    notes: orderNotes,
                  });
                  setIsSubmitting(false);
                  setShowPaymentSheet(false);
                  onSelectOrderForTracking(created.id);
                  setScreen('tracking');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 400);
              }}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3.5 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>
                {isSubmitting
                  ? 'در حال ثبت سفارش...'
                  : `ثبت نهایی سفارش (${formatToman(cartFinalTotal)} تومان)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Digital Invoice Modal */}
      {showInvoiceModal && trackedOrder && (
        <div className="fixed inset-0 z-[95] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="text-center border-b border-dashed border-outline-variant pb-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-primary mb-1">
                <span className="material-symbols-outlined">spa</span>
              </div>
              <h3 className="text-[16px] font-bold text-primary">{tenant.name}</h3>
              <p className="text-[11px] text-outline">فاکتور دیجیتال رسمی • کد #{trackedOrder.code}</p>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">مهمان:</span>
                <span className="font-bold">{trackedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">نوع سرو:</span>
                <span className="font-bold">
                  {trackedOrder.dineType === 'dine_in'
                    ? `میز شماره ${trackedOrder.tableNumber}`
                    : 'بیرون‌بر (Takeaway)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">زمان ثبت:</span>
                <span className="font-bold">{trackedOrder.createdAt}</span>
              </div>
            </div>
            <div className="border-t border-b border-outline-variant/30 py-2.5 space-y-2 text-[12px]">
              {trackedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>
                    {toPersianNum(item.quantity)}× {item.name}
                  </span>
                  <span className="font-bold text-primary">
                    {formatToman(item.unitPrice * item.quantity)} ت
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-[14px] font-bold text-primary">
              <span>مبلغ کل تسویه‌شده:</span>
              <span>{formatToman(trackedOrder.totalAmount)} تومان</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 rounded-xl bg-secondary-container text-on-secondary-container font-bold text-[12px] flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>چاپ فیش</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[12px]"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 1: HOME (Matches Stitch Image_1_62c0da62 & Image_13_adeb2fe6)
         ===================================================================== */}
      {screen === 'home' && (
        <main className="w-full max-w-[390px] min-h-screen bg-surface relative flex flex-col overflow-x-hidden shadow-2xl border-x border-outline-variant/30 pb-28">
          {/* Botanical Tone-on-tone Line-art Overlay with 'lili' filigree */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.06] dark:opacity-[0.07] select-none text-primary"
          >
            <div className="absolute -top-12 -right-16 w-80 h-80 rounded-full border border-current"></div>
            <div className="absolute top-48 -left-20 w-64 h-64 rounded-full border border-current"></div>
            <div className="absolute top-[420px] right-4 font-watermark italic text-[32px] text-current rotate-12">
              lili
            </div>
            <div className="absolute top-[880px] -left-2 font-watermark italic text-[32px] text-current -rotate-6">
              lili
            </div>
            <div className="absolute bottom-40 right-10 font-watermark italic text-[24px] text-current rotate-45">
              muguet
            </div>
            <svg
              className="absolute top-20 right-8 w-44 h-44 text-current stroke-current fill-none stroke-[0.8]"
              viewBox="0 0 100 100"
            >
              <path d="M 20,95 Q 35,45 65,15 Q 75,5 82,10"></path>
              <circle cx="50" cy="40" r="4"></circle>
              <circle cx="62" cy="28" r="3.5"></circle>
              <circle cx="72" cy="18" r="3"></circle>
              <path d="M 46,41 C 44,46 56,46 54,41"></path>
              <path d="M 58,29 C 56,34 68,34 66,29"></path>
            </svg>
          </div>

          {/* SHARED COMPONENT: TopAppBar */}
          <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-margin py-space-sm h-14 w-full max-w-[390px] mx-auto bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 shadow-xs transition-all">
            <div className="flex items-center gap-space-xs">
              <button
                aria-label="منوی گیاهی"
                onClick={() => setScreen('about')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary hover:bg-surface-container active:scale-95 transition-transform duration-200"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">spa</span>
              </button>
              <span className="text-[20px] font-bold text-on-surface tracking-tight">
                {tenant.name}
              </span>
            </div>
            {/* Action Cluster: Theme Switch & Notifications */}
            <div className="flex items-center gap-space-xs">
              <button
                aria-label="تغییر حالت شب و روز"
                onClick={onToggleTheme}
                className="w-14 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 p-0.5 flex items-center justify-between px-1 relative transition-colors duration-300"
                type="button"
              >
                <span className="text-[12px] z-10 text-primary">☀️</span>
                <span className="text-[11px] z-10 text-outline">🌙</span>
                <div
                  className={`absolute left-1 top-0.5 w-6 h-6 rounded-full bg-surface shadow-xs transition-transform duration-300 ${
                    isDark ? 'translate-x-[-26px]' : 'translate-x-0'
                  }`}
                ></div>
              </button>
              <button
                aria-label="سفارش‌های من"
                onClick={() => setScreen('tracking')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary active:scale-95 transition-all duration-200 relative"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-surface"></span>
              </button>
            </div>
          </header>

          {/* Canvas Body Content */}
          <div className="relative z-10 pt-16 px-margin flex flex-col space-y-space-lg">
            {/* Hero Welcome Greeting */}
            <section className="mt-space-sm flex flex-col space-y-space-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/70 border border-outline-variant/30 w-fit text-primary">
                <span className="material-symbols-outlined text-[14px]">yard</span>
                <span className="text-[11px] font-medium">{tenant.badgeText}</span>
              </div>
              <h1 className="text-[26px] leading-[38px] font-extrabold text-on-background">
                {tenant.welcomeTitle}
              </h1>
              <p className="text-[14px] text-on-surface-variant">{tenant.welcomeSubtitle}</p>

              {/* Search Bar with Horticultural Softness */}
              <div className="pt-space-xs">
                <div className="relative flex items-center w-full">
                  <span className="material-symbols-outlined absolute right-3.5 text-outline text-[20px] pointer-events-none">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/60 rounded-full py-2.5 pr-10 pl-10 text-[12px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-xs"
                    placeholder="جستجو در نوشیدنی‌ها، کیک‌ها و میان‌وعده‌ها..."
                    type="text"
                  />
                  <button
                    aria-label="مشاهده فهرست کامل منو"
                    onClick={() => setScreen('menu')}
                    className="absolute left-2.5 w-7 h-7 rounded-full bg-surface border border-outline-variant/40 flex items-center justify-center text-primary shadow-xs hover:bg-surface-container"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Category Chips (Horizontal Scrollable Rail) */}
            <section className="overflow-x-auto no-scrollbar -mx-margin px-margin">
              <div className="flex items-center gap-space-xs min-w-max pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-full text-[12px] font-semibold shadow-xs active:scale-95 transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low border border-outline-variant/70 text-on-surface hover:bg-surface-container'
                  }`}
                  type="button"
                >
                  {selectedCategory === 'all' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-on-primary"></span>
                  )}
                  <span>همه</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-space-md py-1.5 rounded-full text-[12px] font-medium active:scale-95 transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-on-primary font-semibold shadow-xs'
                        : 'bg-surface-container-low border border-outline-variant/70 text-on-surface hover:bg-surface-container'
                    }`}
                    type="button"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Featured Hero Card: "پیشنهاد باریستا" */}
            {featuredProduct && (
              <section className="flex flex-col space-y-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      auto_awesome
                    </span>
                    <h2 className="text-[18px] font-semibold text-on-surface">پیشنهاد باریستا</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('menu')}
                    className="text-[11px] text-primary font-medium cursor-pointer hover:underline"
                  >
                    مشاهده همه
                  </button>
                </div>

                {/* Hero Bento Card */}
                <article
                  onClick={() => openProductDetail(featuredProduct)}
                  className="bg-surface-container rounded-2xl p-3.5 border border-outline-variant/40 shadow-md flex flex-col space-y-3 relative overflow-hidden group cursor-pointer"
                >
                  <div className="relative w-full h-44 overflow-hidden rounded-xl bg-surface-container-high">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={featuredProduct.name}
                      referrerPolicy="no-referrer"
                      src={featuredProduct.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    {/* Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-full text-primary border border-outline-variant/40">
                      <span className="material-symbols-outlined text-[13px]">local_florist</span>
                      <span className="text-[11px] font-semibold">
                        {featuredProduct.badge || 'پیشنهاد باریستا'}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 text-[#F2EDDC] drop-shadow">
                      <span className="text-[11px] block opacity-90">
                        {featuredProduct.subtitle}
                      </span>
                      <span className="text-[18px] font-bold">{featuredProduct.name}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {featuredProduct.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30">
                    <div>
                      <span className="text-[11px] text-outline block">قیمت ویژه:</span>
                      <span className="text-[18px] font-bold text-primary">
                        {formatToman(featuredProduct.basePrice)}{' '}
                        <span className="text-[12px] font-normal text-on-surface">تومان</span>
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleQuickAdd(featuredProduct, e)}
                      className="flex items-center gap-1.5 bg-primary text-on-primary hover:opacity-90 px-4 py-2 rounded-full text-[12px] font-semibold active:scale-95 transition-all shadow-xs"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>افزودن</span>
                    </button>
                  </div>
                </article>
              </section>
            )}

            {/* Botanical Divider: Muguet Stalk Line */}
            <div aria-hidden="true" className="flex items-center justify-center gap-2 py-1 select-none">
              <div className="h-[1px] flex-1 bg-outline-variant/40"></div>
              <div className="flex items-center gap-1 text-primary/60">
                <span className="material-symbols-outlined text-[16px]">nature</span>
              </div>
              <div className="h-[1px] flex-1 bg-outline-variant/40"></div>
            </div>

            {/* Bestsellers / Filtered Section ("محبوب‌ترین‌های کافه") */}
            <section className="flex flex-col space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold text-on-surface">
                    {selectedCategory === 'all' && !searchQuery
                      ? 'محبوب‌ترین‌های کافه'
                      : 'نتایج فیلتر منو'}
                  </h2>
                  <p className="text-[12px] text-outline">طعم‌های برگزیده همراهان همیشگی ما</p>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('menu')}
                  className="text-[11px] text-primary font-medium cursor-pointer hover:underline"
                >
                  دیدن منو
                </button>
              </div>

              <div className="flex flex-col space-y-3">
                {(selectedCategory === 'all' && !searchQuery
                  ? bestsellerProducts
                  : filteredProducts
                ).map((item) => {
                  const cartEntry = cart.find((c) => c.product.id === item.id);
                  return (
                    <article
                      key={item.id}
                      onClick={() => openProductDetail(item)}
                      className="bg-surface-container rounded-xl p-3 border border-outline-variant/40 flex items-center justify-between gap-3 shadow-xs hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container-low flex-shrink-0 relative">
                        <img
                          className="w-full h-full object-cover"
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          src={item.image}
                        />
                        {item.badge && (
                          <span className="absolute top-1 right-1 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <h3 className="text-[15px] font-bold text-on-surface truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-outline line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-[15px] font-bold text-primary">
                            {formatToman(item.basePrice)}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">تومان</span>
                        </div>
                      </div>
                      {cartEntry ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center bg-surface-container-low rounded-full p-0.5 border border-outline-variant/50 flex-shrink-0"
                        >
                          <button
                            aria-label="کاهش"
                            onClick={() => onUpdateCartQty(cartEntry.id, -1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-primary hover:bg-surface active:scale-90 transition-transform"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                          </button>
                          <span className="text-[12px] px-1.5 text-on-surface font-semibold">
                            {toPersianNum(cartEntry.quantity)}
                          </span>
                          <button
                            aria-label="افزایش"
                            onClick={() => onUpdateCartQty(cartEntry.id, 1)}
                            className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          aria-label={`افزودن ${item.name}`}
                          onClick={(e) => handleQuickAdd(item, e)}
                          className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary active:scale-90 transition-all flex-shrink-0"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Conservatory Ambiance Banner */}
            <section className="bg-surface-container rounded-2xl p-4 border border-outline-variant/40 relative overflow-hidden">
              <div className="relative z-10 flex flex-col space-y-1.5">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[18px]">nest_eco_leaf</span>
                  <span className="text-[11px] font-semibold">پایداری و احترام به خاک</span>
                </div>
                <h4 className="text-[16px] font-bold text-on-surface">
                  تمام فنجان‌های ما قابل بازگشت به طبیعت هستند
                </h4>
                <p className="text-[12px] text-on-surface-variant">
                  با آوردن ماگ شخصی خود در هر سفارش ۱۰٪ تخفیف همراهی دریافت کنید.
                </p>
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary/10 pointer-events-none"></div>
            </section>
          </div>

          {/* Floating Basket / Cart Bar */}
          {totalCartCount > 0 && (
            <aside className="fixed bottom-20 inset-x-0 z-40 px-margin max-w-[390px] mx-auto pointer-events-none">
              <div
                onClick={() => setScreen('cart')}
                className="pointer-events-auto bg-inverse-surface text-inverse-on-surface border border-outline-variant/30 rounded-full py-2.5 px-4 shadow-2xl flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-[12px]">
                    {toPersianNum(totalCartCount)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold">
                      سبد خرید شما ({toPersianNum(totalCartCount)} قلم)
                    </span>
                    <span className="text-[10px] opacity-80">
                      تحویل در {currentTableObj?.zone || 'گلخانه اصلی'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold text-primary-fixed">
                    {formatToman(cartSubtotal)} <span className="text-[11px] font-normal">تومان</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-primary-fixed">
                    arrow_back
                  </span>
                </div>
              </div>
            </aside>
          )}
        </main>
      )}

      {/* =====================================================================
          SCREEN 2: FULL MENU (Matches Stitch Image_3_93c5fe41 & Image_11_163a408f)
         ===================================================================== */}
      {screen === 'menu' && (
        <main className="w-full max-w-[390px] min-h-screen bg-surface relative flex flex-col overflow-x-hidden shadow-2xl border-x border-outline-variant/30 pb-36">
          {/* Watermark Botanical Muguet Line-Art Texture */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.07] z-0 overflow-hidden select-none flex flex-col justify-between max-w-[390px] mx-auto">
            <div className="p-8 text-primary font-serif italic text-xs tracking-widest">
              lili · muguet · گل موگه
            </div>
            <div className="flex justify-center items-center scale-150 transform rotate-12">
              <svg
                className="text-primary"
                fill="none"
                height="400"
                stroke="currentColor"
                strokeWidth="0.75"
                viewBox="0 0 100 100"
                width="400"
              >
                <path d="M20,95 Q35,50 65,15"></path>
                <path d="M40,55 Q50,45 60,52 Q58,62 48,60 Z"></path>
                <path d="M50,40 Q62,30 72,38 Q70,48 58,46 Z"></path>
                <path d="M58,25 Q70,16 80,24 Q78,34 66,32 Z"></path>
                <path d="M15,80 Q30,70 42,85"></path>
              </svg>
            </div>
            <div className="p-6 text-left text-primary font-serif italic text-[10px] tracking-widest">
              lili sanctuary · کافه گل
            </div>
          </div>

          {/* Shared TopAppBar Container */}
          <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-margin py-space-sm h-14 w-full max-w-[390px] mx-auto bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary hover:bg-surface-container active:scale-95 transition-transform duration-200"
              >
                <span className="material-symbols-outlined fill-1">spa</span>
              </button>
              <h1 className="text-[20px] font-bold text-on-surface">{tenant.name}</h1>
            </div>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={() => setShowTableModal(true)}
                className="flex items-center gap-1 bg-surface-container-high border border-outline-variant/30 px-2.5 py-1 rounded-full text-primary text-[12px] font-medium"
              >
                <span className="material-symbols-outlined text-sm">table_restaurant</span>
                <span>میز شماره {selectedTableNumber}</span>
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:opacity-80 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg fill-1">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
            </div>
          </header>

          {/* Main Content Canvas */}
          <div className="relative z-10 pt-16 px-margin">
            <section className="mt-space-md mb-space-sm">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-[24px] font-bold text-on-surface">منوی {tenant.name}</h2>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">{tenant.tagline}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-primary text-[11px] font-medium bg-secondary-container/60 border border-outline-variant/30 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  {tenant.isOpen ? 'سفارش آنلاین فعال' : 'موقتاً بسته'}
                </span>
              </div>

              {/* Search Input Field */}
              <div className="mt-space-md relative">
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-xl">search</span>
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-11 pl-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[14px] placeholder:text-outline text-on-surface transition-all shadow-xs"
                  placeholder="جستجوی قهوه، دمنوش، خوراکی..."
                  type="text"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 left-2.5 flex items-center text-outline hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </section>

            {/* Sticky Horizontal Category Tabs */}
            <nav className="sticky top-14 z-30 -mx-margin px-margin py-2.5 bg-surface/95 backdrop-blur-md overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-outline-variant/20">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface border border-outline-variant/40'
                }`}
              >
                <span className="material-symbols-outlined text-sm fill-1">spa</span>
                <span>همه دسته‌ها</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low text-on-surface border border-outline-variant/40 hover:bg-surface-container'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </nav>

            {/* Menu Items List with Muguet Sprig Divider */}
            <div className="mt-space-md space-y-space-md">
              {filteredProducts.map((prod, index) => (
                <React.Fragment key={prod.id}>
                  {index === 2 && (
                    <div className="my-space-lg flex items-center justify-center gap-3">
                      <div className="h-px bg-outline-variant/50 flex-1 max-w-[80px]"></div>
                      <div className="flex items-center gap-1 text-primary">
                        <svg
                          fill="none"
                          height="24"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          width="24"
                        >
                          <path d="M12 21C12 15 15 8 19 4"></path>
                          <path
                            d="M16 8C14.5 7.5 13 8.5 13 10C13 11.5 14.5 12 16 11.5Z"
                            fill="currentColor"
                            fillOpacity="0.25"
                          ></path>
                          <path
                            d="M13 13C11.5 12.5 10 13.5 10 15C10 16.5 11.5 17 13 16.5Z"
                            fill="currentColor"
                            fillOpacity="0.25"
                          ></path>
                          <path d="M7 19C7 16 8.5 13.5 10.5 12"></path>
                        </svg>
                      </div>
                      <div className="h-px bg-outline-variant/50 flex-1 max-w-[80px]"></div>
                    </div>
                  )}
                  <article
                    onClick={() => openProductDetail(prod)}
                    className="p-3.5 bg-surface-container rounded-2xl shadow-xs border border-outline-variant/30 flex gap-3.5 hover:border-primary/40 transition-all group cursor-pointer"
                  >
                    <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden leaf-arch-mask bg-surface-container-low">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        src={prod.image}
                      />
                      {prod.badge && (
                        <span className="absolute top-1.5 right-1.5 bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                          {prod.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="text-[17px] font-bold text-on-surface">{prod.name}</h3>
                        <p className="text-[12px] text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20">
                        <span className="text-[17px] font-bold text-primary">
                          {formatToman(prod.basePrice)}{' '}
                          <span className="text-xs font-normal text-on-surface-variant">تومان</span>
                        </span>
                        <button
                          type="button"
                          aria-label="افزودن به سبد خرید"
                          onClick={(e) => handleQuickAdd(prod, e)}
                          className="w-8 h-8 rounded-full bg-secondary-container text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors active:scale-90 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-xl">add</span>
                        </button>
                      </div>
                    </div>
                  </article>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Floating Cart Bar Overlay */}
          {totalCartCount > 0 && (
            <aside className="fixed bottom-20 inset-x-0 z-40 max-w-[390px] mx-auto px-margin">
              <div className="bg-surface-container text-on-surface rounded-2xl p-3 px-4 shadow-2xl border border-outline-variant/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-primary relative">
                    <span className="material-symbols-outlined text-lg fill-1">local_mall</span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                      {toPersianNum(totalCartCount)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold">
                      {toPersianNum(totalCartCount)} سفارش در سبد
                    </p>
                    <p className="text-[12px] text-primary font-semibold">
                      {formatToman(cartSubtotal)} تومان
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('cart')}
                  className="bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all text-[12px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <span>مشاهده سبد خرید</span>
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
              </div>
            </aside>
          )}
        </main>
      )}

      {/* =====================================================================
          SCREEN 3: PRODUCT DETAIL (Matches Stitch Image_7_4191fcdd & Image_15_852c4fa0)
         ===================================================================== */}
      {screen === 'detail' && selectedProduct && (
        <div className="w-full max-w-[390px] bg-surface min-h-screen relative flex flex-col pb-40 shadow-2xl border-x border-outline-variant/30">
          {/* Top Navigation Header */}
          <header className="sticky top-0 z-40 px-margin py-space-sm flex items-center justify-between backdrop-blur-md bg-surface/85 border-b border-outline-variant/20 transition-all">
            <button
              type="button"
              aria-label="بازگشت"
              onClick={() => setScreen('menu')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-primary border border-outline-variant/30 shadow-xs hover:bg-surface-container-high active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <span className="text-[18px] text-on-surface tracking-tight font-bold">
              جزئیات سفارش
            </span>
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                aria-label="تغییر پوسته"
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container text-primary border border-outline-variant/30 shadow-xs active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined fill-1">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
              <button
                type="button"
                aria-label="اشتراک‌گذاری"
                onClick={() => triggerToast('لینک محصول کپی شد')}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container text-on-surface-variant border border-outline-variant/30 shadow-xs active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
              <button
                type="button"
                aria-label="نشان کردن"
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container text-primary border border-outline-variant/30 shadow-xs active:scale-95 transition-all"
              >
                <span className={`material-symbols-outlined ${isFavorite ? 'fill-1' : ''}`}>
                  favorite
                </span>
              </button>
            </div>
          </header>

          {/* Main Content Flow */}
          <main className="flex-1 flex flex-col">
            {/* Hero Visual Section */}
            <div className="relative w-full px-margin pt-space-xs">
              <div className="relative w-full h-72 rounded-[1.75rem] overflow-hidden shadow-md bg-surface-container border border-outline-variant/30">
                <img
                  className="w-full h-full object-cover"
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  src={selectedProduct.image}
                />
                <div className="absolute bottom-3 right-3 backdrop-blur-md bg-surface/90 border border-outline-variant/40 px-space-md py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <span className="material-symbols-outlined text-primary fill-1 text-[16px]">
                    spa
                  </span>
                  <span className="text-[11px] text-on-surface font-medium">
                    {selectedProduct.servingNote || 'سرو با گلبرگ بهارنارنج تازه'}
                  </span>
                </div>
              </div>
            </div>

            {/* Item Meta & Title Section */}
            <section className="px-margin pt-space-md pb-space-xs">
              <div className="flex items-center gap-space-xs mb-space-xs flex-wrap">
                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[12px] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  دست‌ساز باریستا
                </span>
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">
                    temp_preferences_custom
                  </span>
                  طعم اختصاصی
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-space-sm mt-1">
                <h1 className="text-[24px] font-bold text-on-surface">{selectedProduct.name}</h1>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[18px] font-bold text-primary">
                  {formatToman(selectedProduct.basePrice)}
                </span>
                <span className="text-[12px] text-outline">تومان (پایه)</span>
              </div>

              <p className="text-[14px] text-on-surface-variant mt-space-sm leading-relaxed text-justify">
                {selectedProduct.description}
              </p>

              {/* Botanical Tendril Divider */}
              <div className="flex items-center justify-center my-space-md gap-3 opacity-60">
                <div className="h-[1px] bg-outline-variant flex-1"></div>
                <span className="material-symbols-outlined text-primary text-[18px]">
                  local_florist
                </span>
                <div className="h-[1px] bg-outline-variant flex-1"></div>
              </div>
            </section>

            {/* Customization Section 1: Size Selector */}
            <section className="px-margin mb-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <h2 className="text-[18px] text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">coffee</span>
                  انتخاب اندازه
                </h2>
                <span className="text-[11px] text-outline">اجباری (۱ مورد)</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {selectedProduct.sizes.map((sz) => {
                  const isSelected = detailSizeId === sz.id;
                  return (
                    <label
                      key={sz.id}
                      onClick={() => setDetailSizeId(sz.id)}
                      className={`relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-primary bg-secondary-container/40 shadow-xs'
                          : 'border border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="coffee_size"
                          checked={isSelected}
                          onChange={() => setDetailSizeId(sz.id)}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-[14px] text-on-surface ${
                                isSelected ? 'font-bold' : 'font-medium'
                              }`}
                            >
                              {sz.name}
                            </p>
                            {sz.recommended && (
                              <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                پیشنهادی
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-outline">{sz.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[15px] font-bold text-primary">
                        {sz.priceDelta === 0 ? (
                          <span className="text-[12px] font-medium text-on-surface-variant">
                            پایه
                          </span>
                        ) : (
                          <>
                            +{formatToman(sz.priceDelta)}{' '}
                            <span className="text-[11px] font-normal">تومان</span>
                          </>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Customization Section 2: Milk & Add-ons */}
            {selectedProduct.addons.length > 0 && (
              <section className="px-margin mb-space-md">
                <div className="flex items-center justify-between mb-space-sm">
                  <h2 className="text-[18px] text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                    نوع شیر و افزودنی‌ها
                  </h2>
                  <span className="text-[11px] text-outline">اختیاری</span>
                </div>
                <div className="space-y-2.5">
                  {selectedProduct.addons.map((addon) => {
                    const checked = detailAddonIds.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? 'border-primary bg-secondary-container/30'
                            : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setDetailAddonIds((prev) =>
                                prev.includes(addon.id)
                                  ? prev.filter((id) => id !== addon.id)
                                  : [...prev, addon.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-[14px] font-semibold text-on-surface block">
                              {addon.name}
                            </span>
                            <span className="text-[12px] text-outline">{addon.subtitle}</span>
                          </div>
                        </div>
                        <span className="text-[16px] font-bold text-primary">
                          +{formatToman(addon.price)}{' '}
                          <span className="text-[11px] font-normal text-outline">تومان</span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Sweetness Preference */}
                <div className="mt-space-md p-3.5 rounded-xl bg-surface-container border border-outline-variant/40">
                  <label className="text-[12px] text-on-surface font-semibold mb-2 block">
                    میزان شیرینی نوشیدنی
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailSweetness('normal')}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-[12px] transition-all ${
                        detailSweetness === 'normal'
                          ? 'border-primary bg-secondary-container/70 text-on-surface font-bold'
                          : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                      <span>شیرینی استاندارد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailSweetness('low')}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-[12px] transition-all ${
                        detailSweetness === 'low'
                          ? 'border-primary bg-secondary-container/70 text-on-surface font-bold'
                          : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
                      <span>کم‌شیرین (ملایم)</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Customization Section 3: Barista Instructions */}
            <section className="px-margin mb-space-xl">
              <h2 className="text-[18px] text-on-surface font-semibold mb-space-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">draw</span>
                توضیحات اختصاصی برای باریستا
              </h2>
              <div className="relative">
                <textarea
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value.slice(0, 100))}
                  className="w-full rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3.5 text-on-surface placeholder:text-outline text-[12px] focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-xs"
                  placeholder="مثلاً: لطفاً خیلی داغ سرو شود یا فوم شیر حداکثری باشد..."
                  rows={3}
                ></textarea>
                <span className="absolute left-3 bottom-3 text-outline text-[11px]">
                  حداکثر ۱۰۰ حرف
                </span>
              </div>
            </section>
          </main>

          {/* Bottom Sticky Ordering Console */}
          <div className="fixed bottom-16 inset-x-0 z-40 max-w-[390px] mx-auto px-margin pointer-events-none">
            <div className="pointer-events-auto bg-surface-container/95 backdrop-blur-xl rounded-3xl p-3.5 border border-outline-variant/40 shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center bg-surface-container-low rounded-full p-1 border border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center active:scale-95 transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span className="w-10 text-center text-[18px] font-bold text-on-surface">
                    {toPersianNum(detailQty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailQty((q) => Math.min(20, q + 1))}
                    className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center active:scale-95 transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
                <div className="text-left">
                  <span className="block text-[11px] text-outline">مبلغ کل سفارش</span>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-[24px] font-extrabold text-primary">
                      {formatToman(detailTotalPrice)}
                    </span>
                    <span className="text-[12px] text-outline">تومان</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!currentSizeObj) return;
                  onAddToCart({
                    product: selectedProduct,
                    selectedSize: currentSizeObj,
                    selectedAddons: currentAddonsList,
                    sweetness: detailSweetness,
                    notes: detailNotes,
                    quantity: detailQty,
                    unitPrice: detailUnitPrice,
                  });
                  triggerToast(`«${selectedProduct.name}» به سبد سفارش افزوده شد`);
                  setScreen('cart');
                }}
                className="w-full bg-primary text-on-primary hover:opacity-90 py-3.5 px-space-md rounded-2xl flex items-center justify-center gap-2.5 text-[14px] font-bold shadow-lg active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined">shopping_bag</span>
                افزودن به سبد سفارش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 4: CART & CHECKOUT (Matches Stitch Image_9_a17abaef)
         ===================================================================== */}
      {screen === 'cart' && (
        <main className="w-full max-w-[390px] min-h-screen bg-background relative flex flex-col pb-40 overflow-x-hidden shadow-2xl border-x border-outline-variant/30">
          {/* Top App Bar */}
          <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-margin py-space-sm h-14 w-full max-w-[390px] mx-auto bg-surface/90 backdrop-blur-md shadow-xs">
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary hover:bg-surface-container active:scale-95 transition-transform duration-200"
              >
                <span className="material-symbols-outlined text-[22px]">spa</span>
              </button>
              <span className="text-[20px] font-bold text-primary">{tenant.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/70 border border-outline-variant/30 text-on-secondary-container"
            >
              <span className="material-symbols-outlined text-[15px] fill-1">table_restaurant</span>
              <span className="text-[11px] font-semibold">میز {selectedTableNumber}</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setScreen('tracking')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-surface-container active:scale-95 transition-transform duration-200"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </button>
            </div>
          </header>

          {/* Sub-Header Context */}
          <div className="pt-16 px-margin pb-2">
            <div className="flex items-center justify-between mt-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <h1 className="text-[20px] font-bold text-primary">سبد سفارش {tenant.name}</h1>
              </div>
              <span className="text-[12px] font-medium text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full">
                {toPersianNum(totalCartCount)} قلم منتخب
              </span>
            </div>
            <p className="text-[12px] text-on-surface-variant">
              عطر دست‌چین شکوفه‌ها و دم‌آوری با طعم بهشت کوچک گل‌ها
            </p>
          </div>

          {/* Botanical Divider */}
          <div className="px-margin my-2 flex items-center justify-center gap-2 text-outline-variant">
            <span className="h-px bg-outline-variant/60 flex-1"></span>
            <span className="material-symbols-outlined text-primary/70 text-[18px]">
              local_florist
            </span>
            <span className="h-px bg-outline-variant/60 flex-1"></span>
          </div>

          {/* Dining Preference Switch (سرو در کافه / بیرون‌بر) */}
          <section aria-label="انتخاب نوع سرو" className="px-margin mb-4">
            <div className="p-1 bg-surface-container-high rounded-full flex items-center justify-between relative shadow-inner">
              <button
                type="button"
                onClick={() => setDineType('dine_in')}
                className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-all duration-200 ${
                  dineType === 'dine_in'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] fill-1">
                  table_restaurant
                </span>
                <span>سرو در کافه (میز)</span>
              </button>
              <button
                type="button"
                onClick={() => setDineType('takeaway')}
                className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-all duration-200 ${
                  dineType === 'takeaway'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">takeout_dining</span>
                <span>سفارش بیرون‌بر (Takeaway)</span>
              </button>
            </div>
          </section>

          {/* Table Selector Card */}
          {dineType === 'dine_in' && (
            <section className="px-margin mb-5">
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[20px] p-space-md flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">deck</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-secondary">محل استقرار</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    </div>
                    <div className="text-[14px] font-semibold text-on-surface">
                      {currentTableObj?.name || 'میز شماره ۴ - کنار پنجره حیاط'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTableModal(true)}
                  className="flex items-center gap-0.5 text-[12px] font-medium text-primary bg-surface-container-low px-2.5 py-1.5 rounded-full hover:bg-surface-container active:scale-95 transition-all"
                >
                  <span>تغییر</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </section>
          )}

          {/* Cart Items Section */}
          <section aria-label="اقلام سبد خرید" className="px-margin mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  shopping_bag
                </span>
                <span>لیست نوشیدنی و شیرینی‌ها</span>
              </h2>
              <span className="text-[11px] text-secondary">به‌روزرسانی خودکار</span>
            </div>

            {cart.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[20px] p-8 text-center space-y-3">
                <span className="material-symbols-outlined text-primary text-4xl">local_cafe</span>
                <p className="text-[14px] font-bold text-on-surface">سبد سفارش شما خالی است</p>
                <p className="text-[12px] text-on-surface-variant">
                  نوشیدنی‌ها و شیرینی‌های روز کافه گل را از منو انتخاب کنید.
                </p>
                <button
                  type="button"
                  onClick={() => setScreen('menu')}
                  className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-[12px] font-bold"
                >
                  مشاهده منوی کافه گل
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cart.map((item) => (
                  <article
                    key={item.id}
                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-[20px] p-3.5 shadow-xs relative"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-[16px] overflow-hidden bg-surface-container shrink-0 border border-secondary-container/40 relative">
                        <img
                          className="w-full h-full object-cover"
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          src={item.product.image}
                        />
                        <span className="absolute top-1 right-1 bg-surface-container-lowest/90 text-primary rounded-full p-0.5">
                          <span className="material-symbols-outlined text-[12px] block">eco</span>
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-[14px] font-bold text-on-surface leading-tight">
                              {item.product.name}
                            </h3>
                            <button
                              type="button"
                              aria-label="حذف"
                              onClick={() => onRemoveFromCart(item.id)}
                              className="text-outline hover:text-error transition-colors p-1 -mt-1 -ml-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                          <p className="text-[12px] text-on-surface-variant mt-0.5">
                            {item.selectedSize.name}
                            {item.selectedAddons.length > 0 &&
                              `، با ${item.selectedAddons.map((a) => a.name).join(' و ')}`}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-container">
                          <div className="text-[17px] font-bold text-primary">
                            {formatToman(item.unitPrice * item.quantity)}{' '}
                            <span className="text-[11px] text-on-surface-variant font-normal">
                              تومان
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openProductDetail(item.product)}
                              className="text-secondary hover:text-primary p-1 flex items-center"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                edit_note
                              </span>
                            </button>
                            <div className="bg-secondary-container/60 rounded-full px-2 py-1 flex items-center gap-2 border border-outline-variant/30">
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, -1)}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-lowest active:scale-90 transition-transform"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  remove
                                </span>
                              </button>
                              <span className="text-[12px] font-bold text-on-surface px-1">
                                {toPersianNum(item.quantity)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(item.id, 1)}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-lowest active:scale-90 transition-transform"
                              >
                                <span className="material-symbols-outlined text-[14px]">add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Notes to Cafe Section */}
          <section aria-label="یادداشت سفارش" className="px-margin mb-6">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[20px] p-4 shadow-xs">
              <label
                className="flex items-center gap-2 text-[12px] font-semibold text-on-surface mb-2"
                htmlFor="order-notes"
              >
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  edit_note
                </span>
                <span>یادداشت یا توضیحات سفارش (اختیاری)</span>
              </label>
              <div className="relative">
                <textarea
                  id="order-notes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value.slice(0, 100))}
                  className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 p-3 text-[12px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                  placeholder="مثال: لاته با فوم بیشتر سرو شود، یا سفارش همزمان آورده شود..."
                  rows={2}
                ></textarea>
                <span className="absolute bottom-2 left-2 text-[11px] text-outline">
                  حداکثر ۱۰۰ حرف
                </span>
              </div>
            </div>
          </section>

          {/* Botanical Loyalty Banner */}
          {loyaltyDiscount > 0 && (
            <div className="px-margin mb-6">
              <div className="bg-gradient-to-l from-secondary-fixed via-secondary-container to-surface-container-high border border-primary-container/20 rounded-[20px] p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] fill-1">
                    card_membership
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-on-secondary-fixed">
                    اعمال تخفیف اشتراک بهاری {tenant.name}
                  </div>
                  <div className="text-[12px] text-on-secondary-fixed-variant">
                    {formatToman(loyaltyDiscount)} تومان هدیه روی سفارش شما لحاظ شد
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary text-[20px]">
                  check_circle
                </span>
              </div>
            </div>
          )}

          {/* Bill Summary Breakdown */}
          <section aria-label="صورت‌حساب نهایی" className="px-margin mb-6">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[20px] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <span className="text-[14px] font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    receipt_long
                  </span>
                  <span>جزئیات پرداخت</span>
                </span>
                <span className="text-[11px] text-secondary bg-surface-container-low px-2 py-0.5 rounded-full">
                  شماره فاکتور: #GL-۸۹۴
                </span>
              </div>
              <div className="flex items-center justify-between text-[14px] text-on-surface-variant">
                <span>مجموع سفارشات</span>
                <span className="font-medium text-on-surface">
                  {formatToman(cartSubtotal)} تومان
                </span>
              </div>
              <div className="flex items-center justify-between text-[14px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span>مالیات و خدمات کافه</span>
                  <span className="text-[11px] text-primary">
                    {taxAmount === 0 ? `(مهمان ${tenant.name})` : `(${toPersianNum(tenant.taxPercentage)}٪)`}
                  </span>
                </span>
                <span className="font-medium text-primary">{formatToman(taxAmount)} تومان</span>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="flex items-center justify-between text-[14px] text-primary">
                  <span className="flex items-center gap-1">
                    <span>تخفیف وفاداری باشگاه مشتریان</span>
                    <span className="material-symbols-outlined text-[15px]">local_offer</span>
                  </span>
                  <span className="font-bold text-primary">
                    -{formatToman(loyaltyDiscount)} تومان
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-dashed border-outline-variant flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-on-surface">
                    مبلغ قابل پرداخت نهایی
                  </span>
                  <span className="text-[11px] text-outline">با احتساب کلیه کسورات</span>
                </div>
                <div className="text-left">
                  <span className="text-[26px] font-extrabold text-primary tracking-tight">
                    {formatToman(cartFinalTotal)}
                  </span>
                  <span className="text-[12px] font-bold text-primary mr-1">تومان</span>
                </div>
              </div>
            </div>
          </section>

          {/* Botanical Micro Guarantee Stamp */}
          <div className="px-margin mb-4 text-center flex items-center justify-center gap-2 text-[11px] text-outline">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              verified_user
            </span>
            <span>پرداخت امن شتابی و کارت‌به‌کارت با تضمین رضایت {tenant.name}</span>
          </div>

          {/* Fixed Floating Checkout Submission Bar */}
          {cart.length > 0 && (
            <div className="fixed bottom-16 inset-x-0 z-40 max-w-[390px] mx-auto px-margin">
              <button
                type="button"
                onClick={() => setShowPaymentSheet(true)}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3.5 px-space-lg rounded-[20px] shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[14px] font-bold text-on-primary">
                      تأیید و پرداخت نهایی
                    </span>
                    <span className="block text-[11px] text-on-primary/80 font-normal">
                      کارت‌به‌کارت با بارگذاری رسید یا درگاه شاپرک
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-full">
                  <span className="text-[14px] font-bold text-on-primary">
                    {formatToman(cartFinalTotal)}
                  </span>
                  <span className="text-[11px] text-on-primary font-normal">تومان</span>
                  <span className="material-symbols-outlined text-[18px] text-on-primary mr-0.5">
                    arrow_back
                  </span>
                </div>
              </button>
            </div>
          )}
        </main>
      )}

      {/* =====================================================================
          SCREEN 5: LIVE ORDER TRACKING (Matches Stitch Image_17_df782e48)
         ===================================================================== */}
      {screen === 'tracking' && trackedOrder && (
        <div className="w-full max-w-[390px] min-h-screen bg-surface flex flex-col relative pb-32 shadow-2xl border-x border-outline-variant/30">
          {/* TopAppBar */}
          <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-margin py-space-sm h-14 w-full max-w-[390px] mx-auto bg-surface/90 backdrop-blur-md shadow-xs">
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                aria-label="بازگشت"
                onClick={() => setScreen('home')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-container active:scale-95 transition-transform duration-200"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[24px]">spa</span>
                <h1 className="text-[20px] font-bold text-primary tracking-tight">{tenant.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center justify-between p-1 bg-surface-container rounded-full w-14 h-8 px-1.5 transition-colors border border-outline-variant/40"
              >
                <span className="material-symbols-outlined text-[16px] text-primary fill-1">
                  light_mode
                </span>
                <span className="material-symbols-outlined text-[15px] text-outline">
                  dark_mode
                </span>
              </button>
            </div>
          </header>

          {/* Main Content Canvas */}
          <main className="flex-1 px-margin pt-20 space-y-space-md">
            {/* Order Switcher if multiple orders exist */}
            {orders.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {orders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => onSelectOrderForTracking(ord.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                      trackedOrder.id === ord.id
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant border border-outline-variant/40'
                    }`}
                  >
                    سفارش #{ord.code}
                  </button>
                ))}
              </div>
            )}

            {/* Success Confirmation Hero Card */}
            <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md border border-secondary-fixed/50 relative overflow-hidden text-center mt-1">
              <div className="absolute -top-6 -right-6 w-24 h-24 text-secondary-container/30 pointer-events-none rotate-12">
                <span className="material-symbols-outlined text-7xl select-none">
                  local_florist
                </span>
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 text-secondary-container/20 pointer-events-none -rotate-45">
                <span className="material-symbols-outlined text-7xl select-none">eco</span>
              </div>

              {/* Muguet & Check Blooming Badge */}
              <div className="relative mx-auto w-20 h-20 mb-space-sm flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-secondary-container/45 animate-ping opacity-30"></div>
                <div className="relative w-18 h-18 rounded-full bg-secondary-fixed flex items-center justify-center shadow-inner border border-primary-container/20">
                  <span className="material-symbols-outlined text-primary text-[36px] fill-1">
                    check_circle
                  </span>
                </div>
                <span className="material-symbols-outlined text-primary absolute -bottom-1 -right-1 text-[20px] bg-surface-container-lowest rounded-full p-0.5 shadow-xs">
                  spa
                </span>
              </div>

              <h2 className="text-[22px] text-primary font-bold mb-space-xs">
                سفارش شما با موفقیت ثبت شد!
              </h2>
              <p className="text-[12px] text-on-surface-variant flex items-center justify-center gap-1.5 flex-wrap">
                <span className="font-semibold text-primary">کد پیگیری:</span>
                <span className="font-bold text-primary-container">#{trackedOrder.code}</span>
                <span className="text-outline-variant">|</span>
                <span className="inline-flex items-center gap-1 text-secondary font-medium">
                  <span className="material-symbols-outlined text-[15px]">table_restaurant</span>
                  {trackedOrder.dineType === 'dine_in'
                    ? `میز شماره ${trackedOrder.tableNumber} (کنار پنجره حیاط)`
                    : 'سفارش بیرون‌بر (Takeaway)'}
                </span>
              </p>

              <div className="flex items-center justify-center gap-3 my-space-md opacity-75">
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-primary-container/30 to-primary-container/60"></div>
                <span className="material-symbols-outlined text-primary-container text-base">
                  eco
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary-container/30 to-primary-container/60"></div>
              </div>

              {/* Estimated Preparation Time Tracker */}
              <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-variant flex items-center justify-between gap-space-sm">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary text-[12px] font-medium">
                    <span className="material-symbols-outlined text-[17px]">hourglass_top</span>
                    <span>زمان تقریبی آماده‌سازی:</span>
                  </div>
                  <p className="text-[18px] text-on-surface font-bold mt-0.5">۱۲ تا ۱۵ دقیقه</p>
                </div>
                <div className="flex flex-col items-center justify-center pl-1">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-primary-container flex items-center justify-center bg-secondary-fixed/30 text-primary">
                    <span className="text-[14px] font-bold">
                      {toPersianNum(trackedOrder.estimatedMinutes)}′
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1">تا سرو عطرانگیز</span>
                </div>
              </div>
            </section>

            {/* Order Status Timeline (مراحل سفارش) */}
            <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-secondary-fixed/30">
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="text-[17px] text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    timeline
                  </span>
                  پیگیری وضعیت زنده سفارش
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-container text-primary font-medium">
                  زنده (Polling ۵s)
                </span>
              </div>

              <div className="relative pr-2 space-y-6">
                {/* Step 1 */}
                <div className="relative flex items-start gap-3.5">
                  <div className="absolute right-[17px] top-[34px] w-[2px] h-[calc(100%+8px)] bg-primary-container"></div>
                  <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-xs z-10 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">done</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-bold text-on-surface">
                        {trackedOrder.status === 'pending_payment'
                          ? 'ثبت اولیه و بررسی رسید پرداخت'
                          : 'ثبت و تأیید در سیستم'}
                      </p>
                      <span className="text-[11px] font-bold text-outline">
                        {trackedOrder.createdAt}
                      </span>
                    </div>
                    <p className="text-[12px] text-secondary mt-0.5">
                      {trackedOrder.status === 'pending_payment'
                        ? 'رسید کارت‌به‌کارت شما ارسال شده و در انتظار تأیید صندوق است.'
                        : 'سفارش توسط صندوق مرکزی دریافت و تأیید شد.'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-3.5">
                  <div className="absolute right-[17px] top-[34px] w-[2px] h-[calc(100%+8px)] bg-outline-variant/60"></div>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 ${
                      trackedOrder.status === 'preparing' ||
                      trackedOrder.status === 'ready' ||
                      trackedOrder.status === 'delivered'
                        ? 'bg-secondary-fixed border-2 border-primary-container text-primary animate-gentle-pulse shadow-md'
                        : 'bg-surface-container-high border border-outline-variant text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] fill-1">local_cafe</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-bold text-primary flex items-center gap-1.5">
                        در حال آماده‌سازی توسط باریستا
                        <span className="w-2 h-2 rounded-full bg-primary-container inline-block"></span>
                      </p>
                      <span className="text-[11px] px-2 py-0.5 bg-secondary-container/70 text-primary rounded-full font-medium">
                        {trackedOrder.status === 'preparing' ? 'اکنون' : 'مرحله ۲'}
                      </span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant mt-0.5">
                      باریستا مشغول عصاره‌گیری و دم‌آوری برگ‌های تازه است.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 ${
                      trackedOrder.status === 'ready' || trackedOrder.status === 'delivered'
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container-high border border-outline-variant text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">room_service</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-[14px] font-bold ${
                          trackedOrder.status === 'ready' || trackedOrder.status === 'delivered'
                            ? 'text-primary'
                            : 'text-outline'
                        }`}
                      >
                        بررسی نهایی و سرو روی میز
                      </p>
                      <span className="text-[11px] text-outline">
                        {trackedOrder.status === 'ready' || trackedOrder.status === 'delivered'
                          ? 'آماده سرو'
                          : '--:--'}
                      </span>
                    </div>
                    <p className="text-[12px] text-outline mt-0.5">
                      سرو در ظروف سفالی دست‌ساز بر روی میز شماره{' '}
                      {trackedOrder.tableNumber || '۴'}.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Order Summary Card (خلاصه سفارش) */}
            <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-secondary-fixed/30">
              <div className="flex items-center justify-between mb-space-sm pb-space-xs border-b border-surface-container">
                <h3 className="text-[17px] text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    receipt_long
                  </span>
                  خلاصه اقلام سفارش
                </h3>
                <span className="text-[11px] text-secondary font-medium">
                  {toPersianNum(trackedOrder.items.length)} قلم
                </span>
              </div>

              <div className="divide-y divide-surface-container/80">
                {trackedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-space-sm flex items-center justify-between gap-space-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex items-center justify-center text-secondary relative shrink-0">
                        <span className="material-symbols-outlined text-2xl">
                          {item.icon || 'coffee'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-[14px] text-on-surface font-semibold">
                          {item.name}{' '}
                          {item.quantity > 1 && `(${toPersianNum(item.quantity)} عدد)`}
                        </h4>
                        <p className="text-[12px] text-secondary">{item.details}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[17px] font-bold text-primary">
                        {formatToman(item.unitPrice * item.quantity)}
                      </span>
                      <span className="text-[11px] text-outline block">تومان</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-space-sm pt-space-sm border-t border-surface-variant flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
                <span className="text-[13px] text-on-surface font-bold">
                  مجموع کل قابل پرداخت ({trackedOrder.receiptVerified ? 'تسویه‌شده' : 'در انتظار تأیید'}):
                </span>
                <div className="text-left">
                  <span className="text-[18px] text-primary font-bold">
                    {formatToman(trackedOrder.totalAmount)}
                  </span>
                  <span className="text-[12px] text-primary font-medium mr-1">تومان</span>
                </div>
              </div>
            </section>

            {/* Action Buttons Cluster */}
            <section className="space-y-space-sm pt-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-3.5 px-space-md rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>مشاهده جزئیات سفارش و فاکتور دیجیتال</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="w-full bg-surface-container-lowest hover:bg-surface-container text-secondary border border-outline-variant/80 py-3 px-space-md rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                <span>بازگشت به صفحه اصلی کافه</span>
              </button>
            </section>

            <p className="text-center text-[12px] text-secondary/70 pt-2 pb-4">
              عطر گل‌های موگه و طعم دست‌ساز باریستاهای {tenant.name}، تقدیم به آرامش شما.
            </p>
          </main>
        </div>
      )}

      {/* =====================================================================
          SCREEN 6: ABOUT CAFE GOL (Matches Stitch Image_5_0a347d3d)
         ===================================================================== */}
      {screen === 'about' && (
        <div className="w-full max-w-[390px] mx-auto min-h-screen bg-surface flex flex-col relative pb-32 shadow-2xl border-x border-outline-variant/20">
          {/* TopAppBar */}
          <header className="bg-surface/90 backdrop-blur-md shadow-xs fixed top-0 inset-x-0 z-40 flex items-center justify-between px-margin py-space-sm h-14 w-full max-w-[390px] mx-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container text-primary active:scale-95 transition-transform duration-200"
              >
                <span className="material-symbols-outlined text-primary">spa</span>
              </button>
              <span className="text-[18px] font-bold text-primary">{tenant.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/30 active:scale-95 transition-all text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px] text-primary fill-1">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="text-[11px] font-medium">{isDark ? 'شب' : 'روز'}</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen('tracking')}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant active:scale-95 transition-transform duration-200"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </header>

          {/* Main Content Canvas */}
          <main className="flex-1 px-margin pt-16 mt-2 space-y-space-lg">
            {/* Hero Section with Leaf-Arch Botanical Atmosphere */}
            <section className="space-y-space-sm">
              <div className="relative overflow-hidden leaf-arch shadow-md border border-outline-variant/30 bg-surface-container-low group">
                <img
                  className="w-full h-56 object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  alt={`درباره ${tenant.name}`}
                  referrerPolicy="no-referrer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIf8tGPuxOOHZimVX7IXXBHDQovAOHermoa8AgDeowTXtxsMAnGDf-cuVh3lFcimzijQd3N7XMaX35XhFrkxl9HF9QyQU-ze4IaOEb9syu4SRlkoq8jlAMHPijm8WbUrfZFeMwGhlLVhQviTNfivrECFaOXDG9UuaAQj8wEtAYIkMBtTSKto-nL2NxoLDaUMSGoMtZpFRR8ont4B_FNh9RuaZRL5FI_K9i53YZZcm6TXjE8Yd4WIR6kw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
                <div className="absolute top-space-sm right-space-sm bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border border-secondary-container/50">
                  <span className="material-symbols-outlined text-primary text-[16px] fill-1">
                    eco
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    کافه گلخانه و قنادی دست‌ساز
                  </span>
                </div>
                <div className="absolute bottom-space-sm right-space-sm left-space-sm text-[#F2EDDC]">
                  <h1 className="text-[20px] font-bold drop-shadow-xs">درباره {tenant.name}</h1>
                  <p className="text-[12px] opacity-90">
                    پناهگاه آرامش و رایحه طبیعت در قلب شهر
                  </p>
                </div>
              </div>

              {/* Poetic Brand Story Card */}
              <div className="bg-surface-container-low/80 backdrop-blur-xs p-space-md rounded-2xl border border-secondary-container/40 shadow-xs relative overflow-hidden">
                <div className="absolute -left-6 -bottom-6 w-20 h-20 opacity-10 pointer-events-none text-primary">
                  <span className="material-symbols-outlined text-[80px]">local_florist</span>
                </div>
                <p className="text-[14px] text-on-surface leading-relaxed text-justify">
                  {tenant.storyQuote}
                </p>
                <div className="mt-space-sm flex items-center justify-end gap-2 text-primary">
                  <span className="text-[11px] font-medium tracking-wider">سلسله اصالت و طعم</span>
                  <span className="w-8 h-[1px] bg-primary/40"></span>
                  <span className="material-symbols-outlined text-[14px] fill-1">
                    filter_vintage
                  </span>
                </div>
              </div>
            </section>

            {/* Botanical Divider (Muguet Emblem) */}
            <div className="flex items-center justify-center gap-3 py-1 text-secondary-container">
              <span className="h-[1px] flex-1 bg-outline-variant/40"></span>
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[16px]">yard</span>
                <span className="text-[10px] tracking-widest text-primary/70 font-mono">
                  MUGUET
                </span>
              </div>
              <span className="h-[1px] flex-1 bg-outline-variant/40"></span>
            </div>

            {/* Bento-style Feature Cards */}
            <section className="space-y-space-md">
              {/* Card 1: Working Hours */}
              <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs">
                <div className="flex items-center gap-3 mb-space-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">schedule</span>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-on-surface">ساعات پذیرایی و کاری</h2>
                    <span className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      {tenant.isOpen ? 'اکنون باز است • سرو قهوه و نوشیدنی' : 'هم‌اکنون بسته است'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-surface-container">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        calendar_today
                      </span>
                      شنبه تا چهارشنبه:
                    </span>
                    <span className="font-bold text-primary">{tenant.weekdayHours}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        weekend
                      </span>
                      پنج‌شنبه و جمعه:
                    </span>
                    <span className="font-bold text-primary">{tenant.weekendHours}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Address & Interactive Navigation */}
              <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs">
                <div className="flex items-center gap-3 mb-space-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">distance</span>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-on-surface">نشانی و دسترسی</h2>
                    <p className="text-[11px] text-on-surface-variant">
                      محیط اختصاصی عمارت باغ گل
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-on-surface mt-2 bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/20 leading-relaxed">
                  {tenant.address}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-space-sm">
                  <a
                    className="flex items-center justify-center gap-1.5 bg-primary text-on-primary py-2.5 px-3 rounded-xl text-[12px] font-semibold hover:bg-primary-container active:scale-95 transition-all shadow-xs"
                    href="https://neshan.org"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[18px]">explore</span>
                    <span>مسیریابی در نشان</span>
                  </a>
                  <a
                    className="flex items-center justify-center gap-1.5 bg-secondary-container text-on-secondary-container py-2.5 px-3 rounded-xl text-[12px] font-semibold hover:bg-secondary-fixed active:scale-95 transition-all"
                    href="https://maps.google.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span>گوگل مپس</span>
                  </a>
                </div>
              </div>

              {/* Card 3: Free High-Speed Wi-Fi */}
              <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">wifi</span>
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-on-surface">
                        اینترنت رایگان مهمانان
                      </h2>
                      <span className="text-[11px] text-on-surface-variant">
                        فیبر نوری پرسرعت برای مطالعه و کار
                      </span>
                    </div>
                  </div>
                  <span className="bg-secondary-fixed text-on-secondary-fixed text-[11px] px-2 py-0.5 rounded-full font-bold">
                    رایگان
                  </span>
                </div>
                <div className="mt-space-md space-y-2 bg-surface-container-low/50 p-space-sm rounded-xl border border-outline-variant/20">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-on-surface-variant">نام شبکه (SSID):</span>
                    <span className="font-mono font-semibold text-primary" dir="ltr">
                      {tenant.wifiSsid}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] pt-1.5 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant">رمز عبور:</span>
                    <div className="flex items-center gap-2" dir="ltr">
                      <code className="font-mono text-primary font-bold text-[13px] bg-surface-container px-2 py-0.5 rounded">
                        {tenant.wifiPass}
                      </code>
                      <button
                        className="p-1 rounded-lg hover:bg-secondary-container text-primary transition-colors"
                        onClick={() => {
                          navigator.clipboard?.writeText(tenant.wifiPass);
                          triggerToast('رمز وای‌فای با موفقیت کپی شد');
                        }}
                        title="کپی رمز"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Contact & Socials */}
              <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs">
                <div className="flex items-center gap-3 mb-space-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">contact_support</span>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-on-surface">ارتباط و رزرو میز</h2>
                    <p className="text-[11px] text-on-surface-variant">
                      پاسخگویی در تمامی ساعات کاری
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <a
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-secondary-container/40 transition-colors"
                    href={`tel:${tenant.phone}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        call
                      </span>
                      <span className="text-[13px] text-on-surface font-medium">
                        شماره تماس رزرو:
                      </span>
                    </div>
                    <span className="text-[16px] font-bold text-primary" dir="ltr">
                      {toPersianNum(tenant.phone)}
                    </span>
                  </a>
                  <a
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-secondary-container/40 transition-colors"
                    href="https://instagram.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        camera_alt
                      </span>
                      <span className="text-[13px] text-on-surface font-medium">
                        اینستاگرام کافه:
                      </span>
                    </div>
                    <span className="font-mono text-[12px] font-semibold text-primary" dir="ltr">
                      {tenant.instagram}
                    </span>
                  </a>
                </div>
              </div>

              {/* Artisan Certificate & Amenities Tags */}
              <div className="bg-surface-container-low/40 rounded-2xl p-space-md border border-outline-variant/20 flex flex-wrap items-center justify-around gap-2 text-center">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">
                    local_bar
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-1">
                    باریستاهای گواهی‌شده
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-outline-variant/40"></div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">
                    bakery_dining
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-1">قنادی روزانه</span>
                </div>
                <div className="w-[1px] h-8 bg-outline-variant/40"></div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">
                    nature_people
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-1">فضای باز باغ</span>
                </div>
              </div>
            </section>

            {/* Signature botanical stamp */}
            <footer className="text-center pt-2 pb-4 text-on-surface-variant/70">
              <p className="text-[11px]">{tenant.name} • تهران، فرشته</p>
              <p className="text-[10px] text-outline font-mono mt-0.5">
                Muguet Botanical Sanctum © 2026
              </p>
            </footer>
          </main>
        </div>
      )}

      {/* =====================================================================
          SHARED COMPONENT: BottomNavBar (Matches Stitch Capsule Nav)
         ===================================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-around items-center px-space-sm py-space-xs max-w-[390px] mx-auto pb-safe pointer-events-none">
        <div className="pointer-events-auto w-full flex justify-around items-center bg-surface-container/95 backdrop-blur-md shadow-2xl rounded-full mb-3 mx-margin p-1 border border-outline-variant/40">
          {/* Tab 1: خانه / منو */}
          <button
            type="button"
            onClick={() => setScreen('home')}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1.5 active:scale-95 transition-all duration-200 ${
              screen === 'home' || screen === 'detail'
                ? 'bg-secondary-container text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                screen === 'home' || screen === 'detail' ? 'fill-1' : ''
              }`}
            >
              local_cafe
            </span>
            <span className="text-[11px] mt-0.5">منو</span>
          </button>

          {/* Tab 2: فهرست و جستجو */}
          <button
            type="button"
            onClick={() => setScreen('menu')}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1.5 active:scale-95 transition-all duration-200 ${
              screen === 'menu'
                ? 'bg-secondary-container text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                screen === 'menu' ? 'fill-1' : ''
              }`}
            >
              search
            </span>
            <span className="text-[11px] mt-0.5">جستجو</span>
          </button>

          {/* Tab 3: سفارش‌ها */}
          <button
            type="button"
            onClick={() => setScreen(totalCartCount > 0 && screen !== 'tracking' ? 'cart' : 'tracking')}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1.5 active:scale-95 transition-all duration-200 relative ${
              screen === 'cart' || screen === 'tracking'
                ? 'bg-secondary-container text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                screen === 'cart' || screen === 'tracking' ? 'fill-1' : ''
              }`}
            >
              receipt_long
            </span>
            <span className="text-[11px] mt-0.5">سفارش‌ها</span>
            {totalCartCount > 0 && (
              <span className="absolute top-1 left-3 w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                {toPersianNum(totalCartCount)}
              </span>
            )}
          </button>

          {/* Tab 4: درباره ما */}
          <button
            type="button"
            onClick={() => setScreen('about')}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1.5 active:scale-95 transition-all duration-200 ${
              screen === 'about'
                ? 'bg-secondary-container text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                screen === 'about' ? 'fill-1' : ''
              }`}
            >
              info
            </span>
            <span className="text-[11px] mt-0.5">درباره ما</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
