// ===== IMPORTS & DEPENDENCIES =====
import React, { useState, useEffect, useCallback } from 'react';
import {
  PlatformRoleView,
  TenantCafe,
  Category,
  Product,
  CartItem,
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  InventoryItem,
  LedgerEntry,
  CashRegisterShift,
  StaffMember,
  CafeTable,
  SaaSPlan,
  SupportTicket,
} from './types';
import {
  INITIAL_PLANS,
  INITIAL_TENANTS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_INVENTORY,
  INITIAL_LEDGER,
  INITIAL_SHIFT,
  INITIAL_STAFF,
  INITIAL_TICKETS,
} from './mockData';
import { toPersianNum, toJalaliDate, toJalaliTime } from './utils/persian';
import { cafeGolApi } from './api/client';
import { CustomerApp } from './components/CustomerApp';
import { OwnerPanel } from './components/OwnerPanel';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { MarketingAndOnboarding } from './components/MarketingAndOnboarding';
import { InstallerAndArchitecture } from './components/InstallerAndArchitecture';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// ===== INITIAL DEFAULT STITCH CART (۳ قلم - ۳۳۸,۰۰۰ تومان) =====
const buildDefaultStitchCart = (products: Product[]): CartItem[] => {
  const vanillaLatte = products.find((p) => p.id === 'prod_vanilla_latte') || products[0];
  const pearTart = products.find((p) => p.id === 'prod_pear_tart') || products[6];
  const coldBrew = products.find((p) => p.id === 'prod_cold_brew') || products[3];

  const items: CartItem[] = [];
  if (vanillaLatte) {
    items.push({
      id: 'cart_init_1',
      product: vanillaLatte,
      selectedSize: vanillaLatte.sizes[0] || {
        id: 'size_md',
        name: 'متوسط (Double Shot)',
        subtitle: '۲۴۰ میلی‌لیتر',
        priceDelta: 0,
      },
      selectedAddons: [
        {
          id: 'addon_almond_milk',
          name: 'شیر بادام ارگانیک، اسطوخودوس',
          subtitle: 'دست‌ساز',
          price: 0,
        },
      ],
      sweetness: 'کم شیرین',
      quantity: 1,
      unitPrice: 130000,
    });
  }
  if (pearTart) {
    items.push({
      id: 'cart_init_2',
      product: pearTart,
      selectedSize: pearTart.sizes[0] || {
        id: 'size_slice',
        name: 'اسلایس استاندارد روز',
        subtitle: 'تازه پخت صبحگاهی با هل سبز',
        priceDelta: 0,
      },
      selectedAddons: [],
      sweetness: 'استاندارد',
      quantity: 1,
      unitPrice: 115000,
    });
  }
  if (coldBrew) {
    items.push({
      id: 'cart_init_3',
      product: coldBrew,
      selectedSize: coldBrew.sizes[0] || {
        id: 'size_md',
        name: 'متوسط',
        subtitle: 'دم‌آوری سرد ۱۸ ساعته با برش نارنج',
        priceDelta: 0,
      },
      selectedAddons: [],
      sweetness: 'کم شیرین',
      quantity: 1,
      unitPrice: 93000,
    });
  }
  return items;
};

// ===== CORE APPLICATION COMPONENT =====
export default function App() {
  const [roleView, setRoleView] = useState<PlatformRoleView>('customer');

  // Theme state (persisted per user in localStorage)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cafegol_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('cafegol_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  // Multi-tenant & RBAC state synchronized with /api/v1/*
  const [plans, setPlans] = useState<SaaSPlan[]>(INITIAL_PLANS);
  const [tenants, setTenants] = useState<TenantCafe[]>(INITIAL_TENANTS);
  const [activeTenantId, setActiveTenantId] = useState<string>('tenant_cafegol');
  const [activeStaffRole, setActiveStaffRole] = useState<
    'owner' | 'manager' | 'cashier' | 'kitchen'
  >('owner');
  const [lastPolledAt, setLastPolledAt] = useState<string>(toJalaliTime());

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [tables, setTables] = useState<CafeTable[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeOrderId, setActiveOrderId] = useState<string | null>('ord_gl894');
  const [cart, setCart] = useState<CartItem[]>(() => buildDefaultStitchCart(INITIAL_PRODUCTS));
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [shift, setShift] = useState<CashRegisterShift>(INITIAL_SHIFT);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);

  // Fetch Platform Overview & Tenant-Isolated Bootstrap from /api/v1/*
  const syncTenantFromApi = useCallback(
    async (tenantId: string, staffRole: string) => {
      try {
        const [platformData, tenantData] = await Promise.all([
          cafeGolApi.getPlatformOverview(),
          cafeGolApi.getTenantBootstrap(tenantId, staffRole),
        ]);
        setPlans(platformData.plans);
        setTenants(platformData.tenants);
        setTickets(platformData.tickets);

        setCategories(tenantData.categories);
        setProducts(tenantData.products);
        setTables(tenantData.tables);
        setOrders(tenantData.orders);
        setInventory(tenantData.inventory);
        setLedger(tenantData.ledger);
        setShift(tenantData.shift);
        setStaff(tenantData.staff);
        setLastPolledAt(toJalaliTime());
      } catch {
        // Fallback to local state if offline
      }
    },
    []
  );

  useEffect(() => {
    void syncTenantFromApi(activeTenantId, activeStaffRole);
  }, [activeTenantId, activeStaffRole, syncTenantFromApi]);

  // Real HTTP Short Polling Handler (GET /api/v1/tenant/orders/poll)
  const handlePollOrders = useCallback(async () => {
    try {
      const res = await cafeGolApi.pollTenantOrders(activeTenantId, activeStaffRole);
      setOrders(res.orders);
      setLastPolledAt(res.polledAt);
    } catch {
      // Ignore transient network errors during short polling
    }
  }, [activeTenantId, activeStaffRole]);

  const activeTenant =
    tenants.find((t) => t.id === activeTenantId) || tenants[0];

  // ===== CART & ORDER HANDLERS =====
  const handleAddToCart = (newItem: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      const addonKey = newItem.selectedAddons
        .map((a) => a.id)
        .sort()
        .join(',');
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === newItem.product.id &&
          item.selectedSize.id === newItem.selectedSize.id &&
          item.sweetness === newItem.sweetness &&
          item.selectedAddons
            .map((a) => a.id)
            .sort()
            .join(',') === addonKey
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          ...newItem,
          id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        },
      ];
    });
  };

  const handleUpdateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleSubmitOrder = (payload: {
    customerName: string;
    customerPhone: string;
    dineType: 'dine_in' | 'takeaway';
    tableNumber?: string;
    paymentMethod: 'card_to_card' | 'online_gateway';
    cardLastFour?: string;
    receiptImageUrl?: string;
    notes?: string;
  }): Order => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const discountAmount = subtotal >= 250000 ? activeTenant.loyaltyDiscountAmount : 0;
    const taxAmount = Math.round(
      ((subtotal - discountAmount) * activeTenant.taxPercentage) / 100
    );
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
    const nowTime = toJalaliTime();
    const orderNum = 896 + orders.length;

    const newOrder: Order = {
      id: `ord_gl${orderNum}`,
      code: `GL-${toPersianNum(orderNum)}`,
      tenantId: activeTenant.id,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      dineType: payload.dineType,
      tableNumber: payload.tableNumber,
      items: cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        details: [
          c.selectedSize.name,
          ...c.selectedAddons.map((a) => a.name),
          `شیرینی: ${c.sweetness}`,
        ].join(' • '),
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        icon: c.product.categoryId === 'cat_bakery' ? 'bakery_dining' : 'coffee',
      })),
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      cardLastFour: payload.cardLastFour,
      receiptImageUrl: payload.receiptImageUrl,
      receiptVerified: payload.paymentMethod === 'online_gateway',
      status:
        payload.paymentMethod === 'online_gateway'
          ? 'payment_verified'
          : 'pending_payment',
      createdAt: nowTime,
      estimatedMinutes: 14,
      notes: payload.notes,
      history: [
        {
          status:
            payload.paymentMethod === 'online_gateway'
              ? 'payment_verified'
              : 'pending_payment',
          time: nowTime,
          note:
            payload.paymentMethod === 'online_gateway'
              ? 'پرداخت آنلاین با موفقیت انجام و تأیید شد.'
              : 'سفارش ثبت شد و تصویر فیش کارت‌به‌کارت در انتظار تأیید صندوق است.',
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrderId(newOrder.id);

    // Persist order & trigger BOM inventory deduction on backend API (POST /api/v1/tenant/orders)
    void cafeGolApi
      .createOrder(activeTenant.id, newOrder, activeStaffRole)
      .then((res) => {
        setInventory(res.inventory);
        setLedger(res.ledger);
        if (res.shift) setShift(res.shift);
      })
      .catch(() => {});

    return newOrder;
  };

  // ===== OWNER PANEL HANDLERS (CONNECTED TO /api/v1/tenant/*) =====
  const handleUpdateTenant = (updated: Partial<TenantCafe>) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === activeTenant.id ? { ...t, ...updated } : t))
    );
    void cafeGolApi
      .updateTenantSettings(activeTenant.id, updated, activeStaffRole)
      .catch(() => {});
  };

  const handleAddProduct = (prod: Product) => {
    setProducts((prev) => [prod, ...prev]);
    void cafeGolApi
      .createProduct(activeTenant.id, prod, activeStaffRole)
      .catch(() => {});
  };

  const handleUpdateProduct = (productId: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updated } : p))
    );
    void cafeGolApi
      .updateProduct(activeTenant.id, productId, updated, activeStaffRole)
      .catch(() => {});
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    void cafeGolApi
      .deleteProduct(activeTenant.id, productId, activeStaffRole)
      .catch(() => {});
  };

  const handleBulkPriceAdjustment = (percentage: number) => {
    const factor = 1 + percentage / 100;
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        basePrice: Math.round((p.basePrice * factor) / 1000) * 1000,
      }))
    );
    void cafeGolApi
      .bulkAdjustPrice(activeTenant.id, percentage, activeStaffRole)
      .then((res) => setProducts(res.products))
      .catch(() => {});
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const nowTime = toJalaliTime();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              history: [
                ...o.history,
                {
                  status: newStatus,
                  time: nowTime,
                  note: `تغییر وضعیت به «${ORDER_STATUS_LABELS[newStatus]}» توسط پرسنل کافه`,
                },
              ],
            }
          : o
      )
    );
    void cafeGolApi
      .updateOrderStatus(activeTenant.id, orderId, newStatus, activeStaffRole)
      .catch(() => {});
  };

  const handleApproveReceipt = (orderId: string, approved: boolean) => {
    const nowTime = toJalaliTime();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              receiptVerified: approved,
              status: approved ? 'payment_verified' : 'cancelled',
              history: [
                ...o.history,
                {
                  status: approved ? 'payment_verified' : 'cancelled',
                  time: nowTime,
                  note: approved
                    ? 'رسید کارت‌به‌کارت توسط صندوق‌دار تأیید شد.'
                    : 'رسید کارت‌به‌کارت نامعتبر تشخیص داده شد و سفارش لغو گردید.',
                },
              ],
            }
          : o
      )
    );
    void cafeGolApi
      .verifyReceipt(activeTenant.id, orderId, approved, activeStaffRole)
      .then((res) => {
        setLedger(res.ledger);
        if (res.shift) setShift(res.shift);
      })
      .catch(() => {});
  };

  const handleCreatePosOrder = (posOrder: Order) => {
    setOrders((prev) => [posOrder, ...prev]);
    void cafeGolApi
      .createOrder(activeTenant.id, posOrder, activeStaffRole)
      .then((res) => {
        setInventory(res.inventory);
        setLedger(res.ledger);
        if (res.shift) setShift(res.shift);
      })
      .catch(() => {});
  };

  const handleAddLedgerEntry = (entry: LedgerEntry) => {
    setLedger((prev) => [entry, ...prev]);
    void cafeGolApi
      .addLedgerEntry(activeTenant.id, entry, activeStaffRole)
      .then((res) => {
        if (res.shift) setShift(res.shift);
      })
      .catch(() => {});
  };

  const handleUpdateShift = (updated: Partial<CashRegisterShift>) => {
    setShift((prev) => ({ ...prev, ...updated }));
    void cafeGolApi
      .updateShift(activeTenant.id, updated, activeStaffRole)
      .then((res) => setShift(res.shift))
      .catch(() => {});
  };

  const handleUpdateInventoryItem = (itemId: string, deltaStock: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              currentStock: Math.max(0, item.currentStock + deltaStock),
              lastUpdated: toJalaliDate(),
            }
          : item
      )
    );
    void cafeGolApi
      .adjustInventory(activeTenant.id, itemId, deltaStock, activeStaffRole)
      .then((res) => setInventory(res.inventory))
      .catch(() => {});
  };

  const handleAddStaff = (member: StaffMember) => {
    setStaff((prev) => [...prev, member]);
    void cafeGolApi
      .addStaff(activeTenant.id, member, activeStaffRole)
      .then((res) => setStaff(res.staff))
      .catch(() => {});
  };

  // ===== SUPER ADMIN HANDLERS =====
  const handleUpdateTenantStatus = (
    tenantId: string,
    status: TenantCafe['status']
  ) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status } : t))
    );
    void cafeGolApi
      .updateTenantStatus(tenantId, status)
      .then((res) => setTenants(res.tenants))
      .catch(() => {});
  };

  const handleImpersonateTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setRoleView('owner');
  };

  const handleReplyTicket = (ticketId: string, replyText: string) => {
    const nowTime = toJalaliTime();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'answered',
              messages: [
                ...t.messages,
                {
                  sender: 'superadmin',
                  senderName: 'پشتیبانی فنی پلتفرم کافه گل',
                  text: replyText,
                  time: nowTime,
                },
              ],
            }
          : t
      )
    );
    void cafeGolApi
      .replyTicket(ticketId, replyText)
      .then((res) => setTickets(res.tickets))
      .catch(() => {});
  };

  const handleRegisterNewCafe = (newCafe: TenantCafe) => {
    setTenants((prev) => [...prev, newCafe]);
    setActiveTenantId(newCafe.id);
    setRoleView('owner');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-on-surface font-sans">
      {/* Top SaaS Platform Role & Environment Bar */}
      <div className="sticky top-0 z-[70] bg-surface-container-highest/95 backdrop-blur-md border-b border-outline-variant/40 px-3 py-1.5 text-[11px]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Role Switcher Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-on-surface-variant font-bold ml-1 hidden sm:inline">
              بخش‌های سامانه کافه گل:
            </span>
            {[
              {
                id: 'customer',
                label: 'منوی دیجیتال مشتری (Stitch UI)',
                icon: 'restaurant_menu',
              },
              {
                id: 'owner',
                label: 'پنل مدیریت کافه و POS',
                icon: 'storefront',
                badge: orders.filter(
                  (o) => o.tenantId === activeTenant.id && o.status === 'pending_payment'
                ).length,
              },
              {
                id: 'superadmin',
                label: 'پنل سوپرادمین SaaS',
                icon: 'admin_panel_settings',
              },
              {
                id: 'marketing',
                label: 'سایت، ثبت‌نام و OTP بله/تلگرام',
                icon: 'rocket_launch',
              },
              {
                id: 'installer',
                label: 'نصب‌کننده (/install) و کدهای Laravel 11',
                icon: 'terminal',
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoleView(item.id as PlatformRoleView)}
                className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all whitespace-nowrap shrink-0 ${
                  roleView === item.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-lowest/70 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-error text-on-error text-[10px]">
                    {toPersianNum(item.badge)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Right Controls: Active Tenant Switcher + PWA Install + Dark/Light Toggle */}
          <div className="flex items-center gap-2 mr-auto">
            <div className="hidden md:flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-full border border-outline-variant/30">
              <span className="text-[10px] text-outline">کافه فعال (Tenant):</span>
              <select
                value={activeTenantId}
                onChange={(e) => setActiveTenantId(e.target.value)}
                className="bg-transparent text-primary font-bold text-[11px] focus:outline-none cursor-pointer"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-surface text-on-surface">
                    {t.name} (/c/{t.slug})
                  </option>
                ))}
              </select>
            </div>

            <PWAInstallBanner />

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-on-surface hover:border-primary transition-all text-[11px] font-semibold"
              title="تغییر حالت روشن / تاریک"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline">
                {isDark ? 'تم روشن گیاهی' : 'تم تاریک گیاهی'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      {roleView === 'customer' && (
        <div className="py-0 sm:py-6 px-0 sm:px-4 flex flex-col items-center">
          <CustomerApp
            tenant={activeTenant}
            categories={categories}
            products={products}
            tables={tables}
            cart={cart}
            orders={orders}
            activeOrderId={activeOrderId}
            isDark={isDark}
            onToggleTheme={() => setIsDark((prev) => !prev)}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveFromCart={handleRemoveFromCart}
            onSubmitOrder={handleSubmitOrder}
            onSelectOrderForTracking={(orderId) => setActiveOrderId(orderId)}
          />
        </div>
      )}

      {roleView === 'owner' && (
        <OwnerPanel
          tenant={activeTenant}
          categories={categories}
          products={products}
          orders={orders}
          inventory={inventory}
          ledger={ledger}
          shift={shift}
          staff={staff}
          tables={tables}
          plans={plans}
          activeStaffRole={activeStaffRole}
          lastPolledAt={lastPolledAt}
          onChangeStaffRole={setActiveStaffRole}
          onPollOrders={handlePollOrders}
          onUpdateTenant={handleUpdateTenant}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onBulkPriceAdjustment={handleBulkPriceAdjustment}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onApproveReceipt={handleApproveReceipt}
          onCreatePosOrder={handleCreatePosOrder}
          onAddLedgerEntry={handleAddLedgerEntry}
          onUpdateShift={handleUpdateShift}
          onUpdateInventoryItem={handleUpdateInventoryItem}
          onAddStaff={handleAddStaff}
          onPreviewCustomerMenu={() => setRoleView('customer')}
        />
      )}

      {roleView === 'superadmin' && (
        <SuperAdminPanel
          tenants={tenants}
          plans={plans}
          tickets={tickets}
          onUpdateTenantStatus={handleUpdateTenantStatus}
          onImpersonateTenant={handleImpersonateTenant}
          onReplyTicket={handleReplyTicket}
        />
      )}

      {roleView === 'marketing' && (
        <MarketingAndOnboarding
          plans={plans}
          onRegisterNewCafe={handleRegisterNewCafe}
          onOpenDemoCafe={() => setRoleView('customer')}
          onOpenOwnerPanel={() => setRoleView('owner')}
        />
      )}

      {roleView === 'installer' && <InstallerAndArchitecture />}
    </div>
  );
}
