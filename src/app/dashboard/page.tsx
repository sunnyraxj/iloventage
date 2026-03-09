'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Account</CardTitle>
        <CardDescription>View and manage your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h3 className="font-medium">Name</h3>
            <p className="text-muted-foreground">{user.name}</p>
        </div>
        <div>
            <h3 className="font-medium">Email</h3>
            <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div>
            <h3 className="font-medium">Role</h3>
            <p className="text-muted-foreground capitalize">{user.role}</p>
        </div>
      </CardContent>
    </Card>
  );
}
