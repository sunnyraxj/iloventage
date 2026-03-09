import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewProductPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>Fill out the form to add a new product.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Product form will be here.</p>
      </CardContent>
    </Card>
  );
}
