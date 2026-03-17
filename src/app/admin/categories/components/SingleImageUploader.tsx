
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2, Download, Cloud, Flame } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';
import { getR2ConfigStatus, getR2SignedURL, deleteR2Object } from '@/app/actions/r2';


const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface SingleImageUploaderProps {
  fieldName: string;
  label: string;
}

export function SingleImageUploader({ fieldName, label }: SingleImageUploaderProps) {
  const { control, getValues, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [r2Config, setR2Config] = useState<{ isConfigured: boolean; bucketName: string | null; publicUrlBase: string | null }>({ isConfigured: false, bucketName: null, publicUrlBase: null });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const imageUrl = watch(fieldName);

  useEffect(() => {
    getR2ConfigStatus().then(setR2Config);
  }, []);

  useEffect(() => {
    if (!imageUrl) {
        setCompressedSize(null);
    }
  }, [imageUrl]);

  const uploadToR2 = async (file: File) => {
    const fileExtension = file.name.split('.').pop() || 'file';
    let signedUrlResult;
    try {
        signedUrlResult = await getR2SignedURL({ fileType: file.type, extension: fileExtension });
        if (signedUrlResult.failure) {
          throw new Error(signedUrlResult.failure.message);
        }
    } catch (serverError: any) {
        throw new Error(`Failed to get upload URL: ${serverError.message}`);
    }
    
    const { signedUrl, publicUrl, key } = signedUrlResult.success;

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
    
    return { publicUrl, key };
  };
  
  const handleRemoveImage = async () => {
    const urlToRemove = getValues(fieldName);
    if (!urlToRemove) return;

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


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setCompressedSize(null);
    
    await handleRemoveImage();

    const fileName = file.name.toLowerCase();
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
    let processedFile = file;

    if (isHeic) {
        try {
            toast({ title: 'Converting HEIC...', description: 'Please wait while the image is being converted.' });
            const conversionResult = await heic2any({ blob: file, toType: 'image/png' });
            processedFile = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
            processedFile = new File([processedFile], file.name.replace(/\.(heic|heif)$/i, '.png'), { type: 'image/png' });
        } catch (e) {
            console.error("HEIC conversion failed", e);
            toast({ variant: 'destructive', title: 'Conversion Failed', description: 'Could not convert the HEIC file. Please try a different format.' });
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
    }
    
    try {
      if (!r2Config.isConfigured) {
        toast({
            variant: "destructive",
            title: "Upload Blocked",
            description: "Cloudflare R2 is not configured on the server. Cannot upload new images.",
            duration: 9000,
        });
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const originalSize = processedFile.size;
      const originalName = processedFile.name;
      
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.75,
        fileType: 'image/webp',
        alwaysKeepOrientation: true,
      };

      const compressedFile = await imageCompression(processedFile, options);
      const compressedSizeVal = compressedFile.size;
      const newName = compressedFile.name;
      
      const { publicUrl: downloadURL } = await uploadToR2(compressedFile);

      setValue(fieldName, downloadURL, { shouldValidate: true, shouldDirty: true });
      setCompressedSize(compressedSizeVal);
      toast({ title: 'Image Processed & Uploaded', description: `${originalName} (${formatBytes(originalSize)}) → ${newName} (${formatBytes(compressedSizeVal)}) stored in R2.` });

    } catch (error: any) {
      console.error("Image upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Could not upload image.', duration: 9000 });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  let imageSource: 'R2' | 'Firebase' | 'Other' = 'Other';
  if (imageUrl && r2Config.isConfigured && r2Config.publicUrlBase && imageUrl.startsWith(r2Config.publicUrlBase)) {
      imageSource = 'R2';
  } else if (imageUrl && (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('storage.googleapis.com'))) {
      imageSource = 'Firebase';
  }

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
                 {imageSource !== 'Other' && (
                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] p-0.5 rounded flex items-center">
                        {imageSource === 'R2' ? <Cloud className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
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
                        <a href={imageUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download image</span>
                        </a>
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleRemoveImage}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                    </Button>
                </div>
            </div>
            ) : null}
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors">
            {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <Input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept="image/*,.heic,.heif"
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

    
