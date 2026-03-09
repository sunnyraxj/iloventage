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
import Image from 'next/image';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';
import { OrderStatusChanger } from '@/app/admin/orders/components/OrderStatusChanger';

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
        return <div className="text-center p-8">Loading order details...</div>
    }

    if (!order) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Order #{order.orderNumber}</CardTitle>
                    <CardDescription>
                        Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-8 flex items-center gap-4">
                        <h3 className="text-lg font-semibold">Order Status</h3>
                        <OrderStatusChanger 
                            orderId={order.id} 
                            currentStatus={order.orderStatus}
                            isEditable={user?.role === 'admin'}
                        />
                    </div>

                    <h3 className="mb-4 text-lg font-semibold">Items Ordered</h3>
                    <ul className="divide-y">
                        {order.items.map((item) => (
                                <li key={item.id} className="flex items-center py-4">
                                <div className="relative h-20 w-20 overflow-hidden rounded-md">
                                    <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
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
