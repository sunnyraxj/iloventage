'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateOrderStatus } from '@/app/actions/admin';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface OrderStatusChangerProps {
  orderId: string;
  currentStatus: Order['orderStatus'];
  isEditable?: boolean;
}

export function OrderStatusChanger({ orderId, currentStatus, isEditable = true }: OrderStatusChangerProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Order['orderStatus'] | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!pendingStatus || isLoading) return;
    setIsLoading(true);
    
    const result = await updateOrderStatus(orderId, pendingStatus);
    if (result.success) {
      setStatus(pendingStatus);
      toast({ title: 'Status Updated', description: `Order status changed to ${pendingStatus}.` });
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
    }
    
    setIsLoading(false);
    setPendingStatus(null);
    setIsAlertOpen(false);
  };
  
  const openConfirmation = (newStatus: Order['orderStatus']) => {
    setPendingStatus(newStatus);
    setIsAlertOpen(true);
  }

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
  const canChangeStatus = isEditable && !['pending', 'cancelled', 'delivered'].includes(status);


  return (
    <>
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
                            <DropdownMenuItem onSelect={() => openConfirmation('shipped')}>
                                Mark as Shipped
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => openConfirmation('delivered')}>
                            Mark as Delivered
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will update the order status to &quot;{pendingStatus}&quot;. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPendingStatus(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Continue'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
