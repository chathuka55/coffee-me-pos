import { Request, Response } from 'express';
import { OrdersService } from '../services/orders.service';

const ordersService = new OrdersService();

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      orderType: req.query.orderType as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    };
    const orders = await ordersService.getAllOrders(filters);
    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
    });
  }
};

export const getPendingOrders = async (req: Request, res: Response) => {
  try {
    const orders = await ordersService.getPendingOrders();
    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending orders',
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await ordersService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order',
    });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await ordersService.createOrder(req.body);
    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

export const checkoutOrder = async (req: Request, res: Response) => {
  try {
    const order = await ordersService.checkoutOrder(req.params.id);
    res.json({
      success: true,
      data: order,
      message: 'Order completed successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to checkout order',
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }
    const order = await ordersService.updateOrderStatus(req.params.id, status);
    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    await ordersService.deleteOrder(req.params.id);
    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete order',
    });
  }
};
