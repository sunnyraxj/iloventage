import { getCategories, getStoreSettings } from '@/lib/data';
import { FooterClient } from './footer-client';

export async function Footer() {
    const [categories, settings] = await Promise.all([
        getCategories(),
        getStoreSettings()
    ]);
   
    return <FooterClient categories={categories || []} settings={settings} />
}
