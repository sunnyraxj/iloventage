'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';

// Utility to create an image element from a URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Utility to calculate rotated image size
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

// Main utility to get the cropped, rotated, and flipped image as a Blob
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = (rotation * Math.PI) / 180;

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/png'); // Output PNG for further compression
  });
}

interface EditState {
  file: File;
  url: string;
  crop: Point;
  zoom: number;
  rotation: number;
  flip: { horizontal: boolean; vertical: boolean };
  croppedAreaPixels: Area | null;
}

interface ImageEditorProps {
  files: File[];
  onCancel: () => void;
  onComplete: (processedImages: {blob: Blob | null; originalFile: File}[]) => void;
}

export function ImageEditor({ files, onCancel, onComplete }: ImageEditorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [editStates, setEditStates] = useState<EditState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const initialStates: EditState[] = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      crop: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0,
      flip: { horizontal: false, vertical: false },
      croppedAreaPixels: null,
    }));
    setEditStates(initialStates);
    setCurrentIndex(0);

    return () => {
      initialStates.forEach(state => URL.revokeObjectURL(state.url));
    };
  }, [files]);
  
  const currentEditState = editStates[currentIndex];

  const updateCurrentState = (updates: Partial<EditState>) => {
    const newStates = [...editStates];
    newStates[currentIndex] = { ...newStates[currentIndex], ...updates };
    setEditStates(newStates);
  };
  
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    updateCurrentState({ croppedAreaPixels });
  }, [editStates, currentIndex]);

  const handleFinish = async () => {
    setIsProcessing(true);
    toast({ title: 'Processing Images', description: 'Applying edits and compressing...' });

    try {
        const editedBlobPromises = editStates.map(async (state) => {
            try {
                if (!state.croppedAreaPixels) {
                    throw new Error('Crop data not yet available for this image.');
                }
                const blob = await getCroppedImg(state.url, state.croppedAreaPixels, state.rotation, state.flip);
                if (!blob) {
                    throw new Error('Cropping failed to produce an image.');
                }
                return { blob, originalFile: state.file };
            } catch (error) {
                console.error(`Failed to process image ${state.file.name}:`, error);
                toast({
                    variant: 'destructive',
                    title: 'Processing Failed',
                    description: `Skipping ${state.file.name}. It might be a corrupted or unsupported file.`
                });
                return { blob: null, originalFile: state.file }; // Mark as failed
            }
        });

        const editedBlobs = await Promise.all(editedBlobPromises);

        const compressionOptions = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            initialQuality: 0.7,
            fileType: 'image/webp',
            alwaysKeepOrientation: true,
        };

        const results = await Promise.all(
            editedBlobs.map(async (image) => {
                const { blob, originalFile } = image;
                if (!blob) return { blob: null, originalFile };
              
                const fileToCompress = new File([blob], originalFile.name.replace(/\.[^/.]+$/, ".png"), { type: 'image/png' });
    
                try {
                    const compressedFile = await imageCompression(fileToCompress, compressionOptions);
                    return { blob: compressedFile, originalFile };
                } catch (compressionError) {
                    console.error('Compression failed for an image:', compressionError);
                    toast({ variant: 'destructive', title: 'Compression Failed', description: `Could not compress ${originalFile.name}. Using uncompressed edited version.`});
                    return { blob: blob, originalFile };
                }
            })
        );
      
      onComplete(results);
      setIsOpen(false);
    } catch (e) {
        // This catch block will now only handle very unexpected errors, as per-image errors are caught above.
        console.error("An unexpected error occurred during image processing:", e);
        toast({ variant: "destructive", title: 'Unexpected Error', description: 'An unknown error occurred while processing images.'});
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleCancel = () => {
      setIsOpen(false);
      onCancel();
  }

  const handleReset = () => {
    const newStates = [...editStates];
    newStates[currentIndex] = {
        ...newStates[currentIndex],
        crop: { x: 0, y: 0 },
        zoom: 1,
        rotation: 0,
        flip: { horizontal: false, vertical: false },
    };
    setEditStates(newStates);
  }

  if (!currentEditState) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Edit Image ({currentIndex + 1} of {editStates.length})</DialogTitle>
          <DialogDescription>Crop, rotate, and adjust your product image before uploading.</DialogDescription>
        </DialogHeader>

        <div className="flex-grow relative bg-muted/20">
          <Cropper
            image={currentEditState.url}
            crop={currentEditState.crop}
            zoom={currentEditState.zoom}
            rotation={currentEditState.rotation}
            aspect={3 / 4}
            onCropChange={(crop) => updateCurrentState({ crop })}
            onZoomChange={(zoom) => updateCurrentState({ zoom })}
            onRotationChange={(rotation) => updateCurrentState({ rotation })}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
            flipHorizontal={currentEditState.flip.horizontal}
            flipVertical={currentEditState.flip.vertical}
          />
        </div>

        <div className="p-4 space-y-4 border-t">
            <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                    <Label>Zoom</Label>
                    <Slider
                        value={[currentEditState.zoom]}
                        min={1} max={3} step={0.1}
                        onValueChange={(val) => updateCurrentState({ zoom: val[0] })}
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Rotation</Label>
                    <Slider
                        value={[currentEditState.rotation]}
                        min={0} max={360} step={1}
                        onValueChange={(val) => updateCurrentState({ rotation: val[0] })}
                    />
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => updateCurrentState({ rotation: (currentEditState.rotation - 90) % 360 })}>
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" onClick={() => updateCurrentState({ rotation: (currentEditState.rotation + 90) % 360 })}>
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => updateCurrentState({ flip: { ...currentEditState.flip, horizontal: !currentEditState.flip.horizontal } })}>
                        <FlipHorizontal className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => updateCurrentState({ flip: { ...currentEditState.flip, vertical: !currentEditState.flip.vertical } })}>
                        <FlipVertical className="h-4 w-4" />
                    </Button>
                </div>
                 <Button variant="outline" onClick={handleReset}><RefreshCcw className="mr-2 h-4 w-4" /> Reset</Button>
            </div>
        </div>

        <DialogFooter className="p-4 border-t flex justify-between w-full">
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setCurrentIndex(i => i - 1)} disabled={currentIndex === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" onClick={() => setCurrentIndex(i => i + 1)} disabled={currentIndex === editStates.length - 1}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          <Button onClick={handleFinish} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin mr-2"/> : null}
            {isProcessing ? `Processing ${editStates.length} images...` : `Finish & Upload ${editStates.length} Images`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
