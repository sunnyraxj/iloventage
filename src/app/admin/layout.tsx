
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings } from 'lucide-react';
import { hasConfirmedOrders as checkHasConfirmedOrders } from '@/lib/data';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Customers', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasConfirmedOrders, setHasConfirmedOrders] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin');
      } else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkOrders = async () => {
      if (user?.role === 'admin') {
        const hasConfirmed = await checkHasConfirmedOrders();
        setHasConfirmedOrders(hasConfirmed);
      }
    };
    
    if (user) {
      checkOrders();
      // Optional: Poll for new orders periodically
      const interval = setInterval(checkOrders, 60000); // every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <aside className="md:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <nav className="flex flex-col space-y-1">
                    {navItems.map((item) => {
                      const isActive = (item.href === '/admin' && pathname === '/admin') || (item.href !== '/admin' && pathname.startsWith(item.href));
                      const isOrdersLink = item.label === 'Orders';
                      return (
                        <Button
                          key={item.label}
                          asChild
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="justify-start relative"
                        >
                          <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                            {isOrdersLink && hasConfirmedOrders && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500" />
                            )}
                          </Link>
                        </Button>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </aside>
            <div className="md:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
