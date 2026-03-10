import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DashboardLayoutClient } from './layout-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <DashboardLayoutClient>
            {children}
        </DashboardLayoutClient>
      </main>
      <Footer />
    </div>
  );
}
