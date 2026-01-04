import prisma from '../config/database';
import { Table } from '../types';

export class TablesService {
  async getAllTables() {
    return await prisma.table.findMany({
      orderBy: { number: 'asc' },
    });
  }

  async getTableById(id: string) {
    return await prisma.table.findUnique({
      where: { id },
    });
  }

  async createTable(data: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) {
    // Check if table number already exists
    const existingTable = await prisma.table.findUnique({
      where: { number: data.number },
    });

    if (existingTable) {
      throw new Error('Table with this number already exists');
    }

    return await prisma.table.create({
      data: {
        number: data.number,
        seats: data.seats,
        status: data.status || 'available',
      },
    });
  }

  async updateTable(id: string, data: Partial<Table>) {
    // If table number is being updated, check if it already exists
    if (data.number !== undefined) {
      const existingTable = await prisma.table.findUnique({
        where: { number: data.number },
      });

      if (existingTable && existingTable.id !== id) {
        throw new Error('Table with this number already exists');
      }
    }

    return await prisma.table.update({
      where: { id },
      data,
    });
  }

  async deleteTable(id: string) {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            status: 'pending',
          },
        },
      },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    if (table.status === 'occupied') {
      throw new Error('Cannot delete occupied table. Please complete or cancel the order first');
    }

    if (table.orders.length > 0) {
      throw new Error('Cannot delete table with pending orders');
    }

    return await prisma.table.delete({
      where: { id },
    });
  }

  async updateTableStatus(id: string, status: string) {
    const validStatuses = ['available', 'occupied', 'reserved'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return await prisma.table.update({
      where: { id },
      data: { status },
    });
  }
}
