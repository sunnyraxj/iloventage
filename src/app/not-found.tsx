import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center bg-secondary p-4 text-center">
        <div className="rounded-lg bg-background p-8 shadow-sm">
          <ShoppingBag className="mx-auto h-20 w-20 text-primary" />
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Page Not Found
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Sorry, we couldn’t find the page you’re looking for.
          </p>
          <Button asChild className="mt-8">
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
