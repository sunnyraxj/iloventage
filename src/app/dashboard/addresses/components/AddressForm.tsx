'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addAddress, updateAddress, type AddressFormValues } from '@/app/actions/user';
import type { UserAddress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, "Name is required."),
    mobile: z.string().length(10, "Must be a 10-digit mobile number.").refine(val => !isNaN(Number(val)), "Must be a number."),
    address: z.string().min(5, "Address is required."),
    city: z.string().min(2, "City is required."),
    state: z.string().min(2, "State is required."),
    pincode: z.string().length(6, "Must be a 6-digit pincode.").refine(val => !isNaN(Number(val)), "Must be a number."),
});

interface AddressFormProps {
    address?: UserAddress;
    children: React.ReactNode;
}

export function AddressForm({ address, children }: AddressFormProps) {
    const { user, reloadUser } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: address ? {
            name: address.name,
            mobile: address.mobile,
            address: address.address,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
        } : {
            name: user?.name || '',
            mobile: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
        },
        mode: 'onChange',
    });

    const onSubmit = async (values: AddressFormValues) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const result = address
                ? await updateAddress(user.id, address.id, values)
                : await addAddress(user.id, values);

            if (result.success) {
                toast({ title: 'Success', description: `Address has been ${address ? 'updated' : 'saved'}.` });
                await reloadUser();
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="mobile" render={({ field }) => (
                            <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Address (House No, Building, Street)</FormLabel><FormControl><Input placeholder="123, Main Street" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Mumbai" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="pincode" render={({ field }) => (
                            <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="400001" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isLoading}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Saving...' : 'Save Address'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
