'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from '@/lib/types';
import { DeleteCategoryButton } from './components/DeleteCategoryButton';
import { collection, query, orderBy, DocumentData, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

function docToCategory(doc: DocumentData): Category {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    } as Category;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'collections'), orderBy('name', 'asc'));
                const snapshot = await getDocs(q);
                const allCategories = snapshot.docs.map(docToCategory);
                setCategories(allCategories);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);
    
    const handleCategoryDelete = (deletedCategoryId: string) => {
        setCategories(prev => prev.filter(c => c.id !== deletedCategoryId));
    };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Organize your products into categories.</CardDescription>
        </div>
        <Button asChild>
            <Link href="/admin/categories/new">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Category
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="space-y-2">
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
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => {
                        const imageUrl = category.imageUrl || `https://picsum.photos/seed/${category.id}/64/64`;
                        return (
                        <TableRow key={category.id}>
                            <TableCell className="hidden sm:table-cell">
                                <img
                                    alt={category.name}
                                    className="aspect-square rounded-md object-cover"
                                    height="64"
                                    src={imageUrl}
                                    width="64"
                                    loading="lazy"
                                />
                            </TableCell>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground line-clamp-2">
                                {category.description}
                            </TableCell>
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
                                            <Link href={`/admin/categories/edit/${category.id}`}>Edit</Link>
                                        </DropdownMenuItem>
                                        <DeleteCategoryButton 
                                            categoryId={category.id}
                                            categoryName={category.name}
                                            onDelete={() => handleCategoryDelete(category.id)}
                                        />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        )}
        {!loading && categories.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <p>No categories found.</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/admin/categories/new">Create your first category</Link>
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
