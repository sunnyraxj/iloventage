'use client';
import Link from 'next/link';
import { Twitter, Facebook, Instagram } from 'lucide-react';
import { getCategories, getStoreSettings } from '@/lib/data';
import type { Category, StoreSettings } from '@/lib/types';
import { useEffect, useState } from 'react';

const WhatsAppIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current text-muted-foreground transition-colors hover:text-primary"><title>WhatsApp</title><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
);


export function Footer() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [settings, setSettings] = useState<StoreSettings | null>(null);

    useEffect(() => {
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

    const logoUrl = settings?.storeDetails?.logoUrl;
    const storeName = settings?.storeDetails?.name || 'My Store';

  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm text-xs">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-2 flex items-center space-x-2">
                {logoUrl ? (
                    <img src={logoUrl} alt={storeName} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                   <div className="h-6 w-6 bg-muted rounded-full" />
                )}
              <span className="font-semibold text-sm">{storeName}</span>
            </Link>
            <p className="text-muted-foreground">
              A modern clothing store for the fashion-forward.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-sm">Shop</h3>
            <ul className="space-y-1.5">
              {categories.slice(0,4).map((category) => (
                <li key={category.id}><Link href={`/categories/${category.slug}`} className="text-muted-foreground transition-colors hover:text-primary">{category.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-sm">Company</h3>
            <ul className="space-y-1.5">
              <li><Link href="#" className="text-muted-foreground transition-colors hover:text-primary">Our Story</Link></li>
              <li><Link href="/contact" className="text-muted-foreground transition-colors hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>

          <div>
             <h3 className="mb-2 font-medium text-sm">Follow</h3>
            <div className="flex space-x-3">
               <Link href="#" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
              <Link href="#" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
              </Link>
              {settings?.storeDetails?.instagramUrl && (
                <Link href={settings.storeDetails.instagramUrl} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
                </Link>
              )}
              {settings?.storeDetails?.whatsappGroupUrl && (
                <Link href={settings.storeDetails.whatsappGroupUrl} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon />
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
