'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { MoreHorizontal, PlusCircle, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Product } from '@/lib/types';
import { DeleteProductButton } from './components/DeleteProductButton';
import { collection, query, orderBy, DocumentData, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '@/firebase/config';

function docToProduct(doc: DocumentData): Product {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    } as Product;
}

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'in-stock', 'out-of-stock'
    const [searchTerm, setSearchTerm] = useState('');
    const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchInitialProducts = useCallback(async () => {
        setLoading(true);
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
            const documentSnapshots = await getDocs(q);
            
            const fetchedProducts = documentSnapshots.docs.map(docToProduct);
            setProducts(fetchedProducts);
            
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisible(lastDoc);
            setHasMore(documentSnapshots.size === PAGE_SIZE);

        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialProducts();
    }, [fetchInitialProducts]);

     const loadMoreProducts = async () => {
        if (!hasMore || loadingMore || !lastVisible) return;

        setLoadingMore(true);
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));
            const documentSnapshots = await getDocs(q);

            const newProducts = documentSnapshots.docs.map(docToProduct);
            setProducts(prevProducts => [...prevProducts, ...newProducts]);

            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisible(lastDoc);
            setHasMore(documentSnapshots.size === PAGE_SIZE);
        } catch (error) {
            console.error("Failed to load more products:", error);
        } finally {
            setLoadingMore(false);
        }
    };
    
    const handleProductDelete = (deletedProductId: string) => {
        setProducts(prevProducts => prevProducts.filter(p => p.id !== deletedProductId));
    };
    
    const calculateTotalStock = (product: Product) => {
        if (!product.variants) return 0;
        return product.variants.reduce((total, variant) => {
            if (!variant.sizes) return total;
            return total + variant.sizes.reduce((variantTotal, size) => variantTotal + size.stock, 0);
        }, 0);
    }
    
    const filteredProducts = useMemo(() => {
        let tempProducts = products;

        if (searchTerm) {
            tempProducts = tempProducts.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (filter === 'in-stock') {
            return tempProducts.filter(p => calculateTotalStock(p) > 0);
        }
        if (filter === 'out-of-stock') {
            return tempProducts.filter(p => calculateTotalStock(p) === 0);
        }
        
        return tempProducts;
    }, [products, filter, searchTerm]);

    const getStockStatus = (product: Product) => {
        const stock = calculateTotalStock(product);
        if (stock === 0) return { text: 'Out of Stock', variant: 'destructive' as const };
        if (stock > 0 && stock < 10) return { text: 'Low Stock', variant: 'outline' as const };
        return { text: 'In Stock', variant: 'success' as const };
    }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your products here.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button asChild>
                <Link href="/admin/products/new">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Product
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search products by name..."
                    className="w-full bg-background pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <Tabs defaultValue="all" onValueChange={setFilter} className="mb-4">
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in-stock">In Stock</TabsTrigger>
                <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
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
                        const firstVariant = product.variants?.[0];
                        const imageUrl = firstVariant?.imageUrls?.[0] || `https://picsum.photos/seed/${product.id}/64/64`;
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
                                    <DropdownMenuSeparator />
                                    <DeleteProductButton 
                                        productId={product.id}
                                        productName={product.name}
                                        onDelete={() => handleProductDelete(product.id)}
                                    />
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
                <p>No products found for the current filters.</p>
            </div>
        )}
        {hasMore && !loading && (
            <div className="mt-8 flex justify-center">
                <Button onClick={loadMoreProducts} disabled={loadingMore}>
                    {loadingMore ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        'Load More'
                    )}
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
