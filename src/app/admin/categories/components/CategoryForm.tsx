'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { upsertCategory } from "@/app/actions/categories";
import { SingleImageUploader } from "./SingleImageUploader";

const formSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL.").or(z.literal('')).optional(),
});

export type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
    category?: Category;
}

export function CategoryForm({ category }: CategoryFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues: Partial<CategoryFormValues> = category ? {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
    } : {
        name: "",
        description: "",
        imageUrl: "",
    };
    
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    });

    async function onSubmit(data: CategoryFormValues) {
        setIsSubmitting(true);
        try {
            const result = await upsertCategory(data, category?.id);
            if (result.success) {
                toast({ title: "Success", description: `Category ${category ? 'updated' : 'created'} successfully.` });
                router.push('/admin/categories');
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Category Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl><Input placeholder="e.g. T-Shirts" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl><Textarea placeholder="Describe the category..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SingleImageUploader fieldName="imageUrl" label="Category Image" />
                    </CardContent>
                </Card>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (category ? 'Save Changes' : 'Create Category')}
                </Button>
            </form>
        </Form>
    );
}
