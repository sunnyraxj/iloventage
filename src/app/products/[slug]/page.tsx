'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductDetails } from './_components/product-details';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductPage({ params: { slug } }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const fetchedProduct = await getProductBySlug(slug);
      if (!fetchedProduct) {
        notFound();
        return;
      }
      setProduct(fetchedProduct);
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-secondary">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-1 gap-8 rounded-lg bg-background p-8 shadow-sm md:grid-cols-2 md:gap-12">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-12 w-1/2" />
                </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 gap-8 rounded-lg bg-background p-8 shadow-sm md:grid-cols-2 md:gap-12">
            <div className="overflow-hidden rounded-lg">
              {product.images && product.images.length > 0 && (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={600}
                  height={800}
                  className="h-full w-full object-cover aspect-[3/4]"
                />
              )}
            </div>
            <ProductDetails product={product} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
