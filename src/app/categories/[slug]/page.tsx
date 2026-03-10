
'use client';

import { useState, useEffect } from 'react';
import { getCategoryBySlug } from '@/lib/data';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import { collection, onSnapshot, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/config';

function docToProduct(doc: DocumentData): Product {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    } as Product;
}


export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    async function fetchCategoryData() {
      if (!slug) return;
      setLoading(true);
      try {
        const categoryData = await getCategoryBySlug(slug);
        if (!categoryData) {
          notFound();
          return;
        }
        setCategory(categoryData);
        
        const q = query(
            collection(db, 'products'), 
            where('collectionId', '==', categoryData.id),
            where('isVisible', '==', true)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const categoryProducts = snapshot.docs.map(docToProduct);
          setProducts(categoryProducts);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching category products:", error);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting up category page:", error);
        setLoading(false);
        notFound();
      }
    }

    fetchCategoryData();
    return () => unsubscribe();
  }, [slug]);

  return (
    <>
      <main className="flex-1">
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : category ? (
          <section className="relative h-48 w-full bg-secondary">
            {category.imageUrl && (
              <img 
                src={category.imageUrl}
                alt={category.name}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center text-white">
                <h1 className="font-headline text-4xl font-bold">{category.name}</h1>
                {category.description && <p className="mt-2 max-w-2xl">{category.description}</p>}
            </div>
          </section>
        ) : null}

        <div className="bg-secondary">
            <div className="container mx-auto px-4 py-8 md:py-12">
                {loading ? (
                    <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="aspect-[3/4] w-full" />
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-5 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
                        {products.length > 0 ? (
                            products.map((product, index) => (
                                <ProductCard 
                                  key={product.id} 
                                  product={product} 
                                  priority={index < 4}
                                />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-muted-foreground">No products found in this category yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
      </main>
    </>
  );
}
