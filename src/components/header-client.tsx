
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ArrowLeft,
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
import { CartDrawer } from '@/components/CartDrawer';
import { cn } from '@/lib/utils';


interface CategoryWithProducts extends Category {
    products: Product[];
}

interface HeaderClientProps {
    categories: CategoryWithProducts[];
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
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (categoryHref: string) => {
      if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
      }
      setHoveredCategory(categoryHref);
  };

  const handleMouseLeave = () => {
      closeTimeoutRef.current = setTimeout(() => {
          setHoveredCategory(null);
      }, 100);
  };


  useEffect(() => {
    setHasMounted(true);
    getProducts().then(setAllProducts);
    getProducts({ limit: 4 }).then(setFeaturedProducts);
  }, []);
  
  useEffect(() => {
    if (debouncedSearchQuery) {
      setIsSearching(true);
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
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

  const navLinks = categories.map(c => ({ href: `/categories/${c.slug}`, label: c.name, products: c.products }));
  const storeName = settings?.storeDetails?.name || 'nitec.';
  const logoUrl = settings?.storeDetails?.logoUrl;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentQuery = new FormData(e.currentTarget).get('search') as string;
    if (currentQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(currentQuery.trim())}`);
        setIsPopoverOpen(false);
        setSearchQuery('');
        setIsMobileSearchActive(false);
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
        
        {isMobileSearchActive ? (
            <div className="flex w-full items-center gap-2 md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {
                    setIsMobileSearchActive(false);
                    setSearchQuery('');
                }}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <form className="w-full" onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <Input
                            type="search"
                            name="search"
                            placeholder="Search products..."
                            className="w-full rounded-full bg-secondary pl-4 pr-12 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        ) : (
            <>
                {/* Left Section: Logo & Mobile Nav */}
                <div className="flex items-center gap-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                        <Menu className="h-6 w-6" />
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

                {/* Center Section: Nav & Search */}
                <div className="flex-1 justify-center items-center hidden md:flex gap-x-6">
                    <nav className="flex items-center gap-x-4 lg:gap-x-6">
                        {navLinks.slice(0, 3).map((link) => (
                            <Popover key={link.href} open={hoveredCategory === link.href} onOpenChange={(isOpen) => !isOpen && setHoveredCategory(null)}>
                                <PopoverTrigger asChild>
                                    <div className="py-4" onMouseEnter={() => handleMouseEnter(link.href)} onMouseLeave={handleMouseLeave}>
                                        <Link
                                            href={link.href}
                                            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                                        >
                                            {link.label}
                                            <ChevronDown 
                                                className={cn(
                                                    "h-4 w-4 transition-transform duration-200",
                                                    hoveredCategory === link.href ? "rotate-180" : ""
                                                )}
                                            />
                                        </Link>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent
                                    onMouseEnter={() => handleMouseEnter(link.href)}
                                    onMouseLeave={handleMouseLeave}
                                    className="w-screen max-w-6xl p-0"
                                    align="start"
                                >
                                    <div className="p-4">
                                        <h3 className="font-semibold">{link.label} Products</h3>
                                        <p className="text-sm text-muted-foreground mb-4">A glimpse of our collection.</p>
                                        {link.products && link.products.length > 0 ? (
                                            <div className="grid grid-cols-6 gap-4">
                                                {link.products.map((product) => (
                                                    <Link
                                                        key={product.id}
                                                        href={`/products/${product.id}`}
                                                        className="group block"
                                                        onClick={() => setHoveredCategory(null)}
                                                    >
                                                        <div className="aspect-[3/4] overflow-hidden rounded-md bg-secondary">
                                                            <img
                                                                src={product.variants[0]?.imageUrls[0] || `https://picsum.photos/seed/${product.id}/200/266`}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <h4 className="mt-2 truncate text-sm font-medium text-foreground">{product.name}</h4>
                                                        <p className="text-xs text-muted-foreground">₹{product.price.toFixed(2)}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-sm text-muted-foreground py-8">No products to display.</p>
                                        )}
                                        <Button asChild variant="outline" className="w-full mt-4">
                                            <Link href={link.href} onClick={() => setHoveredCategory(null)}>View all in {link.label}</Link>
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ))}
                    </nav>
                    <form className="w-full max-w-xs" onSubmit={handleSearchSubmit}>
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div className="relative">
                            <Input
                                type="search"
                                name="search"
                                placeholder="Search products..."
                                className="w-full rounded-full bg-secondary pl-4 pr-12 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsPopoverOpen(true)}
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
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            {showSearchResults ? (
                                <div>
                                <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">
                                    {isSearching ? 'Searching...' : `Showing results for "${searchQuery}"`}
                                </h3>
                                {isSearching ? (
                                    <div className="flex justify-center items-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No products found.</p>
                                ) : (
                                    <div className="space-y-1 max-h-96 overflow-y-auto">
                                    {searchResults.slice(0, 10).map(product => (
                                        <Link
                                        key={product.id}
                                        href={`/products/${product.id}`}
                                        onClick={handleSuggestionClick}
                                        className="flex items-center gap-4 p-2 rounded-md transition-all duration-200 hover:bg-accent hover:shadow-md hover:scale-105"
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
                                        className="flex items-center gap-4 p-2 rounded-md transition-all duration-200 hover:bg-accent hover:shadow-md hover:scale-105"
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
                    <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setIsMobileSearchActive(true)}>
                        <Search className="h-6 w-6" />
                    </Button>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" disabled>
                                <Heart className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Wishlist coming soon!</p>
                        </TooltipContent>
                    </Tooltip>

                    <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative rounded-full">
                        <ShoppingCart className="h-6 w-6" />
                        {hasMounted && cartItemCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {cartItemCount}
                            </span>
                        )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
                        <CartDrawer />
                    </SheetContent>
                    </Sheet>

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
            </>
        )}
      </div>
    </header>
    </TooltipProvider>
  );
}
