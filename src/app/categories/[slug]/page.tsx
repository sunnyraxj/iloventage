

import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProductsByCollectionId } from '@/lib/data';
import { CategoryProductsView } from './CategoryProductsView';

export const revalidate = 600; // Revalidate every 10 minutes

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCollectionId(category.id);

  return (
    <>
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
            <>
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
              
              <CategoryProductsView initialProducts={products} />
            </>
        </div>
      </main>
    </>
  );
}
