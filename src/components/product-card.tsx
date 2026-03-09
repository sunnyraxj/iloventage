'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ product, quantity: 1 });
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="group text-center md:text-left">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-md">
          {productImage && (
            <Image
              src={productImage.imageUrl}
              alt={product.name}
              data-ai-hint={productImage.imageHint}
              width={600}
              height={800}
              className="aspect-[3/4] w-full object-cover"
            />
          )}
          {product.stock > 0 && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="absolute bottom-2 left-2 h-9 w-9 rounded-sm bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="pt-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider">{product.name}</h3>
          <div className="flex items-baseline justify-center gap-2 md:justify-start">
            <p className="text-xs font-semibold text-foreground">RS. {product.price.toFixed(2)}</p>
            {product.originalPrice && (
              <p className="text-[10px] text-muted-foreground line-through">
                RS. {product.originalPrice.toFixed(2)}
              </p>
            )}
          </div>
          {product.stock === 0 && (
            <p className="text-sm font-bold text-red-500">SOLD OUT</p>
          )}
        </div>
      </Link>
    </div>
  );
}
