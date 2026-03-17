'use client';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface OrderImagePreviewProps {
  item: OrderItem;
}

export function OrderImagePreview({ item }: OrderImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <img
            alt={item.name}
            className="aspect-square rounded-md object-cover cursor-pointer"
            height="64"
            src={item.imageUrl || `https://picsum.photos/seed/${item.id}/64/64`}
            width="64"
            loading="lazy"
        />
      </DialogTrigger>
      <DialogContent className="max-w-xl p-1">
        <DialogHeader className="sr-only">
          <DialogTitle>Image Preview: {item.name}</DialogTitle>
          <DialogDescription>A larger view of the product image for {item.name}.</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square w-full group">
            <img
                alt={item.name}
                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/500/500`}
                className="absolute inset-0 h-full w-full object-contain"
                loading="lazy"
            />
            <Button
                asChild
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            >
                <a href={item.imageUrl || `https://picsum.photos/seed/${item.id}/500/500`} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download image</span>
                </a>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
