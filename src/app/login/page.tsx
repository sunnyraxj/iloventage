'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = () => <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.8 111.8 12.8 244 12.8c70.3 0 129.8 27.8 174.4 72.4l-69.3 69.3c-24-22.5-54.8-36.4-90.1-36.4-69.1 0-125.7 56.5-125.7 125.7s56.5 125.7 125.7 125.7c81.5 0 114.8-55.8 119.5-84.2H244v-85.7h244z"></path></svg>;

function LoginContent() {
  const { user, login, signInWithGoogle, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    // If user is logged in, redirect them
    if (user) {
        const targetPath = user.role === 'admin' ? '/admin' : redirect;
        router.push(targetPath);
    }
  }, [user, router, redirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await login(email, password);
        // The useEffect hook will now handle redirection.
        toast({
            title: "Login Successful",
            description: "Redirecting...",
        });
    } catch(e: any) {
        let errorMessage = "An unknown error occurred.";
        // Firebase auth errors have a 'code' property
        switch (e.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password. Please try again.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Please enter a valid email address.";
                break;
            default:
                errorMessage = "Login failed. Please try again later.";
                break;
        }
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
        await signInWithGoogle();
        toast({
            title: "Login Successful",
            description: "Redirecting...",
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Login Failed",
            description: error.message || "An unknown error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  // While auth is loading or if user is already logged in, show loading.
  // The useEffect will handle the redirect.
  if (authLoading || user) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Checking session...</h2>
          <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4 text-2xl">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || authLoading}>
                <GoogleIcon />
                Sign in with Google
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <form onSubmit={handleLogin}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="m@example.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                        {isLoading ? 'Logging in...' : 'Login with Email'}
                    </Button>
                </div>
            </form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                    Sign up
                </Link>
            </p>
        </CardFooter>
    </Card>
  );
}


export default function LoginPage() {
  const loadingSkeleton = (
    <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground">Please wait.</p>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
        <Suspense fallback={loadingSkeleton}>
            <LoginContent />
        </Suspense>
    </div>
  );
}
