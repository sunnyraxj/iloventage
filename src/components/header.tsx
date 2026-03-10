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
import { getCategories, getStoreSettings } from '@/lib/data';
import type { Category, StoreSettings } from '@/lib/types';

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [hasMounted, setHasMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    setHasMounted(true);
    const fetchInitialData = async () => {
        const [appCategories, appSettings] = await Promise.all([
            getCategories(),
            getStoreSettings()
        ]);
        setCategories(appCategories);
        setSettings(appSettings);
    }
    fetchInitialData();
  }, []);

  const navLinks = categories.map(c => ({ href: `/categories/${c.slug}`, label: c.name }));
  const logoUrl = settings?.storeDetails?.logoUrl;
  const storeName = settings?.storeDetails?.name || 'My Store';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {hasMounted && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0 sm:max-w-xs">
                <SheetTitle className='p-4'>Menu</SheetTitle>
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
          <Link href="/" className="flex items-center space-x-2">
            {logoUrl ? (
                <img src={logoUrl} alt={storeName} width={120} height={32} className="h-8 w-auto" />
            ) : (
                <div className="h-8 w-8 bg-muted rounded-full" />
            )}
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/products" className="text-muted-foreground transition-colors hover:text-foreground">All Products</Link>
            {navLinks.slice(0, 4).map(link => (
                 <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link>
            ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <form className="hidden sm:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg bg-secondary pl-8"
                />
              </div>
            </form>
          <div className="flex items-center space-x-2">
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
                        className="rounded-full"
                        aria-label="User Menu"
                      >
                         {user.photoURL ? <img src={user.photoURL} alt={user.name} width={32} height={32} className="rounded-full" /> : <UserCircle className="h-5 w-5" /> }
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
