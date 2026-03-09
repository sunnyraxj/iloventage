import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProductForm } from '../components/ProductForm';
import { getCategories } from '@/lib/data';

export default async function NewProductPage() {
    const categories = await getCategories();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>Fill out the form to add a new product.</CardDescription>
      </CardHeader>
      <CardContent>
        <ProductForm categories={categories} />
      </CardContent>
    </Card>
  );
}
