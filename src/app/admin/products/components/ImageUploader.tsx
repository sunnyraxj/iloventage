'use client';

import { useState, useRef } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2, Download, ArrowLeft, ArrowRight, MoreVertical, Sparkles } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject, getBlob } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';
import heic2any from 'heic2any';
import { ImageEditor } from './ImageEditor';
import { CompressSingleImageButton } from './CompressSingleImageButton';
import imageCompression from 'browser-image-compression';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { replaceProductImage } from '@/app/actions/products';


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
  const [compressingImageUrl, setCompressingImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
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

  const handleCompress = async (imageUrlToCompress: string) => {
    if (compressingImageUrl) return;
    if (!productId || !variantColor) {
        toast({ variant: 'destructive', title: 'Error', description: 'Product or variant data is missing. Cannot compress.' });
        return;
    };

    setCompressingImageUrl(imageUrlToCompress);
    const { id: toastId, update } = toast({ title: 'Step 1/4: Downloading image...', description: 'Please wait...' });

    try {
        const imageRef = ref(storage, imageUrlToCompress);
        const blob = await getBlob(imageRef);
        const originalSize = blob.size;

        update({ title: 'Step 2/4: Compressing image...', description: 'This may take a moment...' });
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
            update({ title: 'Skipped', description: 'Image is already optimized.', duration: 3000 });
            setCompressingImageUrl(null);
            return;
        }

        update({ title: 'Step 3/4: Uploading compressed image...', description: 'Almost done...' });
        const fileId = short.generate();
        const newName = `${fileId}.webp`;
        const newStorageRef = ref(storage, `products/${newName}`);
        await uploadBytes(newStorageRef, compressedFile);
        const newUrl = await getDownloadURL(newStorageRef);
        
        update({ title: 'Step 4/4: Updating product...', description: 'Finalizing changes...' });
        const result = await replaceProductImage(productId, variantColor, imageUrlToCompress, newUrl);

        if (result.success) {
            update({
                id: toastId,
                title: 'Compression Complete!',
                description: `Saved ${formatBytes(originalSize - compressedSize)}. Page will now refresh.`,
            });
            setTimeout(() => router.refresh(), 1500);
        } else {
            throw new Error(result.message || 'Failed to update database.');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        update({ id: toastId, variant: 'destructive', title: 'Compression Failed', description: errorMessage, duration: 9000 });
    } finally {
        setCompressingImageUrl(null);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
        // Use the Firebase SDK to fetch the image data as a Blob.
        // This bypasses browser CORS restrictions that would block a direct fetch.
        const imageRef = ref(storage, imageUrl);
        const blob = await getBlob(imageRef);
        
        // Create a temporary URL for the Blob data.
        const objectUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger the download.
        const link = document.createElement('a');
        link.href = objectUrl;

        // Try to parse a user-friendly filename from the image URL.
        let filename = 'downloaded-image';
        try {
            // new URL() can parse complex URLs and extract parts safely.
            const url = new URL(imageUrl);
            // The pathname contains the encoded file path, e.g., /.../products%2Fmy-image.jpg
            const pathname = decodeURIComponent(url.pathname); 
            const lastSegment = pathname.split('/').pop();
            if (lastSegment) {
                filename = lastSegment;
            }
        } catch (e) {
            // A simple fallback if URL parsing fails for any reason.
            console.warn("Could not parse filename from URL, using a generic name.", imageUrl);
        }
        
        // The 'download' attribute tells the browser to save the file instead of navigating to it.
        // The value of the attribute is used as the default filename in the "Save As" dialog.
        link.download = filename;
        
        // Append the link to the page, trigger a click, then remove it.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up by revoking the temporary object URL to free up memory.
        window.URL.revokeObjectURL(objectUrl);

    } catch (error) {
        // If any step fails (e.g., fetching the blob), fall back to opening the image in a new tab.
        // From there, the user can manually save it (e.g., by long-pressing on mobile).
        console.error("Programmatic download failed:", error);
        toast({ 
            variant: 'destructive', 
            title: 'Download Failed', 
            description: 'Could not start download. Opening image in new tab as fallback.'
        });
        window.open(imageUrl, '_blank');
    }
  };


  return (
    <div className="space-y-4">
      <FormLabel>Images</FormLabel>
      <p className="text-sm text-muted-foreground">The first image is the main display image. Use the arrows to re-order.</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {fields.map((field, index) => {
            const imageUrl = (field as any).value as string;
            const isWebp = imageUrl.includes('.webp');
            const isLoading = compressingImageUrl === imageUrl;
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

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center justify-center gap-1">
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleMoveImage(index, index - 1)} disabled={index === 0}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Move left</span>
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleDownload(imageUrl)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download image</span>
                    </Button>
                    {!isWebp && productId && variantColor && (
                        <CompressSingleImageButton
                            onClick={() => handleCompress(imageUrl)}
                            isLoading={isLoading}
                        />
                    )}
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
                             <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleDownload(imageUrl); }}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            {!isWebp && productId && variantColor && (
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCompress(imageUrl); }} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-blue-600" />}
                                    <span>{isLoading ? 'Compressing...' : 'Compress'}</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => handleRemoveImage(index)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
