import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table } from '@/types';
import { storage } from '@/lib/store';
import { toast } from 'sonner';
import { Utensils, Users, Plus, Trash2 } from 'lucide-react';

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({ number: '', seats: '' });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = () => {
    setTables(storage.getTables());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const number = parseInt(formData.number);
    const seats = parseInt(formData.seats);

    if (!number || !seats || seats < 1) {
      toast.error('Please enter valid table number and seats');
      return;
    }

    if (editingTable) {
      const updatedTables = tables.map(t => 
        t.id === editingTable.id 
          ? { ...t, number, seats }
          : t
      );
      storage.saveTables(updatedTables);
      toast.success('Table updated successfully');
    } else {
      // Check if table number already exists
      if (tables.some(t => t.number === number)) {
        toast.error('Table number already exists');
        return;
      }

      const newTable: Table = {
        id: Date.now().toString(),
        number,
        seats,
        status: 'available'
      };
      storage.saveTables([...tables, newTable]);
      toast.success('Table added successfully');
    }

    loadTables();
    setIsDialogOpen(false);
    setFormData({ number: '', seats: '' });
    setEditingTable(null);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({ number: table.number.toString(), seats: table.seats.toString() });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const table = tables.find(t => t.id === id);
    if (table?.status === 'occupied') {
      toast.error('Cannot delete occupied table. Please complete or cancel the order first');
      return;
    }

    if (confirm('Are you sure you want to delete this table?')) {
      const updatedTables = tables.filter(t => t.id !== id);
      storage.saveTables(updatedTables);
      loadTables();
      toast.success('Table deleted successfully');
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'occupied':
        return 'bg-red-500/20 text-red-700 dark:text-red-400';
      case 'reserved':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    }
  };

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Table Management</h2>
          <p className="text-muted-foreground">Manage restaurant tables and seating</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTable(null); setFormData({ number: '', seats: '' }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? 'Edit Table' : 'Add New Table'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="number">Table Number</Label>
                <Input
                  id="number"
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="e.g., 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                  placeholder="e.g., 4"
                  required
                  min="1"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingTable ? 'Update Table' : 'Add Table'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableTables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{occupiedTables}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tables.sort((a, b) => a.number - b.number).map((table) => (
          <Card key={table.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Table {table.number}</CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {table.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{table.seats} seats</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(table)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(table.id)}
                    disabled={table.status === 'occupied'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            {table.currentOrderId && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Pending Order</div>
                  <div className="text-sm font-mono">{table.currentOrderId}</div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!confirm('Clear pending order for this table?')) return;
                      storage.removePendingOrder(table.currentOrderId!);
                      const updatedTables = storage.getTables().map(t =>
                        t.id === table.id ? { ...t, status: 'available', currentOrderId: undefined } : t
                      );
                      storage.saveTables(updatedTables);
                      setTables(updatedTables);
                      toast.success('Pending order cleared');
                    }}
                  >
                    Clear Pending
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            No tables added yet. Click "Add Table" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
