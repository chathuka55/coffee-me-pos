import { Item, Order, ShopSettings, Table } from '@/types';

const STORAGE_KEYS = {
  ITEMS: 'pos-items',
  ORDERS: 'pos-orders',
  PENDING_ORDERS: 'pos-pending-orders',
  SETTINGS: 'pos-settings',
  TABLES: 'pos-tables',
};

// Sample initial data
export const sampleItems: Item[] = [
  {
    id: '1',
    name: 'Cappuccino',
    category: 'Coffee',
    price: 450,
    costPrice: 150,
    stock: 30,
    sku: 'CAP-001',
    description: 'Classic Italian cappuccino',
  },
  {
    id: '2',
    name: 'Caramel Latte',
    category: 'Coffee',
    price: 550,
    costPrice: 180,
    stock: 20,
    sku: 'LAT-002',
    description: 'Sweet caramel flavored latte',
  },
  {
    id: '3',
    name: 'Iced Mocha',
    category: 'Cold Drinks',
    price: 600,
    costPrice: 200,
    stock: 25,
    sku: 'MOC-003',
    description: 'Refreshing iced chocolate coffee',
  },
  {
    id: '4',
    name: 'Chocolate Donut',
    category: 'Pastries',
    price: 300,
    costPrice: 100,
    stock: 40,
    sku: 'DON-004',
    description: 'Freshly baked chocolate donut',
  },
  {
    id: '5',
    name: 'Chicken Sandwich',
    category: 'Meals',
    price: 850,
    costPrice: 350,
    stock: 15,
    sku: 'SAN-005',
    description: 'Grilled chicken sandwich with fries',
  },
  {
    id: '6',
    name: 'French Fries',
    category: 'Snacks',
    price: 500,
    costPrice: 150,
    stock: 35,
    sku: 'FRI-006',
    description: 'Crispy golden french fries',
  },
  {
    id: '7',
    name: 'Espresso',
    category: 'Coffee',
    price: 350,
    costPrice: 120,
    stock: 50,
    sku: 'ESP-007',
    description: 'Strong Italian espresso',
  },
  {
    id: '8',
    name: 'Croissant',
    category: 'Pastries',
    price: 400,
    costPrice: 120,
    stock: 30,
    sku: 'CRO-008',
    description: 'Buttery flaky croissant',
  },
];

export const defaultSettings: ShopSettings = {
  name: 'Coffee Me',
  address: '123 Coffee Street, Cityville',
  phone: '+1 234 567 8900',
  email: 'hello@coffeeme.com',
  serviceChargePercent: 10,
  taxPercent: 0,
  currencyCode: 'INR',
  currencyLocale: 'en-IN',
  currencySymbol: '₹',
};

export const defaultTables: Table[] = [
  { id: '1', number: 1, seats: 2, status: 'available' },
  { id: '2', number: 2, seats: 2, status: 'available' },
  { id: '3', number: 3, seats: 4, status: 'available' },
  { id: '4', number: 4, seats: 4, status: 'available' },
  { id: '5', number: 5, seats: 6, status: 'available' },
  { id: '6', number: 6, seats: 6, status: 'available' },
  { id: '7', number: 7, seats: 8, status: 'available' },
  { id: '8', number: 8, seats: 4, status: 'available' },
];

// Storage functions
export const storage = {
  getItems: (): Item[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(sampleItems));
      return sampleItems;
    }
    return JSON.parse(data);
  },

  saveItems: (items: Item[]) => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  },

  getOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },

  // Pending orders: used for dine-in orders that are not yet paid
  getPendingOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_ORDERS);
    return data ? JSON.parse(data) : [];
  },

  savePendingOrders: (orders: Order[]) => {
    localStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(orders));
  },

  getPendingOrderById: (id: string): Order | undefined => {
    const orders = storage.getPendingOrders();
    return orders.find((o) => o.id === id);
  },

  addOrUpdatePendingOrder: (order: Order) => {
    const orders = storage.getPendingOrders();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx === -1) {
      orders.unshift(order);
    } else {
      orders[idx] = order;
    }
    storage.savePendingOrders(orders);
  },

  removePendingOrder: (id: string) => {
    const orders = storage.getPendingOrders().filter((o) => o.id !== id);
    storage.savePendingOrders(orders);
  },

  saveOrders: (orders: Order[]) => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  addOrder: (order: Order) => {
    const orders = storage.getOrders();
    orders.unshift(order);
    storage.saveOrders(orders);
  },

  getSettings: (): ShopSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(data);
  },

  saveSettings: (settings: ShopSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getTables: (): Table[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(defaultTables));
      return defaultTables;
    }
    return JSON.parse(data);
  },

  saveTables: (tables: Table[]) => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  },
};
