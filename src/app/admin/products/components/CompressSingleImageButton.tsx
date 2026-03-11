'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { replaceProductImage } from '@/app/actions/products';
import { Loader2, Sparkles } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { storage } from '@/firebase/config';
import { ref, getBlob, uploadBytes, getDownloadURL } from 'firebase/storage';
import short from 'short-uuid';

interface CompressSingleImageButtonProps {
    productId: string;
    variantColor: string;
    imageUrl: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function CompressSingleImageButton({ productId, variantColor, imageUrl }: CompressSingleImageButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleCompress = async () => {
        setIsLoading(true);
        toast({ title: 'Starting Compression', description: `Processing image...` });

        try {
            // 1. Fetch the image blob from Firebase Storage URL
            const imageRef = ref(storage, imageUrl);
            const blob = await getBlob(imageRef);
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
                toast({ title: 'Skipped', description: 'Image is already optimized.' });
                setIsLoading(false);
                return;
            }

            // 3. Upload the new blob
            const fileId = short.generate();
            const newName = `${fileId}.webp`;
            const newStorageRef = ref(storage, `products/${newName}`);
            await uploadBytes(newStorageRef, compressedFile);
            const newUrl = await getDownloadURL(newStorageRef);

            // 4. Update Firestore and delete old image
            const result = await replaceProductImage(productId, variantColor, imageUrl, newUrl);

            if (result.success) {
                toast({
                    title: 'Compression Complete',
                    description: `Saved ${formatBytes(originalSize - compressedSize)}.`,
                });
                router.refresh(); // This will reload the page and show the new image URL
            } else {
                throw new Error(result.message || 'Failed to update database.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Compression Failed', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            onClick={handleCompress}
            disabled={isLoading}
            title="Compress this image"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="sr-only">Compress image</span>
        </Button>
    );
}
