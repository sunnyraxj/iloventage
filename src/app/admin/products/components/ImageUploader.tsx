
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

    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.75,
        fileType: 'image/webp',
    };

    for (const file of Array.from(files)) {
        try {
            const originalSize = file.size;
            const originalName = file.name;
            const compressedFile = await imageCompression(file, options);
            const compressedSize = compressedFile.size;
            const newName = compressedFile.name;
            
            const fileId = short.generate();
            const storageRef = ref(storage, `products/${fileId}-${newName}`);
            await uploadBytes(storageRef, compressedFile);
            const downloadURL = await getDownloadURL(storageRef);
            append({ 
                value: downloadURL,
                originalSize,
                compressedSize,
            });

            toast({ title: 'Image Optimized & Uploaded', description: `${originalName} (${formatBytes(originalSize)}) → ${newName} (${formatBytes(compressedSize)})` });
        } catch (error: any) {
            console.error(`Upload failed for ${file.name}:`, error);

            let errorMessage = `Could not upload ${file.name}.`;
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (error.code) {
                switch (error.code) {
                    case 'storage/unauthorized':
                        errorMessage = `Permission denied for ${file.name}. Please check your storage rules.`;
                        break;
                    case 'storage/canceled':
                        errorMessage = `Upload for ${file.name} was canceled.`;
                        break;
                    case 'storage/retry-limit-exceeded':
                        errorMessage = `Upload for ${file.name} timed out. Please check your network connection.`;
                        break;
                    case 'storage/unauthenticated':
                        errorMessage = `You must be logged in to upload images.`;
                        break;
                    default:
                        errorMessage = `For ${file.name}: ${error.message}`;
                        break;
                }
            }

            toast({ variant: 'destructive', title: 'Upload Failed', description: errorMessage, duration: 9000 });
            // Stop on first error
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return; 
        }
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
            accept="image/*" 
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
