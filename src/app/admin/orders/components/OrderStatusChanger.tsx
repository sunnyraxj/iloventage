'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateOrderStatus } from '@/app/actions/admin';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface OrderStatusChangerProps {
  orderId: string;
  currentStatus: Order['orderStatus'];
}

export function OrderStatusChanger({ orderId, currentStatus }: OrderStatusChangerProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: Order['orderStatus']) => {
    if (isLoading) return;
    setIsLoading(true);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setStatus(newStatus);
      toast({ title: 'Status Updated', description: `Order status changed to ${newStatus}.` });
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
    }
    setIsLoading(false);
  };
  
  const getStatusVariant = (status: Order['orderStatus']): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' => {
      switch (status) {
        case 'confirmed':
          return 'success';
        case 'shipped':
          return 'default';
        case 'delivered':
          return 'secondary';
        case 'cancelled':
            return 'destructive';
        case 'pending':
            return 'outline';
        default:
          return 'outline';
      }
    };
    
  // Admin cannot change status for these states
  const canChangeStatus = !['pending', 'cancelled', 'delivered'].includes(status);


  return (
    <div className="flex items-center justify-center gap-1">
        <Badge variant={getStatusVariant(status)} className="capitalize w-24 justify-center">{status}</Badge>
        {canChangeStatus && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {status === 'confirmed' && (
                        <DropdownMenuItem onClick={() => handleStatusChange('shipped')}>
                            Mark as Shipped
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleStatusChange('delivered')}>
                        Mark as Delivered
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
    </div>
  );
}
