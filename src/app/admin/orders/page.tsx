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
import { OrderStatusSelector } from './components/OrderStatusSelector';

export default async function AdminOrdersPage() {
    const orders = (await getAllOrders()).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Payment</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">
                            <a href={`/dashboard/orders/${order.id}`} className="hover:underline">
                                #{order.orderNumber}
                            </a>
                        </TableCell>
                        <TableCell>{format(new Date(order.createdAt), 'PP')}</TableCell>
                        <TableCell>{order.address.name}</TableCell>
                        <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={order.paymentStatus === 'paid' ? 'secondary' : 'destructive'} className="capitalize">{order.paymentStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <OrderStatusSelector orderId={order.id} currentStatus={order.orderStatus} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
