'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if(!user) {
        router.push('/login?redirect=/checkout');
    }
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, user, router]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger payment processing (e.g., with Razorpay)
    // and then create an order in the database.
    
    toast({
      title: 'Order Placed!',
      description: 'Your order has been successfully placed. Thank you for shopping with us!',
    });
    
    clearCart();
    
    // Redirect to a confirmation page or user's order history
    router.push('/dashboard/orders');
  };

  if (!user || items.length === 0) {
      return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 font-headline text-3xl font-bold md:text-4xl">Checkout</h1>
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Main St" required />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="San Francisco" required />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="94103" required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="USA" required />
                  </div>
                </CardContent>
              </Card>
              <Card className="mt-8">
                  <CardHeader>
                      <CardTitle>Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">This is a demo. No real payment will be processed. Click "Place Order" to simulate a purchase.</p>
                  </CardContent>
              </Card>
            </div>
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Your Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item.product.id} className="flex justify-between text-sm">
                        <span>{item.product.name} x {item.quantity}</span>
                        <span>RS. {(item.product.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex justify-between border-t pt-4 font-bold">
                    <span>Total</span>
                    <span>RS. {totalPrice.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" size="lg" className="w-full">
                    Place Order
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
