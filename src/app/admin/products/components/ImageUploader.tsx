
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2, ArrowLeft, ArrowRight, MoreVertical, Cloud, Flame } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';
import heic2any from 'heic2any';
import { ImageEditor } from './ImageEditor';
import { getR2ConfigStatus, getR2SignedURL, deleteR2Object } from '@/app/actions/r2';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
}

export function ImageUploader({ variantIndex }: ImageUploaderProps) {
  const { control, getValues } = useFormContext();
  const { fields, remove, append, move } = useFieldArray({
    control,
    name: `variants.${variantIndex}.imageUrls`
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [filesToEdit, setFilesToEdit] = useState<File[]>([]);
  const [r2Config, setR2Config] = useState<{ isConfigured: boolean; bucketName: string | null; publicUrlBase: string | null }>({ isConfigured: false, bucketName: null, publicUrlBase: null });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getR2ConfigStatus().then(setR2Config);
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsPreparing(true);
    
    const heicFiles = Array.from(files).filter(file => {
        const fileName = file.name.toLowerCase();
        return file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
    });

    if (heicFiles.length > 0) {
        toast({ title: 'Converting HEIC files...', description: `Please wait while we convert ${heicFiles.length} image(s).` });
    }

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
    setIsPreparing(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const uploadToR2 = async (file: File) => {
    const fileExtension = file.name.split('.').pop() || 'file';
    let signedUrlResult;
    try {
        signedUrlResult = await getR2SignedURL({ fileType: file.type, extension: fileExtension });
        if (signedUrlResult.failure) throw new Error(signedUrlResult.failure.message);
    } catch (serverError: any) {
        throw new Error(`Failed to get upload URL: ${serverError.message}`);
    }

    const { signedUrl, publicUrl } = signedUrlResult.success;
    
    let response;
    try {
        response = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
    } catch (networkError: any) {
        console.error("Network error during R2 upload:", networkError);
        throw new Error(`Upload failed due to a network issue. This could be a CORS configuration problem on your R2 bucket. Please ensure your bucket allows PUT requests from this website's origin. Error: ${networkError.message}`);
    }

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("R2 Upload HTTP Error Response:", errorBody);
        throw new Error(`Upload failed with status ${response.status}. R2 response: ${errorBody}`);
    }
    return publicUrl;
  };

  const handleEditComplete = async (processedImages: {blob: Blob | null; originalFile: File}[]) => {
    setFilesToEdit([]);
    setIsUploading(true);

    if (!r2Config.isConfigured) {
        toast({
            variant: "destructive",
            title: "Upload Blocked",
            description: "Cloudflare R2 is not configured on the server. Cannot upload new images.",
            duration: 9000,
        });
        setIsUploading(false);
        return;
    }

    const uploadPromises = processedImages.map(async (image) => {
        if (!image.blob) return null;
        
        try {
            const file = new File([image.blob], image.originalFile.name, { type: image.blob.type });
            const downloadURL = await uploadToR2(file);
            return {
                url: downloadURL,
                originalFile: image.originalFile,
                compressedSize: file.size,
            };
        } catch (error: any) {
            console.error("Upload failed for one image:", error);
            toast({ variant: 'destructive', title: 'Upload Error', description: `Failed to upload ${image.originalFile.name}: ${error.message}`, duration: 9000 });
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
                description: `${result.originalFile.name} (${formatBytes(result.originalFile.size)}) → ${formatBytes(result.compressedSize)} stored in R2.`
            });
            successCount++;
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
    
    if (r2Config.isConfigured && r2Config.publicUrlBase && urlToRemove.startsWith(r2Config.publicUrlBase)) {
        const key = urlToRemove.substring(r2Config.publicUrlBase.length + 1);
        try {
            await deleteR2Object(key);
        } catch(error: any) {
            console.error("Failed to delete image from R2:", error);
            toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not remove image from cloud storage.' });
            return;
        }
    } else if (urlToRemove.includes('firebasestorage.googleapis.com') || urlToRemove.includes('storage.googleapis.com')) {
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
      {r2Config.bucketName && (
        <FormDescription className="flex items-center gap-2 text-xs">
            {r2Config.isConfigured ? <Cloud className="h-4 w-4 text-blue-500" /> : <Flame className="h-4 w-4 text-orange-500" />}
            <span>Storage: Cloudflare R2 (Bucket: {r2Config.bucketName})</span>
        </FormDescription>
      )}
      <p className="text-sm text-muted-foreground">The first image is the main display image. Use the arrows to re-order.</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {fields.map((field, index) => {
            const imageUrl = (field as any).value as string;
          return (
            <div key={field.id} className="flex flex-col gap-2">
                <div className="relative aspect-[3/4]">
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

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center justify-center gap-1">
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleMoveImage(index, index - 1)} disabled={index === 0}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Move left</span>
                    </Button>
                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleRemoveImage(index)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleMoveImage(index, index + 1)} disabled={index === fields.length - 1}>
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">Move right</span>
                    </Button>
                </div>

                {/* Mobile Dropdown */}
                <div className="flex md:hidden items-center justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleMoveImage(index, index - 1)} disabled={index === 0}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Move Left
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleMoveImage(index, index + 1)} disabled={index === fields.length - 1}>
                                <ArrowRight className="mr-2 h-4 w-4" /> Move Right
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleRemoveImage(index)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        )})}
        <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors">
          {isUploading || isPreparing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
          <Input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={handleFileSelect} 
            accept="image/*,.heic,.heif" 
            multiple
            disabled={isUploading || isPreparing}
          />
          <span className="text-xs text-muted-foreground mt-2 text-center">
            {isPreparing ? 'Preparing...' : (isUploading ? 'Uploading...' : 'Upload')}
          </span>
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

    
