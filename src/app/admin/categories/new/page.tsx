import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CategoryForm } from '../components/CategoryForm';

export default function NewCategoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Category</CardTitle>
        <CardDescription>Fill out the form to add a new category.</CardDescription>
      </CardHeader>
      <CardContent>
        <CategoryForm />
      </CardContent>
    </Card>
  );
}
