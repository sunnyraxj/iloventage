

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getCategories, getStoreSettings, getAllProducts } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RealtimeProductSearch } from '@/components/realtime-product-search';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import type { Product } from '@/lib/types';

export const revalidate = 1800; // Revalidate every 30 minutes

// Helper function to shuffle an array deterministically based on a seed
const shuffle = <T,>(array: T[], seed: number): T[] => {
    // This is a simple pseudo-random number generator.
    const seededRandom = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;
    // We create a mutable copy of the seed to ensure the function is pure
    let currentSeed = seed; 

    const random = () => {
        currentSeed++; // Increment seed to get a new number for each shuffle step
        return seededRandom(currentSeed);
    };

    // Create a new array to avoid mutating the original
    const newArray = [...array];

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = newArray[currentIndex];
        newArray[currentIndex] = newArray[randomIndex];
        newArray[randomIndex] = temporaryValue;
    }

    return newArray;
};


export default async function HomePage() {
  // We fetch all products once, then derive the featured list from that.
  const [categories, settings, allProducts] = await Promise.all([
    getCategories(),
    getStoreSettings(),
    getAllProducts(),
  ]);

  // Use the current date as a seed for daily shuffling.
  // This ensures that every user sees the same "random" list for a given day,
  // which is great for caching and performance.
  const today = new Date();
  const dailySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Shuffle all products and take the first 24 for the featured section.
  const shuffledProducts = shuffle(allProducts || [], dailySeed);
  const searchableProducts = shuffledProducts.slice(0, 24);

  const heroImageUrl = settings?.storeDetails?.heroImageUrl || 'https://picsum.photos/seed/hero/1600/900';
  const heroVideoUrl = settings?.storeDetails?.heroVideoUrl;
  const heroSubtitle = settings?.storeDetails?.heroSubtitle || 'Latest Collection';
  const heroTitle = settings?.storeDetails?.heroTitle || 'Where Classic Meets Contemporary.';
  const totalProductCount = allProducts.length;

  const categoryProductCounts = (categories || []).reduce((acc, category) => {
    acc[category.id] = (allProducts || []).filter(p => p.collectionIds?.includes(category.id)).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 -mt-20 md:-mt-[5.5rem]">
        <section className="relative h-[60vh] w-full md:h-[80vh]">
          {heroVideoUrl ? (
            <video
              src={heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={heroImageUrl}
              alt="Latest Collection"
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center pt-20 md:pt-[5.5rem]">
            <div className="container mx-auto px-4 text-center text-white">
              <p className="mb-2 font-semibold tracking-widest uppercase text-white/80">
                {heroSubtitle}
              </p>
              <h1
                className="mb-6 font-headline text-2xl font-bold md:text-3xl lg:text-4xl drop-shadow-md"
                dangerouslySetInnerHTML={{ __html: heroTitle.replace(/\n/g, '<br />') }}
              />
              <Button asChild size="lg" className="rounded-full font-semibold tracking-wider">
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h2 className="font-headline text-xl font-bold uppercase tracking-wider">
                        Shop by Category
                    </h2>
                    <p className="-mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                        Curated Collections
                    </p>
                </div>
                <Link href="/categories" className="hidden items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80 md:flex">
                    <span>View All</span>
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            <CategoryCarousel categories={categories || []} categoryProductCounts={categoryProductCounts} />
          </div>
        </section>

        <RealtimeProductSearch initialProducts={searchableProducts} totalProductCount={totalProductCount} />
        
      </main>
      <Footer />
    </div>
  );
}
