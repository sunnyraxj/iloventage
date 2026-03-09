import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCategoryById } from '@/lib/data';
import { CategoryForm } from '../../components/CategoryForm';
import { notFound } from 'next/navigation';

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const category = await getCategoryById(params.id);

  if (!category) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Category</CardTitle>
        <CardDescription>Editing: {category.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <CategoryForm category={category} />
      </CardContent>
    </Card>
  );
}
