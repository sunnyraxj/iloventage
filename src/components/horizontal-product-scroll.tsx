'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, scroll } from 'motion';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';

interface HorizontalProductScrollProps {
  products: Product[];
}

export function HorizontalProductScroll({ products }: HorizontalProductScrollProps) {
  const containerRef = useRef<HTMLElement>(null);
  const groupRef = useRef<HTMLUListElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !groupRef.current || !progressRef.current || hasMounted === false) {
      return;
    }

    const group = groupRef.current;
    
    const itemsPerScreen = isMobile ? 1 : 3;
    const numItems = products.length;
    
    // We can only scroll if we have more items than fit on screen
    if (numItems <= itemsPerScreen) {
        if (progressRef.current) progressRef.current.style.transform = 'scaleX(0)';
        if (groupRef.current) {
            groupRef.current.style.transform = 'none';
            // Center the items if they don't fill the screen
            group.classList.add('justify-center');
        }
        return;
    } else {
        group.classList.remove('justify-center');
    }
    
    const numScrollSteps = numItems - itemsPerScreen;
    const itemWidthVw = 100 / itemsPerScreen;
    const scrollDistanceVw = numScrollSteps * itemWidthVw;

    // Horizontal scroll animation for the product group
    const scrollAnimation = animate(
      group,
      { transform: ['none', `translateX(-${scrollDistanceVw}vw)`] }
    );
    
    // Link the animation to the vertical scroll of the container
    const stopScrolling = scroll(scrollAnimation, {
      target: containerRef.current,
    });
    
    // Animate the progress bar based on the same container scroll
    const stopProgressAnimation = scroll(animate(progressRef.current, { scaleX: [0, 1] }), {
        target: containerRef.current,
    });

    return () => {
        stopScrolling();
        stopProgressAnimation();
    }
    
  }, [products, isMobile, hasMounted]);

  if (!products || products.length === 0) {
    return null;
  }

  const itemsPerScreen = (hasMounted === false) ? 1 : (isMobile ? 1 : 3);
  const itemWidthVw = 100 / itemsPerScreen;
  const groupWidthVw = products.length * itemWidthVw;

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

        <section ref={containerRef} className="relative h-[200vh]">
            <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
                <ul
                    ref={groupRef}
                    className="flex h-full items-center"
                    style={{ width: `${groupWidthVw}vw` }}
                >
                {products.map((product) => {
                    const imageUrl = product.variants?.[0]?.imageUrls?.[0] || `https://picsum.photos/seed/${product.id}/400/533`;
                    return (
                        <li
                            key={product.id}
                            className="flex h-screen flex-shrink-0 flex-col items-center justify-center px-4"
                            style={{ width: `${itemWidthVw}vw` }}
                        >
                            <Link href={`/products/${product.id}`} className="group block">
                                <div className="relative w-72 h-96 md:w-80 md:h-[426px] overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                    <img
                                        src={imageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        width={400}
                                        height={533}
                                        loading="lazy"
                                    />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="rounded-xl border border-white/20 bg-black/30 p-4 backdrop-blur-lg">
                                            <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                                            <p className="text-sm text-white/80">{product.brand || 'ILV'}</p>
                                        </div>
                                    </div>
                                </div>
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
