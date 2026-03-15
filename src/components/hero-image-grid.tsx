'use client';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { useMemo } from 'react';

// Using a Set to get unique image URLs
const getUniqueImageUrls = (products: Product[]): string[] => {
    const imageUrls = new Set<string>();
    products.forEach(p => 
        p.variants?.forEach(v => 
            v.imageUrls?.forEach(url => {
                if (url) imageUrls.add(url);
            })
        )
    );
    return Array.from(imageUrls);
}

const ImageColumn = ({
  imageUrls,
  className,
  animationClass,
}: {
  imageUrls: string[];
  className?: string;
  animationClass?: string;
}) => {
  if (imageUrls.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className={cn('flex flex-col gap-4', animationClass)}>
        {/* Duplicate images for seamless loop */}
        {[...imageUrls, ...imageUrls].map((imageUrl, index) => (
          <div key={`${imageUrl}-${index}`} className="w-full overflow-hidden rounded-lg shadow-lg aspect-square">
            <img
              src={imageUrl}
              alt={`Gallery image ${index + 1}`}
              className="h-full w-full object-cover"
              width={400}
              height={400}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};


export function HeroImageGrid({ products }: { products: Product[] }) {
  const uniqueImageUrls = useMemo(() => getUniqueImageUrls(products), [products]);

  if (uniqueImageUrls.length < 6) return null; // Ensure we have enough images

  const col1_images = uniqueImageUrls.slice(0, Math.ceil(uniqueImageUrls.length / 2));
  const col2_images = uniqueImageUrls.slice(Math.ceil(uniqueImageUrls.length / 2));

  return (
    <div className="relative hidden md:grid h-[80vh] grid-cols-2 gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)] md:h-[90vh]">
        <ImageColumn imageUrls={col1_images} animationClass="animate-scroll-up [animation-duration:35s]"/>
        <ImageColumn imageUrls={col2_images} className="pt-16" animationClass="animate-scroll-down [animation-duration:45s]" />
    </div>
  );
}
