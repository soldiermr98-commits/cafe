// ===== IMPORTS & DEPENDENCIES =====
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
} from './src/mockData.ts';
import {
  TenantCafe,
  Category,
  Product,
  CafeTable,
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  InventoryItem,
  LedgerEntry,
  CashRegisterShift,
  StaffMember,
  SaaSPlan,
  SupportTicket,
} from './src/types.ts';
import { toPersianNum, toJalaliDate, toJalaliTime } from './src/utils/persian.ts';

// ===== PERSISTENT DATABASE SCHEMA (MIRRORING MYSQL / LARAVEL 11 TABLES) =====
interface OtpChallengeRecord {
  id: string;
  identifier: string;
  channel: 'email' | 'bale' | 'telegram';
  codeHash: string;
  rawCodeForDemo: string;
  botSessionToken: string;
  attempts: number;
  maxAttempts: number;
  ipAddress: string;
  expiresAt: number;
  verifiedAt: number | null;
  createdAt: number;
}

interface DatabaseSchema {
  plans: SaaSPlan[];
  tenants: TenantCafe[];
  categories: Category[];
  products: Product[];
  tables: CafeTable[];
  orders: Order[];
  inventory: InventoryItem[];
  ledger: LedgerEntry[];
  shifts: CashRegisterShift[];
  staff: StaffMember[];
  tickets: SupportTicket[];
  otpChallenges: OtpChallengeRecord[];
  botConfig: {
    baleBotToken: string;
    telegramBotToken: string;
    telegramProxyUrl: string;
    lastWebhookSync: string;
  };
  cronLogs: { id: string; command: string; executedAt: string; summary: string }[];
}

const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
const DB_FILE_PATH = path.join(STORAGE_DIR, 'cafegol_database.json');

function hashCode(raw: string): string {
  return crypto.createHash('sha256').update(`cafegol_salt_${raw}`).digest('hex');
}

function createInitialMultiTenantDatabase(): DatabaseSchema {
  // Seed isolated data for secondary tenants too so Tenant Isolation is verifiable immediately
  const roasteryProducts: Product[] = [
    {
      id: 'prod_roast_v60',
      tenantId: 'tenant_roastery',
      categoryId: 'cat_brew',
      name: 'دم‌آوری تخصصی V60 اتیوپی یرگاشف',
      subtitle: 'رست مدیوم-لایت موج سوم',
      description: 'نت‌های یاسمن، ترنج و هلو سفید با دم‌آوری دستی V60.',
      basePrice: 118000,
      costPrice: 36000,
      image: '/assets/aistudio/Image_6.jpg',
      badge: 'تک‌خاستگاه',
      isFeatured: true,
      isBestseller: true,
      isAvailable: true,
      stockCount: 40,
      sizes: [
        { id: 'sz_v60_std', name: 'کاراف ۲۵۰ میلی‌لیتر', subtitle: 'سرو با لیوان دوجداره', priceDelta: 0, isDefault: true },
      ],
      addons: [],
      recipe: [{ inventoryItemId: 'inv_roast_ethiopia', amount: 20 }],
    },
    {
      id: 'prod_roast_chemex',
      tenantId: 'tenant_roastery',
      categoryId: 'cat_brew',
      name: 'کمکس دو نفره کلمبیا اوئیلا',
      subtitle: 'عصاره‌گیری شفاف',
      description: 'اسیدیته متوازن سیب سبز و کارامل با فیلتر کاغذی ضخیم کمکس.',
      basePrice: 175000,
      costPrice: 54000,
      image: '/assets/aistudio/Image_5.jpg',
      isFeatured: false,
      isBestseller: true,
      isAvailable: true,
      stockCount: 25,
      sizes: [
        { id: 'sz_chx_2', name: 'کمکس ۴۰۰ میلی‌لیتر', subtitle: 'مناسب ۲ نفر', priceDelta: 0, isDefault: true },
      ],
      addons: [],
      recipe: [{ inventoryItemId: 'inv_roast_ethiopia', amount: 30 }],
    },
  ];

  const baghProducts: Product[] = [
    {
      id: 'prod_bagh_sourdough',
      tenantId: 'tenant_bagh',
      categoryId: 'cat_bakery',
      name: 'بشقاب خمیرترش چاودار و کره محلی شیراز',
      subtitle: 'تخمیر طبیعی ۳۶ ساعته',
      description: 'نان خمیرترش داغ تنوری همراه با کره محلی، عسل بهارنارنج و گردو.',
      basePrice: 142000,
      costPrice: 45000,
      image: '/assets/aistudio/Image_9.jpg',
      badge: 'پخت روز شیراز',
      isFeatured: true,
      isBestseller: true,
      isAvailable: true,
      stockCount: 30,
      sizes: [
        { id: 'sz_bagh_1', name: 'پرس کامل صبحانه باغ', subtitle: 'همراه چای بهارنارنج', priceDelta: 0, isDefault: true },
      ],
      addons: [],
      recipe: [],
    },
  ];

  const roasteryCategories: Category[] = [
    { id: 'cat_all', tenantId: 'tenant_roastery', name: 'همه', icon: 'apps', sortOrder: 1 },
    { id: 'cat_brew', tenantId: 'tenant_roastery', name: 'دم‌آوری موج سوم', icon: 'coffee_maker', sortOrder: 2 },
  ];

  const baghCategories: Category[] = [
    { id: 'cat_all', tenantId: 'tenant_bagh', name: 'همه', icon: 'apps', sortOrder: 1 },
    { id: 'cat_bakery', tenantId: 'tenant_bagh', name: 'نان خمیرترش و صبحانه', icon: 'bakery_dining', sortOrder: 2 },
  ];

  const roasteryInventory: InventoryItem[] = [
    {
      id: 'inv_roast_ethiopia',
      tenantId: 'tenant_roastery',
      name: 'دانه سبز برشته‌شده اتیوپی یرگاشف',
      unit: 'گرم',
      currentStock: 6000,
      minThreshold: 1200,
      costPerUnit: 1650,
      lastUpdated: '۱۴۰۵/۰۷/۳۰',
    },
  ];

  const roasteryShift: CashRegisterShift = {
    id: 'shift_roastery_1',
    tenantId: 'tenant_roastery',
    openedAt: '۰۷:۳۰ صبح - ۱۴۰۵/۰۷/۳۰',
    openingBalance: 1500000,
    cashSales: 420000,
    cardToCardSales: 2150000,
    posReaderSales: 3890000,
    expensesOut: 0,
    expectedCash: 1920000,
    status: 'open',
    cashierName: 'آرمان هدایت (رستری نیلوفر آبی)',
  };

  const baghShift: CashRegisterShift = {
    id: 'shift_bagh_1',
    tenantId: 'tenant_bagh',
    openedAt: '۰۸:۰۰ صبح - ۱۴۰۵/۰۷/۳۰',
    openingBalance: 2000000,
    cashSales: 650000,
    cardToCardSales: 1800000,
    posReaderSales: 2400000,
    expensesOut: 300000,
    expectedCash: 2350000,
    status: 'open',
    cashierName: 'سارا فرهادی (کافه باغ آوانو)',
  };

  return {
    plans: INITIAL_PLANS,
    tenants: INITIAL_TENANTS,
    categories: [...INITIAL_CATEGORIES, ...roasteryCategories, ...baghCategories],
    products: [...INITIAL_PRODUCTS, ...roasteryProducts, ...baghProducts],
    tables: [
      ...INITIAL_TABLES,
      { id: 'tbl_r1', tenantId: 'tenant_roastery', number: '۱', name: 'میز بار دمی ۱', zone: 'اسلو بار', capacity: 2 },
      { id: 'tbl_b1', tenantId: 'tenant_bagh', number: '۱', name: 'تخت چوبی زیر نارنج', zone: 'حیاط شیراز', capacity: 4 },
    ],
    orders: INITIAL_ORDERS,
    inventory: [...INITIAL_INVENTORY, ...roasteryInventory],
    ledger: INITIAL_LEDGER,
    shifts: [INITIAL_SHIFT, roasteryShift, baghShift],
    staff: INITIAL_STAFF,
    tickets: INITIAL_TICKETS,
    otpChallenges: [],
    botConfig: {
      baleBotToken: '1948271042:AAH9xK8mPqL2vR5nTzW0cJ4bY7gF1dM3sE',
      telegramBotToken: '7102938475:AAHkL9pQ2wR4xT6yU8iO0pA3sD5fG7hJ9k',
      telegramProxyUrl: 'https://tg-relay.cafegol-worker.workers.dev/bot',
      lastWebhookSync: '۱۴۰۵/۰۷/۳۰ - ۱۰:۱۵',
    },
    cronLogs: [
      {
        id: 'cron_init_1',
        command: 'php artisan schedule:run (queue:work --stop-when-empty + check-subscriptions)',
        executedAt: '۱۴۰۵/۰۷/۳۰ - ۱۰:۲۰',
        summary: '۳ صف اعلان پردازش شد • وضعیت اشتراک ۳ کافه بررسی گردید.',
      },
    ],
  };
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initial = createInitialMultiTenantDatabase();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    const initial = createInitialMultiTenantDatabase();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDb(db: DatabaseSchema): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ===== TENANT RESOLUTION & RBAC MIDDLEWARE =====
interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: TenantCafe;
  staffRole?: 'owner' | 'manager' | 'cashier' | 'kitchen';
}

const ROLE_SCOPES: Record<string, string[]> = {
  owner: ['*'],
  manager: ['dashboard', 'orders', 'pos', 'products', 'inventory'],
  cashier: ['dashboard', 'orders', 'pos', 'receipt_approval', 'shift'],
  kitchen: ['orders', 'stock_toggle'],
};

function resolveTenantMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  const db = loadDb();
  const headerTenantId = req.header('X-Tenant-Id') || (req.query.tenant_id as string | undefined);
  const headerTenantSlug = req.header('X-Tenant-Slug') || (req.query.slug as string | undefined);

  let tenant = db.tenants.find((t) =>
    headerTenantId ? t.id === headerTenantId : headerTenantSlug ? t.slug === headerTenantSlug : false
  );

  if (!tenant) {
    tenant = db.tenants[0];
  }

  req.tenantId = tenant.id;
  req.tenant = tenant;
  req.staffRole = (req.header('X-Staff-Role') as TenantRequest['staffRole']) || 'owner';
  next();
}

function requireScope(scope: string) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const role = req.staffRole || 'owner';
    const allowed = ROLE_SCOPES[role] || [];
    if (!allowed.includes('*') && !allowed.includes(scope)) {
      res.status(403).json({
        error: 'FORBIDDEN_ROLE_SCOPE',
        message: `نقش کاربری شما (${role}) مجوز انجام عملیات در بخش «${scope}» را ندارد.`,
      });
      return;
    }
    next();
  };
}

// ===== AUTOMATIC BOM INVENTORY DEDUCTION HELPER =====
function deductBomInventory(
  db: DatabaseSchema,
  tenantId: string,
  orderItems: { productId: string; quantity: number }[]
) {
  const tenantProducts = db.products.filter((p) => p.tenantId === tenantId);
  db.inventory = db.inventory.map((inv) => {
    if (inv.tenantId !== tenantId) return inv;
    let deductAmount = 0;
    for (const item of orderItems) {
      const prod = tenantProducts.find((p) => p.id === item.productId);
      if (prod && prod.recipe) {
        const line = prod.recipe.find((r) => r.inventoryItemId === inv.id);
        if (line) {
          deductAmount += line.amount * item.quantity;
        }
      }
    }
    if (deductAmount > 0) {
      return {
        ...inv,
        currentStock: Math.max(0, inv.currentStock - deductAmount),
        lastUpdated: toJalaliDate(),
      };
    }
    return inv;
  });
}

// ===== INITIALIZE EXPRESS + VITE SERVER =====
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // ---------------------------------------------------------------------------
  // PHASE 1: PUBLIC AUTH & MULTI-DRIVER OTP (Email, Bale Bot, Telegram Bot)
  // ---------------------------------------------------------------------------
  app.post('/api/v1/auth/otp/send', (req: Request, res: Response) => {
    const { identifier, channel } = req.body as {
      identifier?: string;
      channel?: 'email' | 'bale' | 'telegram';
    };

    if (!identifier || !channel || !['email', 'bale', 'telegram'].includes(channel)) {
      res.status(422).json({ message: 'شناسه کاربری و کانال ارسال OTP (ایمیل، بله یا تلگرام) الزامی است.' });
      return;
    }

    const db = loadDb();
    const now = Date.now();

    // Rate limiting: max 5 challenges per identifier in 2 minutes
    const recentChallenges = db.otpChallenges.filter(
      (c) => c.identifier === identifier && now - c.createdAt < 120_000
    );
    if (recentChallenges.length >= 5) {
      res.status(429).json({
        message: 'تعداد درخواست‌های کد تأیید بیش از حد مجاز است. لطفاً ۲ دقیقه صبر کنید.',
      });
      return;
    }

    const rawCode = String(Math.floor(100000 + Math.random() * 900000));
    const botSessionToken = crypto.randomBytes(16).toString('hex');

    const record: OtpChallengeRecord = {
      id: `otp_${now}`,
      identifier,
      channel,
      codeHash: hashCode(rawCode),
      rawCodeForDemo: rawCode,
      botSessionToken,
      attempts: 0,
      maxAttempts: 5,
      ipAddress: req.ip || '127.0.0.1',
      expiresAt: now + 120_000, // 2 minutes TTL
      verifiedAt: null,
      createdAt: now,
    };

    db.otpChallenges.push(record);
    saveDb(db);

    res.json({
      status: 'sent',
      channel,
      identifier,
      expiresInSeconds: 120,
      maxAttempts: 5,
      botSessionToken,
      botDeepLink:
        channel === 'bale'
          ? `https://ble.ir/CafeGolOtpBot?start=${botSessionToken}`
          : channel === 'telegram'
          ? `https://t.me/CafeGolOtpBot?start=${botSessionToken}`
          : null,
      demoOtpCode: rawCode,
    });
  });

  app.post('/api/v1/auth/otp/verify', (req: Request, res: Response) => {
    const { identifier, channel, code } = req.body as {
      identifier?: string;
      channel?: 'email' | 'bale' | 'telegram';
      code?: string;
    };

    if (!identifier || !channel || !code) {
      res.status(422).json({ message: 'اطلاعات کد تأیید ناقص است.' });
      return;
    }

    // Normalize Persian/Arabic digits to English before hashing
    const normalizedCode = code
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .trim();

    const db = loadDb();
    const now = Date.now();

    const challenge = [...db.otpChallenges]
      .reverse()
      .find(
        (c) =>
          c.identifier === identifier &&
          c.channel === channel &&
          c.verifiedAt === null
      );

    if (!challenge) {
      res.status(422).json({ message: 'درخواست فعالی برای این شناسه یافت نشد. مجدداً کد دریافت کنید.' });
      return;
    }

    if (now > challenge.expiresAt) {
      res.status(422).json({ message: 'کد یک‌بارمصرف منقضی شده است (مهلت ۲ دقیقه به پایان رسید).' });
      return;
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      res.status(429).json({ message: 'تعداد تلاش‌های ناموفق به سقف ۵ بار رسید. کد قفل شد.' });
      return;
    }

    challenge.attempts += 1;

    if (challenge.codeHash !== hashCode(normalizedCode)) {
      saveDb(db);
      res.status(422).json({
        message: `کد وارد شده صحیح نیست. (${toPersianNum(challenge.maxAttempts - challenge.attempts)} تلاش باقی‌مانده)`,
      });
      return;
    }

    challenge.verifiedAt = now;
    saveDb(db);

    res.json({
      status: 'authenticated',
      token: `cg_tok_${crypto.randomBytes(16).toString('hex')}`,
      verifiedAt: new Date(now).toISOString(),
    });
  });

  // Bale & Telegram Bot Webhook Simulation Endpoint (Plain HTTP POST, no long-polling)
  app.post('/api/v1/webhooks/:provider', (req: Request, res: Response) => {
    const provider = req.params.provider === 'telegram' ? 'telegram' : 'bale';
    const { botSessionToken, phone } = req.body as { botSessionToken?: string; phone?: string };
    const db = loadDb();
    const challenge = db.otpChallenges.find((c) => c.botSessionToken === botSessionToken);
    if (challenge) {
      challenge.verifiedAt = Date.now();
      saveDb(db);
    }
    res.json({
      ok: true,
      provider,
      confirmedPhone: phone || '09123456789',
      message: `وب‌هوک ${provider === 'bale' ? 'بازوی بله' : 'ربات تلگرام'} با موفقیت پردازش شد.`,
    });
  });

  // ---------------------------------------------------------------------------
  // PHASE 2: MULTI-TENANT REGISTRATION & PLATFORM BOOTSTRAP
  // ---------------------------------------------------------------------------
  app.get('/api/v1/platform/overview', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({
      plans: db.plans,
      tenants: db.tenants,
      tickets: db.tickets,
      botConfig: db.botConfig,
      cronLogs: db.cronLogs,
    });
  });

  app.post('/api/v1/tenants/register', (req: Request, res: Response) => {
    const payload = req.body as Partial<TenantCafe>;
    const db = loadDb();

    const rawSlug = (payload.slug || `cafe-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const uniqueSlug = db.tenants.some((t) => t.slug === rawSlug)
      ? `${rawSlug}-${Math.floor(100 + Math.random() * 900)}`
      : rawSlug;

    const tenantId = `tenant_${Date.now()}`;
    const newTenant: TenantCafe = {
      id: tenantId,
      slug: uniqueSlug,
      name: payload.name || 'کافه جدید',
      tagline: payload.tagline || 'میزبان لحظات خوش شما با منوی دیجیتال کافه گل',
      welcomeTitle: payload.welcomeTitle || `به ${payload.name || 'کافه ما'} خوش آمدید`,
      welcomeSubtitle: payload.welcomeSubtitle || 'سفارش آنلاین و سریع از سر میز',
      badgeText: payload.badgeText || 'عضو خانواده کافه گل',
      storyQuote:
        payload.storyQuote ||
        `«${payload.name || 'کافه ما'} با عشق به قهوه تازه و میزبانی صمیمانه راه‌اندازی شده است.»`,
      address: payload.address || 'تهران، خیابان ولیعصر',
      phone: payload.phone || '021-22000000',
      instagram: payload.instagram || `@${uniqueSlug}`,
      wifiSsid: payload.wifiSsid || `${uniqueSlug}_WiFi`,
      wifiPass: payload.wifiPass || '12345678',
      weekdayHours: '۸:۰۰ صبح الی ۲۳:۰۰ شب',
      weekendHours: '۹:۰۰ صبح الی ۲۴:۰۰ بامداد',
      isOpen: true,
      primaryColorPalette: payload.primaryColorPalette || 'olive',
      cardNumber: payload.cardNumber || '۶۰۳۷-۹۹۷۵-۰۰۰۰-۰۰۰۰',
      cardHolderName: payload.cardHolderName || payload.ownerName || 'مدیر کافه',
      bankName: payload.bankName || 'بانک ملی ایران',
      shebaNumber: payload.shebaNumber || 'IR000170000000000000000000',
      taxPercentage: 0,
      serviceFeePercentage: 0,
      loyaltyDiscountAmount: 15000,
      planId: 'plan_trial',
      subscriptionEndsAt: '۱۴۰۵/۰۸/۱۵ (۱۴ روز آزمایشی)',
      status: 'trial',
      ownerName: payload.ownerName || 'مدیر کافه',
      ownerPhone: payload.ownerPhone || '09120000000',
      ownerEmail: payload.ownerEmail || `info@${uniqueSlug}.ir`,
      ordersCountThisMonth: 0,
      storageUsedMb: 5,
    };

    // Seed starter categories, starter product, table, shift, and owner staff for the new tenant
    const starterCatId = `cat_${Date.now()}`;
    db.tenants.push(newTenant);
    db.categories.push(
      { id: 'cat_all', tenantId, name: 'همه', icon: 'apps', sortOrder: 1 },
      { id: starterCatId, tenantId, name: 'بار گرم و اسپرسو', icon: 'coffee', sortOrder: 2 }
    );
    db.products.push({
      id: `prod_${Date.now()}`,
      tenantId,
      categoryId: starterCatId,
      name: 'لاته تخصصی سرآشپز',
      subtitle: 'عصاره‌گیری روزانه',
      description: 'دبل شات اسپرسو ۱۰۰٪ عربیکا با فوم شیر مخملی.',
      basePrice: 98000,
      costPrice: 32000,
      image: '/assets/aistudio/Image_1.jpg',
      badge: 'پیشنهاد کافه',
      isFeatured: true,
      isBestseller: true,
      isAvailable: true,
      stockCount: 50,
      sizes: [
        { id: 'sz_1', name: 'متوسط (Double Shot)', subtitle: '۲۴۰ میلی‌لیتر', priceDelta: 0, isDefault: true },
      ],
      addons: [],
      recipe: [],
    });
    db.tables.push({
      id: `tbl_${Date.now()}`,
      tenantId,
      number: '۱',
      name: 'میز شماره ۱ - سالن اصلی',
      zone: 'سالن اصلی',
      capacity: 4,
    });
    db.shifts.push({
      id: `shift_${Date.now()}`,
      tenantId,
      openedAt: `${toJalaliTime()} - ${toJalaliDate()}`,
      openingBalance: 1000000,
      cashSales: 0,
      cardToCardSales: 0,
      posReaderSales: 0,
      expensesOut: 0,
      expectedCash: 1000000,
      status: 'open',
      cashierName: newTenant.ownerName,
    });
    db.staff.push({
      id: `stf_${Date.now()}`,
      tenantId,
      name: newTenant.ownerName,
      role: 'owner',
      roleLabel: 'مالک و مدیر کافه',
      phone: newTenant.ownerPhone,
      active: true,
      permissions: ['همه دسترسی‌ها'],
      lastLogin: 'هم‌اکنون',
    });

    saveDb(db);
    res.status(201).json({ tenant: newTenant });
  });

  // ---------------------------------------------------------------------------
  // TENANT-ISOLATED API ROUTES (Enforced by resolveTenantMiddleware)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/tenant/bootstrap', resolveTenantMiddleware, (req: TenantRequest, res: Response) => {
    const db = loadDb();
    const tenantId = req.tenantId!;
    const tenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];

    const tenantCategories = db.categories
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const tenantProducts = db.products.filter((p) => p.tenantId === tenantId);
    const tenantTables = db.tables.filter((t) => t.tenantId === tenantId);
    const tenantOrders = db.orders.filter((o) => o.tenantId === tenantId);
    const tenantInventory = db.inventory.filter((i) => i.tenantId === tenantId);
    const tenantLedger = db.ledger.filter((l) => l.tenantId === tenantId);
    const tenantShift =
      db.shifts.find((s) => s.tenantId === tenantId) || {
        id: `shift_${tenantId}`,
        tenantId,
        openedAt: '۰۸:۰۰ صبح',
        openingBalance: 1000000,
        cashSales: 0,
        cardToCardSales: 0,
        posReaderSales: 0,
        expensesOut: 0,
        expectedCash: 1000000,
        status: 'open',
        cashierName: tenant.ownerName,
      };
    const tenantStaff = db.staff.filter((s) => s.tenantId === tenantId);

    res.json({
      tenant,
      categories: tenantCategories,
      products: tenantProducts,
      tables: tenantTables,
      orders: tenantOrders,
      inventory: tenantInventory,
      ledger: tenantLedger,
      shift: tenantShift,
      staff: tenantStaff,
    });
  });

  // Short Polling Endpoint for Live Order Board (No WebSockets required)
  app.get('/api/v1/tenant/orders/poll', resolveTenantMiddleware, (req: TenantRequest, res: Response) => {
    const db = loadDb();
    const tenantId = req.tenantId!;
    const tenantOrders = db.orders.filter((o) => o.tenantId === tenantId);
    res.json({
      tenantId,
      polledAt: toJalaliTime(),
      pendingCount: tenantOrders.filter((o) => o.status === 'pending_payment').length,
      orders: tenantOrders,
    });
  });

  // Update Tenant Settings
  app.patch(
    '/api/v1/tenant/settings',
    resolveTenantMiddleware,
    requireScope('owner'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const updates = req.body as Partial<TenantCafe>;
      db.tenants = db.tenants.map((t) => (t.id === tenantId ? { ...t, ...updates, id: tenantId } : t));
      saveDb(db);
      res.json({ tenant: db.tenants.find((t) => t.id === tenantId) });
    }
  );

  // Products CRUD + Bulk Price Edit
  app.post(
    '/api/v1/tenant/products',
    resolveTenantMiddleware,
    requireScope('products'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const prod: Product = {
        ...(req.body as Product),
        id: req.body.id || `prod_${Date.now()}`,
        tenantId,
      };
      db.products = [prod, ...db.products];
      saveDb(db);
      res.status(201).json({ product: prod });
    }
  );

  app.patch(
    '/api/v1/tenant/products/:id',
    resolveTenantMiddleware,
    requireScope('orders'), // Kitchen can also toggle availability
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const productId = req.params.id;
      const updates = req.body as Partial<Product>;

      db.products = db.products.map((p) =>
        p.id === productId && p.tenantId === tenantId ? { ...p, ...updates, tenantId } : p
      );
      saveDb(db);
      res.json({ product: db.products.find((p) => p.id === productId && p.tenantId === tenantId) });
    }
  );

  app.delete(
    '/api/v1/tenant/products/:id',
    resolveTenantMiddleware,
    requireScope('products'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const productId = req.params.id;
      db.products = db.products.filter((p) => !(p.id === productId && p.tenantId === tenantId));
      saveDb(db);
      res.json({ deleted: true });
    }
  );

  app.post(
    '/api/v1/tenant/products/bulk-price',
    resolveTenantMiddleware,
    requireScope('products'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const { percentage } = req.body as { percentage: number };
      const factor = 1 + (Number(percentage) || 0) / 100;

      db.products = db.products.map((p) =>
        p.tenantId === tenantId
          ? { ...p, basePrice: Math.round((p.basePrice * factor) / 1000) * 1000 }
          : p
      );
      saveDb(db);
      res.json({ products: db.products.filter((p) => p.tenantId === tenantId) });
    }
  );

  // Customer Order Submission + Automatic Recipe BOM Inventory Deduction
  app.post('/api/v1/tenant/orders', resolveTenantMiddleware, (req: TenantRequest, res: Response) => {
    const db = loadDb();
    const tenantId = req.tenantId!;
    const tenant = db.tenants.find((t) => t.id === tenantId)!;

    if (tenant.status === 'suspended') {
      res.status(402).json({ message: 'اشتراک این کافه منقضی شده و امکان ثبت سفارش وجود ندارد.' });
      return;
    }

    const orderPayload = req.body as Order;
    const nowTime = toJalaliTime();
    const orderNum = 896 + db.orders.length;

    const newOrder: Order = {
      ...orderPayload,
      id: orderPayload.id || `ord_gl${orderNum}`,
      code: orderPayload.code || `GL-${toPersianNum(orderNum)}`,
      tenantId,
      createdAt: orderPayload.createdAt || nowTime,
    };

    db.orders = [newOrder, ...db.orders];

    // Deduct BOM recipe ingredients from tenant's inventory
    deductBomInventory(
      db,
      tenantId,
      newOrder.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
    );

    // Increment tenant monthly order counter
    db.tenants = db.tenants.map((t) =>
      t.id === tenantId ? { ...t, ordersCountThisMonth: t.ordersCountThisMonth + 1 } : t
    );

    // If POS order or online gateway, record in ledger & shift immediately
    if (newOrder.paymentMethod === 'pos_split' || newOrder.paymentMethod === 'online_gateway') {
      db.ledger = [
        {
          id: `ldg_${Date.now()}`,
          tenantId,
          type: 'income',
          category: newOrder.paymentMethod === 'pos_split' ? 'فروش صندوق POS' : 'فروش آنلاین منو',
          title: `تسویه سفارش #${newOrder.code} (${newOrder.customerName})`,
          amount: newOrder.totalAmount,
          jalaliDate: toJalaliDate(),
          paymentMethod: newOrder.paymentMethod === 'pos_split' ? 'ترکیبی POS' : 'درگاه آنلاین',
          referenceCode: newOrder.code,
        },
        ...db.ledger,
      ];

      db.shifts = db.shifts.map((s) => {
        if (s.tenantId !== tenantId) return s;
        if (newOrder.splitPayment) {
          return {
            ...s,
            cashSales: s.cashSales + newOrder.splitPayment.cashAmount,
            posReaderSales: s.posReaderSales + newOrder.splitPayment.posAmount,
            cardToCardSales: s.cardToCardSales + newOrder.splitPayment.cardToCardAmount,
            expectedCash: s.expectedCash + newOrder.splitPayment.cashAmount,
          };
        }
        return {
          ...s,
          posReaderSales: s.posReaderSales + newOrder.totalAmount,
        };
      });
    }

    saveDb(db);
    res.status(201).json({
      order: newOrder,
      inventory: db.inventory.filter((i) => i.tenantId === tenantId),
      ledger: db.ledger.filter((l) => l.tenantId === tenantId),
      shift: db.shifts.find((s) => s.tenantId === tenantId),
    });
  });

  // Update Order Status
  app.patch(
    '/api/v1/tenant/orders/:id/status',
    resolveTenantMiddleware,
    requireScope('orders'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const orderId = req.params.id;
      const { status } = req.body as { status: OrderStatus };
      const nowTime = toJalaliTime();

      db.orders = db.orders.map((o) =>
        o.id === orderId && o.tenantId === tenantId
          ? {
              ...o,
              status,
              history: [
                ...o.history,
                {
                  status,
                  time: nowTime,
                  note: `تغییر وضعیت به «${ORDER_STATUS_LABELS[status]}» توسط (${req.staffRole})`,
                },
              ],
            }
          : o
      );

      saveDb(db);
      res.json({ order: db.orders.find((o) => o.id === orderId && o.tenantId === tenantId) });
    }
  );

  // Verify or Reject Card-to-Card Receipt
  app.post(
    '/api/v1/tenant/orders/:id/verify-receipt',
    resolveTenantMiddleware,
    requireScope('receipt_approval'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const orderId = req.params.id;
      const { approved } = req.body as { approved: boolean };
      const nowTime = toJalaliTime();

      const targetOrder = db.orders.find((o) => o.id === orderId && o.tenantId === tenantId);
      if (!targetOrder) {
        res.status(404).json({ message: 'سفارش یافت نشد.' });
        return;
      }

      db.orders = db.orders.map((o) =>
        o.id === orderId && o.tenantId === tenantId
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
                    : 'رسید کارت‌به‌کارت رد شد و سفارش لغو گردید.',
                },
              ],
            }
          : o
      );

      if (approved) {
        db.ledger = [
          {
            id: `ldg_${Date.now()}`,
            tenantId,
            type: 'income',
            category: 'فروش روزانه منو',
            title: `تأیید کارت‌به‌کارت سفارش #${targetOrder.code} (${targetOrder.customerName})`,
            amount: targetOrder.totalAmount,
            jalaliDate: toJalaliDate(),
            paymentMethod: 'کارت‌به‌کارت',
            referenceCode: targetOrder.code,
          },
          ...db.ledger,
        ];

        db.shifts = db.shifts.map((s) =>
          s.tenantId === tenantId
            ? { ...s, cardToCardSales: s.cardToCardSales + targetOrder.totalAmount }
            : s
        );
      }

      saveDb(db);
      res.json({
        order: db.orders.find((o) => o.id === orderId && o.tenantId === tenantId),
        ledger: db.ledger.filter((l) => l.tenantId === tenantId),
        shift: db.shifts.find((s) => s.tenantId === tenantId),
      });
    }
  );

  // Accounting Ledger & Cash Register Shift
  app.post(
    '/api/v1/tenant/ledger',
    resolveTenantMiddleware,
    requireScope('owner'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const entry: LedgerEntry = {
        ...(req.body as LedgerEntry),
        id: req.body.id || `ldg_${Date.now()}`,
        tenantId,
      };
      db.ledger = [entry, ...db.ledger];

      if (entry.type === 'expense' && entry.paymentMethod.includes('نقد')) {
        db.shifts = db.shifts.map((s) =>
          s.tenantId === tenantId
            ? {
                ...s,
                expensesOut: s.expensesOut + entry.amount,
                expectedCash: Math.max(0, s.expectedCash - entry.amount),
              }
            : s
        );
      }

      saveDb(db);
      res.status(201).json({
        entry,
        shift: db.shifts.find((s) => s.tenantId === tenantId),
      });
    }
  );

  app.patch(
    '/api/v1/tenant/shift',
    resolveTenantMiddleware,
    requireScope('shift'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const updates = req.body as Partial<CashRegisterShift>;

      db.shifts = db.shifts.map((s) =>
        s.tenantId === tenantId ? { ...s, ...updates, tenantId } : s
      );
      saveDb(db);
      res.json({ shift: db.shifts.find((s) => s.tenantId === tenantId) });
    }
  );

  // Inventory Stock Adjustment
  app.patch(
    '/api/v1/tenant/inventory/:id',
    resolveTenantMiddleware,
    requireScope('inventory'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const itemId = req.params.id;
      const { deltaStock } = req.body as { deltaStock: number };

      db.inventory = db.inventory.map((item) =>
        item.id === itemId && item.tenantId === tenantId
          ? {
              ...item,
              currentStock: Math.max(0, item.currentStock + Number(deltaStock || 0)),
              lastUpdated: toJalaliDate(),
            }
          : item
      );
      saveDb(db);
      res.json({ inventory: db.inventory.filter((i) => i.tenantId === tenantId) });
    }
  );

  // Staff CRUD
  app.post(
    '/api/v1/tenant/staff',
    resolveTenantMiddleware,
    requireScope('owner'),
    (req: TenantRequest, res: Response) => {
      const db = loadDb();
      const tenantId = req.tenantId!;
      const member: StaffMember = {
        ...(req.body as StaffMember),
        id: req.body.id || `stf_${Date.now()}`,
        tenantId,
      };
      db.staff.push(member);
      saveDb(db);
      res.status(201).json({ staff: db.staff.filter((s) => s.tenantId === tenantId) });
    }
  );

  // ---------------------------------------------------------------------------
  // SUPER ADMIN & SHARED HOSTING CRON RUNNER (`php artisan schedule:run`)
  // ---------------------------------------------------------------------------
  app.patch('/api/v1/superadmin/tenants/:id/status', (req: Request, res: Response) => {
    const db = loadDb();
    const tenantId = req.params.id;
    const { status } = req.body as { status: TenantCafe['status'] };
    db.tenants = db.tenants.map((t) => (t.id === tenantId ? { ...t, status } : t));
    saveDb(db);
    res.json({ tenants: db.tenants });
  });

  app.post('/api/v1/superadmin/tickets/:id/reply', (req: Request, res: Response) => {
    const db = loadDb();
    const ticketId = req.params.id;
    const { replyText } = req.body as { replyText: string };
    const nowTime = toJalaliTime();

    db.tickets = db.tickets.map((t) =>
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
    );
    saveDb(db);
    res.json({ tickets: db.tickets });
  });

  app.post('/api/v1/superadmin/bots/config', (req: Request, res: Response) => {
    const db = loadDb();
    db.botConfig = {
      ...db.botConfig,
      ...(req.body as Partial<DatabaseSchema['botConfig']>),
      lastWebhookSync: `${toJalaliDate()} - ${toJalaliTime()}`,
    };
    saveDb(db);
    res.json({ botConfig: db.botConfig });
  });

  // Cron Job Endpoint (Simulates cPanel `* * * * * php artisan schedule:run`)
  app.post('/api/v1/cron/schedule-run', (_req: Request, res: Response) => {
    const db = loadDb();
    const nowTime = `${toJalaliDate()} - ${toJalaliTime()}`;

    // Clean expired OTP challenges
    const beforeOtp = db.otpChallenges.length;
    db.otpChallenges = db.otpChallenges.filter((c) => Date.now() < c.expiresAt || c.verifiedAt !== null);
    const cleanedOtps = beforeOtp - db.otpChallenges.length;

    const logEntry = {
      id: `cron_${Date.now()}`,
      command: 'php artisan schedule:run (queue:work --stop-when-empty + check-subscriptions)',
      executedAt: nowTime,
      summary: `صف دیتابیس پردازش شد • ${toPersianNum(cleanedOtps)} کد OTP منقضی پاکسازی شد • وضعیت اشتراک ${toPersianNum(db.tenants.length)} کافه بررسی گردید.`,
    };
    db.cronLogs = [logEntry, ...db.cronLogs.slice(0, 19)];
    saveDb(db);

    res.json({
      ok: true,
      log: logEntry,
      cronLogs: db.cronLogs,
      tenants: db.tenants,
    });
  });

  // ---------------------------------------------------------------------------
  // VITE MIDDLEWARE (DEVELOPMENT) OR STATIC PUBLIC SERVING (PRODUCTION)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cafe Gol Multi-Tenant API + Frontend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
