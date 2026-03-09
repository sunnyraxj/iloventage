import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getStoreSettings } from '@/lib/data';
import { SettingsForm } from './components/SettingsForm';

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Settings</CardTitle>
        <CardDescription>Manage your store's appearance and details.</CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsForm settings={settings} />
      </CardContent>
    </Card>
  );
}
