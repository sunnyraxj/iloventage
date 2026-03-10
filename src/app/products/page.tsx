
import { getProducts, getCategories } from '@/lib/data';
import { ProductsView } from './components/ProductsView';

export default async function ProductsPage() {
    const [products, categories] = await Promise.all([
        getProducts(),
        getCategories(),
    ]);

    return <ProductsView initialProducts={products} categories={categories} />;
}
