'use client';

import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  variantIndex: number;
}

export function ImageUploader({ variantIndex }: ImageUploaderProps) {
  const { control, getValues, setValue } = useFormContext();
  const { fields, remove, append } = useFieldArray({
    control,
    name: `variants.${variantIndex}.imageUrls`
  });
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        const fileId = short.generate();
        const storageRef = ref(storage, `products/${fileId}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        // @ts-ignore
        append({ value: downloadURL });
      }
      toast({ title: 'Upload successful', description: `${files.length} image(s) uploaded.` });
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload images.' });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    try {
        const urlToRemove = getValues(`variants.${variantIndex}.imageUrls`)[index].value;
        const imageRef = ref(storage, urlToRemove);
        await deleteObject(imageRef);
        remove(index);
        toast({ title: 'Image removed' });
    } catch(error: any) {
        // If it's a new upload not yet saved, it might not exist in storage yet, so we can ignore delete errors
         if (error.code === 'storage/object-not-found') {
            remove(index);
         } else {
            console.error("Failed to delete image from storage:", error);
            toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not remove image from cloud storage.' });
         }
    }
  };

  return (
    <div className="space-y-4">
      <FormLabel>Images</FormLabel>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="relative aspect-square group">
            <Image
              // @ts-ignore
              src={field.value}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover rounded-md border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveImage(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors">
          {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
          <Input 
            // @ts-ignore
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
      {/* This is a hidden field to satisfy the form schema validation */}
       <FormField
        control={control}
        name={`variants.${variantIndex}.imageUrls`}
        render={({ field, fieldState }) => (
          <FormItem className="hidden">
            <FormControl>
                <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
