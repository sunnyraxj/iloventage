
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
import { PlusCircle, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddressForm } from './components/AddressForm';
import { DeleteAddressButton } from './components/DeleteAddressButton';

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
        <AddressForm>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Address
            </Button>
        </AddressForm>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.addresses && user.addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((address) => (
                    <Card key={address.id}>
                        <CardContent className="p-4 flex items-start justify-between">
                            <div className="text-sm space-y-1">
                                <p className="font-semibold">{address.name}</p>
                                <p className="text-muted-foreground">{address.address}</p>
                                <p className="text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                                <p className="text-muted-foreground">Mobile: {address.mobile}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mt-1 -mr-1">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <AddressForm address={address}>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            Edit
                                        </DropdownMenuItem>
                                    </AddressForm>
                                    <DeleteAddressButton addressId={address.id} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <p>You have no saved addresses.</p>
                 <AddressForm>
                    <Button variant="outline" size="sm" className="mt-4">Add your first address</Button>
                </AddressForm>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
