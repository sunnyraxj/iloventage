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
                    <CardHeader><CardTitle>Store Details</CardTitle></CardHeader>
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
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
            </form>
        </Form>
    );
}
