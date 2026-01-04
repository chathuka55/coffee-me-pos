import { Request, Response } from 'express';
import { TablesService } from '../services/tables.service';

const tablesService = new TablesService();

export const getAllTables = async (req: Request, res: Response) => {
  try {
    const tables = await tablesService.getAllTables();
    res.json({
      success: true,
      data: tables,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tables',
    });
  }
};

export const getTableById = async (req: Request, res: Response) => {
  try {
    const table = await tablesService.getTableById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }
    res.json({
      success: true,
      data: table,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch table',
    });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const table = await tablesService.createTable(req.body);
    res.status(201).json({
      success: true,
      data: table,
      message: 'Table created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create table',
    });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const table = await tablesService.updateTable(req.params.id, req.body);
    res.json({
      success: true,
      data: table,
      message: 'Table updated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update table',
    });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    await tablesService.deleteTable(req.params.id);
    res.json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete table',
    });
  }
};

export const updateTableStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }
    const table = await tablesService.updateTableStatus(req.params.id, status);
    res.json({
      success: true,
      data: table,
      message: 'Table status updated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update table status',
    });
  }
};
