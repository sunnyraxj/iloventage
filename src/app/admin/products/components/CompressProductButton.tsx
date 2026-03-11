'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { replaceProductImage } from '@/app/actions/products';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import short from 'short-uuid';

interface CompressProductButtonProps {
    product: Product;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function CompressProductButton({ product }: CompressProductButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleCompress = async () => {
        setIsLoading(true);
        toast({ title: 'Starting Compression', description: `Processing images for ${product.name}` });

        const imagesToCompress: {variantColor: string, url: string}[] = [];
        product.variants.forEach(variant => {
            variant.imageUrls.forEach(url => {
                if (!url.includes('.webp')) {
                    imagesToCompress.push({ variantColor: variant.color, url });
                }
            });
        });

        if (imagesToCompress.length === 0) {
            toast({ title: 'No Images to Compress', description: 'All images for this product are already in WebP format.' });
            setIsLoading(false);
            return;
        }

        let successCount = 0;
        let skippedCount = 0;
        let failCount = 0;
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;

        for (const image of imagesToCompress) {
             try {
                // 1. Fetch the image
                const response = await fetch(image.url);
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
                const blob = await response.blob();
                const originalSize = blob.size;

                // 2. Compress the image
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
                    continue;
                }

                // 3. Upload the new blob
                const fileId = short.generate();
                const newName = `${fileId}.webp`;
                const newStorageRef = ref(storage, `products/${newName}`);
                const snapshot = await uploadBytes(newStorageRef, compressedFile);
                const newUrl = await getDownloadURL(snapshot.ref);

                // 4. Update Firestore and delete old image
                const result = await replaceProductImage(product.id, image.variantColor, image.url, newUrl);

                if (result.success) {
                    successCount++;
                    totalOriginalSize += originalSize;
                    totalCompressedSize += compressedSize;
                } else {
                    throw new Error(result.message || 'Failed to update database.');
                }
            } catch (error) {
                failCount++;
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                toast({ variant: 'destructive', title: `Compression Failed for ${image.url.split('/').pop()}`, description: errorMessage });
            }
        }
        
        const totalSaved = totalOriginalSize - totalCompressedSize;

        toast({ 
            title: 'Compression Complete', 
            description: `Compressed: ${successCount}, Skipped: ${skippedCount}, Failed: ${failCount}. Total saved: ${formatBytes(totalSaved)}.`,
            duration: 9000,
        });

        setIsLoading(false);
        router.refresh();
    };

    return (
        <DropdownMenuItem
            onSelect={(e) => {
                e.preventDefault();
                handleCompress();
            }}
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Compressing...' : 'Compress Images'}
        </DropdownMenuItem>
    );
}
