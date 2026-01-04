import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, FileText, Calendar, TrendingUp, DollarSign, ShoppingBag, Percent } from 'lucide-react';
import { storage } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type DateFilter = 'today' | 'week' | 'month' | 'all';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

export default function Reports() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const orders = storage.getOrders();
  const items = storage.getItems();

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let interval;

    switch (dateFilter) {
      case 'today':
        interval = { start: startOfDay(now), end: endOfDay(now) };
        break;
      case 'week':
        interval = { start: startOfWeek(now), end: endOfWeek(now) };
        break;
      case 'month':
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'all':
        return orders;
    }

    return orders.filter(order => 
      isWithinInterval(new Date(order.createdAt), interval)
    );
  }, [orders, dateFilter]);

  const analytics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    
    const totalProfit = filteredOrders.reduce((sum, order) => {
      const orderProfit = order.items.reduce((itemSum, item) => {
        return itemSum + ((item.price - item.costPrice) * item.quantity);
      }, 0);
      return sum + orderProfit;
    }, 0);

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Payment method breakdown
    const paymentMethods = filteredOrders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Order type breakdown
    const orderTypes = filteredOrders.reduce((acc, order) => {
      acc[order.orderType] = (acc[order.orderType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top selling items
    const itemSales = filteredOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (!acc[item.id]) {
          acc[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        acc[item.id].quantity += item.quantity;
        acc[item.id].revenue += item.price * item.quantity;
      });
      return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    const topItems = Object.entries(itemSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily sales trend
    const dailySales = filteredOrders.reduce((acc, order) => {
      const date = format(new Date(order.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0, profit: 0 };
      }
      acc[date].revenue += order.total;
      acc[date].orders += 1;
      
      const orderProfit = order.items.reduce((sum, item) => {
        return sum + ((item.price - item.costPrice) * item.quantity);
      }, 0);
      acc[date].profit += orderProfit;
      
      return acc;
    }, {} as Record<string, { date: string; revenue: number; orders: number; profit: number }>);

    const dailyTrend = Object.values(dailySales).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      totalRevenue,
      totalOrders,
      totalProfit,
      avgOrderValue,
      profitMargin,
      paymentMethods,
      orderTypes,
      topItems,
      dailyTrend
    };
  }, [filteredOrders]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const settings = storage.getSettings();
    
    // Header
    doc.setFontSize(18);
    doc.text(settings.name, 14, 20);
    doc.setFontSize(11);
    doc.text(`Sales Report - ${dateFilter.toUpperCase()}`, 14, 28);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 34);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${formatCurrency(analytics.totalRevenue)}`, 14, 52);
    doc.text(`Total Orders: ${analytics.totalOrders}`, 14, 58);
    doc.text(`Total Profit: ${formatCurrency(analytics.totalProfit)}`, 14, 64);
    doc.text(`Average Order Value: ${formatCurrency(analytics.avgOrderValue)}`, 14, 70);
    doc.text(`Profit Margin: ${analytics.profitMargin.toFixed(2)}%`, 14, 76);

    // Top Items Table
    autoTable(doc, {
      startY: 85,
      head: [['Item', 'Quantity Sold', 'Revenue']],
      body: analytics.topItems.map(item => [
        item.name,
        item.quantity.toString(),
        `${formatCurrency(item.revenue)}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 69, 19] }
    });

    // Orders Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Order ID', 'Date', 'Type', 'Payment', 'Total']],
      body: filteredOrders.map(order => [
        order.id.slice(0, 8),
        format(new Date(order.createdAt), 'PPp'),
        order.orderType,
        order.paymentMethod,
        `${formatCurrency(order.total)}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 69, 19] }
    });

    doc.save(`sales-report-${dateFilter}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully');
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Type', 'Payment Method', 'Status', 'Subtotal', 'Service Charge', 'Discount', 'Total', 'Items'];
    
    const rows = filteredOrders.map(order => [
      order.id,
      format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      order.orderType,
      order.paymentMethod,
      order.status,
      order.subtotal.toFixed(2),
      order.serviceCharge.toFixed(2),
      order.discount.toFixed(2),
      order.total.toFixed(2),
      order.items.map(item => `${item.name} x${item.quantity}`).join('; ')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateFilter}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  const paymentChartData = Object.entries(analytics.paymentMethods).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const orderTypeChartData = Object.entries(analytics.orderTypes).map(([name, value]) => ({
    name: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Sales Reports</h2>
          <p className="text-muted-foreground">Detailed sales analytics and reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={dateFilter} className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totalProfit)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.avgOrderValue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.profitMargin.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'PPP')}
                      formatter={(value: number) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={orderTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.topItems.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(item.revenue)}</div>
                        <div className="text-xs text-muted-foreground">{item.quantity} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), 'PPp')}</TableCell>
                      <TableCell className="capitalize">{order.orderType}</TableCell>
                      <TableCell className="capitalize">{order.paymentMethod}</TableCell>
                      <TableCell className="capitalize">{order.status}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(order.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
