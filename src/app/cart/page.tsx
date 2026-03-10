'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { getStoreSettings } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const [shippingSettings, setShippingSettings] = useState<{
    freeShippingThreshold: number;
    belowThresholdRate: number;
  } | null>(null);

  useEffect(() => {
    getStoreSettings().then(settings => {
      setShippingSettings(settings?.shippingSettings || { freeShippingThreshold: 1000, belowThresholdRate: 50 });
    });
  }, []);

  if (!shippingSettings) {
    return (
      <main className="flex-1 bg-secondary">
          <div className="container mx-auto px-4 py-8 md:py-12">
              <Skeleton className="h-10 w-1/3 mb-8" />
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                      <Skeleton className="h-40 w-full" />
                  </div>
                  <div className="lg:col-span-1 lg:sticky lg:top-24">
                      <Skeleton className="h-80 w-full" />
                  </div>
              </div>
          </div>
      </main>
    );
  }

  const { freeShippingThreshold, belowThresholdRate } = shippingSettings;
  const shippingCost = (totalPrice > 0 && totalPrice < freeShippingThreshold) ? belowThresholdRate : 0;
  const finalTotal = totalPrice + shippingCost;
  const freeShippingProgress = Math.min((totalPrice / freeShippingThreshold) * 100, 100);
  const amountForFreeShipping = freeShippingThreshold - totalPrice;

  return (
    <main className="flex-1 bg-secondary">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {items.length === 0 ? (
          <Card className="text-center border-dashed shadow-none">
            <CardContent className="p-8 md:p-16">
              <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
              <h2 className="mt-6 text-2xl font-semibold">Your Cart is Empty</h2>
              <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
              <Button asChild className="mt-8">
                <Link href="/products">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <h1 className="mb-8 font-headline text-3xl font-bold md:text-4xl">Shopping Cart</h1>
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
              
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 flex gap-4">
                      <div className="relative h-24 w-24 md:h-32 md:w-32 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between md:flex-row md:items-center md:gap-4">
                          <div className="flex-1">
                              <h3 className="font-semibold line-clamp-2">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                  {item.color} / {item.size}
                              </p>
                              <p className="md:hidden mt-2 font-semibold text-primary">₹{item.price.toFixed(2)}</p>
                          </div>

                          <div className="flex items-center justify-between mt-4 md:mt-0">
                              <div className="flex items-center rounded-md border w-28">
                                  <Button variant="ghost" size="icon" className="h-full" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= item.moq}>
                                      <Minus className="h-4 w-4" />
                                  </Button>
                                  <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                      className="h-full w-full border-0 bg-transparent text-center text-sm shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                      min={item.moq}
                                  />
                                  <Button variant="ghost" size="icon" className="h-full" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                      <Plus className="h-4 w-4" />
                                  </Button>
                              </div>
                              
                              <p className="hidden md:block w-24 text-right font-semibold">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                              </p>

                              <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                                  <X className="h-5 w-5" />
                                  <span className="sr-only">Remove item</span>
                              </Button>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1 lg:sticky lg:top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {totalPrice < freeShippingThreshold ? (
                      <div className="space-y-2 rounded-lg bg-secondary p-3 text-center">
                          <p className="text-sm">Add <span className="font-bold text-primary">₹{amountForFreeShipping.toFixed(2)}</span> more to get FREE shipping!</p>
                          <Progress value={freeShippingProgress} className="h-2" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-y-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-3 text-center text-sm font-semibold">
                          You've got FREE shipping!
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'Free'}</span>
                      </div>
                    </div>

                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild size="lg" className="w-full">
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
