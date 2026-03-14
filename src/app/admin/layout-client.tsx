'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LayoutGrid } from 'lucide-react';
import { getConfirmedOrdersCount } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Customers', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmedOrdersCount, setConfirmedOrdersCount] = useState(0);

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
    const fetchOrderCount = async () => {
      if (user?.role === 'admin') {
        const count = await getConfirmedOrdersCount();
        setConfirmedOrdersCount(count);
      }
    };
    
    if (user) {
        fetchOrderCount();
      // Poll for new orders periodically
      const interval = setInterval(fetchOrderCount, 60000); // every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <aside className="md:col-span-1">
            <Skeleton className="h-72 w-full" />
          </aside>
          <div className="md:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
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
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="justify-start relative"
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                      {isOrdersLink && confirmedOrdersCount > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                              {confirmedOrdersCount}
                          </span>
                      )}
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
  );
}
