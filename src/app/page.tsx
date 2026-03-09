import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getCategories, getFeaturedProducts } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CategoryCard } from '@/components/category-card';

export default function HomePage() {
  const featuredProducts = getFeaturedProducts();
  const categories = getCategories();
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image');

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full text-white">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center">
            <h1 className="mb-4 font-headline text-4xl font-bold md:text-6xl">
              Style for Every Story
            </h1>
            <p className="mb-8 max-w-2xl text-lg md:text-xl">
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-8">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="text-center font-headline text-3xl font-bold uppercase tracking-wider">
                New Products
              </h2>
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                Fresh Arrivals
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
