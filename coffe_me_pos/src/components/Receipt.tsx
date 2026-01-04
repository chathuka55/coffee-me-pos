import { Order } from '@/types';
import { storage } from '@/lib/store';
import { format } from 'date-fns';
import { forwardRef } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ReceiptProps {
  order: Order;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
  const settings = storage.getSettings();

  return (
    <div ref={ref} className="bg-background p-8 max-w-sm mx-auto font-mono text-sm">
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-foreground pb-4">
        <h1 className="text-2xl font-bold mb-2">{settings.name}</h1>
        <p className="text-xs">{settings.address}</p>
        <p className="text-xs">{settings.phone}</p>
        <p className="text-xs">{settings.email}</p>
      </div>

      {/* Order Info */}
      <div className="mb-4 space-y-1">
        <div className="flex justify-between">
          <span>Order #:</span>
          <span className="font-bold">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(new Date(order.createdAt), 'PPp')}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="uppercase">{order.orderType}</span>
        </div>
        {order.tableNumber && (
          <div className="flex justify-between">
            <span>Table:</span>
            <span className="font-bold">#{order.tableNumber}</span>
          </div>
        )}
        {order.customerName && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{order.customerName}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-t-2 border-b-2 border-dashed border-foreground py-4 mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground">
              <th className="text-left pb-2">Item</th>
              <th className="text-center pb-2">Qty</th>
              <th className="text-right pb-2">Price</th>
              <th className="text-right pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="border-b border-dashed border-muted">
                <td className="py-2">{item.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.price)}</td>
                <td className="text-right font-bold">
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.serviceCharge > 0 && (
            <div className="flex justify-between">
            <span>Service Charge ({settings.serviceChargePercent}%):</span>
            <span>{formatCurrency(order.serviceCharge)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="flex justify-between text-accent">
            <span>Discount:</span>
            <span>- {formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t-2 border-foreground pt-2">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="mb-6">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span className="uppercase font-bold">{order.paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs border-t-2 border-dashed border-foreground pt-4">
        <p className="mb-2">Thank you for your visit!</p>
        <p>Please visit us again</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
