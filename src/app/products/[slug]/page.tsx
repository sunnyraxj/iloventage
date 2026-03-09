'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
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

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const fetchedProduct = await getProductBySlug(slug);
      if (!fetchedProduct) {
        notFound();
        return;
      }
      setProduct(fetchedProduct);
      if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
        setSelectedVariant(fetchedProduct.variants[0]);
        const firstAvailableSize = fetchedProduct.variants[0].sizes.find(s => s.stock > 0);
        setSelectedSize(firstAvailableSize || null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
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
        imageUrl: selectedVariant.imageUrls[0] || '/placeholder.svg'
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
                    <Image
                        src={selectedVariant?.imageUrls[0] || '/placeholder.svg'}
                        alt={`${product.name} - ${selectedVariant?.color}`}
                        width={800}
                        height={800}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {selectedVariant?.imageUrls.map((url, i) => (
                        <div key={i} className="aspect-square w-full overflow-hidden rounded-md border-2 border-transparent hover:border-primary">
                             <Image
                                src={url}
                                alt={`${product.name} - ${selectedVariant?.color} thumbnail ${i+1}`}
                                width={200}
                                height={200}
                                className="h-full w-full object-cover cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">{product.brand}</p>
                <h1 className="my-2 font-headline text-3xl font-bold md:text-4xl">{product.name}</h1>
                <div className="flex items-baseline gap-2 mb-4">
                    <p className="text-2xl font-semibold text-primary">₹{product.price.toFixed(2)}</p>
                    <p className="text-xl text-muted-foreground line-through">₹{product.mrp.toFixed(2)}</p>
                    <p className="text-sm font-bold text-green-600">({Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF)</p>
                </div>
                
                {/* Color Selector */}
                <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium">Color: <span className="font-bold">{selectedVariant?.color}</span></h3>
                    <div className="flex flex-wrap gap-2">
                        {product.variants.map(variant => (
                            <Button
                                key={variant.color}
                                variant="outline"
                                size="icon"
                                className={cn("h-10 w-10 rounded-full border-2", { 'border-primary ring-2 ring-primary': selectedVariant?.color === variant.color })}
                                onClick={() => handleSelectVariant(variant)}
                                style={{ backgroundColor: variant.color.toLowerCase() === 'white' ? '#f1f1f1' : variant.color.toLowerCase()}}
                                aria-label={`Select color ${variant.color}`}
                            >
                                {variant.color.toLowerCase() === 'white' && <div className="h-full w-full rounded-full border border-gray-300" />}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Size Selector */}
                <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium">Size: <span className="font-bold">{selectedSize?.size}</span></h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedVariant?.sizes.map(size => (
                             <Button
                                key={size.size}
                                variant={selectedSize?.size === size.size ? "default" : "outline"}
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
                     {selectedSize && selectedSize.stock === 0 && (
                        <p className="mt-2 text-sm text-destructive">This size is out of stock.</p>
                     )}
                </div>
                
                <p className="mb-4 text-sm text-muted-foreground">Minimum Order Quantity: {product.moq}</p>

                <Button size="lg" onClick={handleAddToCart} disabled={!canAddToCart}>
                    {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
                </Button>

                <Accordion type="single" collapsible className="w-full mt-8">
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
