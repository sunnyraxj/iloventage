
'use client';

import { useState, useEffect } from 'react';
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
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      setLoading(false);
    }
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    let tempProducts = [...products];

    if (searchTerm) {
        tempProducts = tempProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (genderFilter !== 'all') {
      tempProducts = tempProducts.filter(p => p.gender === genderFilter);
    }

    if (categoryFilters.length > 0) {
      tempProducts = tempProducts.filter(p => categoryFilters.includes(p.collectionId));
    }
    
    setFilteredProducts(tempProducts);
  }, [genderFilter, categoryFilters, products, searchTerm]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setCategoryFilters(prev => [...prev, categoryId]);
    } else {
      setCategoryFilters(prev => prev.filter(id => id !== categoryId));
    }
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
                                />
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
                                <SheetContent side="left" className="w-[300px]">
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
                                        />
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
                                filteredProducts.map((product, index) => (
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
