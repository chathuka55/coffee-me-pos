export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  image?: string;
  sku: string;
  description?: string;
}

export interface CartItem extends Item {
  quantity: number;
}

export interface Table {
  id: string;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  serviceCharge: number;
  discount: number;
  total: number;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  paymentMethod: 'cash' | 'card' | 'online';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  staffName?: string;
  customerName?: string;
  customerPhone?: string;
  tableId?: string;
  tableNumber?: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  serviceChargePercent: number;
  taxPercent: number;
  logo?: string;
  currencyCode?: string;
  currencyLocale?: string;
  currencySymbol?: string;
}
