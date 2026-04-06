'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyPaymentStatusFromAdmin } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

interface VerifyPaymentButtonProps {
    orderId: string;
}

export function VerifyPaymentButton({ orderId }: VerifyPaymentButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleVerify = async () => {
        setIsLoading(true);
        try {
            const result = await verifyPaymentStatusFromAdmin(orderId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Verification Failed', description: result.message });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button onClick={handleVerify} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Verifying...' : 'Verify Payment Manually'}
        </Button>
    )
}
