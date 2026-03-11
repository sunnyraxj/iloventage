'use client';

import { useState, useRef } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';
import heic2any from 'heic2any';
import { ImageEditor } from './ImageEditor';
import { CompressSingleImageButton } from './CompressSingleImageButton';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface ImageUploaderProps {
  variantIndex: number;
  productId?: string;
}

export function ImageUploader({ variantIndex, productId }: ImageUploaderProps) {
  const { control, getValues } = useFormContext();
  const { fields, remove, append, move } = useFieldArray({
    control,
    name: `variants.${variantIndex}.imageUrls`
  });
  const [isUploading, setIsUploading] = useState(false);
  const [filesToEdit, setFilesToEdit] = useState<File[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const variantColor = getValues(`variants.${variantIndex}.color`);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // HEIC conversion
    const convertedFiles = await Promise.all(Array.from(files).map(async file => {
        const fileName = file.name.toLowerCase();
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
        if (isHeic) {
            try {
                const conversionResult = await heic2any({ blob: file, toType: 'image/png' });
                const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
                return new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.png'), { type: 'image/png' });
            } catch (e) {
                toast({ variant: 'destructive', title: 'Conversion Failed', description: `Could not convert HEIC file: ${file.name}` });
                return null;
            }
        }
        return file;
    }));
    
    const validFiles = convertedFiles.filter((f): f is File => f !== null);
    setFilesToEdit(validFiles);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditComplete = async (processedImages: {blob: Blob | null; originalFile: File}[]) => {
    setFilesToEdit([]);
    setIsUploading(true);

    const uploadPromises = processedImages.map(async (image) => {
        if (!image.blob) return null;
        const blob = image.blob;
        
        try {
            const fileId = short.generate();
            const newName = image.originalFile.name.replace(/\.[^/.]+$/, ".webp");
            const storageRef = ref(storage, `products/${fileId}-${newName}`);
            const snapshot = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return {
                url: downloadURL,
                originalFile: image.originalFile,
                compressedSize: blob.size,
            };
        } catch (error) {
            console.error("Upload failed:", error);
            return null;
        }
    });

    const results = await Promise.all(uploadPromises);

    let successCount = 0;
    results.forEach(result => {
        if (result) {
            append({ 
                value: result.url,
                compressedSize: result.compressedSize,
            });
            toast({ 
                title: 'Image Uploaded & Optimized', 
                description: `${result.originalFile.name} (${formatBytes(result.originalFile.size)}) → ${formatBytes(result.compressedSize)}` 
            });
            successCount++;
        } else {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'One or more images failed to upload.', duration: 9000 });
        }
    });

    if (successCount > 0 && successCount < processedImages.length) {
        toast({ title: 'Partial Success', description: `${successCount} out of ${processedImages.length} images were uploaded.` });
    }

    setIsUploading(false);
  }

  const handleEditCancel = () => {
    setFilesToEdit([]);
  }

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

  const handleMoveImage = (from: number, to: number) => {
      if (to >= 0 && to < fields.length) {
          move(from, to);
      }
  }

  return (
    <div className="space-y-4">
      <FormLabel>Images</FormLabel>
      <p className="text-sm text-muted-foreground">The first image is the main display image. Use the arrows to re-order.</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {fields.map((field, index) => {
            const imageUrl = (field as any).value as string;
            const isWebp = imageUrl.includes('.webp');
          return (
            <div key={field.id} className="flex flex-col gap-2">
                <div className="relative aspect-square">
                    <img
                        src={imageUrl}
                        alt={`Product image ${index + 1}`}
                        className="h-full w-full object-cover rounded-md border"
                    />
                    {index === 0 && (
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider">
                            MAIN
                        </div>
                    )}
                    {(field as any).compressedSize && (
                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded">
                            {formatBytes((field as any).compressedSize)}
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-center gap-1">
                     <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveImage(index, index - 1)}
                        disabled={index === 0}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Move left</span>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                    >
                        <a href={imageUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download image</span>
                        </a>
                    </Button>
                    
                    {!isWebp && productId && variantColor && (
                        <CompressSingleImageButton
                            productId={productId}
                            variantColor={variantColor}
                            imageUrl={imageUrl}
                        />
                    )}

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove image</span>
                    </Button>
                     <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveImage(index, index + 1)}
                        disabled={index === fields.length - 1}
                    >
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">Move right</span>
                    </Button>
                </div>
            </div>
        )})}
        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors">
          {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
          <Input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={handleFileSelect} 
            accept="image/*,.heic,.heif" 
            multiple
            disabled={isUploading}
          />
          <span className="text-xs text-muted-foreground mt-2">Upload</span>
        </label>
      </div>

      {filesToEdit.length > 0 && (
          <ImageEditor
              files={filesToEdit}
              onComplete={handleEditComplete}
              onCancel={handleEditCancel}
          />
      )}

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
