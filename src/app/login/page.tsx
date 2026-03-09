'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { NextBazaarLogo } from '@/components/icons';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleLogin = (role: 'admin' | 'customer') => {
    login(role);
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <NextBazaarLogo className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl">Welcome to NextBazaar</CardTitle>
          <CardDescription>Select a role to log in to the demo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button size="lg" onClick={() => handleLogin('customer')}>
            Login as Customer
          </Button>
          <Button size="lg" variant="outline" onClick={() => handleLogin('admin')}>
            Login as Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
