'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { IloventagLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState<'admin' | 'customer' | null>(null);

  const redirect = searchParams.get('redirect') || '/';

  const handleLogin = async (role: 'admin' | 'customer') => {
    setIsLoggingIn(role);
    try {
        await login(role);
        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
        if (role === 'admin') {
            router.push('/admin');
        } else {
            router.push(redirect);
        }
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Please ensure demo users exist in your Firebase project.",
        });
    } finally {
        setIsLoggingIn(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <IloventagLogo className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl">Welcome to ILOVENTAG</CardTitle>
          <CardDescription>Select a role to log in to the demo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button size="lg" onClick={() => handleLogin('customer')} disabled={loading || !!isLoggingIn}>
            {isLoggingIn === 'customer' ? 'Logging in...' : 'Login as Customer'}
          </Button>
          <Button size="lg" variant="outline" onClick={() => handleLogin('admin')} disabled={loading || !!isLoggingIn}>
            {isLoggingIn === 'admin' ? 'Logging in...' : 'Login as Admin'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
