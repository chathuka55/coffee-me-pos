import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function Customers() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Customer Management</h2>
        <p className="text-muted-foreground">Manage customer data and loyalty</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Customer management features coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
