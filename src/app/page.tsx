
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getCategories, getProducts } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroImageGrid } from '@/components/hero-image-grid';
import { HorizontalProductScroll } from '@/components/horizontal-product-scroll';
import { RealtimeProductSearch } from '@/components/realtime-product-search';
import { CinematicScroll } from '@/components/cinematic-scroll';

export default async function HomePage() {
  const [productsForGrid, searchableProducts, categories, horizontalScrollProducts] = await Promise.all([
    getProducts({ limit: 12 }),
    getProducts({ limit: 24 }),
    getCategories(),
    getProducts({ limit: 6 }),
  ]);

  const cinematicProducts = productsForGrid.slice(0, 2);

  return (
    <CinematicScroll products={cinematicProducts}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <section className="container mx-auto px-4 pt-4 pb-12 md:pt-8">
              <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
                  <div className="text-center md:text-left pt-0">
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
                  <div>
                      <HeroImageGrid products={productsForGrid} />
                  </div>
              </div>
          </section>

          <HorizontalProductScroll products={horizontalScrollProducts} />

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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className={'group block'}
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

          <RealtimeProductSearch initialProducts={searchableProducts} />
          
        </main>
        <Footer />
      </div>
    </CinematicScroll>
  );
}
