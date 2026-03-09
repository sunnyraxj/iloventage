
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProductById, getCategories } from '@/lib/data';
import { ProductForm } from '../../components/ProductForm';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    getProductById(params.id),
    getCategories()
  ]);

  if (!product) {
    return notFound();
  }

  const categoryName = categories.find(c => c.id === product.collectionId)?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Product</CardTitle>
        <CardDescription>Editing: {product.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <ProductForm product={product} categories={categories} categoryName={categoryName} />
      </CardContent>
    </Card>
  );
}
