'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const FREE_SHIPPING_THRESHOLD = 1000;
const BELOW_THRESHOLD_RATE = 50;

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  const shippingCost = totalPrice > FREE_SHIPPING_THRESHOLD ? 0 : BELOW_THRESHOLD_RATE;
  const finalTotal = totalPrice + shippingCost;


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 font-headline text-3xl font-bold md:text-4xl">Your Shopping Cart</h1>
          
          {items.length === 0 ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-2xl font-semibold">Your cart is empty</h2>
                <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                <Button asChild className="mt-6">
                  <Link href="/products">Start Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y">
                      {items.map((item) => (
                          <li key={item.id} className="flex items-center p-4">
                            <div className="relative h-24 w-24 overflow-hidden rounded-md">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                            </div>
                            <div className="ml-4 flex-grow">
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                              <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                            </div>
                            <div className="flex items-center">
                                <div className="flex items-center rounded-md border">
                                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= item.moq}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                                        className="h-10 w-16 border-0 text-center shadow-none focus-visible:ring-0"
                                        min={item.moq}
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="ml-4 text-right font-semibold">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                            <Button variant="ghost" size="icon" className="ml-4" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'Free'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-4 font-bold">
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
