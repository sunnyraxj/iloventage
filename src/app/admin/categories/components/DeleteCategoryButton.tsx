'use client';
import { useState } from 'react';
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
} from "@/components/ui/alert-dialog"
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { deleteCategory } from '@/app/actions/categories';
import { useRouter } from 'next/navigation';


interface DeleteCategoryButtonProps {
    categoryId: string;
    imageUrl?: string;
}

export function DeleteCategoryButton({ categoryId, imageUrl }: DeleteCategoryButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async () => {
        setIsLoading(true);
        const result = await deleteCategory(categoryId, imageUrl);
        if (result.success) {
            toast({ title: 'Category Deleted' });
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: result.message });
        }
        setIsLoading(false);
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:bg-destructive/10"
                >
                    Delete
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the category.
                        Any products in this category will need to be re-categorized.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
