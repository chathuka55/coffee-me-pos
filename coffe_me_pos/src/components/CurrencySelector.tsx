import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/store';

type Props = {
  value?: string;
  onChange?: (code: string, locale: string) => void;
  className?: string;
};

const OPTIONS = [
  { code: 'INR', locale: 'en-IN', label: '₹ - INR' },
  { code: 'USD', locale: 'en-US', label: '$ - USD' },
  { code: 'EUR', locale: 'de-DE', label: '€ - EUR' },
  { code: 'PHP', locale: 'en-PH', label: '₱ - PHP' },
  { code: 'GBP', locale: 'en-GB', label: '£ - GBP' },
  { code: 'LKR', locale: 'en-LK', label: 'Rs. - LKR' },
];

export default function CurrencySelector({ value, onChange, className }: Props) {
  const settings = storage.getSettings();
  const current = value || settings.currencyCode || 'INR';

  const handleChange = (code: string) => {
    const option = OPTIONS.find((o) => o.code === code);
    if (!option) return;

    if (onChange) {
      onChange(option.code, option.locale);
      return;
    }

    // Legacy behavior: save directly to storage and reload
    const newSettings = { ...settings, currencyCode: option.code, currencyLocale: option.locale };
    storage.saveSettings(newSettings);
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className={className}>
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.code} value={opt.code}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
