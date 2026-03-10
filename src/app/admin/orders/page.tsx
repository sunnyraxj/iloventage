
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getAllOrders } from '@/lib/data';
import { format } from 'date-fns';
import { OrderStatusChanger } from './components/OrderStatusChanger';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OrderImagePreview } from './components/OrderImagePreview';

const OrderList = ({ orders }: { orders: Order[] }) => {
    if (orders.length === 0) {
        return <div className="text-center text-muted-foreground py-8">No orders in this category.</div>
    }

    return (
        <>
            {/* Mobile View */}
            <div className="grid gap-4 md:hidden pt-4">
                {orders.map(order => {
                    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                    return (
                        <Card key={order.id} className="w-full overflow-hidden">
                             <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-3">
                                <div className="grid gap-0.5">
                                    <h3 className="font-semibold text-sm">Order #{order.orderNumber}</h3>
                                    <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'PP')}</p>
                                </div>
                                <OrderStatusChanger orderId={order.id} currentStatus={order.orderStatus} />
                            </CardHeader>
                            <CardContent className="p-3 text-sm">
                                <div className="flex items-start gap-3">
                                    {firstItem && 
                                        <div className="w-16 flex-shrink-0">
                                            <OrderImagePreview item={firstItem} />
                                        </div>
                                    }
                                    <div className="flex-grow space-y-1">
                                        {firstItem ? (
                                            <>
                                                <p className="font-medium line-clamp-2 leading-tight">{firstItem.name}</p>
                                                {order.items.length > 1 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        + {order.items.length - 1} more item(s)
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">No items</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">₹{order.total.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 p-2">
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <Link href={`/dashboard/orders/${order.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block pt-4">
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
            </div>
        </>
    );
};

export default async function AdminOrdersPage() {
    const statusOrder: Record<Order['orderStatus'], number> = {
        'confirmed': 1,
        'shipped': 2,
        'delivered': 3,
        'pending': 4,
        'cancelled': 5,
    };

    const allOrders = (await getAllOrders()).sort((a, b) => {
        const orderA = statusOrder[a.orderStatus] ?? 99;
        const orderB = statusOrder[b.orderStatus] ?? 99;
    
        if (orderA !== orderB) {
            return orderA - orderB;
        }
    
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const confirmedOrders = allOrders.filter(o => o.orderStatus === 'confirmed');
    const shippedOrders = allOrders.filter(o => o.orderStatus === 'shipped');
    const deliveredOrders = allOrders.filter(o => o.orderStatus === 'delivered');
    const otherOrders = allOrders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'cancelled');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>View and manage customer orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
            <div className="overflow-x-auto">
                <TabsList className="-mb-px">
                    <TabsTrigger value="all">All ({allOrders.length})</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed ({confirmedOrders.length})</TabsTrigger>
                    <TabsTrigger value="shipped">Shipped ({shippedOrders.length})</TabsTrigger>
                    <TabsTrigger value="delivered">Delivered ({deliveredOrders.length})</TabsTrigger>
                    <TabsTrigger value="other">Other ({otherOrders.length})</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="all">
                <OrderList orders={allOrders} />
            </TabsContent>
            <TabsContent value="confirmed">
                <OrderList orders={confirmedOrders} />
            </TabsContent>
            <TabsContent value="shipped">
                <OrderList orders={shippedOrders} />
            </TabsContent>
            <TabsContent value="delivered">
                <OrderList orders={deliveredOrders} />
            </TabsContent>
            <TabsContent value="other">
                <OrderList orders={otherOrders} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
