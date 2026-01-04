import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Store } from 'lucide-react';
import { storage } from '@/lib/store';
import { ShopSettings } from '@/types';
import { toast } from 'sonner';
import CurrencySelector from '@/components/CurrencySelector';

export default function Settings() {
  const [settings, setSettings] = useState<ShopSettings>(storage.getSettings());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(settings);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Configure your café settings</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <CurrencySelector
                  value={settings.currencyCode}
                  onChange={(code, locale) => setSettings({ ...settings, currencyCode: code, currencyLocale: locale })}
                />
                <p className="text-xs text-muted-foreground">Select the display currency for prices</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">
                Save Shop Info
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              POS Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceCharge">Service Charge (%)</Label>
                <Input
                  id="serviceCharge"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.serviceChargePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, serviceChargePercent: Number(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Default service charge percentage for all orders
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Tax (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.taxPercent}
                  onChange={(e) => setSettings({ ...settings, taxPercent: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Tax rate applied to orders</p>
              </div>

              <Button type="submit" className="w-full">
                Save POS Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
