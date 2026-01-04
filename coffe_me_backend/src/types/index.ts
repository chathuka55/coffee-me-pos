export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  sku: string;
  description?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
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

export interface ShopSettings {
  id?: string;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  serviceChargePercent: number;
  taxPercent: number;
  currencyCode?: string;
  currencyLocale?: string;
  currencySymbol?: string;
  logo?: string;
}
