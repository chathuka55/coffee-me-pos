import prisma from '../config/database';
import { CartItem } from '../types';

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

    const orders = await prisma.order.findMany({
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

    // Transform to match frontend format
    return orders.map((order: any) => ({
      id: order.id,
      items: order.items.map((oi: any) => ({
        ...oi.item,
        quantity: oi.quantity,
      })),
      subtotal: order.subtotal,
      serviceCharge: order.serviceCharge,
      discount: order.discount,
      total: order.total,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      staffName: order.staffName,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      tableId: order.tableId,
      tableNumber: order.tableNumber,
    }));
  }

  async getPendingOrders() {
    const orders = await prisma.order.findMany({
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

    return orders.map((order: any) => ({
      id: order.id,
      items: order.items.map((oi: any) => ({
        ...oi.item,
        quantity: oi.quantity,
      })),
      subtotal: order.subtotal,
      serviceCharge: order.serviceCharge,
      discount: order.discount,
      total: order.total,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      staffName: order.staffName,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      tableId: order.tableId,
      tableNumber: order.tableNumber,
    }));
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
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

    if (!order) return null;

    return {
      id: order.id,
      items: order.items.map((oi) => ({
        ...oi.item,
        quantity: oi.quantity,
      })),
      subtotal: order.subtotal,
      serviceCharge: order.serviceCharge,
      discount: order.discount,
      total: order.total,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      staffName: order.staffName,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      tableId: order.tableId,
      tableNumber: order.tableNumber,
    };
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
    return await prisma.$transaction(async (tx: any) => {
      // Validate items and check stock
      for (const cartItem of orderData.items) {
        const item = await tx.item.findUnique({
          where: { id: cartItem.id },
        });

        if (!item) {
          throw new Error(`Item ${cartItem.id} not found`);
        }

        if (item.stock < cartItem.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${item.stock}, Requested: ${cartItem.quantity}`);
        }
      }

      // Get table number if tableId is provided
      let tableNumber: number | undefined;
      if (orderData.tableId) {
        const table = await tx.table.findUnique({
          where: { id: orderData.tableId },
        });
        if (!table) {
          throw new Error('Table not found');
        }
        if (table.status === 'occupied' && table.currentOrderId !== orderData.tableId) {
          throw new Error('Table is already occupied');
        }
        tableNumber = table.number;
      }

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
          tableNumber,
          staffName: orderData.staffName,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
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
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { table: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'completed') {
        throw new Error('Order is already completed');
      }

      // Update order status
      await tx.order.update({
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
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return await prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async deleteOrder(id: string) {
    return await prisma.$transaction(async (tx: any) => {
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
