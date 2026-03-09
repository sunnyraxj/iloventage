'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminOrdersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>View and manage customer orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Order management interface will be here.</p>
      </CardContent>
    </Card>
  );
}
