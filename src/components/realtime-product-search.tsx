'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface RealtimeProductSearchProps {
  initialProducts: Product[];
  totalProductCount: number;
}

export function RealtimeProductSearch({ initialProducts, totalProductCount }: RealtimeProductSearchProps) {
  const moreProductsCount = totalProductCount - initialProducts.length;

  return (
    <section className="bg-secondary py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div className="w-full md:max-w-lg">
            <h2 className="font-headline text-xl font-bold uppercase tracking-wider">
              Featured Products
            </h2>
            <p className="-mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              A Glimpse of Our Collection
            </p>
          </div>
        </div>

        {initialProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
            {initialProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-lg font-semibold">No featured products to display.</p>
          </div>
        )}

        <div className="mt-12 text-center">
            {moreProductsCount > 0 ? (
                 <Button asChild size="lg" className="rounded-full font-semibold tracking-wider shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/50 hover:scale-105">
                    <Link href="/products">Explore {moreProductsCount.toLocaleString()} More Products</Link>
                </Button>
            ) : (
                 <Button asChild size="lg" className="rounded-full font-semibold tracking-wider shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/50 hover:scale-105">
                    <Link href="/products">View All Products</Link>
                </Button>
            )}
        </div>
      </div>
    </section>
  );
}
