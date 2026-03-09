'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-4'>
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.photoURL} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>View and manage your account details.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
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
