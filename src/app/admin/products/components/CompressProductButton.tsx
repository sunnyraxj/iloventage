'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { compressProductImage } from '@/app/actions/compress';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
                imagesToCompress.push({ variantColor: variant.color, url });
            });
        });

        let successCount = 0;
        let skippedCount = 0;
        let failCount = 0;
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;

        for (const image of imagesToCompress) {
            const result = await compressProductImage(product.id, image.variantColor, image.url);
            if (result.success) {
                if(result.skipped) {
                    skippedCount++;
                } else {
                    successCount++;
                    totalOriginalSize += result.originalSize || 0;
                    totalCompressedSize += result.compressedSize || 0;
                }
            } else {
                failCount++;
                toast({ variant: 'destructive', title: 'Compression Failed', description: result.message });
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
