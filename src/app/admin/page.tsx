'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Dashboard</CardTitle>
        <CardDescription>Welcome to the admin panel.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is your admin dashboard. You can manage products, orders, and users from the menu.</p>
      </CardContent>
    </Card>
  );
}
