'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers</CardTitle>
        <CardDescription>View and manage your customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Customer management interface will be here.</p>
      </CardContent>
    </Card>
  );
}
