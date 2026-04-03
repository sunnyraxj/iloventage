
'use client';

import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Category } from '@/lib/types';
import React from 'react';

interface CategoryCarouselProps {
    categories: Category[];
    categoryProductCounts: Record<string, number>;
}

export function CategoryCarousel({ categories, categoryProductCounts }: CategoryCarouselProps) {
    if (!categories || categories.length === 0) {
        return null;
    }

  return (
    <div className="relative">
      <Carousel
          opts={{
              align: "start",
          }}
          className="w-full"
      >
        <CarouselContent className="-ml-4">
          {categories.slice(0, 6).map((category) => (
            <CarouselItem key={category.id} className="basis-3/5 md:basis-1/3 lg:basis-1/4 pl-4">
              <Link
                href={`/categories/${category.slug}`}
                className={'group relative block w-full overflow-hidden rounded-lg aspect-[3/4]'}
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
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
        <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
      </Carousel>
    </div>
  );
}
