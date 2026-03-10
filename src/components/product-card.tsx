
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Plus } from 'lucide-react';

import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const getSafeUrl = (url: any, productId: string): string => {
  if (typeof url === 'string' && url) return url;
  if (typeof url === 'object' && url !== null && typeof url.value === 'string' && url.value) return url.value;
  return `https://picsum.photos/seed/${productId}/600/800`;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const firstVariant = product.variants?.[0];
  const firstSize = firstVariant?.sizes?.[0];

  const imageUrl = getSafeUrl(firstVariant?.imageUrls?.[0], product.id);
  const hoverImageUrl = firstVariant?.imageUrls?.[1] ? getSafeUrl(firstVariant.imageUrls[1], product.id) : null;


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
        imageUrl: imageUrl
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
            <>
              <Image
                src={imageUrl}
                alt={product.name}
                width={600}
                height={800}
                className="aspect-[3/4] w-full object-cover transition-opacity duration-300"
                priority={priority}
              />
              {hoverImageUrl && (
                <Image
                  src={hoverImageUrl}
                  alt={`${product.name} - hover view`}
                  width={600}
                  height={800}
                  className="hidden md:block absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="aspect-[3/4] w-full bg-secondary flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No Image</span>
            </div>
          )}
          {product.mrp && product.mrp > product.price && (
             <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded z-10">
                - {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
            </div>
          )}
          {hasStock && (
            <>
              {/* Desktop-only hover button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to cart`}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-11/12 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10 hidden md:inline-flex"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              
              {/* Mobile-only plus button */}
              <Button
                size="icon"
                variant="secondary"
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to cart`}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full md:hidden z-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="pt-2 text-left">
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <h3 className="text-sm font-semibold h-8 line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline justify-start gap-1">
            <p className="text-sm font-semibold text-foreground">₹{product.price.toFixed(2)}</p>
            {product.mrp && product.mrp > product.price && (
              <p className="text-xs text-muted-foreground line-through">
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
