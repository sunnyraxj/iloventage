'use client';

import { useState, useRef } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2, Download } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface ImageUploaderProps {
  variantIndex: number;
}

export function ImageUploader({ variantIndex }: ImageUploaderProps) {
  const { control, getValues } = useFormContext();
  const { fields, remove, append } = useFieldArray({
    control,
    name: `variants.${variantIndex}.imageUrls`
  });
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    const uploadPromises = Array.from(files).map(async (file) => {
        let fileToProcess = file;
        const fileName = file.name.toLowerCase();
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');

        if (isHeic) {
            try {
                const conversionResult = await heic2any({ blob: file, toType: 'image/png' });
                const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
                fileToProcess = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.png'), { type: 'image/png' });
            } catch (e) {
                console.error("HEIC conversion failed for", file.name, e);
                throw new Error(`Could not convert HEIC file: ${file.name}`);
            }
        }
        
        const originalSize = fileToProcess.size;
        const originalName = fileToProcess.name;

        const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            initialQuality: 0.7,
            fileType: 'image/webp',
            alwaysKeepOrientation: true,
        };
        
        const compressedFile = await imageCompression(fileToProcess, options);
        const compressedSize = compressedFile.size;
        const newName = compressedFile.name;
        
        const fileId = short.generate();
        const storageRef = ref(storage, `products/${fileId}-${newName}`);
        await uploadBytes(storageRef, compressedFile);
        const downloadURL = await getDownloadURL(storageRef);
        
        return {
            url: downloadURL,
            originalName,
            originalSize,
            newName,
            compressedSize,
        };
    });

    const results = await Promise.allSettled(uploadPromises);

    let successCount = 0;
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            const { url, originalName, originalSize, newName, compressedSize } = result.value;
            append({ 
                value: url,
                originalSize: originalSize,
                compressedSize: compressedSize,
            });
            toast({ title: 'Image Optimized & Uploaded', description: `${originalName} (${formatBytes(originalSize)}) → ${newName} (${formatBytes(compressedSize)})` });
            successCount++;
        } else {
            console.error("Upload failed:", result.reason);
            let errorMessage = 'An upload failed.';
            if (result.reason instanceof Error) {
                errorMessage = result.reason.message;
            } else if (typeof result.reason === 'string') {
                errorMessage = result.reason;
            } else if (result.reason && result.reason.code) {
                 switch (result.reason.code) {
                    case 'storage/unauthorized': errorMessage = `Permission denied. Check storage rules.`; break;
                    case 'storage/canceled': errorMessage = `Upload was canceled.`; break;
                    case 'storage/retry-limit-exceeded': errorMessage = `Upload timed out. Check network.`; break;
                    case 'storage/unauthenticated': errorMessage = `You must be logged in to upload images.`; break;
                    default: errorMessage = result.reason.message || 'An unknown upload error occurred.'; break;
                }
            }
            toast({ variant: 'destructive', title: 'Upload Failed', description: errorMessage, duration: 9000 });
        }
    });

    if (successCount > 0 && successCount < files.length) {
        toast({ title: 'Partial Success', description: `${successCount} out of ${files.length} images were uploaded.` });
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (index: number) => {
    const urlToRemove = getValues(`variants.${variantIndex}.imageUrls`)[index].value;

    const isFirebaseUrl = urlToRemove.includes('firebasestorage.googleapis.com') || urlToRemove.includes('storage.googleapis.com');

    if (isFirebaseUrl) {
      try {
        const imageRef = ref(storage, urlToRemove);
        await deleteObject(imageRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error("Failed to delete image from storage:", error);
          toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not remove image from cloud storage.' });
          return;
        }
      }
    }
    
    remove(index);
    toast({ title: 'Image removed' });
  };

  return (
    <div className="space-y-4">
      <FormLabel>Images</FormLabel>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="relative aspect-square group">
            <img
              src={(field as any).value}
              alt={`Product image ${index + 1}`}
              className="h-full w-full object-cover rounded-md border"
            />
            {(field as any).compressedSize && (
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded">
                    {formatBytes((field as any).compressedSize)}
                </div>
            )}
            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6"
                    asChild
                >
                    <a href={(field as any).value} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download image</span>
                    </a>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
            </div>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors">
          {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
          <Input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/*,.heic,.heif" 
            multiple
            disabled={isUploading}
          />
          <span className="text-xs text-muted-foreground mt-2">Upload</span>
        </label>
      </div>
      <FormField
        control={control}
        name={`variants.${variantIndex}.imageUrls`}
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
