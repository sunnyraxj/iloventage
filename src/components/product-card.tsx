'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  sizes?: string;
  priority?: boolean;
}

export function ProductCard({ product, sizes = "(max-width: 768px) 50vw, 33vw", priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const firstVariant = product.variants?.[0];
  const firstSize = firstVariant?.sizes?.[0];
  const rawImageUrl = firstVariant?.imageUrls?.[0];

  const getSafeUrl = (url: any): string | null => {
    if (!url) return null;
    return typeof url === 'string' ? url : url.value;
  }

  const imageUrl = getSafeUrl(rawImageUrl);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || !firstSize) {
        toast({
            variant: "destructive",
            title: 'Product Unavailable',
            description: `This product is not available for purchase right now.`,
          });
        return;
    };

    addItem({
        id: `${product.id}-${firstVariant.color}-${firstSize.size}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        color: firstVariant.color,
        size: firstSize.size,
        stock: firstSize.stock,
        quantity: 1,
        moq: product.moq,
        imageUrl: imageUrl || '/placeholder.svg'
    });

    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const hasStock = product.variants.some(v => v.sizes.some(s => s.stock > 0));

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-md">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              width={600}
              height={800}
              className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes={sizes}
              quality={75}
              priority={priority}
            />
          ) : (
            <div className="aspect-[3/4] w-full bg-secondary flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No Image</span>
            </div>
          )}
          {product.mrp > product.price && (
             <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                - {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
            </div>
          )}
          {hasStock && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-11/12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          )}
        </div>
        <div className="pt-2 text-left">
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <h3 className="text-sm font-semibold h-10 line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline justify-start gap-2">
            <p className="font-semibold text-foreground">₹{product.price.toFixed(2)}</p>
            {product.mrp > product.price && (
              <p className="text-sm text-muted-foreground line-through">
                ₹{product.mrp.toFixed(2)}
              </p>
            )}
          </div>
          {!hasStock && (
            <p className="text-sm font-bold text-red-500">SOLD OUT</p>
          )}
        </div>
      </Link>
    </div>
  );
}
