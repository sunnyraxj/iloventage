import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProductById, getCategories } from '@/lib/data';
import { ProductForm } from '../components/ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    getProductById(params.id),
    getCategories()
  ]);

  if (!product) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Product not found</CardTitle>
            </CardHeader>
            <CardContent>
                <p>The product you are trying to edit does not exist.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Product</CardTitle>
        <CardDescription>Editing: {product.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <ProductForm product={product} categories={categories} />
      </CardContent>
    </Card>
  );
}
