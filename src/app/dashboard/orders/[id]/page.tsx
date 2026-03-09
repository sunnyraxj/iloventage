'use client';

import { notFound } from 'next/navigation';
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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle, Circle, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const order = getOrderById(params.id);

    if (!order || order.userId !== user?.id) {
        notFound();
    }

    const orderStatuses = ['Confirmed', 'Shipped', 'Delivered'];
    const currentStatusIndex = orderStatuses.indexOf(order.orderStatus);

    const getStatusIcon = (status: string, index: number) => {
        if (index < currentStatusIndex) {
            return <CheckCircle className="h-6 w-6 text-primary" />;
        }
        if (index === currentStatusIndex) {
            return <Package className="h-6 w-6 text-accent" />;
        }
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Order {order.id}</CardTitle>
                    <CardDescription>
                        Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-8">
                        <h3 className="mb-4 text-lg font-semibold">Order Tracking</h3>
                        <div className="flex items-center justify-between">
                            {orderStatuses.map((status, index) => (
                                <div key={status} className="flex flex-col items-center">
                                    {getStatusIcon(status, index)}
                                    <span className="mt-2 text-sm">{status}</span>
                                </div>
                            ))}
                        </div>
                         <div className="relative mt-4 h-1 w-full rounded-full bg-muted">
                            <div className="absolute h-1 rounded-full bg-primary" style={{ width: `${(currentStatusIndex / (orderStatuses.length - 1)) * 100}%` }}></div>
                        </div>
                    </div>

                    <h3 className="mb-4 text-lg font-semibold">Items Ordered</h3>
                    <ul className="divide-y">
                        {order.products.map(({ product, quantity }) => {
                            const productImage = PlaceHolderImages.find((img) => img.id === product.images[0]);
                            return (
                                <li key={product.id} className="flex items-center py-4">
                                <div className="relative h-16 w-16 overflow-hidden rounded-md">
                                    {productImage && (
                                        <Image
                                        src={productImage.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        />
                                    )}
                                </div>
                                <div className="ml-4 flex-grow">
                                    <h4 className="font-semibold">{product.name}</h4>
                                    <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                                </div>
                                <div className="text-right font-semibold">
                                    RS. {(product.price * quantity).toFixed(2)}
                                </div>
                                </li>
                            );
                        })}
                    </ul>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.address}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                        <p>{order.shippingAddress.country}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>RS. {order.totalPrice.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>RS. 0.00</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold">
                            <span>Total</span>
                            <span>RS. {order.totalPrice.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
