
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatusClient } from './components/StatusClient';

export default function StatusPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>
          Check the connection status of your store's external services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatusClient />
      </CardContent>
    </Card>
  );
}
