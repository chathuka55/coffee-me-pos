import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Receipt, Clock, CheckCircle, XCircle } from 'lucide-react';
import { storage } from '@/lib/store';
import { Order } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setOrders(storage.getOrders());
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredOrders = orders.filter((order) => {
    if (filter === 'today') return order.createdAt.startsWith(today);
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'completed') return order.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      pending: { variant: 'default' as const, icon: Clock },
      completed: { variant: 'secondary' as const, icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, icon: XCircle },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getOrderTypeBadge = (type: Order['orderType']) => {
    const colors = {
      'dine-in': 'bg-accent text-accent-foreground',
      takeaway: 'bg-warning text-warning-foreground',
      delivery: 'bg-primary text-primary-foreground',
    };
    return (
      <Badge className={colors[type]}>
        {type === 'dine-in' ? 'Dine-in' : type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Orders</h2>
        <p className="text-muted-foreground">View and manage all orders</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Orders
        </Button>
        <Button
          variant={filter === 'today' ? 'default' : 'outline'}
          onClick={() => setFilter('today')}
        >
          Today
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Order History ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(order.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{getOrderTypeBadge(order.orderType)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-muted-foreground">
                              {item.quantity}× {item.name}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{order.paymentMethod}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
