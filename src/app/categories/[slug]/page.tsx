'use client';

import { useState, useEffect } from 'react';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import { collection, onSnapshot, query, where, DocumentData, getDocs, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

function docToProduct(doc: DocumentData): Product {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    } as Product;
}

function docToCategory(doc: DocumentData): Category {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    } as Category;
}


export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let productsUnsubscribe = () => {};

    if (!slug) {
        setLoading(false);
        setCategory(null);
        return;
    };

    setLoading(true);

    const findCategoryAndFetchProducts = async () => {
        const categoryQuery = query(collection(db, 'collections'), where('slug', '==', slug), limit(1));
        try {
            const categorySnapshot = await getDocs(categoryQuery);
            
            if (categorySnapshot.empty) {
                setLoading(false);
                setCategory(null); // This will trigger notFound()
                return;
            }

            const foundCategory = docToCategory(categorySnapshot.docs[0]);

            setCategory(foundCategory);

            const productsQuery = query(
                collection(db, 'products'),
                where('collectionId', '==', foundCategory.id)
            );

            productsUnsubscribe = onSnapshot(productsQuery, (productsSnapshot) => {
                const categoryProducts = productsSnapshot.docs.map(docToProduct);
                setProducts(categoryProducts);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching category products:", error);
                setLoading(false);
            });
        } catch (error) {
            console.error("Error fetching category:", error);
            setLoading(false);
            setCategory(null);
        }
    };

    findCategoryAndFetchProducts();

    return () => {
        productsUnsubscribe();
    };
}, [slug]);

  if (category === null) {
      notFound();
  }

  return (
    <>
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {loading || category === undefined ? (
            <>
              <Skeleton className="mb-8 h-10 w-1/3" />
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
            </>
          ) : (
            <>
              {category && (
                <div className="mb-8 text-left">
                  <h1 className="font-headline text-3xl font-bold md:text-4xl">
                    {category.name}
                  </h1>
                  {category.description && (
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
              )}
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
                  <p className="col-span-full text-center text-muted-foreground">
                    No products found in this category yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
