'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { OrderItem } from '@/lib/types';

interface OrderImagePreviewProps {
  item: OrderItem;
}

export function OrderImagePreview({ item }: OrderImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Image
            alt={item.name}
            className="aspect-square rounded-md object-cover cursor-pointer"
            height="64"
            src={item.imageUrl || '/placeholder.svg'}
            width="64"
        />
      </DialogTrigger>
      <DialogContent className="max-w-xl p-1">
        <div className="relative aspect-square w-full">
            <Image
                alt={item.name}
                src={item.imageUrl || '/placeholder.svg'}
                fill
                className="object-contain"
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
