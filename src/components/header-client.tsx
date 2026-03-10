'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  ShoppingCart,
  UserCircle,
  LayoutDashboard,
  LogOut,
  LogIn,
  User,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import type { Category, StoreSettings } from '@/lib/types';
import { getConfirmedOrdersCount } from '@/lib/data';

interface HeaderClientProps {
    categories: Category[];
    settings: StoreSettings | null;
}

export function HeaderClient({ categories, settings }: HeaderClientProps) {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [hasMounted, setHasMounted] = useState(false);
  const [confirmedOrdersCount, setConfirmedOrdersCount] = useState(0);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  useEffect(() => {
    const fetchOrderCount = async () => {
      if (user?.role === 'admin') {
        const count = await getConfirmedOrdersCount();
        setConfirmedOrdersCount(count);
      } else {
        setConfirmedOrdersCount(0); // Reset if not admin or logged out
      }
    };
    
    if (user) {
        fetchOrderCount();
      // Poll for new orders periodically
      const interval = setInterval(fetchOrderCount, 60000); // every minute
      return () => clearInterval(interval);
    } else {
        // Clear count if user logs out
        setConfirmedOrdersCount(0);
    }
  }, [user]);


  const navLinks = categories.map(c => ({ href: `/categories/${c.slug}`, label: c.name }));
  const logoUrl = settings?.storeDetails?.logoUrl;
  const storeName = settings?.storeDetails?.name || 'My Store';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container grid h-16 grid-cols-3 items-center gap-4">
        {/* Left Section */}
        <div className="flex items-center justify-start gap-4">
          {hasMounted && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0 sm:max-w-xs">
                <SheetTitle className='p-4'>{storeName}</SheetTitle>
                <nav className="flex flex-col space-y-2 p-4">
                  <Link href="/products" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md">All Products</Link>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
            <Link href="/products" className="text-muted-foreground transition-colors hover:text-foreground">All Products</Link>
            {navLinks.slice(0, 3).map(link => (
                 <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link>
            ))}
        </nav>
        </div>

        {/* Center Section (Logo) */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-2">
            {logoUrl ? (
                <img src={logoUrl} alt={storeName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            ) : (
                <div className="h-10 w-10 bg-muted rounded-full" />
            )}
            <span className="font-bold hidden lg:inline-block">{storeName}</span>
          </Link>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <form className="hidden sm:block sm:flex-1 sm:max-w-xs">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg bg-secondary pl-8"
                />
              </div>
            </form>
          <div className="flex items-center space-x-1 md:space-x-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {hasMounted && cartItemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {hasMounted && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full relative"
                        aria-label="User Menu"
                      >
                         {user.photoURL ? <img src={user.photoURL} alt={user.name} width={32} height={32} className="rounded-full" /> : <UserCircle className="h-5 w-5" /> }
                         {user.role === 'admin' && confirmedOrdersCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                                {confirmedOrdersCount}
                            </span>
                         )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                        {user.role === 'admin' ? (
                            <DropdownMenuItem asChild>
                                <Link href="/admin">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                                </Link>
                            </DropdownMenuItem>
                        ) : (
                            <>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard">
                                <User className="mr-2 h-4 w-4" />
                                <span>My Account</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/addresses">
                                <MapPin className="mr-2 h-4 w-4" />
                                <span>Addresses</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/orders">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                <span>My Orders</span>
                                </Link>
                            </DropdownMenuItem>
                            </>
                        )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild>
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
