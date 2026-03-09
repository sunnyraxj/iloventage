'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoreSettings, StoreDetails } from "@/lib/types";
import { updateStoreSettings } from "@/app/actions/settings";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { SingleImageUploader } from "./SingleImageUploader";

const formSchema = z.object({
    name: z.string().min(2, "Store name must be at least 2 characters."),
    logoUrl: z.string().url("Must be a valid URL.").or(z.literal('')),
    heroImageUrl: z.string().url("Must be a valid URL.").or(z.literal('')),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().min(10, "Please enter a valid phone number."),
    phone2: z.string().optional(),
    address: z.string().min(5, "Please enter a valid address."),
    city: z.string().min(2, "Please enter a valid city."),
    state: z.string().min(2, "Please enter a valid state."),
    pincode: z.string().min(6, "Please enter a valid pincode."),
    instagramUrl: z.string().url("Must be a valid URL.").or(z.literal('')).optional(),
    whatsappGroupUrl: z.string().url("Must be a valid URL.").or(z.literal('')).optional(),
});

export type SettingsFormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
    settings: StoreSettings | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues: SettingsFormValues = {
        name: settings?.storeDetails?.name || "",
        logoUrl: settings?.storeDetails?.logoUrl || "",
        heroImageUrl: settings?.storeDetails?.heroImageUrl || "",
        email: settings?.storeDetails?.email || "",
        phone: settings?.storeDetails?.phone || "",
        phone2: settings?.storeDetails?.phone2 || "",
        address: settings?.storeDetails?.address || "",
        city: settings?.storeDetails?.city || "",
        state: settings?.storeDetails?.state || "",
        pincode: settings?.storeDetails?.pincode || "",
        instagramUrl: settings?.storeDetails?.instagramUrl || "",
        whatsappGroupUrl: settings?.storeDetails?.whatsappGroupUrl || "",
    };
    
    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    });

    async function onSubmit(data: SettingsFormValues) {
        setIsSubmitting(true);
        try {
            const baseDetails: StoreDetails = settings?.storeDetails || {
                name: '',
                logoUrl: '',
                heroImageUrl: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
            };
            
            const fullSettingsData: StoreDetails = {
                ...baseDetails,
                ...data
            };
            
            const result = await updateStoreSettings(fullSettingsData);

            if (result.success) {
                toast({ title: "Success", description: `Settings updated successfully.` });
                // Hard reload to ensure all components (like the header) get the new settings.
                window.location.reload();
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
                    <CardHeader><CardTitle>Store Display</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Name</FormLabel>
                                    <FormControl><Input placeholder="e.g. My Awesome Store" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SingleImageUploader fieldName="logoUrl" label="Store Logo" />
                        <SingleImageUploader fieldName="heroImageUrl" label="Homepage Hero Image" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                         <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="contact@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Primary Phone</FormLabel><FormControl><Input placeholder="e.g. 9876543210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="phone2" render={({ field }) => (<FormItem><FormLabel>Secondary Phone (Optional)</FormLabel><FormControl><Input placeholder="e.g. 8765432109" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         </div>
                        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="123, Main Street" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Mumbai" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g. Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="pincode" render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="e.g. 400001" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="instagramUrl" render={({ field }) => (<FormItem><FormLabel>Instagram URL</FormLabel><FormControl><Input placeholder="https://instagram.com/your-store" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="whatsappGroupUrl" render={({ field }) => (<FormItem><FormLabel>WhatsApp Group URL</FormLabel><FormControl><Input placeholder="https://chat.whatsapp.com/your-group" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
            </form>
        </Form>
    );
}
