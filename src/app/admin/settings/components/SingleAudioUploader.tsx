'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Loader2, Music } from 'lucide-react';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import short from 'short-uuid';
import { useToast } from '@/hooks/use-toast';

interface SingleAudioUploaderProps {
  fieldName: string;
  label: string;
}

export function SingleAudioUploader({ fieldName, label }: SingleAudioUploaderProps) {
  const { control, getValues, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const audioUrl = watch(fieldName);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // First, attempt to delete the old audio if it exists
      const currentAudioUrl = getValues(fieldName);
      if (currentAudioUrl && (currentAudioUrl.includes('firebasestorage.googleapis.com') || currentAudioUrl.includes('storage.googleapis.com'))) {
          try {
              const audioRef = ref(storage, currentAudioUrl);
              await deleteObject(audioRef);
          } catch (error: any) {
               if (error.code !== 'storage/object-not-found') {
                  console.error("Old audio deletion failed, continuing with upload:", error);
               }
          }
      }

      // Now, upload the new audio
      const fileId = short.generate();
      const storageRef = ref(storage, `settings/${fileId}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setValue(fieldName, downloadURL, { shouldValidate: true, shouldDirty: true });
      toast({ title: 'Audio Uploaded', description: `${file.name} has been uploaded successfully.` });

    } catch (error: any) {
      console.error("Audio upload failed:", error);
      
      let errorMessage = 'Could not upload audio.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error.code) {
          switch (error.code) {
              case 'storage/unauthorized': errorMessage = `Permission denied. Please check your storage rules.`; break;
              case 'storage/canceled': errorMessage = 'Upload was canceled.'; break;
              case 'storage/retry-limit-exceeded': errorMessage = 'Upload timed out. Please check your network connection.'; break;
              case 'storage/unauthenticated': errorMessage = `You must be logged in to upload files.`; break;
              default: errorMessage = error.message; break;
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

  const handleRemoveAudio = async () => {
    const urlToRemove = getValues(fieldName);
    if (!urlToRemove) return;

    const isFirebaseUrl = urlToRemove.includes('firebasestorage.googleapis.com') || urlToRemove.includes('storage.googleapis.com');

    if (isFirebaseUrl) {
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

  return (
    <FormItem>
        <FormLabel>{label}</FormLabel>
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
