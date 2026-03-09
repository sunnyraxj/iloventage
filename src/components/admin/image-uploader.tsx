'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import shortUuid from 'short-uuid';

import { storage } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface UploadedImage {
  url: string;
  uploadProgress: number;
  file?: File;
  isUploading: boolean;
}

export function ImageUploader() {
  const { control, getValues, setValue } = useFormContext();
  const { toast } = useToast();

  const [imageUploads, setImageUploads] = useState<UploadedImage[]>(
    (getValues('images') || []).map((url: string) => ({ url, uploadProgress: 100, isUploading: false }))
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newUploads: UploadedImage[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file), // for preview
      uploadProgress: 0,
      isUploading: true,
    }));
    
    const currentUploadsCount = imageUploads.length;
    setImageUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach((upload, index) => {
      uploadFile(upload.file!, currentUploadsCount + index);
    });
    
    event.target.value = ''; // Reset file input
  };

  const uploadFile = (file: File, index: number) => {
    const fileId = shortUuid.generate();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    const storageRef = ref(storage, `products/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageUploads(prev => {
            const newUploads = [...prev];
            if (newUploads[index]) {
                newUploads[index].uploadProgress = progress;
            }
            return newUploads;
        });
      },
      (error) => {
        console.error('Upload failed:', error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: `Could not upload ${file.name}. Please try again.`
        });
        setImageUploads(prev => prev.filter(u => u.file !== file));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        setImageUploads(prev => {
            const newUploads = [...prev];
             if (newUploads[index]) {
                newUploads[index].url = downloadURL;
                newUploads[index].isUploading = false;
                newUploads[index].file = undefined;
             }
            return newUploads;
        });

        const currentImages = getValues('images') || [];
        setValue('images', [...currentImages, downloadURL], { shouldValidate: true });
        
        toast({
            title: "Upload Successful",
            description: `${file.name} has been uploaded.`,
        });
      }
    );
  };
    
  const handleRemoveImage = async (imageUrl: string, index: number) => {
    setImageUploads(prev => prev.filter((_, i) => i !== index));

    const currentImages = getValues('images') || [];
    setValue('images', currentImages.filter((url: string) => url !== imageUrl), { shouldValidate: true });

    if (imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            toast({
                title: "Image Removed",
                description: "The image has been removed from storage.",
            });
        } catch (error: any) {
            console.error("Failed to delete image from storage:", error);
            if (error.code !== 'storage/object-not-found') {
                 toast({
                    variant: "destructive",
                    title: "Deletion Failed",
                    description: "Could not remove the image from storage, but it has been detached from the product.",
                });
            }
        }
    }
  };

  return (
    <FormField
        control={control}
        name="images"
        render={({ field }) => (
            <FormItem>
                <FormLabel>Product Images</FormLabel>
                <FormControl>
                    <div>
                        <Card>
                            <CardContent className="p-4">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                    {imageUploads.map((upload, index) => (
                                    <div key={index} className="relative aspect-square group">
                                        <Image
                                            src={upload.url}
                                            alt={`Product image ${index + 1}`}
                                            fill
                                            className="object-cover rounded-md"
                                        />
                                        {upload.isUploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                                                <Progress value={upload.uploadProgress} className="h-2 w-3/4" />
                                            </div>
                                        )}
                                        {!upload.isUploading && (
                                            <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveImage(upload.url, index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    ))}
                                    <label htmlFor="file-upload" className="aspect-square flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/50 cursor-pointer hover:bg-accent">
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                        <span className="mt-2 text-sm text-center text-muted-foreground">Upload</span>
                                        <input id="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
  );
}
