'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllProducts } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Product } from '@/lib/types';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'in-stock', 'out-of-stock'

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            const allProducts = await getAllProducts();
            setProducts(allProducts);
            setLoading(false);
        }
        fetchProducts();
    }, []);
    
    const calculateTotalStock = (product: Product) => {
        if (!product.variants) return 0;
        return product.variants.reduce((total, variant) => {
            if (!variant.sizes) return total;
            return total + variant.sizes.reduce((variantTotal, size) => variantTotal + size.stock, 0);
        }, 0);
    }
    
    const filteredProducts = useMemo(() => {
        if (filter === 'all') {
            return products;
        }
        return products.filter(product => {
            const stock = calculateTotalStock(product);
            if (filter === 'in-stock') {
                return stock > 0;
            }
            if (filter === 'out-of-stock') {
                return stock === 0;
            }
            return true;
        });
    }, [products, filter]);

    const getStockStatus = (product: Product) => {
        const stock = calculateTotalStock(product);
        if (stock === 0) return { text: 'Out of Stock', variant: 'destructive' as const };
        if (stock > 0 && stock < 10) return { text: 'Low Stock', variant: 'outline' as const };
        return { text: 'In Stock', variant: 'success' as const };
    }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your products here.</CardDescription>
        </div>
        <Button asChild>
            <Link href="/admin/products/new">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Product
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setFilter} className="mb-4">
            <TabsList>
                <TabsTrigger value="all">All ({products.length})</TabsTrigger>
                <TabsTrigger value="in-stock">In Stock ({products.filter(p => calculateTotalStock(p) > 0).length})</TabsTrigger>
                <TabsTrigger value="out-of-stock">Out of Stock ({products.filter(p => calculateTotalStock(p) === 0).length})</TabsTrigger>
            </TabsList>
        </Tabs>
        
        {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="hidden w-[100px] sm:table-cell">
                            <span className="sr-only">Image</span>
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Stock Status</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden md:table-cell">Total Stock</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredProducts.map((product) => {
                        const imageUrl = product.variants?.[0]?.imageUrls?.[0] || `https://picsum.photos/seed/${product.id}/64/64`;
                        const stockStatus = getStockStatus(product);
                        return (
                        <TableRow key={product.id}>
                            <TableCell className="hidden sm:table-cell">
                                <img
                                    alt={product.name}
                                    className="aspect-square rounded-md object-cover"
                                    height="64"
                                    src={imageUrl}
                                    width="64"
                                    loading="lazy"
                                />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                                <Badge variant={product.isVisible ? 'default' : 'outline'}>
                                    {product.isVisible ? 'Visible' : 'Hidden'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={stockStatus.variant}>{stockStatus.text}</Badge>
                            </TableCell>
                            <TableCell>₹{product.price.toFixed(2)}</TableCell>
                            <TableCell className="hidden md:table-cell">{calculateTotalStock(product)}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button
                                        aria-haspopup="true"
                                        size="icon"
                                        variant="ghost"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/products/edit/${product.id}`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        )}
        {!loading && filteredProducts.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <p>No products found for this filter.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
