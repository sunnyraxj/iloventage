'use client';

import { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';

interface SingleImageUploaderProps {
  fieldName: string;
  label: string;
}

export function SingleImageUploader({ fieldName, label }: SingleImageUploaderProps) {
  const { control, getValues, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const imageUrl = watch(fieldName);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // First, attempt to delete the old image if it exists and is a Firebase URL
      const currentImageUrl = getValues(fieldName);
      if (currentImageUrl && (currentImageUrl.includes('firebasestorage.googleapis.com') || currentImageUrl.includes('storage.googleapis.com'))) {
          try {
              const imageRef = ref(storage, currentImageUrl);
              await deleteObject(imageRef);
          } catch (error: any) {
               if (error.code !== 'storage/object-not-found') {
                  // Log the error but don't block the upload
                  console.error("Old image deletion failed, continuing with upload:", error);
               }
          }
      }

      // Now, upload the new image
      const fileId = short.generate();
      const storageRef = ref(storage, `settings/${fileId}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setValue(fieldName, downloadURL, { shouldValidate: true, shouldDirty: true });
      toast({ title: 'Upload successful', description: 'Image has been uploaded.' });

    } catch (error: any) {
      console.error("Image upload failed:", error);
      
      let errorMessage = 'Could not upload image.';
      if (error.code) {
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
      } else if (error.message) {
          errorMessage = error.message;
      }

      toast({ variant: 'destructive', title: 'Upload failed', description: errorMessage, duration: 9000 });
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
    toast({ title: 'Image removed' });
  };

  return (
    <FormItem>
        <FormLabel>{label}</FormLabel>
        <div className="flex items-center gap-4">
            {imageUrl ? (
            <div className="relative aspect-video group w-48">
                <Image
                src={imageUrl}
                alt={`${label} preview`}
                fill
                className="object-cover rounded-md border"
                />
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
