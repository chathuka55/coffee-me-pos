# Backend Implementation Guide for Coffee Me POS

This guide will help you build a complete backend API for your POS system using Node.js, Express, TypeScript, and PostgreSQL.

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Setup](#project-setup)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Implementation Steps](#implementation-steps)
6. [Frontend Integration](#frontend-integration)

---

## Technology Stack

### Recommended Stack:
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma (recommended) or TypeORM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Environment**: dotenv

### Alternative Stacks:
- **Python**: FastAPI + SQLAlchemy + PostgreSQL
- **Node.js**: NestJS (more structured, enterprise-ready)

---

## Project Setup

### Step 1: Initialize Backend Project

```bash
# Create backend directory
mkdir brew-bite-backend
cd brew-bite-backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express cors dotenv bcryptjs jsonwebtoken
npm install -D typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken ts-node nodemon

# Install Prisma (if using Prisma)
npm install prisma @prisma/client
npx prisma init
```

### Step 2: TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 3: Project Structure

```
brew-bite-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── items.controller.ts
│   │   ├── orders.controller.ts
│   │   ├── tables.controller.ts
│   │   ├── settings.controller.ts
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/
│   │   ├── Item.ts
│   │   ├── Order.ts
│   │   ├── Table.ts
│   │   └── Settings.ts
│   ├── routes/
│   │   ├── items.routes.ts
│   │   ├── orders.routes.ts
│   │   ├── tables.routes.ts
│   │   ├── settings.routes.ts
│   │   └── auth.routes.ts
│   ├── services/
│   │   ├── items.service.ts
│   │   ├── orders.service.ts
│   │   ├── tables.service.ts
│   │   └── settings.service.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── validation.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Database Schema

### Using Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("staff") // admin, staff
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Item {
  id          String   @id @default(cuid())
  name        String
  category    String
  price       Float
  costPrice   Float
  stock       Int      @default(0)
  sku         String   @unique
  description String?
  image       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orderItems  OrderItem[]
}

model Table {
  id            String   @id @default(cuid())
  number        Int      @unique
  seats         Int
  status        String   @default("available") // available, occupied, reserved
  currentOrderId String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  orders        Order[]
}

model Order {
  id            String      @id @default(cuid())
  orderType     String      // dine-in, takeaway, delivery
  paymentMethod String      // cash, card, online
  status        String      @default("pending") // pending, completed, cancelled
  subtotal      Float
  serviceCharge Float       @default(0)
  discount      Float       @default(0)
  total         Float
  staffName     String?
  customerName  String?
  customerPhone String?
  tableId       String?
  tableNumber   Int?
  table         Table?      @relation(fields: [tableId], references: [id])
  items         OrderItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  itemId    String
  item      Item     @relation(fields: [itemId], references: [id])
  quantity  Int
  price     Float    // Price at time of order
  createdAt DateTime @default(now())
}

model Settings {
  id                   String   @id @default(cuid())
  shopName             String   @default("Brew & Bite Café")
  address              String
  phone                String
  email                String
  serviceChargePercent Float    @default(10)
  taxPercent           Float    @default(0)
  currencyCode         String   @default("INR")
  currencyLocale       String   @default("en-IN")
  currencySymbol       String   @default("₹")
  logo                 String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

---

## API Endpoints

### Base URL: `http://localhost:5000/api`

### 1. Items/Inventory Endpoints

```
GET    /api/items              - Get all items
GET    /api/items/:id          - Get item by ID
POST   /api/items              - Create new item
PUT    /api/items/:id          - Update item
DELETE /api/items/:id          - Delete item
PATCH  /api/items/:id/stock    - Update stock quantity
```

### 2. Orders Endpoints

```
GET    /api/orders                    - Get all orders (with filters)
GET    /api/orders/pending            - Get pending orders
GET    /api/orders/:id                - Get order by ID
POST   /api/orders                    - Create new order
PUT    /api/orders/:id                - Update order
DELETE /api/orders/:id                - Delete order
PATCH  /api/orders/:id/status          - Update order status
POST   /api/orders/:id/checkout        - Complete order (checkout)
```

### 3. Tables Endpoints

```
GET    /api/tables              - Get all tables
GET    /api/tables/:id          - Get table by ID
POST   /api/tables              - Create new table
PUT    /api/tables/:id           - Update table
DELETE /api/tables/:id          - Delete table
PATCH  /api/tables/:id/status   - Update table status
```

### 4. Settings Endpoints

```
GET    /api/settings            - Get shop settings
PUT    /api/settings            - Update shop settings
```

### 5. Auth Endpoints (Optional)

```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/refresh        - Refresh token
GET    /api/auth/me             - Get current user
```

---

## Implementation Steps

### Step 1: Environment Configuration

Create `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/brewbite_pos?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

### Step 2: Database Connection

Create `src/config/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

### Step 3: Express App Setup

Create `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itemsRoutes from './routes/items.routes';
import ordersRoutes from './routes/orders.routes';
import tablesRoutes from './routes/tables.routes';
import settingsRoutes from './routes/settings.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/items', itemsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### Step 4: Items Service & Controller

Create `src/services/items.service.ts`:

```typescript
import prisma from '../config/database';
import { Item } from '../types';

export class ItemsService {
  async getAllItems() {
    return await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getItemById(id: string) {
    return await prisma.item.findUnique({
      where: { id },
    });
  }

  async createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.item.create({
      data,
    });
  }

  async updateItem(id: string, data: Partial<Item>) {
    return await prisma.item.update({
      where: { id },
      data,
    });
  }

  async deleteItem(id: string) {
    return await prisma.item.delete({
      where: { id },
    });
  }

  async updateStock(id: string, stock: number) {
    return await prisma.item.update({
      where: { id },
      data: { stock },
    });
  }
}
```

Create `src/controllers/items.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { ItemsService } from '../services/items.service';

const itemsService = new ItemsService();

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const items = await itemsService.getAllItems();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await itemsService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const item = await itemsService.createItem(req.body);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const item = await itemsService.updateItem(req.params.id, req.body);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    await itemsService.deleteItem(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { stock } = req.body;
    const item = await itemsService.updateStock(req.params.id, stock);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
```

Create `src/routes/items.routes.ts`:

```typescript
import { Router } from 'express';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateStock,
} from '../controllers/items.controller';

const router = Router();

router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/stock', updateStock);

export default router;
```

### Step 5: Orders Service & Controller

Create `src/services/orders.service.ts`:

```typescript
import prisma from '../config/database';
import { Order, CartItem } from '../types';

export class OrdersService {
  async getAllOrders(filters?: {
    status?: string;
    orderType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.orderType) where.orderType = filters.orderType;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    return await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            item: true,
          },
        },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingOrders() {
    return await prisma.order.findMany({
      where: { status: 'pending' },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        table: true,
      },
    });
  }

  async createOrder(orderData: {
    items: CartItem[];
    orderType: string;
    paymentMethod: string;
    subtotal: number;
    serviceCharge: number;
    discount: number;
    total: number;
    tableId?: string;
    staffName?: string;
    customerName?: string;
    customerPhone?: string;
  }) {
    // Use transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderType: orderData.orderType,
          paymentMethod: orderData.paymentMethod,
          status: 'pending',
          subtotal: orderData.subtotal,
          serviceCharge: orderData.serviceCharge,
          discount: orderData.discount,
          total: orderData.total,
          tableId: orderData.tableId,
          staffName: orderData.staffName,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          tableNumber: orderData.tableId
            ? (await tx.table.findUnique({ where: { id: orderData.tableId } }))?.number
            : undefined,
        },
      });

      // Create order items and update stock
      for (const cartItem of orderData.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemId: cartItem.id,
            quantity: cartItem.quantity,
            price: cartItem.price,
          },
        });

        // Update item stock
        await tx.item.update({
          where: { id: cartItem.id },
          data: {
            stock: {
              decrement: cartItem.quantity,
            },
          },
        });
      }

      // Update table status if dine-in
      if (orderData.tableId) {
        await tx.table.update({
          where: { id: orderData.tableId },
          data: {
            status: 'occupied',
            currentOrderId: order.id,
          },
        });
      }

      return await this.getOrderById(order.id);
    });
  }

  async checkoutOrder(id: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { table: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: 'completed' },
      });

      // Free table if dine-in
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: {
            status: 'available',
            currentOrderId: null,
          },
        });
      }

      return await this.getOrderById(id);
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return await prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async deleteOrder(id: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Restore stock
      for (const orderItem of order.items) {
        await tx.item.update({
          where: { id: orderItem.itemId },
          data: {
            stock: {
              increment: orderItem.quantity,
            },
          },
        });
      }

      // Free table if dine-in
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: {
            status: 'available',
            currentOrderId: null,
          },
        });
      }

      // Delete order (cascade will delete order items)
      await tx.order.delete({
        where: { id },
      });
    });
  }
}
```

### Step 6: Package.json Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

## Frontend Integration

### Step 1: Create API Client

Create `src/lib/api.ts` in your frontend:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Items
  async getItems() {
    return this.request<any[]>('/items');
  }

  async getItem(id: string) {
    return this.request<any>(`/items/${id}`);
  }

  async createItem(item: any) {
    return this.request<any>('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateItem(id: string, item: any) {
    return this.request<any>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteItem(id: string) {
    return this.request<void>(`/items/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/orders${params ? `?${params}` : ''}`);
  }

  async getPendingOrders() {
    return this.request<any[]>('/orders/pending');
  }

  async createOrder(order: any) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async checkoutOrder(id: string) {
    return this.request<any>(`/orders/${id}/checkout`, {
      method: 'POST',
    });
  }

  // Tables
  async getTables() {
    return this.request<any[]>('/tables');
  }

  async createTable(table: any) {
    return this.request<any>('/tables', {
      method: 'POST',
      body: JSON.stringify(table),
    });
  }

  // Settings
  async getSettings() {
    return this.request<any>('/settings');
  }

  async updateSettings(settings: any) {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
```

### Step 2: Update Store to Use API

Modify `src/lib/store.ts` to use API calls instead of localStorage.

---

## Next Steps

1. **Add Authentication**: Implement JWT-based auth for multi-user support
2. **Add Validation**: Use Zod for request validation
3. **Add Error Handling**: Comprehensive error handling middleware
4. **Add Logging**: Use Winston or Pino for logging
5. **Add Testing**: Jest for unit and integration tests
6. **Add Docker**: Containerize the application
7. **Add CI/CD**: GitHub Actions for automated deployment

---

## Quick Start Commands

```bash
# Backend
cd brew-bite-backend
npm install
npx prisma migrate dev
npm run dev

# Frontend (update to use API)
# Update src/lib/store.ts to use API client
```

---

## Support

For issues or questions, refer to:
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Docs](https://expressjs.com/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
