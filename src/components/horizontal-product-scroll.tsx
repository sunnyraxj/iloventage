
'use client';

import { useEffect, useRef } from 'react';
import { animate, scroll } from 'motion';
import type { Product } from '@/lib/types';
import Link from 'next/link';

interface HorizontalProductScrollProps {
  products: Product[];
}

export function HorizontalProductScroll({ products }: HorizontalProductScrollProps) {
  const containerRef = useRef<HTMLElement>(null);
  const groupRef = useRef<HTMLUListElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !groupRef.current || !progressRef.current) return;

    const group = groupRef.current;
    const items = group.querySelectorAll('li');
    if (items.length === 0) return;

    // Horizontal scroll animation for the product group
    const scrollAnimation = animate(
      group,
      { transform: ['none', `translateX(-${(items.length - 1) * 100}vw)`] },
      { easing: 'linear' }
    );
    
    // Link the animation to the vertical scroll of the container
    scroll(scrollAnimation, {
      target: containerRef.current,
    });
    
    // Animate the progress bar based on the same container scroll
    scroll(animate(progressRef.current, { scaleX: [0, 1] }), {
        target: containerRef.current,
    });
    
  }, [products]); // Rerun effect if products change

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="relative bg-background">
        <header className="flex h-[20vh] items-center justify-center text-center">
            <div>
                <h2 className="text-4xl font-bold tracking-tighter md:text-6xl">
                Highlighted Collection
                </h2>
                <p className="mt-4 text-muted-foreground">Scroll to explore our hand-picked selection.</p>
            </div>
        </header>

        <section ref={containerRef} className="relative h-[500vh]">
            <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
                <ul
                    ref={groupRef}
                    className="flex h-full items-center"
                    style={{ width: `${products.length * 100}vw` }}
                >
                {products.map((product) => {
                    const imageUrl = product.variants?.[0]?.imageUrls?.[0] || `https://picsum.photos/seed/${product.id}/400/533`;
                    return (
                        <li
                            key={product.id}
                            className="flex h-screen w-screen flex-shrink-0 flex-col items-center justify-center"
                        >
                            <Link href={`/products/${product.id}`} className="group block text-center">
                                <div className="relative w-72 h-96 md:w-80 md:h-[426px] overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                    <img
                                        src={imageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        width={400}
                                        height={533}
                                        loading="lazy"
                                    />
                                </div>
                                <h3 className="mt-4 text-xl font-semibold">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">{product.brand || 'ILV'}</p>
                            </Link>
                        </li>
                    );
                })}
                </ul>
            </div>
        </section>
        
        {/* Progress Bar */}
        <div ref={progressRef} className="fixed left-0 right-0 h-1.5 bg-primary bottom-0 origin-left z-50" />
    </div>
  );
}
