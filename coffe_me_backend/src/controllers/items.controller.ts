import { Request, Response } from 'express';
import { ItemsService } from '../services/items.service';

const itemsService = new ItemsService();

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const items = await itemsService.getAllItems();
    res.json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch items',
    });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await itemsService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }
    res.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch item',
    });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const item = await itemsService.createItem(req.body);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create item',
    });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const item = await itemsService.updateItem(req.params.id, req.body);
    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update item',
    });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    await itemsService.deleteItem(req.params.id);
    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete item',
    });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { stock } = req.body;
    if (typeof stock !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a number',
      });
    }
    const item = await itemsService.updateStock(req.params.id, stock);
    res.json({
      success: true,
      data: item,
      message: 'Stock updated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update stock',
    });
  }
};
