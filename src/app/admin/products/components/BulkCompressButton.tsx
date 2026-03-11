'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { replaceProductImage } from '@/app/actions/products';
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
import imageCompression from 'browser-image-compression';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import short from 'short-uuid';
import { useRouter } from 'next/navigation';


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
    const router = useRouter();

    const handleBulkCompress = async () => {
        setIsLoading(true);
        toast({ title: 'Starting Bulk Compression', description: 'Fetching all products...' });
        
        try {
            const products = await getAllProducts();
            const allImages: {productId: string, variantColor: string, url: string}[] = [];

            products.forEach(product => {
                product.variants.forEach(variant => {
                    variant.imageUrls.forEach(url => {
                        if (!url.includes('.webp')) {
                            allImages.push({ productId: product.id, variantColor: variant.color, url });
                        }
                    });
                });
            });

            if (allImages.length === 0) {
                toast({ title: 'No Images to Compress', description: 'All product images seem to be optimized already.' });
                setIsLoading(false);
                return;
            }
            
            toast({ title: `Found ${allImages.length} uncompressed images`, description: 'Starting compression process...' });
            
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

                try {
                    // 1. Fetch
                    const response = await fetch(image.url);
                    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                    const blob = await response.blob();
                    const originalSize = blob.size;

                    // 2. Compress
                    const options = {
                        maxSizeMB: 0.5,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                        initialQuality: 0.7,
                        fileType: 'image/webp',
                        alwaysKeepOrientation: true,
                    };
                    const compressedFile = await imageCompression(blob, options);
                    const compressedSize = compressedFile.size;
                    
                    if (compressedSize >= originalSize) {
                        skippedCount++;
                        toast({ id: toastId, title: `Skipped ${i + 1} of ${allImages.length}`, description: 'Image could not be compressed further.' });
                        continue;
                    }
                    
                    // 3. Upload
                    const fileId = short.generate();
                    const newName = `${fileId}.webp`;
                    const newStorageRef = ref(storage, `products/${newName}`);
                    const snapshot = await uploadBytes(newStorageRef, compressedFile);
                    const newUrl = await getDownloadURL(snapshot.ref);

                    // 4. Update DB
                    const result = await replaceProductImage(image.productId, image.variantColor, image.url, newUrl);
                    if (!result.success) throw new Error(result.message || 'DB update failed.');

                    successCount++;
                    totalOriginalSize += originalSize;
                    totalCompressedSize += compressedSize;
                    toast({ id: toastId, title: `Compressed ${i + 1} of ${allImages.length}`, description: `Saved ${formatBytes(originalSize - compressedSize)}`});

                } catch(error) {
                    failCount++;
                    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                    toast({ id: toastId, variant: 'destructive', title: `Failed ${i + 1} of ${allImages.length}`, description: errorMessage });
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
            router.refresh();
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
