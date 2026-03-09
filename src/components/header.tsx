'use client';

import Link from 'next/link';
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
import { IloventagLogo } from './icons';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/products', label: 'All Products' },
  { href: '/categories/apparel', label: 'Apparel' },
  { href: '/categories/shoes', label: 'Shoes' },
  { href: '/categories/accessories', label: 'Accessories' },
  { href: '/categories/electronics', label: 'Electronics' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-300",
      isScrolled 
        ? "h-16 bg-background" 
        : "h-24 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container flex h-full items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 sm:max-w-xs">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Link
                href="/"
                className="mb-4 flex items-center space-x-2 px-4"
              >
                <IloventagLogo className="h-6 w-6" />
                <span className="font-bold">ILOVENTAG</span>
              </Link>
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center space-x-2">
            <IloventagLogo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              ILOVENTAG
            </span>
          </Link>
        </div>

        <nav className={cn(
            "hidden items-center space-x-6 text-sm font-medium md:flex",
            isScrolled && "hidden"
          )}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground/80"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center justify-end space-x-2">
          <div className={cn(
            "hidden w-full md:w-auto md:flex",
             isScrolled && "hidden"
          )}>
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" aria-label="Shopping Cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="User Menu"
                  >
                    <UserCircle className="h-5 w-5" />
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
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
