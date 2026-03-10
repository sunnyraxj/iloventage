import { getCategories, getStoreSettings } from '@/lib/data';
import { HeaderClient } from './header-client';

export async function Header() {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getStoreSettings(),
  ]);

  return <HeaderClient categories={categories || []} settings={settings} />;
}
