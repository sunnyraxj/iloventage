'use client';

import { useState, useEffect } from 'react';
import { getProducts, getCategories } from '@/lib/data';
import type { Product, Category } from '@/lib/types';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductCard } from '@/components/product-card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

    if (genderFilter !== 'all') {
      tempProducts = tempProducts.filter(p => p.gender === genderFilter);
    }

    if (categoryFilters.length > 0) {
      tempProducts = tempProducts.filter(p => categoryFilters.includes(p.collectionId));
    }
    
    setFilteredProducts(tempProducts);
  }, [genderFilter, categoryFilters, products]);

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
            <h1 className="mb-8 font-headline text-3xl font-bold md:text-4xl">All Products</h1>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                <aside className="md:col-span-1">
                    <div className="sticky top-24 rounded-lg bg-background p-6 shadow-sm space-y-6">
                        <h2 className="text-lg font-semibold">Filters</h2>
                        <div>
                            <h3 className="mb-2 font-medium">Gender</h3>
                            <RadioGroup defaultValue="all" value={genderFilter} onValueChange={setGenderFilter}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="gender-all" />
                                    <Label htmlFor="gender-all">All</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="male" id="gender-male" />
                                    <Label htmlFor="gender-male">Men</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="female" id="gender-female" />
                                    <Label htmlFor="gender-female">Women</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="unisex" id="gender-unisex" />
                                    <Label htmlFor="gender-unisex">Unisex</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div>
                            <h3 className="mb-2 font-medium">Category</h3>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`cat-${cat.id}`}
                                            onCheckedChange={(checked) => handleCategoryChange(cat.id, checked as boolean)}
                                        />
                                        <Label htmlFor={`cat-${cat.id}`}>{cat.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
                <div className="md:col-span-3">
                    {loading ? (
                         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))
                            ) : (
                                <p>No products found for the selected filters.</p>
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
