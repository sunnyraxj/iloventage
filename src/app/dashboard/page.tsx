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
         {user.addresses && user.addresses.length > 0 && (
          <div>
            <h3 className="font-medium">My Addresses</h3>
            {user.addresses.map((address) => (
              <div key={address.id} className="mt-2 rounded-md border p-4 text-muted-foreground">
                <p className="font-semibold text-card-foreground">{address.name}</p>
                <p>{address.address}</p>
                <p>{address.city}, {address.zip}</p>
                <p>{address.country}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
