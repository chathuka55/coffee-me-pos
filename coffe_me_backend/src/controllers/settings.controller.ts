import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';

const settingsService = new SettingsService();

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch settings',
    });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.updateSettings(req.body);
    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update settings',
    });
  }
};
