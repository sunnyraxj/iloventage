
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getCategories, getProducts, getStoreSettings } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default async function HomePage() {
  const [featuredProducts, categories, settings] = await Promise.all([
    getProducts({ limit: 8 }),
    getCategories(),
    getStoreSettings(),
  ]);

  const heroImageUrl =
    settings?.storeDetails?.heroImageUrl ||
    'https://picsum.photos/seed/1/1920/1080';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full overflow-hidden rounded-b-2xl text-white">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={settings?.storeDetails?.name || 'Hero Image'}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              data-ai-hint="hero image"
            />
          ) : (
            <Skeleton className="h-full w-full" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center">
            <p className="mb-2 font-light tracking-[0.3em] text-sm md:text-base uppercase">Premium Selection</p>
            <h1 className="mb-6 font-headline text-4xl font-bold md:text-6xl [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">
              Timeless <span className="italic">Vintage</span><br /> Modern Style.
            </h1>
            <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-white/90 font-semibold tracking-wider">
              <Link href="/products">START SHOPPING</Link>
            </Button>
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
            <div className="grid grid-cols-4 gap-4 lg:grid-cols-6">
              {categories.slice(0, 6).map((category, index) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className={cn(
                    'group block',
                    index >= 4 && 'hidden lg:block'
                  )}
                >
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={category.imageUrl || `https://picsum.photos/seed/${category.id}/400/400`}
                      alt={category.name}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

        <section className="bg-secondary py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-left">
              <h2 className="font-headline text-xl font-bold uppercase tracking-wider">
                New Products
              </h2>
              <p className="-mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                Fresh Arrivals
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  priority={index < 4}
                />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/products">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
