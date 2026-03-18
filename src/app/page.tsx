

import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { getCategories, getProducts, getStoreSettings, getAllProducts } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroImageGrid } from '@/components/hero-image-grid';
import { RealtimeProductSearch } from '@/components/realtime-product-search';

export const revalidate = 600; // Revalidate every 10 minutes

export default async function HomePage() {
  const [productsForGrid, searchableProducts, categories, settings, allProducts] = await Promise.all([
    getProducts({ limit: 12 }),
    getProducts({ limit: 24 }),
    getCategories(),
    getStoreSettings(),
    getAllProducts(),
  ]);

  const heroImageUrl = settings?.storeDetails?.heroImageUrl || 'https://picsum.photos/seed/hero/1600/900';
  const totalProductCount = allProducts.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 pb-12 -mt-16 pt-32 md:-mt-20 md:pt-36">
            <div className="grid grid-cols-1 items-center gap-8 md:gap-16 md:grid-cols-2">
                <div className="text-center md:text-left order-2 md:order-1">
                      <p className="mb-4 font-semibold tracking-widest uppercase text-primary">Premium Selection</p>
                      <h1 className="mb-6 font-headline text-4xl font-bold md:text-6xl lg:text-7xl">
                        Timeless Vintage,<br /> Modern Style.
                      </h1>
                      <p className="max-w-md mx-auto md:mx-0 text-muted-foreground mb-8 text-lg">
                        Discover curated collections of high-quality apparel that blend classic designs with a modern twist.
                      </p>
                      <div className="flex justify-center md:justify-start gap-4">
                        <Button asChild size="lg" className="rounded-full font-semibold tracking-wider">
                            <Link href="/products">Shop Now</Link>
                        </Button>
                          <Button asChild size="lg" variant="outline" className="rounded-full font-semibold tracking-wider">
                            <Link href="/categories">View Collections</Link>
                        </Button>
                      </div>
                </div>
                <div className="order-1 md:order-2">
                    <HeroImageGrid products={productsForGrid} fallbackImageUrl={heroImageUrl} />
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
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className={'group block w-3/5 flex-shrink-0 md:w-[calc(100%/3.5)] lg:w-[calc(100%/4.5)]'}
                >
                  <div className="overflow-hidden rounded-lg aspect-[3/4]">
                    <img
                      src={category.imageUrl || `https://picsum.photos/seed/${category.id}/400/533`}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-2 truncate text-xs font-semibold text-foreground">
                    {category.name}
                  </h3>
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
