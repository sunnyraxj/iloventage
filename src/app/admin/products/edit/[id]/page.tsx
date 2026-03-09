import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProductById } from '@/lib/data';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

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
        <p>Product edit form will be here.</p>
      </CardContent>
    </Card>
  );
}
