'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { compressProductImage } from '@/app/actions/compress';
import type { Product } from '@/lib/types';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
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
import { getAllProducts } from '@/lib/data';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function BulkCompressButton() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleBulkCompress = async () => {
        setIsLoading(true);
        toast({ title: 'Starting Bulk Compression', description: 'Fetching all products...' });
        
        try {
            const products = await getAllProducts();
            const allImages: {productId: string, variantColor: string, url: string}[] = [];

            products.forEach(product => {
                product.variants.forEach(variant => {
                    variant.imageUrls.forEach(url => {
                        allImages.push({ productId: product.id, variantColor: variant.color, url });
                    });
                });
            });
            
            toast({ title: `Found ${allImages.length} total images`, description: 'Starting compression process...' });
            
            let successCount = 0;
            let skippedCount = 0;
            let failCount = 0;
            let totalOriginalSize = 0;
            let totalCompressedSize = 0;

            for (let i = 0; i < allImages.length; i++) {
                const image = allImages[i];
                const {id: toastId} = toast({ 
                    title: `Compressing ${i + 1} of ${allImages.length}`,
                    description: `Processing: ${image.url.split('/').pop()?.split('?')[0]}`
                });

                const result = await compressProductImage(image.productId, image.variantColor, image.url);
                
                if (result.success) {
                    if (result.skipped) {
                        skippedCount++;
                        toast({ id: toastId, title: `Skipped ${i + 1} of ${allImages.length}`, description: result.message });
                    } else {
                        successCount++;
                        totalOriginalSize += result.originalSize || 0;
                        totalCompressedSize += result.compressedSize || 0;
                        toast({ id: toastId, title: `Compressed ${i + 1} of ${allImages.length}`, description: `Saved ${formatBytes((result.originalSize || 0) - (result.compressedSize || 0))}`});
                    }
                } else {
                    failCount++;
                    toast({ id: toastId, variant: 'destructive', title: `Failed ${i + 1} of ${allImages.length}`, description: result.message });
                }
            }
            
            const totalSaved = totalOriginalSize - totalCompressedSize;
            toast({
                title: 'Bulk Compression Complete',
                description: `Compressed: ${successCount} | Skipped: ${skippedCount} | Failed: ${failCount}. Total space saved: ${formatBytes(totalSaved)}.`,
                duration: 9000,
            });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Bulk Compression Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Compressing...' : 'Compress All Images'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will attempt to compress every product image in your store. This process may take a very long time and cannot be undone. It is recommended to back up your data first.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkCompress}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
