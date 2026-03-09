'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
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
import { CheckCircle, Circle, Package, Truck, Home } from 'lucide-react';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            const fetchedOrder = await getOrderById(params.id);
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
    }, [params.id, user, authLoading, router]);
    
    if (loading || authLoading) {
        return <div className="text-center p-8">Loading order details...</div>
    }

    if (!order) {
        notFound();
    }

    const orderStatuses = ['confirmed', 'shipped', 'delivered'];
    const currentStatusIndex = orderStatuses.indexOf(order.orderStatus);

    const getStatusIcon = (status: string, index: number) => {
        if (index < currentStatusIndex) {
            return <CheckCircle className="h-6 w-6 text-primary" />;
        }
        if (index === currentStatusIndex) {
            if (status === 'confirmed') return <Package className="h-6 w-6 text-accent" />;
            if (status === 'shipped') return <Truck className="h-6 w-6 text-accent" />;
            if (status === 'delivered') return <Home className="h-6 w-6 text-accent" />;
        }
        return <Circle className="h-6 w-6 text-muted-foreground" />;
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
                    <div className="mb-8">
                        <h3 className="mb-4 text-lg font-semibold">Order Tracking</h3>
                        <div className="flex items-start justify-between">
                            {orderStatuses.map((status, index) => (
                                <div key={status} className="flex flex-col items-center text-center w-1/3">
                                    {getStatusIcon(status, index)}
                                    <span className="mt-2 text-sm font-medium capitalize">{status}</span>
                                </div>
                            ))}
                        </div>
                         <div className="relative mt-4 h-1 w-full rounded-full bg-muted">
                            <div className="absolute h-1 rounded-full bg-primary" style={{ width: `${(currentStatusIndex / (orderStatuses.length - 1)) * 100}%` }}></div>
                        </div>
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
