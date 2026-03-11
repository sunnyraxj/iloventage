
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/data';
import { ProductDetailsView } from './ProductDetailsView';
import { ProductCard } from '@/components/product-card';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // The "slug" param is now treated as the product ID
  const productId = params.slug;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  // Fetch related products
  const allProducts = await getProducts();
  const relatedProducts = allProducts
    .filter(p => p.collectionId === product.collectionId && p.id !== product.id)
    .slice(0, 4);

  return (
    <main className="flex-1 bg-secondary">
      <ProductDetailsView product={product} />

      {relatedProducts.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-left font-headline text-2xl font-bold md:text-3xl">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
              {relatedProducts.map((p, index) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  priority={index < 4}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
