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
import { createOrderAndInitiatePayment, verifyPaymentAndUpdateOrder } from '@/app/actions/payment';
import type { UserAddress, OrderAddress, StoreDetails } from '@/lib/types';
import { getStoreSettings } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<OrderAddress>({
      name: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
  });
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingSettings, setShippingSettings] = useState<{
    freeShippingThreshold: number;
    belowThresholdRate: number;
  } | null>(null);
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);


  useEffect(() => {
    getStoreSettings().then(settings => {
      setShippingSettings(settings?.shippingSettings || { freeShippingThreshold: 1000, belowThresholdRate: 50 });
      if (settings?.storeDetails) {
        setStoreDetails(settings.storeDetails);
      }
    });
  }, []);

  useEffect(() => {
    if (items.length === 0 && shippingSettings) { // check shippingSettings to avoid race condition on first load
      router.push('/cart');
    }
  }, [items, router, shippingSettings]);

  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
        const defaultAddress = user.addresses[0];
        setShippingInfo({
            name: defaultAddress.name,
            mobile: defaultAddress.mobile,
            address: defaultAddress.address,
            city: defaultAddress.city,
            state: defaultAddress.state,
            pincode: defaultAddress.pincode,
        });
        setSelectedAddressId(defaultAddress.id);
    } else if (user) {
        setShippingInfo(prev => ({...prev, name: user.name}));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [id]: value }));
    setSelectedAddressId(null); // Deselect saved address if typing new one
  }
  
  const handleSelectAddress = (address: UserAddress) => {
    setShippingInfo({
        name: address.name,
        mobile: address.mobile,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
    });
    setSelectedAddressId(address.id);
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingSettings) return;

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Razorpay Key ID is not configured.",
        });
        return;
    }
    if (!user && !guestEmail) {
        toast({ variant: "destructive", title: "Email required for guest checkout." });
        return;
    }

    setIsLoading(true);

    const { freeShippingThreshold, belowThresholdRate } = shippingSettings;
    const shippingCost = (totalPrice > 0 && totalPrice < freeShippingThreshold) ? belowThresholdRate : 0;
    const finalTotal = totalPrice + shippingCost;


    try {
        const orderPayload = {
            userId: user?.id || null,
            guestEmail: user ? undefined : guestEmail,
            items,
            total: finalTotal,
            shipping: shippingCost,
            address: shippingInfo,
        };
        const paymentInitiationResult = await createOrderAndInitiatePayment(orderPayload);

        if (!paymentInitiationResult.success || !paymentInitiationResult.razorpayOrderId) {
            throw new Error(paymentInitiationResult.message || "Could not initiate payment.");
        }

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: paymentInitiationResult.amount,
            currency: paymentInitiationResult.currency,
            name: storeDetails?.name || "My Store",
            description: "Order Payment",
            order_id: paymentInitiationResult.razorpayOrderId,
            handler: async function (response: any) {
                const verificationData = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                };
                
                const result = await verifyPaymentAndUpdateOrder(verificationData);

                if (result.success && result.orderId) {
                    toast({
                        title: "Payment Successful!",
                        description: "Redirecting to confirmation page...",
                    });
                    clearCart();
                    router.push(`/order-placed?orderId=${result.orderId}`);
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
                name: user?.name || shippingInfo.name,
                email: user?.email || guestEmail,
                contact: shippingInfo.mobile,
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
            },
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: 'Pay with UPI',
                            instruments: [
                                {
                                    method: 'upi'
                                },
                                {
                                    method: 'intent'
                                }
                            ],
                        },
                    },
                    sequence: ['block.upi', 'block.other'],
                    preferences: {
                        show_default_blocks: false,
                    },
                },
            },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();

    } catch (error) {
        console.error("Payment initiation failed:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error instanceof Error ? error.message : "Could not initiate payment. Please try again.",
        });
        setIsLoading(false);
    }
  };

  if (items.length === 0) {
      return null;
  }
  
  if (!shippingSettings) {
    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />
            <main className="flex-1 bg-secondary py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <Skeleton className="h-10 w-1/3 mb-8" />
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Skeleton className="h-96 w-full" />
                        </div>
                        <div>
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
  }

  const { freeShippingThreshold, belowThresholdRate } = shippingSettings;
  const shippingCost = (totalPrice > 0 && totalPrice < freeShippingThreshold) ? belowThresholdRate : 0;
  const finalTotal = totalPrice + shippingCost;


  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <main className="flex-1 bg-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 font-headline text-3xl font-bold md:text-4xl">Checkout</h1>
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user && user.addresses && user.addresses.length > 0 && (
                      <div>
                          <Label>Select a saved address</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              {user.addresses.map(addr => (
                                  <div key={addr.id} onClick={() => handleSelectAddress(addr)} className={`p-4 border rounded-lg cursor-pointer ${selectedAddressId === addr.id ? 'border-primary ring-2 ring-primary' : ''}`}>
                                      <p className="font-semibold">{addr.name}</p>
                                      <p className="text-sm text-muted-foreground">{addr.address}</p>
                                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                                      <p className="text-sm text-muted-foreground">Mobile: {addr.mobile}</p>
                                  </div>
                              ))}
                          </div>
                          <p className="text-center my-4 text-muted-foreground">OR</p>
                      </div>
                  )}

                  {!user && (
                        <div className="md:col-span-2">
                          <Label htmlFor="guestEmail">Email Address</Label>
                          <Input id="guestEmail" type="email" placeholder="you@example.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
                      </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" value={shippingInfo.name} onChange={handleInputChange} required />
                      </div>
                        <div className="md:col-span-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input id="mobile" placeholder="10-digit number" value={shippingInfo.mobile} onChange={handleInputChange} required />
                      </div>
                      <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="123 Main St, Apt 4B" value={shippingInfo.address} onChange={handleInputChange} required />
                      </div>
                      <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="Mumbai" value={shippingInfo.city} onChange={handleInputChange} required />
                      </div>
                        <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" placeholder="Maharashtra" value={shippingInfo.state} onChange={handleInputChange} required />
                      </div>
                      <div>
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input id="pincode" placeholder="400001" value={shippingInfo.pincode} onChange={handleInputChange} required />
                      </div>
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
                      <li key={item.id} className="flex justify-between text-sm">
                        <div>
                          <p>{item.name} x {item.quantity}</p>
                          <p className="text-muted-foreground text-xs">{item.color}, {item.size}</p>
                        </div>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Shipping</span>
                          <span>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'Free'}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>₹{finalTotal.toFixed(2)}</span>
                      </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : `Pay ₹${finalTotal.toFixed(2)}`}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
