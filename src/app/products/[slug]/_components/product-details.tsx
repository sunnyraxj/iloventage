'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Minus, Plus } from 'lucide-react';
import type { Product } from '@/lib/types';

export function ProductDetails({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (quantity > 0) {
      addItem({ product, quantity });
      toast({
        title: 'Added to cart',
        description: `${quantity} x ${product.name} added to your cart.`,
      });
    }
  };

  return (
    <div className="flex flex-col justify-center">
        <h1 className="mb-2 font-headline text-3xl font-bold md:text-4xl">{product.name}</h1>
        <div className="flex items-baseline gap-2 mb-4">
        <p className="text-2xl font-semibold text-primary">RS. {product.price.toFixed(2)}</p>
        {product.originalPrice && (
            <p className="text-xl text-muted-foreground line-through">RS. {product.originalPrice.toFixed(2)}</p>
        )}
        </div>
        <p className="mb-6 text-muted-foreground">{product.description}</p>
        
        {product.stock > 0 ? (
        <>
            <div className="mb-6 flex items-center">
            <label htmlFor="quantity" className="mr-4 font-medium">Quantity</label>
            <div className="flex items-center rounded-md border">
                <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
                </Button>
                <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-10 w-16 border-0 text-center shadow-none focus-visible:ring-0"
                min="1"
                />
                <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
                </Button>
            </div>
            </div>

            <Button size="lg" onClick={handleAddToCart}>
            Add to Cart
            </Button>
        </>
        ) : (
        <div>
            <p className="text-lg font-bold text-red-500">SOLD OUT</p>
        </div>
        )}
    </div>
  );
}
