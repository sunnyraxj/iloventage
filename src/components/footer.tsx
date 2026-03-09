'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Facebook } from 'lucide-react';
import { getCategories } from '@/lib/data';
import type { Category } from '@/lib/types';
import { useEffect, useState } from 'react';

export function Footer() {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            const appCategories = await getCategories();
            setCategories(appCategories);
        }
        fetchInitialData();
    }, []);

  return (
    <footer className="border-t bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col items-start">
            <Link href="/" className="mb-4 flex items-center space-x-2">
               <div className="h-8 w-8 bg-muted rounded-full" />
              <span className="text-xl font-bold">My Store</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Modern e-commerce for the modern world.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Shop</h3>
            <ul className="space-y-2">
              {categories.slice(0,4).map((category) => (
                <li key={category.id}><Link href={`/categories/${category.slug}`} className="text-sm text-muted-foreground hover:text-primary">{category.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">About Us</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Our Story</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Careers</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Follow Us</h3>
            <div className="flex space-x-4">
               <Link href="#" aria-label="Twitter">
                <Twitter className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
              <Link href="#" aria-label="Facebook">
                <Facebook className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} My Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
