'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

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
                      {items.map((item) => {
                        const productImage = PlaceHolderImages.find((img) => img.id === item.product.images[0]);
                        return (
                          <li key={item.product.id} className="flex items-center p-4">
                            <div className="relative h-20 w-20 overflow-hidden rounded-md">
                              {productImage && (
                                <Image
                                  src={productImage.imageUrl}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="ml-4 flex-grow">
                              <h3 className="font-semibold">{item.product.name}</h3>
                              <p className="text-sm text-muted-foreground">RS. {item.product.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center">
                                <div className="flex items-center rounded-md border">
                                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                                        className="h-10 w-16 border-0 text-center shadow-none focus-visible:ring-0"
                                        min="1"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="ml-4 text-right font-semibold">
                              RS. {(item.product.price * item.quantity).toFixed(2)}
                            </div>
                            <Button variant="ghost" size="icon" className="ml-4" onClick={() => removeItem(item.product.id)}>
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                          </li>
                        );
                      })}
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
                      <span>RS. {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between border-t pt-4 font-bold">
                      <span>Total</span>
                      <span>RS. {totalPrice.toFixed(2)}</span>
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
