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
import { getAllOrders } from '@/lib/data';
import { format } from 'date-fns';
import { OrderStatusChanger } from './components/OrderStatusChanger';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OrderImagePreview } from './components/OrderImagePreview';

export default async function AdminOrdersPage() {
    const statusOrder: Record<Order['orderStatus'], number> = {
        'confirmed': 1,
        'shipped': 2,
        'delivered': 3,
        'pending': 4,
        'cancelled': 5,
    };

    const orders = (await getAllOrders()).sort((a, b) => {
        const orderA = statusOrder[a.orderStatus] ?? 99;
        const orderB = statusOrder[b.orderStatus] ?? 99;
    
        if (orderA !== orderB) {
            return orderA - orderB;
        }
    
        // If statuses are the same, sort by most recent
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>View and manage customer orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Payment</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => {
                    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

                    return (
                        <TableRow key={order.id}>
                            <TableCell>
                                {firstItem ? (
                                    <div className="flex items-center gap-3">
                                        <OrderImagePreview item={firstItem} />
                                        <div className="grid gap-0.5">
                                            <p className="font-medium line-clamp-2">{firstItem.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Size: {firstItem.size} &middot; Qty: {firstItem.quantity}
                                            </p>
                                            {order.items.length > 1 && (
                                                <p className="text-xs text-muted-foreground">
                                                    + {order.items.length - 1} more item(s)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">No items</span>
                                )}
                            </TableCell>
                            <TableCell>{format(new Date(order.createdAt), 'PP')}</TableCell>
                            <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'destructive'} className="capitalize">{order.paymentStatus}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                <OrderStatusChanger orderId={order.id} currentStatus={order.orderStatus} />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/dashboard/orders/${order.id}`}>View Details</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
