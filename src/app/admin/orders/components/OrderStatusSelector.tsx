'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOrderStatus } from '@/app/actions/admin';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';

interface OrderStatusSelectorProps {
    orderId: string;
    currentStatus: Order['orderStatus'];
}

export function OrderStatusSelector({ orderId, currentStatus }: OrderStatusSelectorProps) {
    const [status, setStatus] = useState(currentStatus);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const orderStatuses: Order['orderStatus'][] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    const handleStatusChange = async (newStatus: Order['orderStatus']) => {
        setIsLoading(true);
        const result = await updateOrderStatus(orderId, newStatus);
        if (result.success) {
            setStatus(newStatus);
            toast({ title: "Status Updated", description: `Order status changed to ${newStatus}.` });
        } else {
            toast({ variant: 'destructive', title: "Update Failed", description: result.message });
        }
        setIsLoading(false);
    }

    return (
        <Select value={status} onValueChange={(value) => handleStatusChange(value as Order['orderStatus'])} disabled={isLoading}>
            <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                {orderStatuses.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
