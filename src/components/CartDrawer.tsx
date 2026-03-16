
'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { getStoreSettings } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CartDrawer() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const [shippingSettings, setShippingSettings] = useState<{
    freeShippingThreshold: number;
    belowThresholdRate: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    getStoreSettings().then(settings => {
      setShippingSettings(settings?.shippingSettings || { freeShippingThreshold: 1000, belowThresholdRate: 50 });
    });
  }, []);

  if (!isMounted || !shippingSettings) {
    return (
      <>
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <SheetFooter className="p-4 border-t">
          <Skeleton className="h-10 w-full" />
        </SheetFooter>
      </>
    );
  }

  const { freeShippingThreshold, belowThresholdRate } = shippingSettings;
  const shippingCost = (totalPrice > 0 && totalPrice < freeShippingThreshold) ? belowThresholdRate : 0;
  const finalTotal = totalPrice + shippingCost;
  const freeShippingProgress = Math.min((totalPrice / freeShippingThreshold) * 100, 100);
  const amountForFreeShipping = freeShippingThreshold - totalPrice;
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <SheetHeader className="p-4 border-b text-left">
        <SheetTitle>Shopping Cart ({totalItems})</SheetTitle>
      </SheetHeader>
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-6 text-xl font-semibold">Your Cart is Empty</h3>
          <p className="mt-2 text-muted-foreground">Add some products to get started.</p>
          <SheetClose asChild>
            <Button asChild className="mt-8">
                <Link href="/products">Start Shopping</Link>
            </Button>
          </SheetClose>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {totalPrice < freeShippingThreshold ? (
                <div className="w-full space-y-2 rounded-lg bg-secondary p-3 text-center">
                    <p className="text-xs">Add <span className="font-bold text-primary">₹{amountForFreeShipping.toFixed(2)}</span> more to get FREE shipping!</p>
                    <Progress value={freeShippingProgress} className="h-1.5" />
                </div>
              ) : (
                <div className="w-full flex items-center justify-center space-y-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-3 text-center text-sm font-semibold">
                    You've got FREE shipping!
                </div>
              )}

              <ul className="divide-y divide-border -mx-4">
                {items.map(item => (
                  <li key={item.id} className="p-4 flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0">
                      <SheetClose asChild>
                        <Link href={`/products/${item.productId}`}>
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover rounded-md" />
                        </Link>
                      </SheetClose>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div>
                        <SheetClose asChild>
                            <Link href={`/products/${item.productId}`} className="font-semibold text-sm line-clamp-2 hover:underline">{item.name}</Link>
                        </SheetClose>
                        <p className="text-xs text-muted-foreground">{item.color} / {item.size}</p>
                        <p className="text-sm font-semibold mt-1">₹{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center rounded-md border w-24">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= item.moq}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                            className="h-7 w-full border-0 bg-transparent text-center text-xs shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            min={item.moq}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="-mr-2 h-7 w-7 text-muted-foreground" onClick={() => removeItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
          <SheetFooter className="p-4 border-t bg-background">
            <div className="w-full space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'Free'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                </div>
                <SheetClose asChild>
                    <Button asChild size="lg" className="w-full">
                        <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                </SheetClose>
            </div>
          </SheetFooter>
        </>
      )}
    </>
  );
}
