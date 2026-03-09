'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DescriptionGenerator } from './description-generator';
import { addProduct, getCategoryBySlug, addCategory, updateProduct } from '@/lib/data';
import { useEffect, useState } from 'react';

const productFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  price: z.coerce.number().positive({
    message: 'Price must be a positive number.',
  }),
  stock: z.coerce.number().int().min(0, {
    message: 'Stock can not be negative.',
  }),
  category: z.string({
    required_error: 'Please enter a category.',
  }),
  keywords: z.string().optional(),
  images: z.array(z.string()).optional(), // Assuming images are handled elsewhere
  slug: z.string().optional(),
  featured: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
    ? {
        ...product,
        category: '', // Will be set in useEffect
        keywords: product.keywords.join(', '),
      }
    : {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
        keywords: '',
        images: [],
        slug: '',
        featured: false,
      },
  });

  useEffect(() => {
    if (product?.category) {
      async function fetchCategoryName() {
        const categoryData = await getCategoryBySlug(product.category);
        if (categoryData) {
          form.setValue('category', categoryData.name);
        } else {
          // If slug doesn't correspond to a category, show the slug itself
          form.setValue('category', product.category);
        }
      }
      fetchCategoryName();
    }
  }, [product, form]);


  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);
    try {
        const categoryName = data.category;
        const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        if (categoryName) {
            const existingCategory = await getCategoryBySlug(categorySlug);
            if (!existingCategory) {
                await addCategory({ name: categoryName, slug: categorySlug });
            }
        }
        
        const productData = {
            ...data,
            category: categoryName ? categorySlug : '',
            keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : [],
            slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        };

        if (product) {
            await updateProduct(product.id, productData);
            toast({ title: 'Product Updated', description: `${product.name} has been updated.` });
        } else {
            await addProduct(productData as Omit<Product, 'id'>);
            toast({ title: 'Product Created', description: `${data.name} has been added.` });
        }
        router.push('/admin/products');
        router.refresh();
    } catch(e) {
        toast({ variant: 'destructive', title: 'Something went wrong', description: 'Could not save the product. Please try again.'});
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Classic Leather Jacket" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about the product"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DescriptionGenerator form={form} />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="99.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Apparel" {...field} />
                </FormControl>
                <FormDescription>
                  Type a category name. If it doesn't exist, it will be created.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}</Button>
      </form>
    </Form>
  );
}
