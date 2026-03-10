
import { getCategories } from '@/lib/data';
import { ProductsView } from './components/ProductsView';

export default async function ProductsPage() {
    const categories = await getCategories();
    return <ProductsView categories={categories} />;
}
