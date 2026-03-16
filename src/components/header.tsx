import { getCategories, getStoreSettings, getProductsByCollectionId } from '@/lib/data';
import { HeaderClient } from './header-client';
import type { Category, Product } from '@/lib/types';

export interface CategoryWithProducts extends Category {
    products: Product[];
}

export async function Header() {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getStoreSettings(),
  ]);

  const categoriesWithProducts: CategoryWithProducts[] = await Promise.all(
    (categories || []).map(async (category) => {
        const products = await getProductsByCollectionId(category.id, { limit: 6 });
        return { ...category, products };
    })
  );

  return <HeaderClient categories={categoriesWithProducts} settings={settings} />;
}
