
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';
import { Search } from 'lucide-react';

interface RealtimeProductSearchProps {
  initialProducts: Product[];
}

export function RealtimeProductSearch({ initialProducts }: RealtimeProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return initialProducts;
    }
    return initialProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, initialProducts]);

  return (
    <section className="bg-secondary py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-left max-w-lg">
          <h2 className="font-headline text-xl font-bold uppercase tracking-wider">
            Search Our Products
          </h2>
          <p className="-mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Find what you're looking for
          </p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by product name or brand..."
              className="w-full rounded-full bg-background pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-lg font-semibold">No products found for &quot;{searchTerm}&quot;</p>
            <p>Try searching for something else.</p>
          </div>
        )}
      </div>
    </section>
  );
}
