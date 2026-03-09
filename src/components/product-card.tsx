'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const productImage = PlaceHolderImages.find((img) => img.id === product.images[0]);

  const handleAddToCart = () => {
    addItem({ product, quantity: 1 });
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <Link href={`/products/${product.slug}`} className="block overflow-hidden">
          {productImage && (
             <Image
                src={productImage.imageUrl}
                alt={product.name}
                data-ai-hint={productImage.imageHint}
                width={600}
                height={600}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="mb-2 text-lg font-semibold">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </CardTitle>
        <p className="text-muted-foreground">{product.category}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
        <Button size="icon" variant="outline" onClick={handleAddToCart} aria-label={`Add ${product.name} to cart`}>
          <Plus className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
