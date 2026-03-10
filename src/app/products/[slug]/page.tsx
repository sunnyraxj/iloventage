'use client';

import { notFound, useParams } from 'next/navigation';
import { getProductBySlug } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useEffect, useState } from 'react';
import type { Product, ProductVariant, ProductSize } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      const fetchedProduct = await getProductBySlug(slug);
      if (!fetchedProduct) {
        notFound();
        return;
      }
      setProduct(fetchedProduct);
      if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
        const firstVariant = fetchedProduct.variants[0];
        setSelectedVariant(firstVariant);
        
        setSelectedImageUrl(firstVariant.imageUrls?.[0] || null);

        const firstAvailableSize = firstVariant.sizes.find(s => s.stock > 0);
        setSelectedSize(firstAvailableSize || null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedImageUrl(variant.imageUrls?.[0] || null);
    const firstAvailableSize = variant.sizes.find(s => s.stock > 0);
    setSelectedSize(firstAvailableSize || null);
  }

  const handleAddToCart = () => {
    if (!product || !selectedVariant || !selectedSize || selectedSize.stock === 0) {
        toast({
            variant: "destructive",
            title: "Cannot add to cart",
            description: "Please select an available color and size.",
        });
        return;
    }

    if (quantity < product.moq) {
        toast({
            variant: "destructive",
            title: "Minimum Order Quantity",
            description: `You must order at least ${product.moq} of this product.`,
        });
        return;
    }

    const cartImageUrl = selectedVariant.imageUrls?.[0];

    const cartItem = {
        id: `${product.id}-${selectedVariant.color}-${selectedSize.size}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        color: selectedVariant.color,
        size: selectedSize.size,
        stock: selectedSize.stock,
        quantity: quantity,
        moq: product.moq,
        imageUrl: cartImageUrl || `https://picsum.photos/seed/${product.id}/200/200`
    };

    addItem(cartItem);
    toast({
        title: "Added to cart",
        description: `${product.name} (${selectedVariant.color}, ${selectedSize.size}) has been added to your cart.`
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-secondary">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-1 gap-8 rounded-lg bg-background p-8 shadow-sm md:grid-cols-2 md:gap-12">
                <div className="grid grid-cols-1 gap-4">
                    <Skeleton className="aspect-square w-full" />
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="aspect-square w-full" />
                        <Skeleton className="aspect-square w-full" />
                        <Skeleton className="aspect-square w-full" />
                        <Skeleton className="aspect-square w-full" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const stockForSelectedSize = selectedSize?.stock ?? 0;
  const canAddToCart = stockForSelectedSize > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 gap-8 rounded-lg bg-background p-4 shadow-sm md:grid-cols-2 md:gap-12 md:p-8">
            {/* Image Gallery */}
            <div className="grid grid-cols-1 gap-4">
                <div className="aspect-square w-full overflow-hidden rounded-lg">
                    <img
                        src={selectedImageUrl || `https://picsum.photos/seed/${product.id}/800/800`}
                        alt={`${product.name} - ${selectedVariant?.color}`}
                        width={800}
                        height={800}
                        className="h-full w-full object-cover"
                        loading="eager"
                    />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {selectedVariant?.imageUrls.map((url, i) => {
                        if (!url) return null;

                        return (
                            <div 
                                key={i} 
                                onClick={() => setSelectedImageUrl(url)}
                                className={cn(
                                    "aspect-square w-full overflow-hidden rounded-md border-2 cursor-pointer",
                                    selectedImageUrl === url ? 'border-primary' : 'border-transparent hover:border-primary'
                                )}
                            >
                                <img
                                    src={url}
                                    alt={`${product.name} - ${selectedVariant?.color} thumbnail ${i+1}`}
                                    width={200}
                                    height={200}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">{product.brand}</p>
                <h1 className="font-headline text-2xl font-bold md:text-3xl">{product.name}</h1>
                <div className="flex items-baseline gap-2">
                    <p className="text-xl font-semibold text-primary md:text-2xl">₹{product.price.toFixed(2)}</p>
                    {product.mrp && product.mrp > product.price && (
                      <>
                        <p className="text-base text-muted-foreground line-through md:text-lg">₹{product.mrp.toFixed(2)}</p>
                        <p className="text-xs font-bold text-green-600 md:text-sm">({Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF)</p>
                      </>
                    )}
                </div>
                
                {/* Color Selector */}
                <div>
                    <h3 className="mb-2 text-sm font-medium">Color: <span className="font-bold">{selectedVariant?.color}</span></h3>
                    <div className="flex flex-wrap gap-2">
                        {product.variants.map(variant => {
                            const isOutOfStock = variant.sizes.every(s => s.stock === 0);
                            return (
                                <Button
                                    key={variant.color}
                                    variant="outline"
                                    size="icon"
                                    disabled={isOutOfStock}
                                    className={cn("h-8 w-8 rounded-full border-2 relative md:h-10 md:w-10", { 
                                        'border-primary ring-2 ring-primary': selectedVariant?.color === variant.color,
                                        'cursor-not-allowed': isOutOfStock
                                    })}
                                    onClick={() => handleSelectVariant(variant)}
                                    style={{ backgroundColor: variant.color.toLowerCase() === 'white' ? '#f1f1f1' : variant.color.toLowerCase()}}
                                    aria-label={`Select color ${variant.color}`}
                                >
                                    {variant.color.toLowerCase() === 'white' && <div className="h-full w-full rounded-full border border-gray-300" />}
                                    {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center"><div className="h-px w-full rotate-45 bg-destructive" /><div className="h-px w-full -rotate-45 bg-destructive absolute" /></div>}
                                </Button>
                            )
                        })}
                    </div>
                </div>

                {/* Size Selector */}
                <div>
                    <h3 className="mb-2 text-sm font-medium">Size: <span className="font-bold">{selectedSize?.size || 'Select a size'}</span></h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedVariant?.sizes.map(size => (
                             <Button
                                key={size.size}
                                variant={selectedSize?.size === size.size ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedSize(size)}
                                disabled={size.stock === 0}
                                className={cn("relative", { 'disabled:bg-secondary disabled:text-muted-foreground/50': size.stock === 0})}
                            >
                                {size.size}
                                {size.stock === 0 && <div className="absolute -rotate-45 h-px w-full bg-destructive" />}
                            </Button>
                        ))}
                    </div>
                     {selectedSize && selectedSize.stock > 0 && selectedSize.stock < 10 && (
                        <p className="mt-2 text-sm text-destructive">Only {selectedSize.stock} left in stock!</p>
                     )}
                     {selectedSize === null && !selectedVariant?.sizes.every(s => s.stock === 0) && (
                        <p className="mt-2 text-sm text-muted-foreground">Please select an available size.</p>
                     )}
                     {selectedVariant?.sizes.every(s => s.stock === 0) && (
                        <p className="mt-2 text-sm text-destructive">This color is out of stock in all sizes.</p>
                     )}
                </div>
                
                <p className="text-xs text-muted-foreground md:text-sm">Minimum Order Quantity: {product.moq}</p>

                <Button size="lg" onClick={handleAddToCart} disabled={!canAddToCart}>
                    {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
                </Button>

                <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="description">
                        <AccordionTrigger>Description</AccordionTrigger>
                        <AccordionContent>
                           <p className="text-muted-foreground">{product.description}</p>
                        </AccordionContent>
                    </AccordionItem>
                     {product.additionalDetails && product.additionalDetails.length > 0 && (
                        <AccordionItem value="details">
                            <AccordionTrigger>Additional Details</AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                    {product.additionalDetails.map((detail, index) => <li key={index}>{detail}</li>)}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
