'use client';

import { useState } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Minus, Plus } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const productImage = PlaceHolderImages.find((img) => img.id === product.images[0]);

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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 gap-8 rounded-lg bg-background p-8 shadow-sm md:grid-cols-2 md:gap-12">
            <div className="overflow-hidden rounded-lg">
              {productImage && (
                <Image
                  src={productImage.imageUrl}
                  alt={product.name}
                  data-ai-hint={productImage.imageHint}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover aspect-square"
                />
              )}
            </div>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
