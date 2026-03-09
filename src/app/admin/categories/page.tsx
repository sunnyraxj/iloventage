import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default async function AdminCategoriesPage() {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>This page is no longer in use.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Categories are now managed directly from the product form. When you create or edit a product, you can type in a new category name, and it will be created automatically if it doesn't exist.</p>
            </CardContent>
        </Card>
    );
}
