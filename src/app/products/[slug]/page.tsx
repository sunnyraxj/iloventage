import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductDetails } from './_components/product-details';

export default async function ProductPage({ params }: { params: { slug:string } }) {
  
  const product = await getProductBySlug(params.slug);

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
