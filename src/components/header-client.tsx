'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  ShoppingCart,
  UserCircle,
  LayoutDashboard,
  LogOut,
  User,
  Heart,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import type { Category, StoreSettings, Product } from '@/lib/types';
import { getConfirmedOrdersCount, getProducts } from '@/lib/data';
import { NitecLogo } from '@/components/icons';
import { useDebounce } from 'use-debounce';

interface HeaderClientProps {
    categories: Category[];
    settings: StoreSettings | null;
}

export function HeaderClient({ categories, settings }: HeaderClientProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { items } = useCart();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [hasMounted, setHasMounted] = useState(false);
  const [confirmedOrdersCount, setConfirmedOrdersCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    getProducts().then(setAllProducts);
    getProducts({ limit: 4 }).then(setFeaturedProducts);
  }, []);
  
  useEffect(() => {
    if (debouncedSearchQuery) {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, allProducts]);

  useEffect(() => {
    const fetchOrderCount = async () => {
      if (user?.role === 'admin') {
        const count = await getConfirmedOrdersCount();
        setConfirmedOrdersCount(count);
      } else {
        setConfirmedOrdersCount(0);
      }
    };
    if (user) {
        fetchOrderCount();
      const interval = setInterval(fetchOrderCount, 60000);
      return () => clearInterval(interval);
    } else {
        setConfirmedOrdersCount(0);
    }
  }, [user]);

  const navLinks = categories.map(c => ({ href: `/categories/${c.slug}`, label: c.name }));
  const storeName = settings?.storeDetails?.name || 'nitec.';
  const logoUrl = settings?.storeDetails?.logoUrl;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentQuery = new FormData(e.currentTarget).get('search') as string;
    if (currentQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(currentQuery.trim())}`);
        setIsPopoverOpen(false);
        setSearchQuery('');
    }
  };
  
  const handleSuggestionClick = () => {
    setIsPopoverOpen(false);
    setSearchQuery('');
  }

  const showSearchResults = searchQuery.length > 0;

  return (
    <TooltipProvider>
    <header className="sticky top-0 z-50 w-full p-2 md:p-3">
      <div className="container flex h-16 items-center justify-between gap-4 rounded-full border border-border/40 bg-background/80 shadow-lg backdrop-blur-lg">
        
        {/* Left Section: Logo & Mobile Nav */}
        <div className="flex items-center gap-2">
           <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 sm:max-w-xs">
                <SheetHeader className="p-4 border-b text-left">
                    <SheetTitle asChild>
                        <Link href="/" className="flex items-center gap-2">
                           {logoUrl ? (
                                <img src={logoUrl} alt={storeName} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                                <NitecLogo className="h-6 w-6 text-foreground" />
                            )}
                           <span className="font-bold text-lg">{storeName}</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 space-y-1 p-4">
                  <Link href="/products" className="block rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-accent">All Products</Link>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
             {logoUrl ? (
                <img src={logoUrl} alt={storeName} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <NitecLogo className="h-6 w-6 text-foreground" />
              )}
             <span className="font-bold hidden md:inline-block">{storeName}</span>
          </Link>
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 justify-center hidden md:flex">
          <form className="w-full max-w-md" onSubmit={handleSearchSubmit}>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search products..."
                    className="w-full rounded-full bg-secondary pl-4 pr-12 h-10"
                    value={searchQuery}
                    onClick={() => setIsPopoverOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!isPopoverOpen) {
                        setIsPopoverOpen(true);
                      }
                    }}
                    autoComplete="off"
                  />
                  <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Search className="h-4 w-4" />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] mt-1 p-2"
                  align="start"
              >
                 {showSearchResults ? (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">
                        {`Showing results for "${searchQuery}"`}
                      </h3>
                      {debouncedSearchQuery && searchResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No products found.</p>
                      ) : (
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                          {searchResults.slice(0, 10).map(product => (
                            <Link
                              key={product.id}
                              href={`/products/${product.id}`}
                              onClick={handleSuggestionClick}
                              className="flex items-center gap-4 p-2 rounded-md hover:bg-accent"
                            >
                              <img src={product.variants[0]?.imageUrls[0] || `https://picsum.photos/seed/${product.id}/50/50`} alt={product.name} className="h-10 w-10 object-cover rounded-md" />
                              <div className="text-sm">
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-muted-foreground">₹{product.price.toFixed(2)}</p>
                              </div>
                            </Link>
                          ))}
                          {searchResults.length > 10 && (
                            <Button asChild variant="ghost" className="w-full mt-2">
                              <Link href={`/products?search=${searchQuery}`} onClick={handleSuggestionClick}>
                                View all {searchResults.length} results
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">
                        Featured Products
                      </h3>
                      <div className="space-y-1">
                        {featuredProducts.map(product => (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            onClick={handleSuggestionClick}
                            className="flex items-center gap-4 p-2 rounded-md hover:bg-accent"
                          >
                            <img src={product.variants[0]?.imageUrls[0] || `https://picsum.photos/seed/${product.id}/50/50`} alt={product.name} className="h-10 w-10 object-cover rounded-md" />
                            <div className="text-sm">
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-muted-foreground">₹{product.price.toFixed(2)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
              </PopoverContent>
            </Popover>
          </form>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full md:hidden">
                  <Search className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="p-4">
                 <form className="w-full" onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <Input
                        type="search"
                        name="search"
                        placeholder="Search products..."
                        className="w-full rounded-full bg-secondary pl-4 pr-12 h-10"
                        />
                        <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
              </SheetContent>
            </Sheet>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" disabled>
                        <Heart className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Wishlist coming soon!</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative rounded-full">
                    <ShoppingCart className="h-5 w-5" />
                    {hasMounted && cartItemCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Cart</p>
              </TooltipContent>
            </Tooltip>

            {hasMounted && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" className="rounded-full flex items-center gap-2 pl-1 pr-3 h-10">
                         {user.photoURL ? <img src={user.photoURL} alt={user.name || ''} width={32} height={32} className="rounded-full h-8 w-8" /> : <UserCircle className="h-8 w-8" /> }
                         <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                         {user.role === 'admin' && confirmedOrdersCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {confirmedOrdersCount}
                            </span>
                         )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                        {user.role === 'admin' && (
                            <DropdownMenuItem asChild>
                                <Link href="/admin">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Admin</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Account</span>
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
                  <Button asChild className="rounded-full h-10 px-4 hidden sm:flex">
                    <Link href="/login">
                      Login
                    </Link>
                  </Button>
                )}
              </>
            )}
        </div>
      </div>
    </header>
    </TooltipProvider>
  );
}
