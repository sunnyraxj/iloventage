
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
import { Trash2, PlusCircle } from "lucide-react"
import type { Product, Category } from "@/lib/types"
import { upsertProduct } from "@/app/actions/products"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ImageUploader } from "./ImageUploader"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"


const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  brand: z.string().optional(),
  gender: z.enum(["male", "female", "unisex"]),
  collectionId: z.string().min(1, "A primary category is required."),
  additionalCollectionIds: z.array(z.string()).optional(),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  mrp: z.coerce.number().min(0, "MRP must be a positive number.").optional(),
  moq: z.coerce.number().int().min(1, "MOQ must be at least 1."),
  additionalDetails: z.array(z.object({ value: z.string() })).optional(),
  variants: z.array(z.object({
    color: z.string().min(1, "Color is required."),
    imageUrls: z.array(z.object({ 
        value: z.string().url(),
        compressedSize: z.number().optional(),
    })).min(1, "At least one image is required."),
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
}

export function ProductForm({ product, categories }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allCollectionIds = product?.collectionIds || (product && (product as any).collectionId ? [(product as any).collectionId] : []);

    const defaultValues: Partial<ProductFormValues> = product ? {
        ...product,
        collectionId: allCollectionIds[0] || '',
        additionalCollectionIds: allCollectionIds.slice(1),
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
        collectionId: "",
        additionalCollectionIds: [],
        price: 0,
        mrp: 0,
        moq: 1,
        additionalDetails: [],
        variants: [{ color: "", imageUrls: [], sizes: [{ size: "", stock: 1 }] }],
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
                                <Button type="button" variant="outline" onClick={() => appendVariant({ color: "", imageUrls: [], sizes: [{ size: "", stock: 1 }]})}>
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
                                <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Brand (Optional)</FormLabel><FormControl><Input placeholder="Defaults to ILV if empty" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                
                                <FormField
                                    control={form.control}
                                    name="collectionId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Primary Category</FormLabel>
                                        <FormDescription>This is the main category for the product.</FormDescription>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select a primary category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="additional-categories">
                                        <AccordionTrigger>Additional Categories</AccordionTrigger>
                                        <AccordionContent>
                                            <FormField
                                                control={form.control}
                                                name="additionalCollectionIds"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormDescription>
                                                        Select other relevant categories (optional).
                                                    </FormDescription>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                                                    {categories.filter(c => c.id !== form.watch('collectionId')).map((item) => (
                                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                checked={field.value?.includes(item.id)}
                                                                onCheckedChange={(checked) => {
                                                                    const currentIds = field.value || [];
                                                                    return checked
                                                                    ? field.onChange([...currentIds, item.id])
                                                                    : field.onChange(currentIds.filter((id) => id !== item.id));
                                                                }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-sm">
                                                                {item.name}
                                                            </FormLabel>
                                                        </FormItem>
                                                    ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                
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
                    </div>
                </div>
                <Button type="submit" disabled={isSubmitting}>
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
            <Button type="button" variant="outline" size="sm" onClick={() => append({ size: "", stock: 1 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Size
            </Button>
        </div>
    )
}
