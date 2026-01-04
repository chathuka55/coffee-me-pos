import prisma from '../config/database';
import { ShopSettings } from '../types';

export class SettingsService {
  async getSettings() {
    let settings = await prisma.settings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          shopName: 'Coffee Me',
          address: '123 Coffee Street, Cityville',
          phone: '+1 234 567 8900',
          email: 'hello@coffeeme.com',
          serviceChargePercent: 10,
          taxPercent: 0,
          currencyCode: 'INR',
          currencyLocale: 'en-IN',
          currencySymbol: '₹',
        },
      });
    }

    return {
      id: settings.id,
      name: settings.shopName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      serviceChargePercent: settings.serviceChargePercent,
      taxPercent: settings.taxPercent,
      currencyCode: settings.currencyCode,
      currencyLocale: settings.currencyLocale,
      currencySymbol: settings.currencySymbol,
      logo: settings.logo,
    };
  }

  async updateSettings(data: Partial<ShopSettings>) {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create new settings if none exist
      settings = await prisma.settings.create({
        data: {
          shopName: data.shopName || 'Coffee Me',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          serviceChargePercent: data.serviceChargePercent ?? 10,
          taxPercent: data.taxPercent ?? 0,
          currencyCode: data.currencyCode || 'INR',
          currencyLocale: data.currencyLocale || 'en-IN',
          currencySymbol: data.currencySymbol || '₹',
          logo: data.logo,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          shopName: data.shopName,
          address: data.address,
          phone: data.phone,
          email: data.email,
          serviceChargePercent: data.serviceChargePercent,
          taxPercent: data.taxPercent,
          currencyCode: data.currencyCode,
          currencyLocale: data.currencyLocale,
          currencySymbol: data.currencySymbol,
          logo: data.logo,
        },
      });
    }

    return {
      id: settings.id,
      name: settings.shopName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      serviceChargePercent: settings.serviceChargePercent,
      taxPercent: settings.taxPercent,
      currencyCode: settings.currencyCode,
      currencyLocale: settings.currencyLocale,
      currencySymbol: settings.currencySymbol,
      logo: settings.logo,
    };
  }
}
