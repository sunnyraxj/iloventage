
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getOrdersByUserId } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';
import { OrderImagePreview } from '@/app/admin/orders/components/OrderImagePreview';
import { OrderStatusChanger } from '@/app/admin/orders/components/OrderStatusChanger';
import { Skeleton } from '@/components/ui/skeleton';

const OrderList = ({ orders }: { orders: Order[] }) => {
    if (orders.length === 0) {
        return <div className="py-8 text-center text-muted-foreground">You have no orders yet.</div>
    }

    return (
        <>
            {/* Mobile View */}
            <div className="grid gap-4 md:hidden">
                {orders.map(order => {
                    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                    return (
                        <Card key={order.id} className="w-full overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-3">
                                <div className="grid gap-0.5">
                                    <h3 className="font-semibold text-sm">Order #{order.orderNumber}</h3>
                                    <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'PP')}</p>
                                </div>
                                <OrderStatusChanger orderId={order.id} currentStatus={order.orderStatus} isEditable={false} />
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
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium py-3">#{order.orderNumber}</TableCell>
                                <TableCell className="py-3">{format(new Date(order.createdAt), 'PP')}</TableCell>
                                <TableCell className="py-3">
                                    <OrderStatusChanger orderId={order.id} currentStatus={order.orderStatus} isEditable={false} />
                                </TableCell>
                                <TableCell className="text-right py-3">₹{order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-right py-3">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/orders/${order.id}`}>View Details</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
};


export default function DashboardOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            const fetchOrders = async () => {
                setLoading(true);
                const userOrders = await getOrdersByUserId(user.id);
                setOrders(userOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                setLoading(false);
            };
            fetchOrders();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Orders</CardTitle>
        <CardDescription>Track the status of your past and current orders.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="space-y-4">
                <div className="hidden md:block space-y-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                </div>
                <div className="grid gap-4 md:hidden">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                </div>
            </div>
        ) : (
            <OrderList orders={orders} />
        )}
      </CardContent>
    </Card>
  );
}
