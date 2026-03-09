import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/product-form';
  
export default function NewProductPage() {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>Fill in the details below to add a new product to your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm />
          </CardContent>
        </Card>
      </div>
    );
}
