
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getCategories, getProducts, getStoreSettings } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';

export default async function HomePage() {
  const [products, categories, settings] = await Promise.all([
    getProducts(),
    getCategories(),
    getStoreSettings(),
  ]);

  // Simple logic to get some "featured" products, e.g. first 8
  const featuredProducts = products.slice(0, 8);
  const heroImageUrl =
    settings?.storeDetails?.heroImageUrl ||
    'https://picsum.photos/seed/1/1920/1080';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full text-white">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <h1 className="mb-4 font-headline text-4xl font-bold md:text-6xl [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">
              {settings?.storeDetails?.name || 'Welcome to our store'}
            </h1>
            <p className="mb-8 max-w-2xl text-lg md:text-xl [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">
              Discover curated collections that blend timeless elegance with
              modern trends.
            </p>
            <Button asChild size="lg">
              <Link href="/products">Shop Now</Link>
            </Button>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center font-headline text-3xl font-bold">
              Shop by Category
            </h2>
            <div className="grid auto-cols-[22vw] grid-flow-col gap-4 overflow-x-auto pb-4 sm:auto-cols-[18vw] md:auto-cols-auto md:grid-cols-3 md:grid-flow-row lg:grid-cols-4 -mx-4 px-4">
              {categories.map((category) => (
                <Link key={category.id} href={`/categories/${category.slug}`} className="group block">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={category.imageUrl || `https://picsum.photos/seed/${category.id}/400/400`}
                      alt={category.name}
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-center text-foreground">{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-left">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-wider">
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
