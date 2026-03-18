'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, ProductVariant, ProductSize } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Minus, Plus, ShoppingBag, Download } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Skeleton } from '@/components/ui/skeleton';

interface ProductDetailsViewProps {
    product: Product;
}

export function ProductDetailsView({ product }: ProductDetailsViewProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  
  const [api, setApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => api && setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => { api && api.off("select", onSelect) };
  }, [api]);
  
  // Memoize initial variant and size selection to prevent re-renders
  const initialSelections = useMemo(() => {
    if (!product) return { variant: null, size: null };

    const firstVariant = product.variants[0];
    const firstAvailableSize = firstVariant?.sizes.find(s => s.stock > 0) || null;
    return { variant: firstVariant, size: firstAvailableSize };
  }, [product]);

  // Effect for synchronizing variant and size selections when product data changes
  useEffect(() => {
      if (!product) return;
  
      // Set initial selections once
      if (!selectedVariant) {
        setSelectedVariant(initialSelections.variant);
        setSelectedSize(initialSelections.size);
      }
  
      // Validate and update selections if they become invalid (e.g. out of stock)
      const currentVariantIsValid = product.variants.some(v => v.color === selectedVariant?.color);
      const newVariant = currentVariantIsValid ? selectedVariant! : initialSelections.variant;
      
      const currentSizeIsValid = newVariant?.sizes.some(s => s.size === selectedSize?.size && s.stock > 0);
      const newSize = currentSizeIsValid ? selectedSize : newVariant?.sizes.find(s => s.stock > 0) || null;

      if (newVariant?.color !== selectedVariant?.color) {
        setSelectedVariant(newVariant);
        api?.scrollTo(0, true);
      }
      
      if (newSize?.size !== selectedSize?.size || newSize?.stock !== selectedSize?.stock) {
        setSelectedSize(newSize);
      }
      
      setQuantity(product.moq || 1);
      
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, initialSelections, api]);

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    api?.scrollTo(0, true);
    const firstAvailableSize = variant.sizes.find(s => s.stock > 0);
    setSelectedSize(firstAvailableSize || null);
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    if (newQuantity >= product.moq) {
        setQuantity(newQuantity);
    } else {
        setQuantity(product.moq);
    }
  };

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

  const handleBuyNow = () => {
    if (!product || !selectedVariant || !selectedSize || selectedSize.stock === 0) {
        toast({
            variant: "destructive",
            title: "Cannot buy now",
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
    router.push('/checkout');
  }

  const stockForSelectedSize = selectedSize?.stock ?? 0;
  const canAddToCart = stockForSelectedSize > 0;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 rounded-lg bg-background p-4 shadow-sm md:grid-cols-5 md:gap-12 md:p-8">
            {/* Image Gallery */}
            <div className="grid grid-cols-1 gap-4 md:col-span-3">
                <Carousel setApi={setApi} className="w-full">
                    <CarouselContent>
                        {selectedVariant?.imageUrls.map((url, index) => (
                            <CarouselItem key={index}>
                                <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary">
                                    <img
                                        src={url || `https://picsum.photos/seed/${product.id}/600/800`}
                                        alt={`${product.name} - ${selectedVariant?.color} image ${index + 1}`}
                                        width={600}
                                        height={800}
                                        className="h-full w-full object-cover"
                                        loading={index === 0 ? "eager" : "lazy"}
                                        decoding="async"
                                    />
                                    <Button
                                        asChild
                                        size="icon"
                                        variant="secondary"
                                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                        <a href={url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Download image</span>
                                        </a>
                                    </Button>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2" />
                </Carousel>
                <div className="grid grid-cols-5 gap-2">
                    {selectedVariant?.imageUrls.map((url, i) => {
                        if (!url) return null;

                        return (
                            <div 
                                key={i} 
                                onClick={() => api?.scrollTo(i)}
                                className={cn(
                                    "aspect-[3/4] w-full overflow-hidden rounded-md border-2 cursor-pointer",
                                    currentSlide === i ? 'border-primary' : 'border-transparent hover:border-primary'
                                )}
                            >
                                <img
                                    src={url}
                                    alt={`${product.name} - ${selectedVariant?.color} thumbnail ${i+1}`}
                                    width={150}
                                    height={200}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col space-y-4 md:col-span-2 md:space-y-6">
                <h1 className="font-headline text-2xl font-bold md:text-3xl">{product.name}</h1>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold text-primary">₹{product.price.toFixed(2)}</p>
                    {product.mrp && product.mrp > product.price && (
                    <>
                        <p className="text-lg text-muted-foreground line-through">₹{product.mrp.toFixed(2)}</p>
                        <p className="text-sm font-bold text-green-600">({Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF)</p>
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
                                    className={cn("h-8 w-8 rounded-full border-2 relative", { 
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
                
                <div className="space-y-4 pt-2">
                    <div>
                        <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                        <div className="flex items-center rounded-md border w-28 mt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10"
                                onClick={() => handleQuantityChange(Math.max(product.moq, quantity - 1))}
                                disabled={quantity <= product.moq}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                                onBlur={(e) => { if (Number(e.target.value) < product.moq) { setQuantity(product.moq); } }}
                                className="h-10 w-full border-0 bg-transparent text-center text-base shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                min={product.moq}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10"
                                onClick={() => handleQuantityChange(quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Min. order: {product.moq}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button size="lg" variant="outline" className="w-full" onClick={handleAddToCart} disabled={!canAddToCart}>
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                        <Button size="lg" className="w-full" onClick={handleBuyNow} disabled={!canAddToCart}>
                            Buy Now
                        </Button>
                    </div>
                </div>

                {hasMounted ? (
                    <div className="space-y-6 pt-4">
                        {selectedSize && (
                            <div>
                                <p className="text-lg">Size {selectedSize.size}</p>
                            </div>
                        )}
                
                        <div>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">Note:</span> Sizes are mentioned as Waist × Length (in inches). Colour may vary slightly due to lighting and screen settings.
                            </p>
                        </div>
                
                        <div className="space-y-2">
                            <h3 className="text-base font-semibold">Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
                        </div>
                
                        {product.additionalDetails && product.additionalDetails.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold">Additional Details</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                    {product.additionalDetails.map((detail, index) => <li key={index}>{detail}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full mt-4 space-y-6">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
