import { getProductById } from '@/lib/data';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/product-form';
import { notFound } from 'next/navigation';
  
export default async function EditProductPage({ params }: { params: { id: string } }) {
    const product = await getProductById(params.id);

    if (!product) {
        notFound();
    }

    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
            <CardDescription>Update the details of your product below.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm product={product} />
          </CardContent>
        </Card>
      </div>
    );
}
