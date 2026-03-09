'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminProductsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>Manage your products here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Product management interface will be here.</p>
      </CardContent>
    </Card>
  );
}
