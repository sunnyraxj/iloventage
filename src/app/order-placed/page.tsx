'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrderById } from '@/lib/data';
import type { Order } from '@/lib/types';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

function OrderPlacedContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (orderId) {
            getOrderById(orderId).then(fetchedOrder => {
                if (fetchedOrder) {
                    setOrder(fetchedOrder);
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-10 w-3/4 mt-4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="text-center space-y-4 pt-0 pb-8">
                        <Skeleton className="h-6 w-full" />
                        <div className="flex justify-center gap-4">
                            <Skeleton className="h-10 w-40" />
                            <Skeleton className="h-10 w-40" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold">Order not found</h2>
                <p className="text-muted-foreground">We couldn't find details for this order.</p>
                <Button asChild className="mt-4">
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card className={`bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-center transform transition-all duration-500 ease-out ${isMounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <CardHeader className="items-center pt-8">
                    <CheckCircle2 className="h-24 w-24 text-green-500" />
                    <CardTitle className="text-3xl font-bold text-green-800 dark:text-green-200 mt-4">Order Placed!</CardTitle>
                    <p className="text-muted-foreground pt-2">Thank you for your purchase. Your order #{order.orderNumber} is being processed.</p>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pb-8">
                    <div className="text-sm">
                        You will receive an email confirmation shortly.
                    </div>
                    <div className="flex gap-4">
                        <Button asChild>
                            <Link href={`/dashboard/orders/${order.id}`}>
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                View Order Details
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/products">Continue Shopping</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function OrderPlacedPage() {
     return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary py-12 md:py-20">
                <div className="container mx-auto px-4">
                   <Suspense fallback={<div>Loading...</div>}>
                        <OrderPlacedContent />
                   </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
