'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getOrdersByUserId } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function DashboardOrdersPage() {
    const { user } = useAuth();
    const orders = user ? getOrdersByUserId(user.id) : [];

    const getStatusVariant = (status: string) => {
        switch (status) {
          case 'Shipped':
            return 'default';
          case 'Delivered':
            return 'secondary';
          case 'Cancelled':
              return 'destructive';
          default:
            return 'outline';
        }
      };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Orders</CardTitle>
        <CardDescription>Here is a list of your past orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{format(new Date(order.createdAt), 'PP')}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(order.orderStatus) as any}>{order.orderStatus}</Badge>
                            </TableCell>
                            <TableCell className="text-right">${order.totalPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/dashboard/orders/${order.id}`}>View Details</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            You have no orders yet.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
