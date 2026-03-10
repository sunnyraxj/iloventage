
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2 } from 'lucide-react';
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

interface CategoryImageUploaderProps {
  fieldName: string;
  label: string;
}

export function CategoryImageUploader({ fieldName, label }: CategoryImageUploaderProps) {
  const { control, getValues, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const imageUrl = watch(fieldName);

  useEffect(() => {
    if (!imageUrl) {
        setCompressedSize(null);
    }
  }, [imageUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setCompressedSize(null);
    
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
        initialQuality: 0.75,
        fileType: 'image/webp',
    };

    try {
      const currentImageUrl = getValues(fieldName);
      if (currentImageUrl && (currentImageUrl.includes('firebasestorage.googleapis.com') || currentImageUrl.includes('storage.googleapis.com'))) {
          try {
              const imageRef = ref(storage, currentImageUrl);
              await deleteObject(imageRef);
          } catch (error: any) {
               if (error.code !== 'storage/object-not-found') {
                  console.error("Old image deletion failed, continuing with upload:", error);
               }
          }
      }

      const originalSize = file.size;
      const originalName = file.name;
      const compressedFile = await imageCompression(file, options);
      const compressedSizeVal = compressedFile.size;
      const newName = compressedFile.name;
      const fileId = short.generate();
      const storageRef = ref(storage, `categories/${fileId}-${newName}`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setValue(fieldName, downloadURL, { shouldValidate: true, shouldDirty: true });
      setCompressedSize(compressedSizeVal);
      toast({ title: 'Image Optimized & Uploaded', description: `${originalName} (${formatBytes(originalSize)}) → ${newName} (${formatBytes(compressedSizeVal)})` });

    } catch (error: any) {
      console.error("Image upload failed:", error);
      
      let errorMessage = 'Could not upload image.';
      if (error instanceof Error) {
          errorMessage = error.message;
      } else if (error.code) {
          switch (error.code) {
              case 'storage/unauthorized':
                  errorMessage = `Permission denied. Please check your storage rules.`;
                  break;
              case 'storage/canceled':
                  errorMessage = 'Upload was canceled.';
                  break;
              case 'storage/retry-limit-exceeded':
                  errorMessage = 'Upload timed out. Please check your network connection.';
                  break;
              case 'storage/unauthenticated':
                  errorMessage = `You must be logged in to upload images.`;
                  break;
              default:
                  errorMessage = error.message;
                  break;
          }
      }

      toast({ variant: 'destructive', title: 'Upload Failed', description: errorMessage, duration: 9000 });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    const urlToRemove = getValues(fieldName);
    if (!urlToRemove) return;

    const isFirebaseUrl = urlToRemove.includes('firebasestorage.googleapis.com') || urlToRemove.includes('storage.googleapis.com');

    if (isFirebaseUrl) {
      try {
          const imageRef = ref(storage, urlToRemove);
          await deleteObject(imageRef);
      } catch(error: any) {
          if (error.code !== 'storage/object-not-found') {
              console.error("Failed to delete image from storage:", error);
              toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not remove image from cloud storage.' });
              return;
          }
      }
    }
    
    setValue(fieldName, '', { shouldValidate: true, shouldDirty: true });
    setCompressedSize(null);
    toast({ title: 'Image removed' });
  };

  return (
    <FormItem>
        <FormLabel>{label}</FormLabel>
        <div className="flex items-center gap-4">
            {imageUrl ? (
            <div className="relative aspect-square group w-48">
                <img
                src={imageUrl}
                alt={`${label} preview`}
                className="h-full w-full object-cover rounded-md border"
                />
                {compressedSize && (
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded">
                        {formatBytes(compressedSize)}
                    </div>
                )}
                <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
                >
                <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            ) : null}
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors">
            {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <Input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept="image/*"
                disabled={isUploading}
            />
            <span className="text-xs text-muted-foreground mt-2 text-center">{imageUrl ? 'Change' : 'Upload'}</span>
            </label>
        </div>
        <FormField
            control={control}
            name={fieldName}
            render={({ field }) => (
                <FormControl>
                    <Input type="hidden" {...field} />
                </FormControl>
            )}
        />
        <FormMessage />
    </FormItem>
  );
}
