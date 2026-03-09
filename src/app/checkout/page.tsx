'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { initiatePayment, verifyAndCreateOrder } from '@/app/actions/payment';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
      name: '',
      address: '',
      city: '',
      zip: '',
      country: 'India'
  });

  useEffect(() => {
    if (!user) {
        router.push('/login?redirect=/checkout');
    }
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [id]: value }));
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Razorpay Key ID is not configured. Please contact support.",
        });
        return;
    }

    setIsLoading(true);

    try {
        const razorpayOrder = await initiatePayment(totalPrice);

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "ILOVENTAG",
            description: "Order Payment",
            order_id: razorpayOrder.id,
            handler: async function (response: any) {
                const verificationData = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                };
                const orderData = {
                    user: user!,
                    items: items,
                    totalPrice: totalPrice,
                    shippingAddress: shippingInfo,
                }
                
                const result = await verifyAndCreateOrder(verificationData, orderData);

                if (result.success && result.orderId) {
                    toast({
                        title: "Order Placed!",
                        description: "Your payment was successful.",
                    });
                    clearCart();
                    router.push(`/dashboard/orders/${result.orderId}`);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Payment Verification Failed",
                        description: result.message || "Please contact support.",
                    });
                     setIsLoading(false);
                }
            },
            prefill: {
                name: user?.name,
                email: user?.email,
            },
            theme: {
                color: "#2563EB"
            },
            modal: {
                ondismiss: function() {
                    setIsLoading(false);
                    toast({
                        variant: "destructive",
                        title: "Payment Cancelled",
                        description: "You cancelled the payment process.",
                    })
                }
            }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();

    } catch (error) {
        console.error("Payment initiation failed:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not initiate payment. Please try again.",
        });
        setIsLoading(false);
    }
  };

  if (!user || items.length === 0) {
      return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
      );
  }

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
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
                      <Input id="name" placeholder="John Doe" value={shippingInfo.name} onChange={handleInputChange} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="123 Main St" value={shippingInfo.address} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="Mumbai" value={shippingInfo.city} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" placeholder="400001" value={shippingInfo.zip} onChange={handleInputChange} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" placeholder="India" value={shippingInfo.country} onChange={handleInputChange} required />
                    </div>
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
                    <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Processing...' : `Pay RS. ${totalPrice.toFixed(2)}`}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
