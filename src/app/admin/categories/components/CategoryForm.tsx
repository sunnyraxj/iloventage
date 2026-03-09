
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Category } from "@/lib/types"
import { upsertCategory } from "@/app/actions/categories"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  gender: z.enum(["male", "female", "unisex", "all"]),
})

export type CategoryFormValues = z.infer<typeof formSchema>

interface CategoryFormProps {
    category?: Category | null;
}

export function CategoryForm({ category }: CategoryFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues: Partial<CategoryFormValues> = category ? {
        ...category,
    } : {
        name: "",
        description: "",
        gender: "all",
    }
    
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    })

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
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Category Name</FormLabel><FormControl><Input placeholder="e.g. T-Shirts" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the category..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender association" /></SelectTrigger></FormControl><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="male">Men</SelectItem><SelectItem value="female">Women</SelectItem><SelectItem value="unisex">Unisex</SelectItem></SelectContent></Select><FormDescription>Associate this category with a gender for filtering.</FormDescription><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (category ? 'Save Changes' : 'Create Category')}
                </Button>
            </form>
        </Form>
    )
}
