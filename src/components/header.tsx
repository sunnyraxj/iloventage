'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  ShoppingCart,
  UserCircle,
  LayoutDashboard,
  LogOut,
  LogIn,
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
import { getAppSettings, getCategories } from '@/lib/data';
import type { AppSettings, Category } from '@/lib/types';

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [hasMounted, setHasMounted] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setHasMounted(true);
    const fetchInitialData = async () => {
        const [appSettings, appCategories] = await Promise.all([
            getAppSettings(),
            getCategories()
        ]);
        setSettings(appSettings);
        setCategories(appCategories);
    }
    fetchInitialData();
  }, []);

  const navLinks = categories.map(c => ({ href: `/categories/${c.slug}`, label: c.name }));

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
            {settings?.storeDetails.logoUrl ? (
                <Image src={settings.storeDetails.logoUrl} alt={settings.storeDetails.name} width={32} height={32} />
            ) : <div className="h-8 w-8 bg-muted rounded-full" />}
            <span className="hidden font-bold sm:inline-block text-lg">
              {settings?.storeDetails.name || "My Store"}
            </span>
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
                         {user.photoURL ? <Image src={user.photoURL} alt={user.name} width={24} height={24} className="rounded-full" /> : <UserCircle className="h-5 w-5" /> }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
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
