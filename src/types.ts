// ===== TYPES & INTERFACES =====

export type AppArea = 'customer' | 'owner' | 'superadmin' | 'marketing' | 'installer' | 'architecture';

export type CustomerScreen = 'home' | 'menu' | 'detail' | 'cart' | 'tracking' | 'about';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_verified'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'در انتظار پرداخت',
  payment_verified: 'پرداخت تأیید شد',
  preparing: 'در حال آماده‌سازی',
  ready: 'آماده تحویل',
  delivered: 'تحویل شد',
  cancelled: 'لغو شده',
};

export interface ProductSize {
  id: string;
  name: string;
  subtitle: string;
  priceDelta: number;
  isDefault?: boolean;
  recommended?: boolean;
}

export interface ProductAddon {
  id: string;
  name: string;
  subtitle: string;
  price: number;
}

export interface RecipeIngredient {
  inventoryItemId: string;
  amount: number; // per unit sold
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  subtitle: string;
  description: string;
  basePrice: number;
  costPrice: number;
  image: string;
  badge?: string;
  badgeType?: 'primary' | 'secondary' | 'tertiary' | 'herb';
  servingNote?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isAvailable: boolean;
  stockCount: number;
  sizes: ProductSize[];
  addons: ProductAddon[];
  recipe: RecipeIngredient[];
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: ProductSize;
  selectedAddons: ProductAddon[];
  sweetness: 'normal' | 'low';
  notes: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  time: string;
  note: string;
}

export interface Order {
  id: string;
  code: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  dineType: 'dine_in' | 'takeaway';
  tableNumber?: string;
  items: {
    productId: string;
    name: string;
    details: string;
    quantity: number;
    unitPrice: number;
    icon: string;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'card_to_card' | 'online_gateway' | 'pos_split' | 'cash';
  receiptImageUrl?: string;
  cardLastFour?: string;
  receiptVerified: boolean;
  status: OrderStatus;
  createdAt: string;
  estimatedMinutes: number;
  notes?: string;
  history: OrderStatusHistoryItem[];
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  unit: 'گرم' | 'میلی‌لیتر' | 'عدد' | 'بسته';
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
  lastUpdated: string;
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  type: 'income' | 'expense';
  category: string;
  title: string;
  amount: number;
  jalaliDate: string;
  paymentMethod: string;
  referenceCode?: string;
}

export interface CashRegisterShift {
  id: string;
  tenantId: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  cashSales: number;
  cardToCardSales: number;
  posReaderSales: number;
  expensesOut: number;
  expectedCash: number;
  actualCash?: number;
  status: 'open' | 'closed';
  cashierName: string;
}

export interface StaffMember {
  id: string;
  tenantId: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'kitchen';
  roleLabel: string;
  phone: string;
  active: boolean;
  permissions: string[];
  lastLogin: string;
}

export interface CafeTable {
  id: string;
  tenantId: string;
  number: string;
  name: string;
  zone: string;
  capacity: number;
}

export interface TenantCafe {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  badgeText: string;
  storyQuote: string;
  address: string;
  phone: string;
  instagram: string;
  wifiSsid: string;
  wifiPass: string;
  weekdayHours: string;
  weekendHours: string;
  isOpen: boolean;
  primaryColorPalette: 'olive' | 'sage' | 'terracotta' | 'forest';
  cardNumber: string;
  cardHolderName: string;
  bankName: string;
  shebaNumber: string;
  taxPercentage: number;
  serviceFeePercentage: number;
  loyaltyDiscountAmount: number;
  planId: string;
  subscriptionEndsAt: string;
  status: 'active' | 'trial' | 'grace_period' | 'suspended';
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  baleChatId?: string;
  telegramChatId?: string;
  ordersCountThisMonth: number;
  storageUsedMb: number;
}

export interface SaaSPlan {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxProducts: number;
  maxStaff: number;
  maxOrdersPerMonth: number;
  storageLimitMb: number;
  features: string[];
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  messages: {
    sender: 'owner' | 'superadmin';
    senderName: string;
    text: string;
    time: string;
  }[];
}
