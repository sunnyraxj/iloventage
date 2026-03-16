
'use client';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { useMemo } from 'react';
import Image from 'next/image';

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


export function HeroImageGrid({ products, fallbackImageUrl }: { products: Product[], fallbackImageUrl: string }) {
  const uniqueImageUrls = useMemo(() => getUniqueImageUrls(products), [products]);
  
  // Mobile Grid
  const canShowMobileGrid = uniqueImageUrls.length >= 4;
  const mobileGrid = (
    <div className="relative grid h-[60vh] grid-cols-2 gap-2 overflow-hidden [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)] md:hidden">
      <ImageColumn imageUrls={uniqueImageUrls.slice(0,2)} className="pt-8" animationClass="animate-scroll-up [animation-duration:25s]" />
      <ImageColumn imageUrls={uniqueImageUrls.slice(2,4)} animationClass="animate-scroll-down [animation-duration:30s]" />
    </div>
  );
  
  // Desktop Grid (prefer 3 columns)
  const desktopGrid = useMemo(() => {
    if (uniqueImageUrls.length >= 9) {
      const col1_images = uniqueImageUrls.slice(0, 3);
      const col2_images = uniqueImageUrls.slice(3, 6);
      const col3_images = uniqueImageUrls.slice(6, 9);
      
      return (
          <div className="relative hidden md:grid h-[80vh] grid-cols-3 gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)] md:h-[90vh]">
              <ImageColumn imageUrls={col1_images} className="pt-8" animationClass="animate-scroll-up [animation-duration:35s]" />
              <ImageColumn imageUrls={col2_images} className="pt-16" animationClass="animate-scroll-down [animation-duration:45s]" />
              <ImageColumn imageUrls={col3_images} animationClass="animate-scroll-up [animation-duration:40s]" />
          </div>
        );
    }
    
    // Fallback to 2 columns if not enough for 3, but enough for 2
    if (uniqueImageUrls.length >= 6) {
      const col1_images = uniqueImageUrls.slice(0, Math.ceil(uniqueImageUrls.length / 2));
      const col2_images = uniqueImageUrls.slice(Math.ceil(uniqueImageUrls.length / 2));
  
      return (
          <div className="relative hidden md:grid h-[80vh] grid-cols-2 gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)] md:h-[90vh]">
              <ImageColumn imageUrls={col1_images} animationClass="animate-scroll-up [animation-duration:35s]"/>
              <ImageColumn imageUrls={col2_images} className="pt-16" animationClass="animate-scroll-down [animation-duration:45s]" />
          </div>
      );
    }

    return null;
  }, [uniqueImageUrls]);

  const fallbackImage = (
     <div className="md:hidden aspect-video overflow-hidden rounded-lg">
         <Image
            src={fallbackImageUrl}
            alt="Timeless Vintage, Modern Style"
            width={1600}
            height={900}
            className="h-full w-full object-cover"
            priority
        />
    </div>
  );

  return (
    <>
      {canShowMobileGrid ? mobileGrid : fallbackImage}
      {desktopGrid}
    </>
  );
}
