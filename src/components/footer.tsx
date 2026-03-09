import Link from 'next/link';
import { Github, Twitter, Instagram } from 'lucide-react';
import { NextBazaarLogo } from './icons';

export function Footer() {
  return (
    <footer className="border-t bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col items-start">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <NextBazaarLogo className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">NextBazaar</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Modern e-commerce for the modern world.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/categories/apparel" className="text-sm text-muted-foreground hover:text-primary">Apparel</Link></li>
              <li><Link href="/categories/shoes" className="text-sm text-muted-foreground hover:text-primary">Shoes</Link></li>
              <li><Link href="/categories/accessories" className="text-sm text-muted-foreground hover:text-primary">Accessories</Link></li>
              <li><Link href="/categories/electronics" className="text-sm text-muted-foreground hover:text-primary">Electronics</Link></li>
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
              <Link href="#" aria-label="Instagram">
                <Instagram className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
              <Link href="#" aria-label="GitHub">
                <Github className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NextBazaar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
