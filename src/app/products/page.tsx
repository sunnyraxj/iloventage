
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProducts, getCategories } from '@/lib/data';
import type { Product, Category } from '@/lib/types';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Filter, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProductFilters } from './components/ProductFilters';


export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [colorFilters, setColorFilters] = useState<string[]>([]);
  const [sizeFilters, setSizeFilters] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 0]);

  // Derived data for filters
  const { uniqueColors, uniqueSizes, maxPrice } = useMemo(() => {
    if (!products.length) return { uniqueColors: [], uniqueSizes: [], maxPrice: 0 };
    
    const colors = new Set<string>();
    const sizes = new Set<string>();
    let max = 0;

    products.forEach(product => {
      if (product.price > max) max = product.price;
      product.variants?.forEach(variant => {
        colors.add(variant.color);
        variant.sizes.forEach(size => {
          sizes.add(size.size);
        });
      });
    });
    
    return {
      uniqueColors: Array.from(colors).sort(),
      uniqueSizes: Array.from(sizes).sort(),
      maxPrice: Math.ceil(max)
    };
  }, [products]);

  useEffect(() => {
    async function fetchProductsAndCategories() {
      setLoading(true);
      const [allProducts, allCategories] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setCategories(allCategories);

      const max = allProducts.reduce((acc, p) => p.price > acc ? p.price : acc, 0);
      setPriceRange([0, Math.ceil(max)]);

      setLoading(false);
    }
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    let tempProducts = [...products];

    // Search filter
    if (searchTerm) {
        tempProducts = tempProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Gender filter
    if (genderFilter !== 'all') {
      tempProducts = tempProducts.filter(p => p.gender === genderFilter);
    }
    
    // Category filter
    if (categoryFilters.length > 0) {
      tempProducts = tempProducts.filter(p => categoryFilters.includes(p.collectionId));
    }
    
    // Color filter
    if (colorFilters.length > 0) {
        tempProducts = tempProducts.filter(p => 
            p.variants?.some(v => colorFilters.includes(v.color))
        );
    }

    // Size filter
    if (sizeFilters.length > 0) {
        tempProducts = tempProducts.filter(p => 
            p.variants?.some(v => v.sizes.some(s => sizeFilters.includes(s.size)))
        );
    }
    
    // Price filter
    tempProducts = tempProducts.filter(p => p.price <= priceRange[1]);
    
    setFilteredProducts(tempProducts);
    setVisibleCount(20); // Reset visible count on filter change
  }, [searchTerm, genderFilter, categoryFilters, colorFilters, sizeFilters, priceRange, products]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setCategoryFilters(prev => checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId));
  }

  const handleColorChange = (color: string, checked: boolean) => {
    setColorFilters(prev => checked ? [...prev, color] : prev.filter(c => c !== color));
  }

  const handleSizeChange = (size: string, checked: boolean) => {
    setSizeFilters(prev => checked ? [...prev, size] : prev.filter(s => s !== size));
  }

  const loadMoreProducts = () => {
    setVisibleCount(prevCount => prevCount + 20);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
    setCategoryFilters([]);
    setColorFilters([]);
    setSizeFilters([]);
    setPriceRange([0, maxPrice]);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
            <h1 className="mb-6 font-headline text-3xl font-bold md:text-4xl text-left">All Products</h1>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                {/* Desktop Filters */}
                <aside className="hidden md:block md:col-span-1">
                    <div className="sticky top-24 rounded-lg bg-background p-6 shadow-sm">
                        <Collapsible defaultOpen={true}>
                             <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Filters</h2>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-9 p-0">
                                        <ChevronsUpDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle filters</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="mt-4 data-[state=closed]:mt-0">
                                <ProductFilters
                                    categories={categories}
                                    genderFilter={genderFilter}
                                    onGenderChange={setGenderFilter}
                                    categoryFilters={categoryFilters}
                                    onCategoryChange={handleCategoryChange}
                                    colors={uniqueColors}
                                    sizes={uniqueSizes}
                                    priceRange={priceRange}
                                    maxPrice={maxPrice}
                                    colorFilters={colorFilters}
                                    sizeFilters={sizeFilters}
                                    onPriceChange={setPriceRange}
                                    onColorChange={handleColorChange}
                                    onSizeChange={handleSizeChange}
                                />
                                <Button variant="ghost" onClick={clearFilters} className="w-full justify-start mt-4">Clear All Filters</Button>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </aside>

                <div className="md:col-span-3">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filters
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                                    <SheetHeader>
                                        <SheetTitle>Filters</SheetTitle>
                                    </SheetHeader>
                                    <div className="p-4">
                                        <ProductFilters
                                            categories={categories}
                                            genderFilter={genderFilter}
                                            onGenderChange={setGenderFilter}
                                            categoryFilters={categoryFilters}
                                            onCategoryChange={handleCategoryChange}
                                            colors={uniqueColors}
                                            sizes={uniqueSizes}
                                            priceRange={priceRange}
                                            maxPrice={maxPrice}
                                            colorFilters={colorFilters}
                                            sizeFilters={sizeFilters}
                                            onPriceChange={setPriceRange}
                                            onColorChange={handleColorChange}
                                            onSizeChange={handleSizeChange}
                                        />
                                         <Button variant="ghost" onClick={clearFilters} className="w-full justify-start mt-4">Clear All Filters</Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="w-full rounded-lg bg-background pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {loading ? (
                         <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="aspect-[3/4] w-full" />
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-5 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                         <p className="text-sm text-muted-foreground mb-4">{filteredProducts.length} products found.</p>
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.slice(0, visibleCount).map((product, index) => (
                                    <ProductCard 
                                      key={product.id} 
                                      product={product} 
                                      priority={index < 3}
                                    />
                                ))
                            ) : (
                                <p className="col-span-full text-center py-10 text-muted-foreground">No products found for the selected filters.</p>
                            )}
                        </div>
                        {filteredProducts.length > visibleCount && (
                            <div className="mt-8 text-center">
                                <Button onClick={loadMoreProducts} variant="outline">
                                    Load More
                                </Button>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
