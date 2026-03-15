
'use client';

import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import React, { useRef, useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

const Typewriter = ({ className }: { className?: string }) => {
  const text = "Scroll to Reveal";
  const textArray = Array.from(text);
  
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.5 },
    },
  };

  const child = {
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 12, stiffness: 100 } },
    hidden: { opacity: 0, y: 20 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn("flex items-center justify-center font-mono text-xl md:text-3xl font-medium tracking-widest", className)}
    >
      {textArray.map((char, index) => (
        <motion.span key={index} variants={child}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
      <motion.span
        className="ml-2 h-7 w-0.5 bg-black"
        aria-hidden="true"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
};


interface CinematicScrollProps {
  children: React.ReactNode;
  products: Product[];
}

export function CinematicScroll({ children, products }: CinematicScrollProps) {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // On mount, check if the intro has already been played in this session.
    if (sessionStorage.getItem('introPlayed') === 'true') {
      setAnimationComplete(true);
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // This event listener tracks the scroll progress. When the end is reached,
  // it marks the animation as complete and saves the state to sessionStorage.
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest >= 0.98) {
      setTimeout(() => {
        if (sessionStorage.getItem('introPlayed') !== 'true') {
          sessionStorage.setItem('introPlayed', 'true');
        }
        setAnimationComplete(true);
      }, 200); // A small delay to ensure the animation finishes smoothly
    }
  });
  
  // This effect scrolls the user to the top of the page once the animation is complete.
  useEffect(() => {
    if (animationComplete) {
      // Restore body scroll and scroll to top
      document.body.style.overflow = 'auto';
      window.scrollTo(0, 0);
    } else {
      // Disable body scroll during the animation sequence
      document.body.style.overflow = 'hidden';
    }
    // Cleanup function to restore scrolling if the component unmounts unexpectedly
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [animationComplete]);

  // Define animation ranges based on scroll progress (0 to 1)
  const whiteScreenOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const heroTextOpacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);
  const heroTextY = useTransform(scrollYProgress, [0.1, 0.25], ['5%', '0%']);
  const backgroundColor = useTransform(
    scrollYProgress,
    [0.25, 0.35, 0.8, 0.9],
    ['hsl(var(--background))', '#000000', '#000000', 'hsl(var(--background))']
  );
  const productsOpacity = useTransform(scrollYProgress, [0.35, 0.5], [0, 1]);
  const productsScale = useTransform(scrollYProgress, [0.35, 0.55], [0.8, 1]);
  const finalContentOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 1]);
  
  // If the animation is complete, just render the homepage content.
  if (animationComplete) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1}} transition={{ duration: 0.5 }}>{children}</motion.div>;
  }

  // Fallback images if products aren't loaded yet
  const firstProductImage = products[0]?.variants[0]?.imageUrls[0] || 'https://picsum.photos/seed/p1/600/800';
  const secondProductImage = products[1]?.variants[0]?.imageUrls[0] || 'https://picsum.photos/seed/p2/600/800';

  return (
    <div ref={containerRef} className="relative h-[600vh] w-full bg-background">
        {/* This div is the main animation stage. It's sticky, so it stays in view while the parent scrolls. */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Animated background layer */}
          <motion.div style={{ backgroundColor }} className="absolute inset-0 z-10" />
          
          {/* Layer 1: White screen with typewriter text */}
          <motion.div style={{ opacity: whiteScreenOpacity }} className="absolute inset-0 z-50 flex items-center justify-center bg-white pointer-events-none">
            <Typewriter />
          </motion.div>

          {/* Layer 2: Hero headline text */}
          <motion.div style={{ opacity: heroTextOpacity, y: heroTextY }} className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
             <div className="text-center text-white">
                 <p className="mb-4 font-semibold tracking-widest uppercase text-orange-300">Premium Selection</p>
                 <h1 className="mb-6 font-headline text-4xl font-bold md:text-6xl lg:text-7xl">
                    Timeless Vintage,<br /> Modern Style.
                 </h1>
             </div>
          </motion.div>
          
          {/* Layer 3: Product images with glow effects */}
          <motion.div 
            style={{ opacity: productsOpacity, scale: productsScale }} 
            className="fixed inset-0 z-30 flex items-center justify-center gap-8 md:gap-16 pointer-events-none"
          >
            <div className="relative group">
                <img src={firstProductImage} alt="Showcased Product 1" className="w-48 h-64 md:w-72 md:h-96 object-cover rounded-lg shadow-2xl"/>
                <div className="absolute -inset-4 bg-purple-500/50 rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-300 animate-[pulse_5s_infinite]"/>
            </div>
            <div className="relative group">
                <img src={secondProductImage} alt="Showcased Product 2" className="w-48 h-64 md:w-72 md:h-96 object-cover rounded-lg shadow-2xl"/>
                <div className="absolute -inset-4 bg-pink-500/50 rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-300 animate-[pulse_5s_infinite_0.5s]"/>
            </div>
          </motion.div>
            
          {/* Layer 4: The final homepage content, which fades in at the end of the scroll */}
          <motion.div style={{ opacity: finalContentOpacity }} className="relative z-20 h-full">
            {children}
          </motion.div>
        </div>
      </div>
  );
}
