
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
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
import { Trash2, PlusCircle, Loader2 } from "lucide-react"
import type { Product, Category } from "@/lib/types"
import { upsertProduct } from "@/app/actions/products"
import { createCategory } from "@/app/actions/categories"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { ImageUploader } from "./ImageUploader"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  brand: z.string().min(2, "Brand is required."),
  gender: z.enum(["male", "female", "unisex"]),
  categoryName: z.string().min(1, "Category is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  mrp: z.coerce.number().min(0, "MRP must be a positive number.").optional(),
  moq: z.coerce.number().int().min(1, "MOQ must be at least 1."),
  isVisible: z.boolean(),
  additionalDetails: z.array(z.object({ value: z.string() })).optional(),
  variants: z.array(z.object({
    color: z.string().min(1, "Color is required."),
    imageUrls: z.array(z.object({ value: z.string().url() })).min(1, "At least one image is required."),
    sizes: z.array(z.object({
        size: z.string().min(1, "Size is required."),
        stock: z.coerce.number().int().min(0, "Stock must be a positive integer."),
    })).min(1, "At least one size is required."),
  })).min(1, "At least one variant is required."),
})

export type ProductFormValues = z.infer<typeof formSchema>

interface ProductFormProps {
    product?: Product | null;
    categories: Category[];
    categoryName?: string;
}

export function ProductForm({ product, categories, categoryName }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allCategories, setAllCategories] = useState<Category[]>(categories);
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const defaultValues: Partial<ProductFormValues> = product ? {
        ...product,
        categoryName: categoryName || "",
        mrp: product.mrp || 0,
        additionalDetails: product.additionalDetails?.map(d => ({ value: d })),
        // Map the string[] from DB back to { value: string }[] for the form
        variants: product.variants.map(v => ({
            ...v,
            imageUrls: v.imageUrls.map(url => ({ value: url }))
        })),
    } : {
        name: "",
        description: "",
        brand: "",
        gender: "unisex",
        categoryName: "",
        price: 0,
        mrp: 0,
        moq: 1,
        isVisible: true,
        additionalDetails: [],
        variants: [{ color: "", imageUrls: [], sizes: [{ size: "", stock: 0 }] }],
    }
    
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    })

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control: form.control,
        name: "variants",
    });

    const { fields: detailFields, append: appendDetail, remove: removeDetail } = useFieldArray({
        control: form.control,
        name: "additionalDetails",
    });

    async function handleAddCategory(newCategoryName: string) {
        if (!newCategoryName || newCategoryName.trim() === '') {
            toast({ variant: 'destructive', title: 'Error', description: 'Please type a category name to add.' });
            return;
        }

        setIsAddingCategory(true);
        try {
            const result = await createCategory(newCategoryName);
            if (result.success && result.category) {
                toast({ title: 'Success', description: `Category "${result.category.name}" created.` });
                setAllCategories(prev => [...prev, result.category as Category]);
                form.setValue('categoryName', result.category.name, { shouldValidate: true });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred while adding the category." });
        } finally {
            setIsAddingCategory(false);
        }
    }


    async function onSubmit(data: ProductFormValues) {
        setIsSubmitting(true);
        try {
            const result = await upsertProduct(data, product?.id);
            if (result.success) {
                toast({ title: "Success", description: `Product ${product ? 'updated' : 'created'} successfully.` });
                router.push('/admin/products');
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                             <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g. Classic T-Shirt" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the product..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                             </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Variants</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {variantFields.map((variantField, variantIndex) => (
                                    <div key={variantField.id} className="p-4 border rounded-lg space-y-4 relative">
                                        <FormField control={form.control} name={`variants.${variantIndex}.color`} render={({ field }) => (<FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="e.g. Blue" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                       
                                        <ImageUploader variantIndex={variantIndex} />
                                        
                                        <SizesFieldArray control={form.control} variantIndex={variantIndex} />

                                        {variantFields.length > 1 && (
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => removeVariant(variantIndex)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendVariant({ color: "", imageUrls: [], sizes: [{ size: "", stock: 0 }]})}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {detailFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <FormField control={form.control} name={`additionalDetails.${index}.value`} render={({ field }) => (<FormItem className="flex-grow"><FormControl><Input placeholder="e.g. Fabric: 100% Cotton" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDetail(index)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendDetail({ value: "" })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Detail
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g. Nike" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField
                                    control={form.control}
                                    name="categoryName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <div className="w-full">
                                                        <Input
                                                            placeholder="Select or create a category"
                                                            {...field}
                                                            list="category-list"
                                                        />
                                                        <datalist id="category-list">
                                                            {allCategories.map(c => <option key={c.id} value={c.name} />)}
                                                        </datalist>
                                                    </div>
                                                </FormControl>
                                                <Button type="button" size="icon" onClick={() => handleAddCategory(field.value)} disabled={isAddingCategory}>
                                                    {isAddingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <FormDescription>Select a category or type a new one and click '+' to add.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Men</SelectItem><SelectItem value="female">Women</SelectItem><SelectItem value="unisex">Unisex</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" placeholder="999" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="mrp" render={({ field }) => (<FormItem><FormLabel>MRP (₹)</FormLabel><FormControl><Input type="number" placeholder="1999" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="moq" render={({ field }) => (<FormItem><FormLabel>Minimum Order Qty</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
                            <CardContent>
                                <FormField control={form.control} name="isVisible" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Visible to Customers</FormLabel><FormDescription>Toggle whether this product appears on your store.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <Button type="submit" disabled={isSubmitting || isAddingCategory}>
                    {isSubmitting ? 'Saving...' : (product ? 'Save Changes' : 'Create Product')}
                </Button>
            </form>
        </Form>
    )
}


function SizesFieldArray({ control, variantIndex }: { control: any, variantIndex: number }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `variants.${variantIndex}.sizes`
    });

    return (
        <div className="space-y-2">
            <FormLabel>Sizes & Stock</FormLabel>
            {fields.map((field, sizeIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`variants.${variantIndex}.sizes.${sizeIndex}.size`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormControl><Input placeholder="e.g. M" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`variants.${variantIndex}.sizes.${sizeIndex}.stock`}
                        render={({ field }) => (
                            <FormItem className="w-24">
                                <FormControl><Input type="number" placeholder="Stock" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(sizeIndex)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ size: "", stock: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Size
            </Button>
        </div>
    )
}
