
'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function AddressesPage() {
    const { user } = useAuth();

    if (!user) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>My Addresses</CardTitle>
            <CardDescription>Manage your shipping addresses.</CardDescription>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Address
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.addresses && user.addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((address) => (
                    <div key={address.id} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                        <p className="font-semibold">{address.name}</p>
                        <p className="text-sm text-muted-foreground">{address.address}</p>
                        <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                        <p className="text-sm text-muted-foreground">Mobile: {address.mobile}</p>
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-center text-muted-foreground py-8">You have no saved addresses.</p>
        )}
      </CardContent>
    </Card>
  );
}
