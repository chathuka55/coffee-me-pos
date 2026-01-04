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
    // Check if SKU already exists
    const existingItem = await prisma.item.findUnique({
      where: { sku: data.sku },
    });

    if (existingItem) {
      throw new Error('Item with this SKU already exists');
    }

    return await prisma.item.create({
      data,
    });
  }

  async updateItem(id: string, data: Partial<Item>) {
    // If SKU is being updated, check if it already exists
    if (data.sku) {
      const existingItem = await prisma.item.findUnique({
        where: { sku: data.sku },
      });

      if (existingItem && existingItem.id !== id) {
        throw new Error('Item with this SKU already exists');
      }
    }

    return await prisma.item.update({
      where: { id },
      data,
    });
  }

  async deleteItem(id: string) {
    // Check if item is used in any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { itemId: id },
    });

    if (orderItems) {
      throw new Error('Cannot delete item that has been used in orders');
    }

    return await prisma.item.delete({
      where: { id },
    });
  }

  async updateStock(id: string, stock: number) {
    if (stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    return await prisma.item.update({
      where: { id },
      data: { stock },
    });
  }
}
