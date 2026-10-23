// ===== REST API CLIENT FOR CAFE GOL (CALLING /api/v1/*) =====
import {
  TenantCafe,
  Category,
  Product,
  CafeTable,
  Order,
  OrderStatus,
  InventoryItem,
  LedgerEntry,
  CashRegisterShift,
  StaffMember,
  SaaSPlan,
  SupportTicket,
} from '../types';

export interface TenantBootstrapResponse {
  tenant: TenantCafe;
  categories: Category[];
  products: Product[];
  tables: CafeTable[];
  orders: Order[];
  inventory: InventoryItem[];
  ledger: LedgerEntry[];
  shift: CashRegisterShift;
  staff: StaffMember[];
}

export interface PlatformOverviewResponse {
  plans: SaaSPlan[];
  tenants: TenantCafe[];
  tickets: SupportTicket[];
  botConfig: {
    baleBotToken: string;
    telegramBotToken: string;
    telegramProxyUrl: string;
    lastWebhookSync: string;
  };
  cronLogs: { id: string; command: string; executedAt: string; summary: string }[];
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  tenantId = 'tenant_cafegol',
  staffRole = 'owner'
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    'X-Staff-Role': staffRole,
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `خطای ارتباط با سرور (${response.status})`);
  }
  return data as T;
}

export const cafeGolApi = {
  // Platform & SuperAdmin
  getPlatformOverview: () =>
    apiRequest<PlatformOverviewResponse>('/api/v1/platform/overview'),

  registerTenant: (payload: Partial<TenantCafe>) =>
    apiRequest<{ tenant: TenantCafe }>('/api/v1/tenants/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTenantStatus: (tenantId: string, status: TenantCafe['status']) =>
    apiRequest<{ tenants: TenantCafe[] }>(`/api/v1/superadmin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  replyTicket: (ticketId: string, replyText: string) =>
    apiRequest<{ tickets: SupportTicket[] }>(`/api/v1/superadmin/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ replyText }),
    }),

  runCronSchedule: () =>
    apiRequest<{
      ok: boolean;
      log: { id: string; command: string; executedAt: string; summary: string };
      cronLogs: { id: string; command: string; executedAt: string; summary: string }[];
      tenants: TenantCafe[];
    }>('/api/v1/cron/schedule-run', { method: 'POST' }),

  // Multi-Driver OTP Auth (Email, Bale Bot, Telegram Bot)
  sendOtp: (identifier: string, channel: 'email' | 'bale' | 'telegram') =>
    apiRequest<{
      status: string;
      channel: string;
      identifier: string;
      expiresInSeconds: number;
      maxAttempts: number;
      botSessionToken: string;
      botDeepLink: string | null;
      demoOtpCode: string;
    }>('/api/v1/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ identifier, channel }),
    }),

  verifyOtp: (identifier: string, channel: 'email' | 'bale' | 'telegram', code: string) =>
    apiRequest<{ status: string; token: string; verifiedAt: string }>(
      '/api/v1/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, channel, code }),
      }
    ),

  triggerBotWebhook: (provider: 'bale' | 'telegram', botSessionToken: string, phone: string) =>
    apiRequest<{ ok: boolean; provider: string; confirmedPhone: string; message: string }>(
      `/api/v1/webhooks/${provider}`,
      {
        method: 'POST',
        body: JSON.stringify({ botSessionToken, phone }),
      }
    ),

  // Tenant-Isolated Endpoints
  getTenantBootstrap: (tenantId: string, staffRole = 'owner') =>
    apiRequest<TenantBootstrapResponse>('/api/v1/tenant/bootstrap', {}, tenantId, staffRole),

  pollTenantOrders: (tenantId: string, staffRole = 'owner') =>
    apiRequest<{
      tenantId: string;
      polledAt: string;
      pendingCount: number;
      orders: Order[];
    }>('/api/v1/tenant/orders/poll', {}, tenantId, staffRole),

  updateTenantSettings: (tenantId: string, updated: Partial<TenantCafe>, staffRole = 'owner') =>
    apiRequest<{ tenant: TenantCafe }>(
      '/api/v1/tenant/settings',
      { method: 'PATCH', body: JSON.stringify(updated) },
      tenantId,
      staffRole
    ),

  createProduct: (tenantId: string, prod: Product, staffRole = 'owner') =>
    apiRequest<{ product: Product }>(
      '/api/v1/tenant/products',
      { method: 'POST', body: JSON.stringify(prod) },
      tenantId,
      staffRole
    ),

  updateProduct: (
    tenantId: string,
    productId: string,
    updated: Partial<Product>,
    staffRole = 'owner'
  ) =>
    apiRequest<{ product: Product }>(
      `/api/v1/tenant/products/${productId}`,
      { method: 'PATCH', body: JSON.stringify(updated) },
      tenantId,
      staffRole
    ),

  deleteProduct: (tenantId: string, productId: string, staffRole = 'owner') =>
    apiRequest<{ deleted: boolean }>(
      `/api/v1/tenant/products/${productId}`,
      { method: 'DELETE' },
      tenantId,
      staffRole
    ),

  bulkAdjustPrice: (tenantId: string, percentage: number, staffRole = 'owner') =>
    apiRequest<{ products: Product[] }>(
      '/api/v1/tenant/products/bulk-price',
      { method: 'POST', body: JSON.stringify({ percentage }) },
      tenantId,
      staffRole
    ),

  createOrder: (tenantId: string, order: Order, staffRole = 'owner') =>
    apiRequest<{
      order: Order;
      inventory: InventoryItem[];
      ledger: LedgerEntry[];
      shift: CashRegisterShift;
    }>(
      '/api/v1/tenant/orders',
      { method: 'POST', body: JSON.stringify(order) },
      tenantId,
      staffRole
    ),

  updateOrderStatus: (
    tenantId: string,
    orderId: string,
    status: OrderStatus,
    staffRole = 'owner'
  ) =>
    apiRequest<{ order: Order }>(
      `/api/v1/tenant/orders/${orderId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      tenantId,
      staffRole
    ),

  verifyReceipt: (
    tenantId: string,
    orderId: string,
    approved: boolean,
    staffRole = 'owner'
  ) =>
    apiRequest<{
      order: Order;
      ledger: LedgerEntry[];
      shift: CashRegisterShift;
    }>(
      `/api/v1/tenant/orders/${orderId}/verify-receipt`,
      { method: 'POST', body: JSON.stringify({ approved }) },
      tenantId,
      staffRole
    ),

  addLedgerEntry: (tenantId: string, entry: LedgerEntry, staffRole = 'owner') =>
    apiRequest<{ entry: LedgerEntry; shift: CashRegisterShift }>(
      '/api/v1/tenant/ledger',
      { method: 'POST', body: JSON.stringify(entry) },
      tenantId,
      staffRole
    ),

  updateShift: (
    tenantId: string,
    updated: Partial<CashRegisterShift>,
    staffRole = 'owner'
  ) =>
    apiRequest<{ shift: CashRegisterShift }>(
      '/api/v1/tenant/shift',
      { method: 'PATCH', body: JSON.stringify(updated) },
      tenantId,
      staffRole
    ),

  adjustInventory: (
    tenantId: string,
    itemId: string,
    deltaStock: number,
    staffRole = 'owner'
  ) =>
    apiRequest<{ inventory: InventoryItem[] }>(
      `/api/v1/tenant/inventory/${itemId}`,
      { method: 'PATCH', body: JSON.stringify({ deltaStock }) },
      tenantId,
      staffRole
    ),

  addStaff: (tenantId: string, member: StaffMember, staffRole = 'owner') =>
    apiRequest<{ staff: StaffMember[] }>(
      '/api/v1/tenant/staff',
      { method: 'POST', body: JSON.stringify(member) },
      tenantId,
      staffRole
    ),
};
