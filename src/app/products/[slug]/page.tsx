

import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/data';
import { ProductDetailsView } from './ProductDetailsView';
import { ProductCard } from '@/components/product-card';

// Revalidate this page every 10 minutes
export const revalidate = 600;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // The "slug" param is now treated as the product ID
  const productId = params.slug;

  const [product, otherProducts] = await Promise.all([
    getProductById(productId),
    getProducts({ limit: 5 }) // Fetch 5 products to ensure we have 4 after filtering
  ]);

  if (!product) {
    notFound();
  }

  // Filter out the current product from the list of 'other' products
  const relatedProducts = otherProducts.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <main className="flex-1 bg-secondary">
      <ProductDetailsView product={product} />
      
      {relatedProducts.length > 0 && (
        <section className="bg-background py-12 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-left font-headline text-xl font-bold uppercase tracking-wider">
              Related Products
            </h2>
            <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
              {relatedProducts.map((p, index) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  priority={false}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
