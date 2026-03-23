
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { getCategories, getProducts, getStoreSettings, getAllProducts } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RealtimeProductSearch } from '@/components/realtime-product-search';

export const revalidate = 600; // Revalidate every 10 minutes

export default async function HomePage() {
  const [searchableProducts, categories, settings, allProducts] = await Promise.all([
    getProducts({ limit: 24 }),
    getCategories(),
    getStoreSettings(),
    getAllProducts(),
  ]);

  const heroImageUrl = settings?.storeDetails?.heroImageUrl || 'https://picsum.photos/seed/hero/1600/900';
  const totalProductCount = allProducts.length;

  const categoryProductCounts = (categories || []).reduce((acc, category) => {
    acc[category.id] = (allProducts || []).filter(p => p.collectionIds?.includes(category.id)).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full md:h-[80vh]">
          <Image
            src={heroImageUrl}
            alt="Latest Collection"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container mx-auto px-4 text-center text-white">
              <p className="mb-2 font-semibold tracking-widest uppercase text-white/80">
                Latest Collection
              </p>
              <h1 className="mb-6 font-headline text-4xl font-bold md:text-6xl lg:text-7xl drop-shadow-md">
                Timeless Vintage,<br /> Modern Style.
              </h1>
              <Button asChild size="lg" className="rounded-full font-semibold tracking-wider">
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-6 text-left">
                <h2 className="font-headline text-xl font-bold uppercase tracking-wider">
                    Shop by Category
                </h2>
                <p className="-mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    Curated Collections
                </p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(categories || []).slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className={'group relative block w-3/5 flex-shrink-0 overflow-hidden rounded-lg aspect-[3/4] md:w-[calc(100%/3.5)] lg:w-[calc(100%/4.5)]'}
                >
                  <img
                      src={category.imageUrl || `https://picsum.photos/seed/${category.id}/400/533`}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-bold text-lg drop-shadow-sm">{category.name}</h3>
                      <p className="text-sm drop-shadow-sm">{categoryProductCounts[category.id] || 0} Products</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <RealtimeProductSearch initialProducts={searchableProducts} totalProductCount={totalProductCount} />
        
      </main>
      <Footer />
    </div>
  );
}
