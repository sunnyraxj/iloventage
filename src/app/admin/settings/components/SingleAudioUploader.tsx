
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2, Music, Flame, Cloud } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';
import { getR2ConfigStatus, getR2SignedURL, deleteR2Object } from '@/app/actions/r2';

interface SingleAudioUploaderProps {
  fieldName: string;
  label: string;
}

export function SingleAudioUploader({ fieldName, label }: SingleAudioUploaderProps) {
  const { control, getValues, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const [r2Config, setR2Config] = useState<{ isConfigured: boolean, bucketName: string | null }>({ isConfigured: false, bucketName: null });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const audioUrl = watch(fieldName);
  const r2PublicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  useEffect(() => {
    getR2ConfigStatus().then(setR2Config);
  }, []);
  
  const uploadToR2 = async (file: File) => {
    const fileExtension = file.name.split('.').pop() || 'file';
    const signedUrlResult = await getR2SignedURL({ fileType: file.type, fileSize: file.size, extension: fileExtension });

    if (signedUrlResult.failure) {
      throw new Error(signedUrlResult.failure.message);
    }

    const { signedUrl, publicUrl } = signedUrlResult.success;
    const response = await fetch(signedUrl, { method: 'PUT', body: file });

    if (!response.ok) {
      throw new Error('Failed to upload to R2.');
    }
    
    return publicUrl;
  };

  const uploadToFirebase = async (file: File) => {
    const fileId = short.generate();
    const storageRef = ref(storage, `settings/${fileId}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };
  
  const handleRemoveAudio = async () => {
    const urlToRemove = getValues(fieldName);
    if (!urlToRemove) return;

    if (r2Config.isConfigured && r2PublicUrlBase && urlToRemove.startsWith(r2PublicUrlBase)) {
        const key = urlToRemove.substring(r2PublicUrlBase.length + 1);
        try {
            await deleteR2Object(key);
        } catch(error: any) {
            console.error("Failed to delete audio from R2:", error);
            toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not remove audio from cloud storage.' });
            return;
        }
    } else if (urlToRemove.includes('firebasestorage.googleapis.com') || urlToRemove.includes('storage.googleapis.com')) {
      try {
          const audioRef = ref(storage, urlToRemove);
          await deleteObject(audioRef);
      } catch(error: any) {
          if (error.code !== 'storage/object-not-found') {
              console.error("Failed to delete audio from storage:", error);
              toast({ variant: 'destructive', title: 'Deletion failed', description: 'Could not remove audio from cloud storage.' });
              return;
          }
      }
    }
    
    setValue(fieldName, '', { shouldValidate: true, shouldDirty: true });
    toast({ title: 'Audio removed' });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    await handleRemoveAudio();
    
    try {
        let downloadURL: string;
        if (r2Config.isConfigured) {
            downloadURL = await uploadToR2(file);
        } else {
            downloadURL = await uploadToFirebase(file);
        }
      
        setValue(fieldName, downloadURL, { shouldValidate: true, shouldDirty: true });
        toast({ title: 'Audio Uploaded', description: `${file.name} has been uploaded to ${r2Config.isConfigured ? 'R2' : 'Firebase'}.` });

    } catch (error: any) {
      console.error("Audio upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Could not upload audio.', duration: 9000 });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <FormItem>
        <FormLabel>{label}</FormLabel>
         {r2Config.bucketName && (
            <FormDescription className="flex items-center gap-2 text-xs">
                {r2Config.isConfigured ? <Cloud className="h-4 w-4 text-blue-500" /> : <Flame className="h-4 w-4 text-orange-500" />}
                <span>Storage: {r2Config.isConfigured ? `Cloudflare R2 (Bucket: ${r2Config.bucketName})` : 'Firebase Storage'}</span>
            </FormDescription>
        )}
        <div className="flex items-center gap-4">
            {audioUrl ? (
                <div className="relative group w-full">
                    <audio controls src={audioUrl} className="w-full" />
                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleRemoveAudio}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove audio</span>
                        </Button>
                    </div>
                </div>
            ) : null}
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors flex-shrink-0">
                {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Music className="h-8 w-8 text-muted-foreground" />}
                <Input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept="audio/*"
                    disabled={isUploading}
                />
                <span className="text-xs text-muted-foreground mt-2 text-center">{audioUrl ? 'Change' : 'Upload'}</span>
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
