'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getOrderById } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';
import { OrderStatusChanger } from '@/app/admin/orders/components/OrderStatusChanger';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyPaymentButton } from '@/app/admin/orders/components/VerifyPaymentButton';

function OrderDetailsSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-6 w-28" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="divide-y">
                        {Array.from({length: 2}).map((_, i) => (
                            <div key={i} className="flex items-center py-4">
                                <Skeleton className="h-20 w-20 rounded-md" />
                                <div className="ml-4 flex-grow space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
                        <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
                        <div className="flex justify-between border-t pt-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-24" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function OrderDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            setLoading(true);
            const fetchedOrder = await getOrderById(id);
            if (!fetchedOrder) {
                notFound();
                return;
            }
            // For guest checkout, anyone with the link can view.
            // For logged-in users, check if it's their order OR if the user is an admin.
            if (user?.role !== 'admin' && fetchedOrder.userId && (!user || fetchedOrder.userId !== user.id)) {
                router.push('/login?redirect=/dashboard'); 
                return;
            }
            setOrder(fetchedOrder);
            setLoading(false);
        };

        // We wait for auth to settle before fetching, to know if we should check userId
        if (!authLoading) {
            fetchOrder();
        }
    }, [id, user, authLoading, router]);
    
    if (loading || authLoading) {
        return <OrderDetailsSkeleton />;
    }

    if (!order) {
        notFound();
    }

    const isAdmin = user?.role === 'admin';
    const isPending = order.orderStatus === 'pending';


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Order #{order.orderNumber}</CardTitle>
                            <CardDescription>
                                Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
                            </CardDescription>
                        </div>
                         {isAdmin && isPending && (
                            <VerifyPaymentButton orderId={order.id} />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Order Status</p>
                            <OrderStatusChanger 
                                orderId={order.id} 
                                currentStatus={order.orderStatus}
                                isEditable={user?.role === 'admin'}
                            />
                        </div>
                        {order.shippedAt && (
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Shipped On</p>
                                <p className="font-medium">{format(new Date(order.shippedAt), 'PP')}</p>
                            </div>
                        )}
                        {order.deliveredAt && (
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Delivered On</p>
                                <p className="font-medium">{format(new Date(order.deliveredAt), 'PP')}</p>
                            </div>
                        )}
                    </div>

                    <h3 className="mb-4 text-lg font-semibold">Items Ordered</h3>
                    <ul className="divide-y">
                        {order.items.map((item) => (
                                <li key={item.id} className="flex items-center py-4">
                                <div className="relative h-20 w-20 overflow-hidden rounded-md">
                                    <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    loading="lazy"
                                    />
                                </div>
                                <div className="ml-4 flex-grow">
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground">Color: {item.color}, Size: {item.size}</p>
                                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                </div>
                                <div className="text-right font-semibold">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                </div>
                                </li>
                            )
                        )}
                    </ul>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{order.address.name}</p>
                        <p>{order.address.address}</p>
                        <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                        <p>Mobile: {order.address.mobile}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{(order.total - order.shipping).toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>₹{order.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold">
                            <span>Total</span>
                            <span>₹{order.total.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
