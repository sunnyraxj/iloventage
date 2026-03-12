
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/data';
import { ProductDetailsView } from './ProductDetailsView';
import { ProductCard } from '@/components/product-card';

// Force dynamic rendering to ensure the latest product data is fetched
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // The "slug" param is now treated as the product ID
  const productId = params.slug;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <main className="flex-1 bg-secondary">
      <ProductDetailsView product={product} />
    </main>
  );
}
