'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();

  useEffect(() => {
    // This page is deprecated. The cart is now in a drawer.
    // Redirect users to the homepage.
    router.replace('/');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-secondary">
        <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
    </div>
  );
}
