import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { storage } from '@/lib/store';
import { Item, CartItem, Order, Table } from '@/types';
import { toast } from 'sonner';
import { Receipt } from '@/components/Receipt';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/lib/utils';

const categories = ['All', 'Coffee', 'Cold Drinks', 'Snacks', 'Pastries', 'Meals'];

export default function POS() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [discount, setDiscount] = useState(0);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [selectedPendingId, setSelectedPendingId] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  useEffect(() => {
    setItems(storage.getItems());
    setTables(storage.getTables());
    setPendingOrders(storage.getPendingOrders());
  }, []);

  // When a table is selected for dine-in, try to load its pending order
  useEffect(() => {
    if (orderType !== 'dine-in' || !selectedTable) return;
    const table = storage.getTables().find(t => t.id === selectedTable);
    if (!table) return;
    if (table.currentOrderId) {
      try {
        const pend = storage.getPendingOrderById(table.currentOrderId);
        if (pend) {
          // avoid re-loading if it's already the selected pending
          if (pend.id === selectedPendingId) return;
          // load pend into cart
          setCart(pend.items as CartItem[]);
          setDiscount(Math.round((pend.discount / (pend.subtotal || 1)) * 100) || 0);
          setPaymentMethod(pend.paymentMethod || 'cash');
          setSelectedPendingId(pend.id);
          toast.success(`Loaded pending order for Table ${table.number}`);
          return;
        }
      } catch (e) {
        console.error('Failed loading pending for table:', e);
        toast.error('Failed loading pending order');
      }
    }
    // no pending → clear pending selection
    setSelectedPendingId('');
  }, [selectedTable, orderType]);

  const settings = storage.getSettings();
  const serviceChargePercent = settings.serviceChargePercent;

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: Item) => {
    if (item.stock <= 0) {
      toast.error('Item out of stock!');
      return;
    }

    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      if (existingItem.quantity >= item.stock) {
        toast.error('Cannot add more than available stock!');
        return;
      }
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
      toast.success(`${item.name} added to cart`);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const item = items.find((i) => i.id === id);
    if (item && quantity > item.stock) {
      toast.error('Cannot exceed available stock!');
      return;
    }
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.info('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceCharge = (subtotal * serviceChargePercent) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + serviceCharge - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      toast.error('Please select a table for dine-in order!');
      return;
    }

    // Update stock
    const updatedItems = items.map((item) => {
      const cartItem = cart.find((c) => c.id === item.id);
      if (cartItem) {
        return { ...item, stock: item.stock - cartItem.quantity };
      }
      return item;
    });
    storage.saveItems(updatedItems);
    setItems(updatedItems);

    // Update table status if dine-in: clear its pending order and free the table (customer paid)
    if (orderType === 'dine-in' && selectedTable) {
      const table = tables.find(t => t.id === selectedTable);
      if (table?.currentOrderId) {
        // remove pending order (if it exists)
        storage.removePendingOrder(table.currentOrderId);
      }
      const updatedTables = tables.map(t =>
        t.id === selectedTable
          ? { ...t, status: 'available' as const, currentOrderId: undefined }
          : t
      );
      storage.saveTables(updatedTables);
      setTables(updatedTables);
      setPendingOrders(storage.getPendingOrders());
    }

    const table = tables.find(t => t.id === selectedTable);

    // Create order
    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: cart,
      subtotal,
      serviceCharge,
      discount: discountAmount,
      total,
      orderType,
      paymentMethod,
      status: 'completed',
      createdAt: new Date().toISOString(),
      staffName: 'Staff Member',
      tableId: orderType === 'dine-in' ? selectedTable : undefined,
      tableNumber: orderType === 'dine-in' ? table?.number : undefined,
    };
    storage.addOrder(order);

    toast.success('Order completed successfully!');
    setCompletedOrder(order);
    setShowReceipt(true);
    clearCart();
    setSelectedTable('');
    setSelectedPendingId('');
  };

  const savePending = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    const id = selectedPendingId || `PEND-${Date.now()}`;
    const table = tables.find(t => t.id === selectedTable);
    const pendingOrder: Order = {
      id,
      items: cart,
      subtotal,
      serviceCharge,
      discount: discountAmount,
      total,
      orderType,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      staffName: 'Staff Member',
      tableId: orderType === 'dine-in' ? selectedTable : undefined,
      tableNumber: orderType === 'dine-in' ? table?.number : undefined,
    };

    storage.addOrUpdatePendingOrder(pendingOrder);

    // Associate with table if dine-in
    if (orderType === 'dine-in' && selectedTable) {
      const updatedTables = tables.map(t =>
        t.id === selectedTable ? { ...t, status: 'occupied', currentOrderId: id } : t
      );
      storage.saveTables(updatedTables);
      setTables(updatedTables);
    }

    setPendingOrders(storage.getPendingOrders());
    setSelectedPendingId(id);
    toast.success('Order saved as pending');
  };

  const loadPending = (id: string) => {
    try {
      const pend = storage.getPendingOrderById(id);
      if (!pend) {
        toast.error('Pending order not found');
        return;
      }
      setCart(pend.items as CartItem[]);
      setDiscount(Math.round((pend.discount / (pend.subtotal || 1)) * 100) || 0);
      setPaymentMethod(pend.paymentMethod || 'cash');
      setSelectedPendingId(pend.id);
      if (pend.tableId) setSelectedTable(pend.tableId);
      toast.success('Pending order loaded');
    } catch (e) {
      console.error('Error loading pending order:', e);
      toast.error('Failed to load pending order');
    }
  };

  const deletePending = (id: string) => {
    if (!confirm('Delete this pending order?')) return;
    // clear table references
    const updatedTables = tables.map(t => (t.currentOrderId === id ? { ...t, status: 'available', currentOrderId: undefined } : t));
    storage.saveTables(updatedTables);
    storage.removePendingOrder(id);
    setTables(updatedTables);
    setPendingOrders(storage.getPendingOrders());
    if (selectedPendingId === id) {
      clearCart();
      setSelectedPendingId('');
    }
    toast.success('Pending order deleted');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Point of Sale</h2>
        <p className="text-muted-foreground">Select items to create an order</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Items Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                onClick={() => addToCart(item)}
              >
              <CardContent className="p-4">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="aspect-square w-full object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="aspect-square bg-secondary rounded-lg mb-3 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                  <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-primary">{formatCurrency(item.price)}</p>
                    <Badge variant={item.stock > 10 ? 'secondary' : 'destructive'} className="text-xs">
                      {item.stock}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Cart is empty
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <Separator />

              {/* Order Type */}
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select value={orderType} onValueChange={(v: any) => {
                  setOrderType(v);
                  setSelectedTable('');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table Selection for Dine-in */}
              {orderType === 'dine-in' && (
                <div className="space-y-2">
                  <Label>Select Table</Label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables
                          .sort((a, b) => a.number - b.number)
                          .map(table => (
                            <SelectItem key={table.id} value={table.id}>
                              {`Table ${table.number} (${table.seats} seats) ${table.status === 'occupied' ? '— occupied' : ''}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                  {/* Pending Orders for Dine-in */}
                  {pendingOrders.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Pending Orders ({pendingOrders.length})
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPendingOrders(storage.getPendingOrders());
                            toast.success('Pending orders refreshed');
                          }}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {pendingOrders.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {p.tableNumber ? `Table ${p.tableNumber}` : 'No Table'} — {formatCurrency(p.total)}
                              </p>
                              <p className="text-xs text-muted-foreground">{p.items.length} items</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadPending(p.id)}
                                className="h-7 px-2"
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deletePending(p.id)}
                                className="h-7 px-2 text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button size="sm" variant="outline" onClick={savePending} className="w-full">
                      <Clock className="h-3 w-3 mr-2" />
                      Save as Pending
                    </Button>
                  </div>
                </div>
              )}

                  {/* Discount */}
                  <div className="space-y-2">
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service ({serviceChargePercent}%)</span>
                      <span className="font-medium">{formatCurrency(serviceCharge)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount ({discount}%)</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('cash')}
                        className="flex flex-col h-auto py-3"
                      >
                        <Banknote className="h-5 w-5 mb-1" />
                        <span className="text-xs">Cash</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'card' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('card')}
                        className="flex flex-col h-auto py-3"
                      >
                        <CreditCard className="h-5 w-5 mb-1" />
                        <span className="text-xs">Card</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'online' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('online')}
                        className="flex flex-col h-auto py-3"
                      >
                        <Smartphone className="h-5 w-5 mb-1" />
                        <span className="text-xs">Online</span>
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={clearCart}>
                      Clear
                    </Button>
                    <Button onClick={handleCheckout} className="bg-success hover:bg-success/90">
                      Checkout
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          {completedOrder && (
            <div className="space-y-4">
              <Receipt ref={receiptRef} order={completedOrder} />
              <div className="flex gap-2">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReceipt(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
