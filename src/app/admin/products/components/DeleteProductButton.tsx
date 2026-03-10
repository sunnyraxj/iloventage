
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteProduct } from '@/app/actions/products';

interface DeleteProductButtonProps {
    productId: string;
    productName: string;
    onDelete?: () => void;
}

export function DeleteProductButton({ productId, productName, onDelete }: DeleteProductButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const result = await deleteProduct(productId);
            if (result.success) {
                toast({ title: 'Success', description: `Product "${productName}" has been deleted.` });
                onDelete?.();
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
            setIsAlertOpen(false);
        }
    };

    return (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                >
                    Delete
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product
                        <span className="font-semibold"> {productName} </span>
                        and all of its associated images from the servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                        {isLoading ? 'Deleting...' : 'Continue'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
